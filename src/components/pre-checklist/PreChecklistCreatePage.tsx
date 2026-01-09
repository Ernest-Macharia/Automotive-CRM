'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ClipboardCheck,
  ArrowLeft,
  Save,
  X,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
  User,
  Building,
  Calendar,
  Wrench,
  Upload,
  Loader2,
  AlertTriangle,
  Info,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  Shield,
  FileSignature,
  Settings
} from 'lucide-react';
import { preChecklistService, InspectionItem } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

interface PreChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

export default function PreChecklistCreatePage({ 
  mode = 'create', 
  checklistId 
}: PreChecklistCreatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Get parameters from URL
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');
  const vehicleId = searchParams.get('vehicleId');
  const source = searchParams.get('source');

  const [loading, setLoading] = useState(mode === 'create');
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [existingChecklist, setExistingChecklist] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    remarks: '',
    approved: false,
    inspectionItems: [
      { item: 'Exterior Body Condition & Damage', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Tire Condition & Pressure Check', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Engine Oil Level & Quality', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Brake Fluid Level & Condition', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Coolant Level & Condition', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Power Steering Fluid Level', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Windshield Wipers & Washer Fluid', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Battery Condition & Terminal Corrosion', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Lighting System (All Lights)', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Brake System Operation', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Suspension & Steering Condition', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Exhaust System & Leaks', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Interior Controls & Gauges Function', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Air Conditioning & Heating System', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' },
      { item: 'Documentation & Service Logs', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '' }
    ]
  });

  const [selectedTemplate, setSelectedTemplate] = useState('basic');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  // Load related data
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode]);

  const loadRelatedData = async () => {
  try {
    setLoading(true);

    // Load existing checklist if in edit mode
    if (mode === 'edit' && checklistId) {
      const checklist = await preChecklistService.getPreChecklistById(checklistId);
      setExistingChecklist(checklist);
      
      setFormData({
        opportunityId: typeof checklist.opportunityId === 'object' 
          ? checklist.opportunityId._id 
          : checklist.opportunityId,
        vehicleId: typeof checklist.vehicleId === 'object' 
          ? checklist.vehicleId._id 
          : checklist.vehicleId,
        inspectedBy: checklist.inspectedBy 
          ? (typeof checklist.inspectedBy === 'object' 
              ? checklist.inspectedBy._id 
              : checklist.inspectedBy)
          : sessionStorage.getItem('userId') || '',
        remarks: checklist.remarks || '',
        approved: checklist.approved || false,
        inspectionItems: checklist.inspectionItems.map(item => ({
          item: item.item,
          status: item.status,
          remarks: item.remarks || ''
        }))
      });

      // Set opportunity and vehicle from existing checklist
      if (typeof checklist.opportunityId === 'object') {
        setOpportunity(checklist.opportunityId);
      }
      if (typeof checklist.vehicleId === 'object') {
        setVehicle(checklist.vehicleId);
      }
    }

    // Helper function to get vehicle ID from opportunity
    const getVehicleIdFromOpportunity = (opportunity: any): string | null => {
      if (!opportunity) return null;
      
      // Try different possible property names
      if (opportunity.vehicleId) {
        return typeof opportunity.vehicleId === 'object' 
          ? opportunity.vehicleId._id 
          : opportunity.vehicleId;
      }
      
      if (opportunity.vehicles && Array.isArray(opportunity.vehicles) && opportunity.vehicles.length > 0) {
        const firstVehicle = opportunity.vehicles[0];
        return typeof firstVehicle === 'object' ? firstVehicle._id : firstVehicle;
      }
      
      if (opportunity.vehicle) {
        return typeof opportunity.vehicle === 'object' 
          ? opportunity.vehicle._id 
          : opportunity.vehicle;
      }
      
      return null;
    };

    // Load work order if ID provided
    if (workOrderId) {
      try {
        const wo = await workOrderService.getWorkOrderById(workOrderId);
        setWorkOrder(wo);
        
        // If work order has opportunityId, load opportunity
        if (wo.opportunityId) {
          const oppId = typeof wo.opportunityId === 'object' ? wo.opportunityId._id : wo.opportunityId;
          const opp = await opportunityService.getOpportunityById(oppId);
          setOpportunity(opp);
          
          // Get vehicle ID from opportunity
          const vehicleId = getVehicleIdFromOpportunity(opp);
          if (vehicleId) {
            try {
              const veh = await vehicleService.getVehicleById(vehicleId);
              setVehicle(veh);
              
              // Update form data with loaded IDs
              setFormData(prev => ({
                ...prev,
                opportunityId: oppId,
                vehicleId
              }));
            } catch (vehError) {
              console.error('Error loading vehicle details:', vehError);
              // Still set the ID even if we can't load full details
              setFormData(prev => ({
                ...prev,
                opportunityId: oppId,
                vehicleId
              }));
            }
          }
        }
      } catch (error) {
        console.error('Error loading work order:', error);
        showToast('Could not load work order details', 'warning');
      }
    }

    // Load opportunity directly if provided
    if (opportunityId && !workOrderId) {
      try {
        const opp = await opportunityService.getOpportunityById(opportunityId);
        setOpportunity(opp);
        
        // Get vehicle ID from opportunity
        const vehicleId = getVehicleIdFromOpportunity(opp);
        if (vehicleId) {
          try {
            const veh = await vehicleService.getVehicleById(vehicleId);
            setVehicle(veh);
            
            setFormData(prev => ({
              ...prev,
              opportunityId,
              vehicleId
            }));
          } catch (vehError) {
            console.error('Error loading vehicle details:', vehError);
            // Still set the ID
            setFormData(prev => ({
              ...prev,
              opportunityId,
              vehicleId
            }));
          }
        }
      } catch (error) {
        console.error('Error loading opportunity:', error);
        showToast('Could not load opportunity details', 'warning');
      }
    }

    // Load vehicle directly if provided
    if (vehicleId && !opportunityId) {
      try {
        const veh = await vehicleService.getVehicleById(vehicleId);
        setVehicle(veh);
        
        setFormData(prev => ({
          ...prev,
          vehicleId
        }));
      } catch (error) {
        console.error('Error loading vehicle:', error);
        showToast('Could not load vehicle details', 'warning');
      }
    }

    // If we still don't have opportunity or vehicle, but have IDs in formData, try to load them
    if (!opportunity && formData.opportunityId) {
      try {
        const opp = await opportunityService.getOpportunityById(formData.opportunityId);
        setOpportunity(opp);
      } catch (error) {
        console.error('Error loading opportunity by form ID:', error);
      }
    }
    
    if (!vehicle && formData.vehicleId) {
      try {
        const veh = await vehicleService.getVehicleById(formData.vehicleId);
        setVehicle(veh);
      } catch (error) {
        console.error('Error loading vehicle by form ID:', error);
      }
    }

  } catch (error) {
    console.error('Error loading related data:', error);
    showToast('Failed to load related information', 'error');
  } finally {
    setLoading(false);
  }
};

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleItemChange = (index: number, field: keyof InspectionItem, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.inspectionItems];
      newItems[index] = {
        ...newItems[index],
        [field]: value
      };
      return {
        ...prev,
        inspectionItems: newItems
      };
    });
  };

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      inspectionItems: [
        ...prev.inspectionItems,
        { item: '', status: 'pending', remarks: '' }
      ]
    }));
  };

  const handleRemoveItem = (index: number) => {
    if (formData.inspectionItems.length <= 1) {
      showToast('Checklist must have at least one item', 'warning');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      inspectionItems: prev.inspectionItems.filter((_, i) => i !== index)
    }));
  };

  const handleStatusChange = (index: number, status: 'ok' | 'fault' | 'n/a' | 'pending') => {
    handleItemChange(index, 'status', status);
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    let items: any[] = [];
    
    switch (template) {
      case 'basic':
        items = [
          { item: 'Exterior Body Condition', status: 'pending', remarks: '' },
          { item: 'Tire Condition', status: 'pending', remarks: '' },
          { item: 'Engine Oil', status: 'pending', remarks: '' },
          { item: 'Brake System', status: 'pending', remarks: '' },
          { item: 'Lighting System', status: 'pending', remarks: '' }
        ];
        break;
      case 'comprehensive':
        items = [
          { item: 'Exterior Body & Paint Condition', status: 'pending', remarks: '' },
          { item: 'Tire Condition & Pressure (All)', status: 'pending', remarks: '' },
          { item: 'Engine Oil Level & Quality', status: 'pending', remarks: '' },
          { item: 'Brake Fluid Level & Quality', status: 'pending', remarks: '' },
          { item: 'Coolant Level & Condition', status: 'pending', remarks: '' },
          { item: 'Power Steering Fluid', status: 'pending', remarks: '' },
          { item: 'Transmission Fluid (if applicable)', status: 'pending', remarks: '' },
          { item: 'Windshield Wipers & Washer Fluid', status: 'pending', remarks: '' },
          { item: 'Battery & Electrical System', status: 'pending', remarks: '' },
          { item: 'All External & Internal Lights', status: 'pending', remarks: '' },
          { item: 'Brake System Operation & Wear', status: 'pending', remarks: '' },
          { item: 'Suspension & Steering Components', status: 'pending', remarks: '' },
          { item: 'Exhaust System & Emissions', status: 'pending', remarks: '' },
          { item: 'Interior Controls & Electronics', status: 'pending', remarks: '' },
          { item: 'Air Conditioning & Climate Control', status: 'pending', remarks: '' },
          { item: 'Safety Equipment (Seatbelts, Airbags)', status: 'pending', remarks: '' },
          { item: 'Documentation & Service History', status: 'pending', remarks: '' }
        ];
        break;
      case 'heavy_duty':
        items = [
          { item: 'Chassis & Frame Condition', status: 'pending', remarks: '' },
          { item: 'Tire Condition & Pressure (All Axles)', status: 'pending', remarks: '' },
          { item: 'Engine Oil & Filters', status: 'pending', remarks: '' },
          { item: 'Transmission & Differential Fluids', status: 'pending', remarks: '' },
          { item: 'Brake System (Air/Hydraulic)', status: 'pending', remarks: '' },
          { item: 'Suspension (Air/Leaf)', status: 'pending', remarks: '' },
          { item: 'Fifth Wheel & Hitch System', status: 'pending', remarks: '' },
          { item: 'Electrical System & Wiring', status: 'pending', remarks: '' },
          { item: 'Exhaust & Emissions System', status: 'pending', remarks: '' },
          { item: 'Cab & Interior Condition', status: 'pending', remarks: '' },
          { item: 'Safety Equipment & Logs', status: 'pending', remarks: '' }
        ];
        break;
      case 'custom':
        // Keep existing items for custom
        return;
    }
    
    setFormData(prev => ({
      ...prev,
      inspectionItems: items
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate form
      if (!formData.opportunityId) {
        showToast('Opportunity ID is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.vehicleId) {
        showToast('Vehicle ID is required', 'error');
        setSubmitting(false);
        return;
      }

      // Filter out pending status items (convert to 'n/a')
      const submissionItems = formData.inspectionItems.map(item => ({
        item: item.item,
        status: item.status === 'pending' ? 'n/a' : item.status,
        remarks: item.remarks
      }));

      // Filter out empty items
      const validItems = submissionItems.filter(item => item.item.trim() !== '');

      if (validItems.length === 0) {
        showToast('Please add at least one inspection item', 'error');
        setSubmitting(false);
        return;
      }

      const submissionData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        inspectionItems: validItems,
        remarks: formData.remarks,
        approved: false
      };

      let result;
      
      if (mode === 'edit' && checklistId) {
        // Update existing checklist
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData);
        showToast('Pre-checklist updated successfully', 'success');
      } else {
        // Create new checklist
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await preChecklistService.createPreChecklist(submissionData, userId);
        showToast('Pre-checklist created successfully', 'success');
      }

      // Navigate based on source
      if (source === 'workflow') {
        router.push(`/orders/work-orders/${workOrderId || ''}`);
      } else {
        router.push(`/pre-checklist/${result._id}`);
      }

    } catch (error: any) {
      console.error('Error submitting pre-checklist:', error);
      showToast(error.message || 'Failed to save pre-checklist', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (source === 'workflow' && workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else {
      router.push('/prechecklists');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'fault': return 'bg-red-100 text-red-800 border-red-200';
      case 'n/a': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'fault': return <AlertCircle className="h-4 w-4" />;
      case 'n/a': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const calculateStats = () => {
    const total = formData.inspectionItems.length;
    const ok = formData.inspectionItems.filter(item => item.status === 'ok').length;
    const fault = formData.inspectionItems.filter(item => item.status === 'fault').length;
    const na = formData.inspectionItems.filter(item => item.status === 'n/a').length;
    const pending = formData.inspectionItems.filter(item => item.status === 'pending').length;
    
    return { total, ok, fault, na, pending };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pre-checklist form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-600 text-white px-8 py-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">
                {mode === 'edit' ? 'Edit Pre-Checklist' : 'Create Pre-Checklist'}
              </h1>
              <p className="text-blue-100">
                {mode === 'edit' 
                  ? `Editing: Pre-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Vehicle pre-service inspection checklist'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>OK: {stats.ok}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Faults: {stats.fault}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>N/A: {stats.na}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  {mode === 'edit' ? 'Update Checklist' : 'Create Checklist'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Form */}
        <div className="lg:col-span-3 space-y-8">
          {/* Quick Stats Banner */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Items</div>
              </div>
              <div className="bg-green-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-green-700">{stats.ok}</div>
                <div className="text-sm text-green-600">OK</div>
              </div>
              <div className="bg-red-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-red-700">{stats.fault}</div>
                <div className="text-sm text-red-600">Faults</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-700">{stats.na}</div>
                <div className="text-sm text-gray-600">N/A</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-700">{stats.pending}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
            </div>
          </div>

          {/* Inspection Items Section */}
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Inspection Items</h2>
                    <p className="text-sm text-gray-600">Mark each item as OK, Fault, or N/A</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Templates
                  </button>
                  <button
                    onClick={handleAddItem}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
              </div>

              {/* Template Selector */}
              {showTemplateSelector && (
                <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={() => handleTemplateSelect('basic')}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTemplate === 'basic'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Basic Check</div>
                      <p className="text-sm text-gray-600">5 essential items for quick inspection</p>
                    </button>
                    <button
                      onClick={() => handleTemplateSelect('comprehensive')}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTemplate === 'comprehensive'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Comprehensive</div>
                      <p className="text-sm text-gray-600">17 items for full vehicle inspection</p>
                    </button>
                    <button
                      onClick={() => handleTemplateSelect('heavy_duty')}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTemplate === 'heavy_duty'
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Heavy Duty</div>
                      <p className="text-sm text-gray-600">11 items for trucks & commercial vehicles</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inspection Items List */}
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {formData.inspectionItems.map((item, index) => {
                const isExpanded = expandedSections.includes(index);
                
                return (
                  <div key={index} className="hover:bg-gray-50 transition-colors">
                    {/* Item Header */}
                    <div className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <input
                              type="text"
                              value={item.item}
                              onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                              placeholder="Enter inspection item"
                              className="flex-1 text-lg font-medium text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none p-0"
                            />
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status === 'pending' ? 'Pending' : item.status}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => handleStatusChange(index, 'ok')}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                item.status === 'ok'
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : 'text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-transparent'
                              }`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              OK
                            </button>
                            <button
                              onClick={() => handleStatusChange(index, 'fault')}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                item.status === 'fault'
                                  ? 'bg-red-100 text-red-800 border border-red-300'
                                  : 'text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent'
                              }`}
                            >
                              <AlertCircle className="h-3 w-3" />
                              Fault
                            </button>
                            <button
                              onClick={() => handleStatusChange(index, 'n/a')}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                item.status === 'n/a'
                                  ? 'bg-gray-100 text-gray-800 border border-gray-300'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200 border border-transparent'
                              }`}
                            >
                              <FileText className="h-3 w-3" />
                              N/A
                            </button>
                            <button
                              onClick={() => handleRemoveItem(index)}
                              className="ml-auto p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleSection(index)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              title={isExpanded ? 'Collapse' : 'Expand'}
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Remarks (Optional)
                            </label>
                            <textarea
                              value={item.remarks}
                              onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                              placeholder="Add notes, observations, or details about this item..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                            />
                          </div>
                          
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                            <Info className="h-4 w-4" />
                            <span>Add specific details, measurements, or observations</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Item Button (bottom) */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={handleAddItem}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:border-gray-400 hover:bg-gray-100 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Add Another Inspection Item
              </button>
            </div>
          </div>

          {/* Remarks Section */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Overall Remarks & Notes
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Add any additional observations, recommendations, or special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Optional: Include any general notes or recommendations for the service team
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Information & Actions */}
        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-600" />
              Vehicle Information
            </h2>
            
            {vehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Car className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </div>
                    <div className="text-sm text-gray-600">
                      {vehicle.registrationNumber || 'No plate number'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Vehicle ID
                    </label>
                    <div className="text-sm font-medium text-gray-900">
                      {vehicle._id?.slice(-8)}
                    </div>
                  </div>
                  
                  {vehicle.year && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Year
                      </label>
                      <div className="text-sm font-medium text-gray-900">{vehicle.year}</div>
                    </div>
                  )}
                  
                  {vehicle.mileage && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Mileage
                      </label>
                      <div className="text-sm font-medium text-gray-900">
                        {vehicle.mileage.toLocaleString()} km
                      </div>
                    </div>
                  )}
                  
                  {vehicle.vin && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        VIN
                      </label>
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {vehicle.vin}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Car className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No vehicle information available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Vehicle ID: {formData.vehicleId || 'Not specified'}
                </p>
              </div>
            )}
          </div>

          {/* Opportunity Information */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Opportunity Information
            </h2>
            
            {opportunity ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Building className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {opportunity.subject || 'Opportunity'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {typeof opportunity.customer === 'object' 
                        ? opportunity.customer.name || opportunity.customer.companyName || 'Customer'
                        : 'Customer'
                      }
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Opportunity ID
                    </label>
                    <div className="text-sm font-medium text-gray-900">
                      {opportunity._id?.slice(-8)}
                    </div>
                  </div>
                  
                  {opportunity.type && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Type
                      </label>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {opportunity.type.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                  
                  {opportunity.status && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Status
                      </label>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {opportunity.status.replace('_', ' ')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No opportunity information available</p>
                <p className="text-sm text-gray-500 mt-1">
                  Opportunity ID: {formData.opportunityId || 'Not specified'}
                </p>
              </div>
            )}
          </div>

          {/* Work Order Information */}
          {workOrder && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Wrench className="h-5 w-5 text-blue-600" />
                Work Order Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <Wrench className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {workOrder.workOrderNumber}
                    </div>
                    <div className="text-sm text-gray-600">
                      Work Order
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Status
                    </label>
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {workOrder.status?.replace('_', ' ') || 'Unknown'}
                    </div>
                  </div>
                  
                  {workOrder.priority && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Priority
                      </label>
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {workOrder.priority}
                      </div>
                    </div>
                  )}
                  
                  {workOrder.estimatedHours && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Estimated Hours
                      </label>
                      <div className="text-sm font-medium text-gray-900">
                        {workOrder.estimatedHours} hours
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <Link
                    href={`/orders/work-orders/${workOrder._id}`}
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Eye className="h-4 w-4" />
                    View Work Order Details
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Actions Panel */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Actions</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {mode === 'edit' ? 'Update Checklist' : 'Save & Create Checklist'}
                  </>
                )}
              </button>
              
              <button
                onClick={handleCancel}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="h-5 w-5" />
                Cancel
              </button>
              
              {mode === 'edit' && existingChecklist && (
                <button
                  onClick={() => router.push(`/prechecklists/${existingChecklist._id}`)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                >
                  <Eye className="h-5 w-5" />
                  View Current Version
                </button>
              )}
              
              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Shield className="h-4 w-4" />
                  <span>All changes are auto-saved as drafts</span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-blue-600" />
              Quick Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Mark items as "Fault" only when issues are found</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Use "N/A" for items that don't apply to this vehicle</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Add detailed remarks for any faults found</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Take photos of faults for better documentation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              {formData.inspectionItems.length} items • {stats.ok} OK • {stats.fault} Faults
            </div>
            {stats.fault > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{stats.fault} fault(s) detected</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {mode === 'edit' ? 'Update Checklist' : 'Create Checklist'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}