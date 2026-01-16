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
  Settings,
  Lightbulb,
  Car as CarIcon,
  Package,
  Timer,
  CheckSquare,
  AlertOctagon,
  MessageSquare,
  Camera,
  ShieldAlert,
  CreditCard,
  Truck,
  Home,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  ClipboardList,
  Thermometer,
  Droplets,
  Zap,
  Wrench as WrenchIcon,
  Sparkles
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

type ServiceType = 'pickup_only' | 'workshop_installation' | 'mobile_service';
type InstallationTime = 'less_1_hour' | '1_2_hours' | '3_hours' | 'more_3_hours';
type DeliveryMethod = 'customer_pickup' | 'courier_delivery' | 'mobile_delivery_install';

export default function HeadlightPreChecklistCreatePage({ 
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
  const [autoPopulated, setAutoPopulated] = useState(false);

  // Headlight-specific form state
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    remarks: '',
    approved: false,
    
    // Headlight specific fields
    serviceType: 'workshop_installation' as ServiceType,
    inspectorName: '',
    customerDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    carDetails: {
      regNo: '',
      make: '',
      year: '',
      model: '',
      vin: ''
    },
    productServiceNeeded: '',
    productPrice: 0,
    servicePrice: 0,
    additionalInformation: '',
    installationDetails: {
      estimatedTime: '1_2_hours' as InstallationTime,
      assignedTechnician: '',
      workStartTime: new Date().toISOString()
    },
    deliveryPickupMethod: 'customer_pickup' as DeliveryMethod,
    
    // Headlight inspection items (L-LEFT, R-RIGHT)
    inspectionItems: [
      { item: 'High Beam', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Low Beam', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Daytime Running Light', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Turn Signal', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Fog Lights', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Parking Bulb', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Angel Lights', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Headlight Adjusters', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Adaptive Front Lights (AFS)', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Dimming Functionality', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Headlight Wiring and Connectors', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Beam Alignment', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Headlight Lens (Scratches, Cracks, Haziness)', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Water Proofing', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Dashboard Warning Lights', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'vehicle' },
      { item: 'Bumper Condition', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' }
    ],
    
    // Terms acceptance
    acceptTerms: false,
    acceptDiagnosticCharges: false,
    clientSignature: '',
    inspectorSignature: '',
    
    // Uploads
    uploadedImages: [] as string[]
  });

  const [selectedTemplate, setSelectedTemplate] = useState('headlight_basic');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'inspection' | 'customer' | 'vehicle' | 'installation' | 'terms'>('inspection');

  // Load related data and auto-populate from opportunity
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode]);

  useEffect(() => {
    // Auto-populate form data when opportunity is loaded
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

  const autoPopulateFromOpportunity = () => {
    if (!opportunity) return;

    try {
      // Extract customer name (could be "First Last" or company name)
      const customerName = opportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Get vehicle from opportunity vehicles array
      const primaryVehicle = opportunity.vehicles?.[0] || {};
      
      // Extract product/service details
      let productServiceNeeded = '';
      let productPrice = 0;
      let servicePrice = 0;
      
      if (opportunity.servicesProducts && opportunity.servicesProducts.length > 0) {
        const headlightServices = opportunity.servicesProducts.filter(
          item => item.title.toLowerCase().includes('headlight') || 
                  item.title.toLowerCase().includes('light') ||
                  item.type === 'SERVICE'
        );
        
        if (headlightServices.length > 0) {
          productServiceNeeded = headlightServices.map(item => item.title).join(', ');
          
          // Separate product vs service costs
          headlightServices.forEach(item => {
            if (item.type === 'PRODUCT' || item.type === 'PART') {
              productPrice += item.total;
            } else if (item.type === 'SERVICE' || item.type === 'LABOR') {
              servicePrice += item.total;
            }
          });
        } else {
          productServiceNeeded = opportunity.servicesProducts.map(item => item.title).join(', ');
          productPrice = opportunity.servicesProducts.reduce((sum, item) => sum + item.total, 0);
        }
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        customerDetails: {
          ...prev.customerDetails,
          firstName: firstName || '',
          lastName: lastName || '',
          email: opportunity.customer?.email || '',
          phone: opportunity.customer?.phone || '',
        },
        carDetails: {
          ...prev.carDetails,
          regNo: primaryVehicle.registrationNumber || primaryVehicle.licensePlate || '',
          make: primaryVehicle.make || '',
          year: primaryVehicle.year?.toString() || '',
          model: primaryVehicle.model || '',
          vin: primaryVehicle.vin || primaryVehicle.chassisNumber || ''
        },
        productServiceNeeded: productServiceNeeded || opportunity.subject || '',
        productPrice,
        servicePrice,
        additionalInformation: opportunity.notes || ''
      }));

      setAutoPopulated(true);
    } catch (error) {
      console.error('Error auto-populating from opportunity:', error);
    }
  };

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        setExistingChecklist(checklist);

        const transformedInspectionItems = checklist.inspectionItems?.map(item => ({
          item: item.item || '',
          status: (item.status || 'pending') as 'ok' | 'fault' | 'n/a' | 'pending',
          remarks: item.remarks || '',
          side: item.side || 'both'
        })) || [];
        
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
          serviceType: checklist.serviceType || 'workshop_installation',
          inspectorName: checklist.inspectorName || '',
          customerDetails: checklist.customerDetails || {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
          },
          carDetails: checklist.carDetails || {
            regNo: '',
            make: '',
            year: '',
            model: '',
            vin: ''
          },
          productServiceNeeded: checklist.productServiceNeeded || '',
          productPrice: checklist.productPrice || 0,
          servicePrice: checklist.servicePrice || 0,
          additionalInformation: checklist.additionalInformation || '',
          installationDetails: checklist.installationDetails || {
            estimatedTime: '1_2_hours',
            assignedTechnician: '',
            workStartTime: new Date().toISOString()
          },
          deliveryPickupMethod: checklist.deliveryPickupMethod || 'customer_pickup',
          inspectionItems: transformedInspectionItems,
          acceptTerms: checklist.acceptTerms || false,
          acceptDiagnosticCharges: checklist.acceptDiagnosticCharges || false,
          clientSignature: checklist.clientSignature || '',
          inspectorSignature: checklist.inspectorSignature || '',
          uploadedImages: checklist.uploadedImages || []
        });

        // Set opportunity and vehicle from existing checklist
        if (typeof checklist.opportunityId === 'object') {
          setOpportunity(checklist.opportunityId);
        }
        if (typeof checklist.vehicleId === 'object') {
          setVehicle(checklist.vehicleId);
        }
      }

      // Load opportunity if provided
      if (opportunityId) {
        try {
          const opp = await opportunityService.getOpportunityById(opportunityId);
          setOpportunity(opp);
          
          // Get vehicle from opportunity vehicles
          if (opp.vehicles && opp.vehicles.length > 0) {
            const primaryVehicle = opp.vehicles[0];
            setVehicle(primaryVehicle);
            
            // Set vehicle ID
            setFormData(prev => ({
              ...prev,
              opportunityId,
              vehicleId: primaryVehicle._id || vehicleId || ''
            }));
          } else if (vehicleId) {
            // Fallback to provided vehicleId
            try {
              const veh = await vehicleService.getVehicleById(vehicleId);
              setVehicle(veh);
              
              setFormData(prev => ({
                ...prev,
                opportunityId,
                vehicleId
              }));
            } catch (vehError) {
              console.error('Error loading vehicle:', vehError);
            }
          }
        } catch (error) {
          console.error('Error loading opportunity:', error);
          showToast('Could not load opportunity details', 'warning');
        }
      }

      // Load work order if ID provided
      if (workOrderId) {
        try {
          const wo = await workOrderService.getWorkOrderById(workOrderId);
          setWorkOrder(wo);
          
          if (wo.opportunityId) {
            const oppId = typeof wo.opportunityId === 'object' ? wo.opportunityId._id : wo.opportunityId;
            if (!opportunityId) {
              const opp = await opportunityService.getOpportunityById(oppId);
              setOpportunity(opp);
              
              setFormData(prev => ({
                ...prev,
                opportunityId: oppId
              }));
            }
          }
        } catch (error) {
          console.error('Error loading work order:', error);
          showToast('Could not load work order details', 'warning');
        }
      }

      // If we still don't have opportunity, but have IDs in formData, try to load them
      if (!opportunity && formData.opportunityId) {
        try {
          const opp = await opportunityService.getOpportunityById(formData.opportunityId);
          setOpportunity(opp);
        } catch (error) {
          console.error('Error loading opportunity by form ID:', error);
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

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCustomerDetailChange = (field: keyof typeof formData.customerDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      customerDetails: {
        ...prev.customerDetails,
        [field]: value
      }
    }));
  };

  const handleCarDetailChange = (field: keyof typeof formData.carDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      carDetails: {
        ...prev.carDetails,
        [field]: value
      }
    }));
  };

  const handleRefreshFromOpportunity = () => {
    if (opportunity) {
      autoPopulateFromOpportunity();
      showToast('Refreshed data from opportunity', 'info');
    }
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

  const handleStatusChange = (index: number, status: 'ok' | 'fault' | 'n/a' | 'pending') => {
    handleItemChange(index, 'status', status);
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    let items: any[] = [];
    
    switch (template) {
      case 'headlight_basic':
        items = [
          { item: 'High Beam', status: 'pending', remarks: '', side: 'both' },
          { item: 'Low Beam', status: 'pending', remarks: '', side: 'both' },
          { item: 'Turn Signal', status: 'pending', remarks: '', side: 'both' },
          { item: 'Fog Lights', status: 'pending', remarks: '', side: 'both' },
          { item: 'Headlight Lens', status: 'pending', remarks: '', side: 'both' },
          { item: 'Water Proofing', status: 'pending', remarks: '', side: 'both' }
        ];
        break;
      case 'headlight_comprehensive':
        items = [
          { item: 'High Beam', status: 'pending', remarks: '', side: 'both' },
          { item: 'Low Beam', status: 'pending', remarks: '', side: 'both' },
          { item: 'Daytime Running Light', status: 'pending', remarks: '', side: 'both' },
          { item: 'Turn Signal', status: 'pending', remarks: '', side: 'both' },
          { item: 'Fog Lights', status: 'pending', remarks: '', side: 'both' },
          { item: 'Parking Bulb', status: 'pending', remarks: '', side: 'both' },
          { item: 'Angel Lights', status: 'pending', remarks: '', side: 'both' },
          { item: 'Headlight Adjusters', status: 'pending', remarks: '', side: 'both' },
          { item: 'Adaptive Front Lights (AFS)', status: 'pending', remarks: '', side: 'both' },
          { item: 'Dimming Functionality', status: 'pending', remarks: '', side: 'both' },
          { item: 'Headlight Wiring and Connectors', status: 'pending', remarks: '', side: 'both' },
          { item: 'Beam Alignment', status: 'pending', remarks: '', side: 'both' },
          { item: 'Headlight Lens (Scratches, Cracks, Haziness)', status: 'pending', remarks: '', side: 'both' },
          { item: 'Water Proofing', status: 'pending', remarks: '', side: 'both' },
          { item: 'Dashboard Warning Lights', status: 'pending', remarks: '', side: 'vehicle' },
          { item: 'Bumper Condition', status: 'pending', remarks: '', side: 'both' }
        ];
        break;
      case 'custom':
        return;
    }
    
    setFormData(prev => ({
      ...prev,
      inspectionItems: items
    }));
  };

  const calculateStats = () => {
    const total = formData.inspectionItems.length;
    const ok = formData.inspectionItems.filter(item => item.status === 'ok').length;
    const fault = formData.inspectionItems.filter(item => item.status === 'fault').length;
    const na = formData.inspectionItems.filter(item => item.status === 'n/a').length;
    const pending = formData.inspectionItems.filter(item => item.status === 'pending').length;
    
    return { total, ok, fault, na, pending };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.inspectorName.trim()) {
        showToast('Inspector name is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.customerDetails.firstName.trim() || !formData.customerDetails.lastName.trim()) {
        showToast('Customer name is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.customerDetails.email.trim() || !formData.customerDetails.phone.trim()) {
        showToast('Customer email and phone are required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.carDetails.regNo.trim()) {
        showToast('Vehicle registration number is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.acceptTerms) {
        showToast('You must accept the terms and conditions', 'error');
        setSubmitting(false);
        return;
      }

      // Filter out pending status items (convert to 'n/a')
      const submissionItems = formData.inspectionItems.map(item => ({
        item: item.item,
        status: item.status === 'pending' ? 'n/a' : item.status,
        remarks: item.remarks,
        side: item.side
      }));

      const submissionData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        inspectionItems: submissionItems,
        remarks: formData.remarks,
        approved: false,
        // Include all headlight-specific data
        serviceType: formData.serviceType,
        inspectorName: formData.inspectorName,
        customerDetails: formData.customerDetails,
        carDetails: formData.carDetails,
        productServiceNeeded: formData.productServiceNeeded,
        productPrice: formData.productPrice,
        servicePrice: formData.servicePrice,
        additionalInformation: formData.additionalInformation,
        installationDetails: formData.installationDetails,
        deliveryPickupMethod: formData.deliveryPickupMethod,
        acceptTerms: formData.acceptTerms,
        acceptDiagnosticCharges: formData.acceptDiagnosticCharges,
        clientSignature: formData.clientSignature,
        inspectorSignature: formData.inspectorSignature,
        uploadedImages: formData.uploadedImages
      };

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData);
        showToast('Headlight pre-checklist updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await preChecklistService.createPreChecklist(submissionData, userId);
        showToast('Headlight pre-checklist created successfully', 'success');
      }

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading headlight pre-checklist form...</p>
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
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Lightbulb className="h-6 w-6" />
                {mode === 'edit' ? 'Edit Headlight Pre-Checklist' : 'Headlight Pre-Service Inspection'}
              </h1>
              <p className="text-blue-100">
                {mode === 'edit' 
                  ? `Editing: Pre-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Automotive Lighting Pre-Service Inspection Checklist'
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

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex overflow-x-auto">
            {['inspection', 'customer', 'vehicle', 'installation', 'terms'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'inspection' && 'Inspection Items'}
                {tab === 'customer' && 'Customer Details'}
                {tab === 'vehicle' && 'Vehicle Details'}
                {tab === 'installation' && 'Installation'}
                {tab === 'terms' && 'Terms & Signatures'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Column - Main Form */}
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

          {/* Service Type Selection */}
          {activeTab === 'inspection' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-blue-600" />
                Service Type
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('serviceType', 'pickup_only')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.serviceType === 'pickup_only'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Package className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">Product Pickup Only</div>
                  <p className="text-sm text-gray-600 mt-1">Customer collects product</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('serviceType', 'workshop_installation')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.serviceType === 'workshop_installation'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <WrenchIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">Workshop Installation</div>
                  <p className="text-sm text-gray-600 mt-1">Installation at our workshop</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('serviceType', 'mobile_service')}
                  className={`p-4 border-2 rounded-lg text-center transition-all ${
                    formData.serviceType === 'mobile_service'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Truck className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                  <div className="font-medium">Mobile Service</div>
                  <p className="text-sm text-gray-600 mt-1">We deliver & install</p>
                </button>
              </div>
            </div>
          )}

          {/* Inspection Items Section */}
          {activeTab === 'inspection' && (
            <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Headlight Inspection Items</h2>
                      <p className="text-sm text-gray-600">L-LEFT SIDE | R-RIGHT SIDE</p>
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
                  </div>
                </div>

                {showTemplateSelector && (
                  <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg shadow-lg">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <button
                        onClick={() => handleTemplateSelect('headlight_basic')}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          selectedTemplate === 'headlight_basic'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="font-medium text-gray-900 mb-1">Basic Headlight Check</div>
                        <p className="text-sm text-gray-600">6 essential lighting items</p>
                      </button>
                      <button
                        onClick={() => handleTemplateSelect('headlight_comprehensive')}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          selectedTemplate === 'headlight_comprehensive'
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="font-medium text-gray-900 mb-1">Comprehensive Headlight</div>
                        <p className="text-sm text-gray-600">16 detailed inspection items</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                {formData.inspectionItems.map((item, index) => {
                  const isExpanded = expandedSections.includes(index);
                  
                  return (
                    <div key={index} className="hover:bg-gray-50 transition-colors">
                      <div className="px-6 py-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                              <div className="flex-1">
                                <div className="text-lg font-medium text-gray-900">{item.item}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {item.side === 'both' ? 'L-LEFT | R-RIGHT' : item.side === 'vehicle' ? 'VEHICLE' : 'BOTH SIDES'}
                                </div>
                              </div>
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
                                onClick={() => toggleSection(index)}
                                className="ml-auto p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
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

                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Remarks
                              </label>
                              <textarea
                                value={item.remarks}
                                onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                placeholder="Add specific observations, damage details, or notes..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                rows={2}
                              />
                            </div>
                            
                            <div className="mt-3">
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Side
                              </label>
                              <div className="flex gap-4">
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`side-${index}`}
                                    checked={item.side === 'both'}
                                    onChange={() => handleItemChange(index, 'side', 'both')}
                                    className="text-blue-600"
                                  />
                                  <span>Both Sides</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`side-${index}`}
                                    checked={item.side === 'left'}
                                    onChange={() => handleItemChange(index, 'side', 'left')}
                                    className="text-blue-600"
                                  />
                                  <span>Left Only</span>
                                </label>
                                <label className="flex items-center gap-2">
                                  <input
                                    type="radio"
                                    name={`side-${index}`}
                                    checked={item.side === 'right'}
                                    onChange={() => handleItemChange(index, 'side', 'right')}
                                    className="text-blue-600"
                                  />
                                  <span>Right Only</span>
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Customer Details Section */}
          {activeTab === 'customer' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Customer Details
                </h2>
                {opportunity && (
                  <button
                    onClick={handleRefreshFromOpportunity}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Refresh from Opportunity
                  </button>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700">
                      Customer details are automatically populated from the connected opportunity. 
                      You can edit any fields if needed.
                    </p>
                    {opportunity && (
                      <div className="mt-2 flex items-center gap-2 text-xs">
                        <span className="text-blue-600 font-medium">Source:</span>
                        <span className="text-blue-800">{opportunity.subject}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inspector Name *
                  </label>
                  <input
                    type="text"
                    value={formData.inspectorName}
                    onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                    placeholder="Enter inspector name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Type *
                  </label>
                  <select
                    value={formData.serviceType}
                    onChange={(e) => handleInputChange('serviceType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="workshop_installation">Workshop Installation</option>
                    <option value="pickup_only">Product Pickup Only</option>
                    <option value="mobile_service">Mobile Service</option>
                  </select>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerDetails.firstName}
                      onChange={(e) => handleCustomerDetailChange('firstName', e.target.value)}
                      placeholder="First name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.customerDetails.lastName}
                      onChange={(e) => handleCustomerDetailChange('lastName', e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.customerDetails.email}
                      onChange={(e) => handleCustomerDetailChange('email', e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      value={formData.customerDetails.phone}
                      onChange={(e) => handleCustomerDetailChange('phone', e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vehicle Details Section */}
          {activeTab === 'vehicle' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <CarIcon className="h-5 w-5 text-blue-600" />
                  Vehicle & Service Details
                </h2>
                {opportunity && (
                  <button
                    onClick={handleRefreshFromOpportunity}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Refresh from Opportunity
                  </button>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-blue-700">
                      Vehicle details are populated from the opportunity. Product/service information 
                      and pricing come from the opportunity's services/products.
                    </p>
                    {opportunity?.servicesProducts && opportunity.servicesProducts.length > 0 && (
                      <div className="mt-2">
                        <span className="text-blue-600 font-medium text-xs">Available Services/Products:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {opportunity.servicesProducts.slice(0, 3).map((item, index) => (
                            <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {item.title}
                            </span>
                          ))}
                          {opportunity.servicesProducts.length > 3 && (
                            <span className="text-xs text-blue-600">+{opportunity.servicesProducts.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Number *
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.regNo}
                    onChange={(e) => handleCarDetailChange('regNo', e.target.value)}
                    placeholder="KAA 123A"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.make}
                    onChange={(e) => handleCarDetailChange('make', e.target.value)}
                    placeholder="Toyota"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Year
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.year}
                    onChange={(e) => handleCarDetailChange('year', e.target.value)}
                    placeholder="2022"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.model}
                    onChange={(e) => handleCarDetailChange('model', e.target.value)}
                    placeholder="Land Cruiser"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    VIN
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.vin}
                    onChange={(e) => handleCarDetailChange('vin', e.target.value)}
                    placeholder="Vehicle Identification Number"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Product & Service Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product / Service Needed
                    </label>
                    <input
                      type="text"
                      value={formData.productServiceNeeded}
                      onChange={(e) => handleInputChange('productServiceNeeded', e.target.value)}
                      placeholder="Headlight replacement, LED upgrade, etc."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    {opportunity?.servicesProducts && opportunity.servicesProducts.length > 0 && (
                      <p className="mt-1 text-xs text-gray-500">
                        From opportunity: {opportunity.servicesProducts.length} item(s)
                      </p>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Price (KES)
                      </label>
                      <input
                        type="number"
                        value={formData.productPrice}
                        onChange={(e) => handleInputChange('productPrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Products & parts total
                      </p>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Price (KES)
                      </label>
                      <input
                        type="number"
                        value={formData.servicePrice}
                        onChange={(e) => handleInputChange('servicePrice', parseFloat(e.target.value) || 0)}
                        placeholder="0.00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Service & labor total
                      </p>
                    </div>
                  </div>
                </div>
                
                {opportunity?.servicesProducts && opportunity.servicesProducts.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Opportunity Services/Products
                    </h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-40 overflow-y-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-1 font-medium text-gray-700">Item</th>
                            <th className="text-left py-1 font-medium text-gray-700">Type</th>
                            <th className="text-left py-1 font-medium text-gray-700">Qty</th>
                            <th className="text-left py-1 font-medium text-gray-700">Price</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opportunity.servicesProducts.slice(0, 5).map((item, index) => (
                            <tr key={index} className="border-b border-gray-100 last:border-0">
                              <td className="py-1">{item.title}</td>
                              <td className="py-1">
                                <span className={`px-2 py-0.5 text-xs rounded ${
                                  item.type === 'SERVICE' ? 'bg-blue-100 text-blue-800' :
                                  item.type === 'PRODUCT' ? 'bg-green-100 text-green-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {item.type}
                                </span>
                              </td>
                              <td className="py-1">{item.quantity}</td>
                              <td className="py-1 font-medium">KES {item.total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {opportunity.servicesProducts.length > 5 && (
                        <div className="text-center mt-2 text-xs text-gray-500">
                          +{opportunity.servicesProducts.length - 5} more items
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    value={formData.additionalInformation}
                    onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                    placeholder="Any additional notes, special requests, or observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                  {opportunity?.notes && (
                    <p className="mt-1 text-xs text-gray-500">
                      Opportunity notes: {opportunity.notes.substring(0, 100)}...
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Installation Details Section */}
          {activeTab === 'installation' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <WrenchIcon className="h-5 w-5 text-blue-600" />
                Installation Details
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Technician
                  </label>
                  <input
                    type="text"
                    value={formData.installationDetails.assignedTechnician}
                    onChange={(e) => handleNestedInputChange('installationDetails', 'assignedTechnician', e.target.value)}
                    placeholder="Technician name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.installationDetails.workStartTime.split('.')[0]}
                    onChange={(e) => handleNestedInputChange('installationDetails', 'workStartTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Installation Time
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'less_1_hour', label: '< 1 hour', icon: <Timer className="h-4 w-4" /> },
                    { value: '1_2_hours', label: '1-2 hours', icon: <Timer className="h-4 w-4" /> },
                    { value: '3_hours', label: '3 hours', icon: <Timer className="h-4 w-4" /> },
                    { value: 'more_3_hours', label: '> 3 hours', icon: <Timer className="h-4 w-4" /> }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleNestedInputChange('installationDetails', 'estimatedTime', option.value)}
                      className={`p-3 border rounded-lg flex items-center justify-center gap-2 transition-all ${
                        formData.installationDetails.estimatedTime === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {option.icon}
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery/Pickup Method</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { value: 'customer_pickup', label: 'Customer Pickup (at workshop)', icon: <Home className="h-4 w-4" /> },
                    { value: 'courier_delivery', label: 'Courier Service Delivery', icon: <Truck className="h-4 w-4" /> },
                    { value: 'mobile_delivery_install', label: 'We Deliver & Install (mobile service)', icon: <CarIcon className="h-4 w-4" /> }
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleInputChange('deliveryPickupMethod', option.value)}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        formData.deliveryPickupMethod === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{option.label}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Terms & Signatures Section */}
          {activeTab === 'terms' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-blue-600" />
                  Terms & Conditions
                </h2>
                <span className="text-sm text-gray-500">Required Fields *</span>
              </div>
              
              {/* Scrollable Terms Container */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="h-96 overflow-y-auto p-4">
                  
                  {/* Dashboard Warning Notice */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800 mb-1">NOTICE</h4>
                        <p className="text-sm text-yellow-700">
                          If your vehicle has dashboard warning lights/errors, additional diagnostic charges may apply 
                          for error code reading/clearing.
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Personal Items Terms */}
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Personal Items & Valuables</h3>
                    <ol className="space-y-2 text-xs text-gray-700">
                      <li className="flex gap-2">
                        <span className="font-medium">1.</span>
                        <span>Eagle Lights Automotive LTD takes great care in servicing your vehicle, but we strongly recommend that you remove all personal items, valuables, and items of sentimental value from your vehicle before leaving it in our care for service.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium">2.</span>
                        <span>While we make every effort to ensure the safety and security of your personal belongings, we want to make it clear that we cannot accept liability for any loss, damage, or theft of items left in your vehicle during the service process.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium">3.</span>
                        <span>This includes, but is not limited to, electronic devices, jewelry, cash, documents, and any other personal property.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium">4.</span>
                        <span>We advise you to thoroughly inspect your vehicle before handing it over to us for service and ensure that all personal items are removed.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="font-medium">5.</span>
                        <span>By choosing to leave personal items in your vehicle during service, you acknowledge and accept that Eagle Lights Automotive LTD is not liable for any loss or damage to these items.</span>
                      </li>
                    </ol>
                  </div>
                  
                  {/* Headlight Specific Terms */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Headlight Service Terms & Conditions</h3>
                    <div className="space-y-4 text-xs text-gray-700">
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">1. Scope and Customer Obligations:</h4>
                        <div className="ml-4 space-y-1">
                          <p>1.1. Eagle Lights specialises in automotive lighting, offering headlight installations and customizations.</p>
                          <p>1.2. Accurate vehicle information is crucial, and customers must disclose pre-existing modifications.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">2. Manufacturer's Warranty and Voiding Conditions:</h4>
                        <div className="ml-4 space-y-1">
                          <p>2.1. While Eagle Lights provides a limited warranty for workmanship, manufacturer's warranties vary and are not our responsibility.</p>
                          <p>2.2. Certain actions, like unauthorised modifications, shall void the warranty.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">3. Warranty Period and Refund:</h4>
                        <div className="ml-4 space-y-1">
                          <p>3.1. The warranty period for workmanship is Six Months to One Year depending on the product.</p>
                          <p>3.2. Refunds cannot be given if Eagle Lights has attained the expected standards regardless of whether the client's standards have not been achieved.</p>
                          <p>3.3. If a client requests a refund, Eagle Lights will charge it as a new installation, and installation rates will be applicable.</p>
                          <p>3.4. We do not provide a refund if the vehicle rejects the product installed, and the product testing shows that the product is working properly.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">4. Unauthorised Modifications:</h4>
                        <div className="ml-4">
                          <p>4.1. Unauthorised alterations to installed components, including those not performed by Eagle Lights technicians, will void the warranty and limit liability.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">5. Service Charges and Payments:</h4>
                        <div className="ml-4 space-y-1">
                          <p>5.1. Customers agree to pay for services as outlined in the invoice.</p>
                          <p>5.2. Late payments may incur additional charges.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">6. Risks and Informed Decision:</h4>
                        <div className="ml-4 space-y-1">
                          <p>6.1. Customers acknowledge that customizations and upgrades involve risks, including compatibility and breakage issues.</p>
                          <p>6.2. They make informed decisions to proceed despite these risks.</p>
                          <p>6.3. Customization/Upgrade may cause engine errors. In such events, the customer will be responsible for clearing such errors with Eagle Lights assistance.</p>
                          <p>6.4. Once customization is done, it may be impossible to return the headlight back to the original manufacturer's design.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">7. Customer Liability and Acknowledgment:</h4>
                        <div className="ml-4 space-y-1">
                          <p>7.1. Customers take responsibility for customization choices.</p>
                          <p>7.2. Eagle Lights is not liable for damages arising from customization or upgrades.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">8. Steps for Issue Resolution:</h4>
                        <div className="ml-4">
                          <p>8.1. In case of issues, customers must follow specific steps, including contacting Eagle Lights and providing visual documentation.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">9. Limitation of Liability:</h4>
                        <div className="ml-4 space-y-1">
                          <p>9.1. Eagle Lights is not liable for direct/indirect damages arising from services.</p>
                          <p>9.2. This includes loss of profits, personal injury, or property damage.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">10. Giving Vehicle to Non-Eagle Lights Technician:</h4>
                        <div className="ml-4">
                          <p>10.1. Allowing non-Eagle Lights technicians to perform alterations on the installed headlights may void the warranty and limit liability.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">11. Dispute Resolution:</h4>
                        <div className="ml-4">
                          <p>11.1. Disputes are resolved through negotiation, mediation, and arbitration, with exclusive jurisdiction in Kenya.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">12. Privacy Policy:</h4>
                        <div className="ml-4">
                          <p>12.1. Customer information collected is used solely for service purposes and treated as per Eagle Lights' Privacy Policy.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">13. Acknowledgement of Risks and Acceptance of Modifications:</h4>
                        <div className="ml-4 space-y-1">
                          <p>13.1. Customers acknowledge the inherent risks associated with headlight customization and upgrades.</p>
                          <p>13.2. Once a customer approves modifications and upgrades, they recognize that the vehicle's original manufacturing state cannot be fully restored, and they willingly accept these risks.</p>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-gray-800 mb-1">14. Non-Liability for Damages Resulting from Customization:</h4>
                        <div className="ml-4 space-y-1">
                          <p>14.1. Eagle Lights shall not be held liable for any damages, losses, or costs resulting from the customization process.</p>
                          <p>14.2. This includes issues like breakages, sweating, compatibility, electrical problems, alignment concerns, AFS compatibility, error lights on the dashboard, or warranty implications.</p>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                  
                </div>
              </div>
              
              {/* Acceptance Checkboxes */}
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptDiagnosticCharges"
                    checked={formData.acceptDiagnosticCharges}
                    onChange={(e) => handleInputChange('acceptDiagnosticCharges', e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="acceptDiagnosticCharges" className="text-sm text-gray-700">
                    I understand that dashboard error diagnosis/clearing incurs additional charges as per the service rate card *
                  </label>
                </div>
                
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                    I accept the Terms and Conditions of Eagle Lights Automotive LTD *
                  </label>
                </div>
              </div>
              
              {/* Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Client Signature *
                  </label>
                  <div className="h-24 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <FileSignature className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Click to sign</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">
                    Inspector Signature *
                  </label>
                  <div className="h-24 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <FileSignature className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Click to sign</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Upload Images - Compact */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Drag & drop or click to browse</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Information & Actions */}
        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CarIcon className="h-5 w-5 text-blue-600" />
              Vehicle Information
            </h2>
            
            {vehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <CarIcon className="h-8 w-8 text-blue-600" />
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
                <CarIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
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
            
            {opportunity && (
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Building className="h-5 w-5 text-blue-600" />
                    Opportunity Details
                  </h2>
                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                    opportunity.status === 'won' ? 'bg-green-100 text-green-800' :
                    opportunity.status === 'lost' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {opportunity.status?.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <Building className="h-8 w-8 text-blue-600" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 truncate">
                        {opportunity.subject || 'Opportunity'}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {opportunity.customer?.name || 'Customer'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Opportunity ID
                      </label>
                      <div className="text-sm font-medium text-gray-900 font-mono">
                        {opportunity._id?.slice(-8)}
                      </div>
                    </div>
                    
                    {opportunity.opportunityType && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Type
                        </label>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {opportunity.opportunityType}
                        </div>
                      </div>
                    )}
                    
                    {opportunity.source && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Source
                        </label>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {opportunity.source.replace(/_/g, ' ')}
                        </div>
                      </div>
                    )}
                    
                    {opportunity.total !== undefined && (
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                          Total Value
                        </label>
                        <div className="text-sm font-bold text-green-700">
                          KES {opportunity.total?.toLocaleString() || '0'}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {opportunity.servicesProducts && opportunity.servicesProducts.length > 0 && (
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Services/Products Summary
                      </h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Items:</span>
                          <span className="font-medium">{opportunity.servicesProducts.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-600">Subtotal:</span>
                          <span className="font-medium">KES {opportunity.subtotal?.toLocaleString() || '0'}</span>
                        </div>
                        {opportunity.totalDiscount && opportunity.totalDiscount > 0 && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Discount:</span>
                            <span className="font-medium text-red-600">-KES {opportunity.totalDiscount.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      href={`/opportunities/${opportunity._id}`}
                      className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                    >
                      <Eye className="h-4 w-4" />
                      View Full Opportunity Details
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Work Order Information */}
          {workOrder && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <WrenchIcon className="h-5 w-5 text-blue-600" />
                Work Order Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <WrenchIcon className="h-8 w-8 text-blue-600" />
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
              <Lightbulb className="h-5 w-5 text-blue-600" />
              Headlight Inspection Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Check both left and right sides for each item</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Mark as "Fault" if any damage or malfunction is found</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Document all faults with photos and detailed remarks</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Test adaptive systems if vehicle is equipped</span>
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