// src/components/opportunities/CreateOpportunityModal.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Car, MapPin, Building, Mail, Phone } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (id: string) => void;
}

interface Vehicle {
  registrationNumber: string;
  make?: string;
  model?: string;
  year?: number;
}

export function CreateOpportunityModal({ open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [newVehicle, setNewVehicle] = useState<Partial<Vehicle>>({});

  const [form, setForm] = useState({
    type: 'individual' as 'individual' | 'organization',
    subject: '',
    source: 'manual' as string,
    customer: {
      name: '',
      email: '',
      phone: '',
      companyName: '',
    },
    assignedTo: '', // This should be a user ID string
    vehicles: [] as Vehicle[],
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (!open) {
      setVehicles([]);
      setNewVehicle({});
      setForm({
        type: 'individual',
        subject: '',
        source: 'manual',
        customer: {
          name: '',
          email: '',
          phone: '',
          companyName: '',
        },
        assignedTo: '',
        vehicles: [],
      });
    }
  }, [open]);

  // === CREATE OPPORTUNITY MUTATION ===
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Creating opportunity with data:', JSON.stringify(data, null, 2));
      const response = await api.opportunities.create(data);
      console.log('Create response:', response);
      return response;
    },
    onSuccess: (response) => {
      console.log('Create success - full response:', response);
      
      // Handle different response structures
      const opportunityId = response._id || response.id || response.data?._id || response.data?.id;
      
      if (!opportunityId) {
        console.error('No opportunity ID in response:', response);
        toast.error('Created successfully but could not get opportunity ID');
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success('Deal created successfully!');
      onSuccess(opportunityId);
      onClose();
    },
    onError: (error: Error) => {
      console.error('Create error:', error);
      toast.error(error.message || 'Failed to create deal. Please check the data and try again.');
    },
  });

  const handleSubmit = () => {
    if (!form.customer.name.trim()) {
      toast.error('Please enter account name');
      return;
    }

    if (!form.subject.trim()) {
      toast.error('Please enter deal name');
      return;
    }

    // Prepare data EXACTLY as your API expects
    const submitData = {
      type: form.type,
      subject: form.subject.trim(),
      source: form.source,
      customer: {
        name: form.customer.name.trim(),
        ...(form.customer.email.trim() && { email: form.customer.email.trim() }),
        ...(form.customer.phone.trim() && { phone: form.customer.phone.trim() }),
        ...(form.customer.companyName.trim() && { companyName: form.customer.companyName.trim() }),
      },
      ...(form.assignedTo.trim() && { assignedTo: form.assignedTo.trim() }),
      vehicles: vehicles.map(vehicle => ({
        registrationNumber: vehicle.registrationNumber.trim(),
        ...(vehicle.make?.trim() && { make: vehicle.make.trim() }),
        ...(vehicle.model?.trim() && { model: vehicle.model.trim() }),
        ...(vehicle.year && { year: vehicle.year }),
      })),
    };

    console.log('Submitting data:', JSON.stringify(submitData, null, 2));
    createMutation.mutate(submitData);
  };

  const addNewVehicle = () => {
    if (!newVehicle.registrationNumber?.trim()) {
      toast.error('Registration number is required');
      return;
    }

    const vehicle: Vehicle = {
      registrationNumber: newVehicle.registrationNumber.trim(),
      make: newVehicle.make?.trim(),
      model: newVehicle.model?.trim(),
      year: newVehicle.year,
    };

    setVehicles(prev => [...prev, vehicle]);
    setNewVehicle({});
  };

  const removeVehicle = (index: number) => {
    setVehicles(prev => prev.filter((_, i) => i !== index));
  };

  if (!open) return null;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="border-b border-gray-200 px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500">
            <Building className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Create New Deal</h2>
            <p className="text-sm text-gray-500">Add a new opportunity to your pipeline</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="max-h-[60vh] overflow-y-auto px-8 py-6">
        <div className="grid gap-8">
          {/* Account Section */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Building className="h-4 w-4 text-orange-500" />
              Account Information
            </h3>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="customerName" className="text-sm font-medium text-gray-700">
                  Account Name *
                </Label>
                <Input
                  id="customerName"
                  placeholder="e.g., ABC Logistics"
                  value={form.customer.name}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    customer: { ...prev.customer, name: e.target.value }
                  }))}
                  className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="companyName" className="text-sm font-medium text-gray-700">
                  Company Name
                </Label>
                <Input
                  id="companyName"
                  placeholder="e.g., ABC Logistics Ltd"
                  value={form.customer.companyName}
                  onChange={(e) => setForm(prev => ({ 
                    ...prev, 
                    customer: { ...prev.customer, companyName: e.target.value }
                  }))}
                  className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
              </div>

              <div>
                <Label htmlFor="customerEmail" className="text-sm font-medium text-gray-700">
                  Email
                </Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="customerEmail"
                    type="email"
                    placeholder="e.g., ops@abclogistics.co.ke"
                    value={form.customer.email}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      customer: { ...prev.customer, email: e.target.value }
                    }))}
                    className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="customerPhone" className="text-sm font-medium text-gray-700">
                  Phone
                </Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    id="customerPhone"
                    placeholder="e.g., +254700123456"
                    value={form.customer.phone}
                    onChange={(e) => setForm(prev => ({ 
                      ...prev, 
                      customer: { ...prev.customer, phone: e.target.value }
                    }))}
                    className="pl-10 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Deal Information */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-orange-500" />
              Deal Information
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="type" className="text-sm font-medium text-gray-700">
                    Deal Type
                  </Label>
                  <Select
                    value={form.type}
                    onValueChange={(value: 'individual' | 'organization') => 
                      setForm(prev => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="individual">Individual</SelectItem>
                      <SelectItem value="organization">Organization</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                    Deal Name *
                  </Label>
                  <Input
                    id="subject"
                    placeholder="e.g., Fleet maintenance request"
                    value={form.subject}
                    onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="source" className="text-sm font-medium text-gray-700">
                    Source
                  </Label>
                  <Select
                    value={form.source}
                    onValueChange={(value: string) => 
                      setForm(prev => ({ ...prev, source: value }))
                    }
                  >
                    <SelectTrigger className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-lg">
                      <SelectItem value="manual">Manual Entry</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assignedTo" className="text-sm font-medium text-gray-700">
                    Assign To (User ID)
                  </Label>
                  <Input
                    id="assignedTo"
                    placeholder="e.g., 6901e1b1813162deba7e462c"
                    value={form.assignedTo}
                    onChange={(e) => setForm(prev => ({ ...prev, assignedTo: e.target.value }))}
                    className="mt-1 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Optional: Enter user ID to assign this deal
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicles Section */}
          <div className="border-b border-gray-200 pb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Car className="h-4 w-4 text-orange-500" />
              Vehicles
            </h3>
            
            <div className="space-y-6">
              {/* Add Vehicle Form */}
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <Label className="text-sm font-medium text-gray-700 mb-3 block">Add Vehicle</Label>
                <div className="grid gap-3 md:grid-cols-4">
                  <Input
                    placeholder="Registration *"
                    value={newVehicle.registrationNumber || ''}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, registrationNumber: e.target.value }))}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Input
                    placeholder="Make"
                    value={newVehicle.make || ''}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, make: e.target.value }))}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Input
                    placeholder="Model"
                    value={newVehicle.model || ''}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, model: e.target.value }))}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                  <Input
                    placeholder="Year"
                    type="number"
                    value={newVehicle.year || ''}
                    onChange={(e) => setNewVehicle(prev => ({ ...prev, year: parseInt(e.target.value) || undefined }))}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
                <Button
                  onClick={addNewVehicle}
                  className="mt-3 bg-orange-500 hover:bg-orange-600"
                  size="sm"
                  disabled={!newVehicle.registrationNumber?.trim()}
                >
                  <Car className="h-4 w-4 mr-2" />
                  Add Vehicle
                </Button>
              </div>

              {/* Selected Vehicles */}
              {vehicles.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Selected Vehicles ({vehicles.length})
                  </Label>
                  <div className="space-y-2">
                    {vehicles.map((vehicle, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
                      >
                        <div className="flex items-center gap-3">
                          <Car className="h-4 w-4 text-orange-500" />
                          <div>
                            <div className="font-medium text-sm">{vehicle.registrationNumber}</div>
                            <div className="text-xs text-gray-500">
                              {vehicle.make} {vehicle.model} {vehicle.year}
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeVehicle(index)}
                          className="h-8 w-8 p-0 hover:bg-orange-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 border-t border-gray-200 px-8 py-6">
        <Button
          variant="outline"
          onClick={onClose}
          className="border-gray-300 hover:bg-gray-50"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createMutation.isPending || !form.customer.name.trim() || !form.subject.trim()}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400"
        >
          {createMutation.isPending ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
              Creating...
            </>
          ) : (
            'Create Deal'
          )}
        </Button>
      </div>
    </div>
  );
}