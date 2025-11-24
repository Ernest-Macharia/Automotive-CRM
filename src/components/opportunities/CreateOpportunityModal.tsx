// src/components/opportunities/CreateOpportunityModal.tsx
'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Car, MapPin, Building, Mail, Phone, Plus, Trash2, Wrench, FileText, Shield } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { toast } from 'react-hot-toast';

// ✅ COMPLETE SCHEMA MATCHING YOUR API REQUEST
const opportunitySchema = z.object({
  type: z.enum(['individual', 'organization']),
  subject: z.string().min(1, 'Deal name is required'),
  source: z.enum(['manual', 'referral', 'website', 'email', 'phone', 'social_media', 'walk_in']),
  customer: z.object({
    name: z.string().min(1, 'Account name is required'),
    email: z.string().email('Valid email is required').min(1, 'Email is required'),
    phone: z.string().min(1, 'Phone number is required'),
    companyName: z.string().optional(),
  }),
  assignedTo: z.string().optional(),
  vehicles: z.array(z.object({
    vin: z.string().min(1, 'VIN is required'),
    registrationNumber: z.string().min(1, 'Registration number is required'),
    make: z.string().min(1, 'Make is required'),
    model: z.string().min(1, 'Model is required'),
    year: z.number().min(1900, 'Valid year is required'),
    color: z.string().min(1, 'Color is required'),
  })).min(1, 'At least one vehicle is required'),
  jobCards: z.array(z.object({
    jobTitle: z.string().min(1, 'Job title is required'),
    jobDescription: z.string().min(1, 'Job description is required'),
  })).min(1, 'At least one job card is required'),
  waivers: z.array(z.object({
    type: z.string().min(1, 'Waiver type is required'),
    reason: z.string().min(1, 'Reason is required'),
  })).min(1, 'At least one waiver is required'),
  quotes: z.array(z.object({
    items: z.array(z.object({
      description: z.string().min(1, 'Item description is required'),
      quantity: z.number().min(1, 'Quantity must be at least 1'),
      unitPrice: z.number().min(0, 'Unit price must be positive'),
      total: z.number().min(0, 'Total must be positive'),
    })).min(1, 'At least one quote item is required'),
    totalAmount: z.number().min(0, 'Total amount must be positive'),
    notes: z.string().optional(),
  })).min(1, 'At least one quote is required'),
});

type OpportunityFormData = z.infer<typeof opportunitySchema>;

interface CreateOpportunityModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

export function CreateOpportunityModal({ open, onClose, onSuccess }: CreateOpportunityModalProps) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // ✅ COMPLETE FORM WITH ALL FIELDS
  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      type: 'individual',
      source: 'walk_in',
      subject: '',
      customer: {
        name: '',
        email: '',
        phone: '',
        companyName: '',
      },
      assignedTo: '',
      vehicles: [{
        vin: '',
        registrationNumber: '',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        color: '',
      }],
      jobCards: [{
        jobTitle: '',
        jobDescription: '',
      }],
      waivers: [{
        type: 'service',
        reason: '',
      }],
      quotes: [{
        items: [{
          description: '',
          quantity: 1,
          unitPrice: 0,
          total: 0,
        }],
        totalAmount: 0,
        notes: '',
      }],
    },
  });

  // ✅ FIXED: Calculate quote total without useEffect
  const calculateQuoteTotal = useCallback((quoteIndex: number): number => {
    const items = form.getValues(`quotes.${quoteIndex}.items`);
    return items.reduce((sum, item) => sum + item.total, 0);
  }, [form]);

  // ✅ FIXED: Proper mutation with correct closing behavior
  const createMutation = useMutation({
    mutationFn: async (data: OpportunityFormData) => {
      console.log('🚀 Creating complete opportunity:', JSON.stringify(data, null, 2));
      
      // ✅ Transform data to match API exactly
      const submitData = {
        type: data.type,
        subject: data.subject.trim(),
        source: data.source,
        customer: {
          name: data.customer.name.trim(),
          email: data.customer.email.trim(),
          phone: data.customer.phone.trim(),
          ...(data.customer.companyName?.trim() && { 
            companyName: data.customer.companyName.trim() 
          }),
        },
        ...(data.assignedTo?.trim() && { assignedTo: data.assignedTo.trim() }),
        vehicles: data.vehicles.map(vehicle => ({
          vin: vehicle.vin.trim(),
          registrationNumber: vehicle.registrationNumber.trim(),
          make: vehicle.make.trim(),
          model: vehicle.model.trim(),
          year: vehicle.year,
          color: vehicle.color.trim(),
        })),
        jobCards: data.jobCards.map(jobCard => ({
          jobTitle: jobCard.jobTitle.trim(),
          jobDescription: jobCard.jobDescription.trim(),
        })),
        waivers: data.waivers.map(waiver => ({
          type: waiver.type.trim(),
          reason: waiver.reason.trim(),
        })),
        quotes: data.quotes.map(quote => ({
          items: quote.items.map(item => ({
            description: item.description.trim(),
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
          })),
          totalAmount: quote.items.reduce((sum, item) => sum + item.total, 0),
          ...(quote.notes?.trim() && { notes: quote.notes.trim() }),
        })),
      };

      const response = await api.opportunities.create(submitData);
      return response;
    },
    onMutate: () => {
      setIsLoading(true);
    },
    onSuccess: (response: unknown) => {
      console.log('✅ Create success:', response);
      
      if (response && typeof response === 'object') {
        const responseObj = response as Record<string, unknown>;
        const opportunityId = responseObj._id;
        
        if (opportunityId) {
          queryClient.invalidateQueries({ queryKey: ['opportunities'] });
          toast.success('Deal created successfully! 🎉');
          
          // ✅ FIXED: Reset loading and call onSuccess - let page handle navigation
          setIsLoading(false);
          onSuccess(opportunityId as string);
        } else {
          toast.error('Created but could not get opportunity ID');
          setIsLoading(false);
        }
      } else {
        toast.error('Unexpected response format');
        setIsLoading(false);
      }
    },
    onError: (error: Error) => {
      console.error('❌ Create error:', error);
      toast.error(error.message || 'Failed to create deal. Please check your data.');
      setIsLoading(false);
    },
  });

  // ✅ FIXED: Simple handleClose that just closes the modal
  const handleClose = () => {
    if (!isLoading) {
      form.reset();
      onClose();
    }
  };

  const onSubmit = (data: OpportunityFormData) => {
    createMutation.mutate(data);
  };

  // ✅ FIXED: Update quote item with proper typing
  const updateQuoteItem = (
    quoteIndex: number, 
    itemIndex: number, 
    field: 'quantity' | 'unitPrice', 
    value: string
  ) => {
    const currentValue = form.getValues(`quotes.${quoteIndex}.items.${itemIndex}`);
    
    const quantity = field === 'quantity' ? (Number(value) || 1) : currentValue.quantity;
    const unitPrice = field === 'unitPrice' ? (Number(value) || 0) : currentValue.unitPrice;
    const total = quantity * unitPrice;
    
    form.setValue(`quotes.${quoteIndex}.items.${itemIndex}`, {
      ...currentValue,
      [field]: Number(value),
      total: total,
    });

    // Update the total amount for the quote
    const items = form.getValues(`quotes.${quoteIndex}.items`);
    const newTotalAmount = items.reduce((sum, item) => sum + item.total, 0);
    form.setValue(`quotes.${quoteIndex}.totalAmount`, newTotalAmount);
  };

  const handleQuantityChange = (quoteIndex: number, itemIndex: number, value: string) => {
    updateQuoteItem(quoteIndex, itemIndex, 'quantity', value);
  };

  const handleUnitPriceChange = (quoteIndex: number, itemIndex: number, value: string) => {
    updateQuoteItem(quoteIndex, itemIndex, 'unitPrice', value);
  };

  const sourceOptions = [
    { value: 'walk_in', label: 'Walk In' },
    { value: 'manual', label: 'Manual Entry' },
    { value: 'referral', label: 'Referral' },
    { value: 'website', label: 'Website' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'social_media', label: 'Social Media' },
  ];

  const waiverTypes = [
    { value: 'service', label: 'Service Waiver' },
    { value: 'liability', label: 'Liability Waiver' },
    { value: 'safety', label: 'Safety Waiver' },
    { value: 'privacy', label: 'Privacy Waiver' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden bg-white rounded-2xl shadow-2xl mx-4">
        {/* 🎯 BEAUTIFUL HEADER */}
        <div className="border-b border-gray-200 px-8 py-6 bg-gradient-to-r from-orange-50 to-amber-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 shadow-lg">
                <Building className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Create Complete Deal</h2>
                <p className="text-sm text-gray-600">Add opportunity with vehicles, services, and quotes</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-8 w-8 p-0 hover:bg-gray-100 rounded-lg"
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 📝 COMPLETE FORM CONTENT */}
        <div className="max-h-[70vh] overflow-y-auto px-8 py-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* 👥 ACCOUNT INFORMATION SECTION */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Building className="h-4 w-4 text-orange-500" />
                  Account Information
                </h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="customer.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Account Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., John Doe"
                            className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer.companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Company Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Doe Enterprises"
                            className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer.email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Email *
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="e.g., john.doe@example.com"
                              className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              {...field}
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customer.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Phone *
                        </FormLabel>
                        <FormControl>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <Input
                              placeholder="e.g., +254700123456"
                              className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                              {...field}
                              disabled={isLoading}
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 💼 DEAL INFORMATION SECTION */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-orange-500" />
                  Deal Information
                </h3>
                
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Deal Type
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            <SelectItem value="individual">Individual</SelectItem>
                            <SelectItem value="organization">Organization</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Source *
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                          <FormControl>
                            <SelectTrigger className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-white border border-gray-200 shadow-lg">
                            {sourceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Deal Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Car Service Request - Honda Civic"
                            className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-gray-700">
                          Assign To (User ID)
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 6901e1b1813162deba7e462c"
                            className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <FormMessage className="text-xs text-red-600" />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* 🚗 VEHICLES SECTION */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Car className="h-4 w-4 text-orange-500" />
                  Vehicles
                </h3>
                
                <div className="space-y-4">
                  {form.watch('vehicles').map((vehicle, index) => (
                    <div key={index} className="grid gap-4 md:grid-cols-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.vin`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              VIN *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="1HGCM82633A123456"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.registrationNumber`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Registration *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ABC123"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.make`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Make *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Honda"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.model`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Model *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Civic"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`vehicles.${index}.year`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">
                              Year *
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="2020"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <div className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`vehicles.${index}.color`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-xs font-medium text-gray-700">
                                Color *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Blue"
                                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                  {...field}
                                  disabled={isLoading}
                                />
                              </FormControl>
                              <FormMessage className="text-xs text-red-600" />
                            </FormItem>
                          )}
                        />
                        
                        {form.watch('vehicles').length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const vehicles = form.getValues('vehicles');
                              form.setValue('vehicles', vehicles.filter((_, i) => i !== index));
                            }}
                            className="h-10 w-10 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const vehicles = form.getValues('vehicles');
                      form.setValue('vehicles', [
                        ...vehicles,
                        { vin: '', registrationNumber: '', make: '', model: '', year: new Date().getFullYear(), color: '' }
                      ]);
                    }}
                    className="border-dashed border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Vehicle
                  </Button>
                </div>
              </div>

              {/* 🔧 JOB CARDS SECTION */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Wrench className="h-4 w-4 text-orange-500" />
                  Service Request
                </h3>
                
                <div className="space-y-4">
                  {form.watch('jobCards').map((jobCard, index) => (
                    <div key={index} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <FormField
                        control={form.control}
                        name={`jobCards.${index}.jobTitle`}
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Job Title *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Oil Change Service"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`jobCards.${index}.jobDescription`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Job Description *
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="e.g., Full synthetic oil change and filter replacement"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const jobCards = form.getValues('jobCards');
                      form.setValue('jobCards', [
                        ...jobCards,
                        { jobTitle: '', jobDescription: '' }
                      ]);
                    }}
                    className="border-dashed border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Service
                  </Button>
                </div>
              </div>

              {/* 🛡️ WAIVERS SECTION */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-orange-500" />
                  Waivers
                </h3>
                
                <div className="space-y-4">
                  {form.watch('waivers').map((waiver, index) => (
                    <div key={index} className="grid gap-4 md:grid-cols-2 p-4 border border-gray-200 rounded-lg bg-gray-50">
                      <FormField
                        control={form.control}
                        name={`waivers.${index}.type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Waiver Type *
                            </FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                              <FormControl>
                                <SelectTrigger className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="bg-white border border-gray-200 shadow-lg">
                                {waiverTypes.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name={`waivers.${index}.reason`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Reason *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="e.g., Standard service waiver for maintenance work"
                                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-white"
                                {...field}
                                disabled={isLoading}
                              />
                            </FormControl>
                            <FormMessage className="text-xs text-red-600" />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const waivers = form.getValues('waivers');
                      form.setValue('waivers', [
                        ...waivers,
                        { type: 'service', reason: '' }
                      ]);
                    }}
                    className="border-dashed border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Waiver
                  </Button>
                </div>
              </div>

              {/* 💰 QUOTES SECTION */}
              <div className="border-b border-gray-200 pb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-orange-500" />
                  Quote Information
                </h3>
                
                <div className="space-y-6">
                  {form.watch('quotes').map((quote, quoteIndex) => (
                    <div key={quoteIndex} className="p-6 border border-gray-200 rounded-lg bg-gray-50">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-medium text-gray-900">Quote #{quoteIndex + 1}</h4>
                        {form.watch('quotes').length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const quotes = form.getValues('quotes');
                              form.setValue('quotes', quotes.filter((_, i) => i !== quoteIndex));
                            }}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            disabled={isLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remove Quote
                          </Button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {quote.items.map((item, itemIndex) => (
                          <div key={itemIndex} className="grid gap-4 md:grid-cols-5 p-4 border border-gray-200 rounded bg-white">
                            <FormField
                              control={form.control}
                              name={`quotes.${quoteIndex}.items.${itemIndex}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-700">
                                    Description *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="e.g., Oil Change Service"
                                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                      {...field}
                                      disabled={isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs text-red-600" />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`quotes.${quoteIndex}.items.${itemIndex}.quantity`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-700">
                                    Quantity *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="1"
                                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                      value={field.value}
                                      onChange={(e) => handleQuantityChange(quoteIndex, itemIndex, e.target.value)}
                                      disabled={isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs text-red-600" />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`quotes.${quoteIndex}.items.${itemIndex}.unitPrice`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-700">
                                    Unit Price (KES) *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                      value={field.value}
                                      onChange={(e) => handleUnitPriceChange(quoteIndex, itemIndex, e.target.value)}
                                      disabled={isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs text-red-600" />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`quotes.${quoteIndex}.items.${itemIndex}.total`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-xs font-medium text-gray-700">
                                    Total (KES)
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      min="0"
                                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 bg-gray-100"
                                      readOnly
                                      {...field}
                                      disabled={isLoading}
                                    />
                                  </FormControl>
                                  <FormMessage className="text-xs text-red-600" />
                                </FormItem>
                              )}
                            />

                            {quote.items.length > 1 && (
                              <div className="flex items-end">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const items = form.getValues(`quotes.${quoteIndex}.items`);
                                    form.setValue(`quotes.${quoteIndex}.items`, items.filter((_, i) => i !== itemIndex));
                                    // Update total after removal
                                    const newItems = form.getValues(`quotes.${quoteIndex}.items`);
                                    const newTotalAmount = newItems.reduce((sum, item) => sum + item.total, 0);
                                    form.setValue(`quotes.${quoteIndex}.totalAmount`, newTotalAmount);
                                  }}
                                  className="h-10 w-10 p-0 text-red-600 hover:bg-red-50 hover:text-red-700"
                                  disabled={isLoading}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const items = form.getValues(`quotes.${quoteIndex}.items`);
                            form.setValue(`quotes.${quoteIndex}.items`, [
                              ...items,
                              { description: '', quantity: 1, unitPrice: 0, total: 0 }
                            ]);
                          }}
                          className="border-dashed border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                          disabled={isLoading}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Item
                        </Button>

                        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                          <FormField
                            control={form.control}
                            name={`quotes.${quoteIndex}.notes`}
                            render={({ field }) => (
                              <FormItem className="flex-1">
                                <FormLabel className="text-sm font-medium text-gray-700">
                                  Notes
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g., Standard service package"
                                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                                    {...field}
                                    disabled={isLoading}
                                  />
                                </FormControl>
                                <FormMessage className="text-xs text-red-600" />
                              </FormItem>
                            )}
                          />

                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium text-gray-700">Quote Total</div>
                            <div className="text-2xl font-bold text-orange-600">
                              KES {calculateQuoteTotal(quoteIndex).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const quotes = form.getValues('quotes');
                      form.setValue('quotes', [
                        ...quotes,
                        {
                          items: [{ description: '', quantity: 1, unitPrice: 0, total: 0 }],
                          totalAmount: 0,
                          notes: '',
                        }
                      ]);
                    }}
                    className="border-dashed border-gray-300 text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
                    disabled={isLoading}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Another Quote
                  </Button>
                </div>
              </div>

              {/* 🎯 BEAUTIFUL FOOTER */}
              <div className="flex justify-end gap-3 border-t border-gray-200 px-8 py-6 bg-gray-50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="border-gray-300 hover:bg-gray-50 text-gray-700"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !form.formState.isValid}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 disabled:from-gray-400 disabled:to-gray-400 text-white shadow-lg"
                >
                  {isLoading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Complete Deal'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
}