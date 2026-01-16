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
  ThumbsUp,
  ThumbsDown,
  Star,
  Award,
  Target,
  Sparkles,
  BarChart3,
  Download,
  Copy,
  Calculator,
  DollarSign
} from 'lucide-react';
import { postChecklistService, ChecklistItem, ChecklistItemStatus } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { preChecklistService } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';

interface PostChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

export default function HeadlightPostChecklistCreatePage({ 
  mode = 'create', 
  checklistId 
}: PostChecklistCreatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Get parameters from URL
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');
  const vehicleId = searchParams.get('vehicleId');
  const jobCardId = searchParams.get('jobCardId');
  const preChecklistId = searchParams.get('preChecklistId');
  const source = searchParams.get('source');

  const [loading, setLoading] = useState(mode === 'create');
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [jobCard, setJobCard] = useState<any>(null);
  const [preChecklist, setPreChecklist] = useState<any>(null);
  const [existingChecklist, setExistingChecklist] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    jobCardId: jobCardId || '',
    preChecklistId: preChecklistId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    
    // Customer details
    customerName: '',
    dateTime: new Date().toISOString(),
    warrantyDuration: '12 months',
    
    // Headlight inspection items
    inspectionItems: [
      { item: 'High Beam', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Low Beam', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Daytime Running Light', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Turn Signal', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Fog Lights', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: false },
      { item: 'Parking Bulb', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: false },
      { item: 'Angel Lights', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: false },
      { item: 'Headlight Adjusters', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Adaptive Front Lights (AFS)', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: false },
      { item: 'Dimming Functionality', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: false },
      { item: 'Headlight Wiring and Connectors', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Beam Alignment', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Headlight Lens (Scratches, Cracks, Haziness)', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Water Proofing', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true },
      { item: 'Dashboard Warning Lights', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'vehicle', required: true },
      { item: 'Bumper Condition', status: ChecklistItemStatus.INCOMPLETE, remarks: '', side: 'both', required: true }
    ] as ChecklistItem[],
    
    // Additional fields
    beforePhotos: [] as string[],
    afterPhotos: [] as string[],
    notes: '',
    overallCondition: 'pending' as 'pending' | 'satisfactory' | 'needs_attention' | 'excellent',
    recommendations: '',
    
    // Customer satisfaction
    rating: 0,
    comments: '',
    
    // Approval
    approved: false,
    acceptTerms: false,
    customerSignature: '',
    
    // Warranty
    warrantyStartDate: new Date().toISOString(),
    warrantyEndDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
    warrantyNotes: '',

    productServiceNeeded: '',
    acceptDiagnosticCharges: false
  });

  const [selectedTemplate, setSelectedTemplate] = useState('headlight_comprehensive');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'inspection' | 'photos' | 'warranty' | 'feedback' | 'terms'>('inspection');
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [autoPopulated, setAutoPopulated] = useState(false);

  // Load related data
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, jobCardId, preChecklistId, checklistId, mode]);

  const autoPopulateFromOpportunity = () => {
    if (!opportunity) return;

    try {
      // Extract customer name
      const customerName = opportunity.customer?.name || '';
      
      // Get vehicle from opportunity
      const primaryVehicle = opportunity.vehicles?.[0] || {};
      
      // Extract product/service information for warranty
      let productServiceNeeded = '';
      
      if (opportunity.servicesProducts && opportunity.servicesProducts.length > 0) {
        const headlightServices = opportunity.servicesProducts.filter(
          item => item.title.toLowerCase().includes('headlight') || 
                  item.title.toLowerCase().includes('light')
        );
        
        if (headlightServices.length > 0) {
          productServiceNeeded = headlightServices.map(item => item.title).join(', ');
        } else {
          productServiceNeeded = opportunity.servicesProducts.map(item => item.title).join(', ');
        }
      }

      // Determine warranty duration based on products
      let warrantyDuration = '12 months';
      if (opportunity.servicesProducts && opportunity.servicesProducts.length > 0) {
        const hasPremiumProducts = opportunity.servicesProducts.some(
          item => item.title.toLowerCase().includes('led') || 
                  item.title.toLowerCase().includes('premium') ||
                  item.title.toLowerCase().includes('pro')
        );
        warrantyDuration = hasPremiumProducts ? '24 months' : '12 months';
      }

      // Update form data
      setFormData(prev => ({
        ...prev,
        customerName: customerName,
        productServiceNeeded: productServiceNeeded || opportunity.subject || '',
        warrantyDuration,
        warrantyNotes: opportunity.notes ? 
          `Service performed as per opportunity: ${opportunity.subject}` : 
          `Post-service inspection for ${customerName}`
      }));

      setAutoPopulated(true);
      showToast('Customer and warranty details auto-populated from opportunity', 'success');
    } catch (error) {
      console.error('Error auto-populating from opportunity:', error);
    }
  };

  const handleRefreshFromOpportunity = () => {
    if (opportunity) {
      autoPopulateFromOpportunity();
      showToast('Refreshed data from opportunity', 'info');
    }
  };

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await postChecklistService.getPostChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        setFormData(prev => ({
          ...prev,
          opportunityId: typeof checklist.opportunityId === 'object' 
            ? checklist.opportunityId._id 
            : checklist.opportunityId,
          vehicleId: typeof checklist.vehicleId === 'object' 
            ? checklist.vehicleId._id 
            : checklist.vehicleId,
          jobCardId: typeof checklist.jobCardId === 'object' 
            ? checklist.jobCardId._id 
            : checklist.jobCardId,
          preChecklistId: checklist.preChecklistId || '',
          inspectedBy: checklist.inspectedBy 
            ? (typeof checklist.inspectedBy === 'object' 
                ? checklist.inspectedBy._id 
                : checklist.inspectedBy)
            : sessionStorage.getItem('userId') || '',
          customerName: checklist.customerName || '',
          dateTime: checklist.dateTime || new Date().toISOString(),
          warrantyDuration: checklist.warrantyDuration || '12 months',
          inspectionItems: checklist.inspectionItems || prev.inspectionItems,
          beforePhotos: checklist.beforePhotos || [],
          afterPhotos: checklist.afterPhotos || [],
          notes: checklist.notes || '',
          overallCondition: checklist.overallCondition || 'pending',
          recommendations: checklist.recommendations || '',
          rating: checklist.rating || 0,
          comments: checklist.comments || '',
          approved: checklist.approved || false,
          acceptTerms: checklist.acceptTerms || false,
          customerSignature: checklist.customerSignature || '',
          warrantyStartDate: checklist.warrantyStartDate || new Date().toISOString(),
          warrantyEndDate: checklist.warrantyEndDate || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString(),
          warrantyNotes: checklist.warrantyNotes || ''
        }));

        // Set related data
        if (typeof checklist.opportunityId === 'object') {
          setOpportunity(checklist.opportunityId);
        }
        if (typeof checklist.vehicleId === 'object') {
          setVehicle(checklist.vehicleId);
        }
        if (typeof checklist.jobCardId === 'object') {
          setJobCard(checklist.jobCardId);
        }
      }

      // Helper function to get vehicle ID from opportunity
      const getVehicleIdFromOpportunity = (opportunity: any): string | null => {
        if (!opportunity) return null;
        
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
          
          if (wo.opportunityId) {
            const oppId = typeof wo.opportunityId === 'object' ? wo.opportunityId._id : wo.opportunityId;
            const opp = await opportunityService.getOpportunityById(oppId);
            setOpportunity(opp);
            
            const vehicleId = getVehicleIdFromOpportunity(opp);
            if (vehicleId) {
              try {
                const veh = await vehicleService.getVehicleById(vehicleId);
                setVehicle(veh);
                
                setFormData(prev => ({
                  ...prev,
                  opportunityId: oppId,
                  vehicleId
                }));
              } catch (vehError) {
                console.error('Error loading vehicle details:', vehError);
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

      // Load pre-checklist if ID provided
      if (preChecklistId) {
        try {
          const preChecklist = await preChecklistService.getPreChecklistById(preChecklistId);
          setPreChecklist(preChecklist);
          
          // Use customer details from pre-checklist
          if (preChecklist.customerDetails) {
            setFormData(prev => ({
              ...prev,
              preChecklistId,
              customerName: `${preChecklist.customerDetails.firstName} ${preChecklist.customerDetails.lastName}`.trim()
            }));
          }
        } catch (error) {
          console.error('Error loading pre-checklist:', error);
          showToast('Could not load pre-checklist details', 'warning');
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

  const handleItemChange = (index: number, field: keyof ChecklistItem, value: any) => {
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

  const handleStatusChange = (index: number, status: ChecklistItemStatus) => {
    handleItemChange(index, 'status', status);
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    let items: ChecklistItem[] = [];
    
    switch (template) {
      case 'headlight_basic':
        items = [
          { item: 'High Beam', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Low Beam', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Turn Signal', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Headlight Adjusters', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Beam Alignment', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Water Proofing', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' }
        ];
        break;
      case 'headlight_comprehensive':
        items = [
          { item: 'High Beam', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Low Beam', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Daytime Running Light', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Turn Signal', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Fog Lights', status: ChecklistItemStatus.INCOMPLETE, required: false, side: 'both' },
          { item: 'Parking Bulb', status: ChecklistItemStatus.INCOMPLETE, required: false, side: 'both' },
          { item: 'Angel Lights', status: ChecklistItemStatus.INCOMPLETE, required: false, side: 'both' },
          { item: 'Headlight Adjusters', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Adaptive Front Lights (AFS)', status: ChecklistItemStatus.INCOMPLETE, required: false, side: 'both' },
          { item: 'Dimming Functionality', status: ChecklistItemStatus.INCOMPLETE, required: false, side: 'both' },
          { item: 'Headlight Wiring and Connectors', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Beam Alignment', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Headlight Lens (Scratches, Cracks, Haziness)', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Water Proofing', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' },
          { item: 'Dashboard Warning Lights', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'vehicle' },
          { item: 'Bumper Condition', status: ChecklistItemStatus.INCOMPLETE, required: true, side: 'both' }
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
    const completed = formData.inspectionItems.filter(item => item.status === ChecklistItemStatus.COMPLETED).length;
    const incomplete = formData.inspectionItems.filter(item => item.status === ChecklistItemStatus.INCOMPLETE).length;
    const na = formData.inspectionItems.filter(item => item.status === ChecklistItemStatus.NOT_APPLICABLE).length;
    
    const requiredItems = formData.inspectionItems.filter(item => item.required !== false);
    const requiredCompleted = requiredItems.filter(item => item.status === ChecklistItemStatus.COMPLETED).length;
    const completionPercentage = requiredItems.length > 0 
      ? Math.round((requiredCompleted / requiredItems.length) * 100) 
      : 0;
    
    return { total, completed, incomplete, na, completionPercentage };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.customerName.trim()) {
        showToast('Customer name is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.acceptTerms) {
        showToast('You must accept the terms and conditions', 'error');
        setSubmitting(false);
        return;
      }

      const validItems = formData.inspectionItems.filter(item => item.item.trim() !== '');

      if (validItems.length === 0) {
        showToast('Please complete at least one inspection item', 'error');
        setSubmitting(false);
        return;
      }

      const submissionData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        jobCardId: formData.jobCardId,
        preChecklistId: formData.preChecklistId || undefined,
        inspectedBy: formData.inspectedBy,
        customerName: formData.customerName,
        dateTime: formData.dateTime,
        warrantyDuration: formData.warrantyDuration,
        inspectionItems: validItems,
        beforePhotos: formData.beforePhotos,
        afterPhotos: formData.afterPhotos,
        notes: formData.notes,
        overallCondition: formData.overallCondition,
        recommendations: formData.recommendations,
        rating: formData.rating,
        comments: formData.comments,
        approved: false,
        acceptTerms: formData.acceptTerms,
        customerSignature: formData.customerSignature,
        warrantyStartDate: formData.warrantyStartDate,
        warrantyEndDate: formData.warrantyEndDate,
        warrantyNotes: formData.warrantyNotes
      };

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await postChecklistService.updatePostChecklist(checklistId, submissionData);
        showToast('Headlight post-checklist updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await postChecklistService.createPostChecklist(submissionData, userId);
        showToast('Headlight post-checklist created successfully', 'success');
      }

      if (source === 'workflow') {
        router.push(`/orders/work-orders/${workOrderId || ''}`);
      } else if (source === 'jobcard') {
        router.push(`/job-cards/${jobCardId || ''}`);
      } else {
        router.push(`/post-checklist/${result._id}`);
      }

    } catch (error: any) {
      console.error('Error submitting post-checklist:', error);
      showToast(error.message || 'Failed to save post-checklist', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async () => {
    try {
      setSubmitting(true);
      
      // First save the checklist
      await handleSubmit({ preventDefault: () => {} } as React.FormEvent);
      
      // Then submit for approval
      if (existingChecklist?._id) {
        await postChecklistService.approvePostChecklist(existingChecklist._id);
        showToast('Checklist submitted for approval', 'success');
        router.push(`/post-checklist/${existingChecklist._id}`);
      }
    } catch (error: any) {
      console.error('Error submitting for approval:', error);
      showToast(error.message || 'Failed to submit for approval', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (source === 'workflow' && workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else if (source === 'jobcard' && jobCardId) {
      router.push(`/job-cards/${jobCardId}`);
    } else {
      router.push('/post-checklist');
    }
  };

  const getStatusColor = (status: ChecklistItemStatus) => {
    switch (status) {
      case ChecklistItemStatus.COMPLETED: return 'bg-green-100 text-green-800 border-green-200';
      case ChecklistItemStatus.INCOMPLETE: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case ChecklistItemStatus.NOT_APPLICABLE: return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getStatusIcon = (status: ChecklistItemStatus) => {
    switch (status) {
      case ChecklistItemStatus.COMPLETED: return <CheckCircle className="h-4 w-4" />;
      case ChecklistItemStatus.INCOMPLETE: return <AlertCircle className="h-4 w-4" />;
      case ChecklistItemStatus.NOT_APPLICABLE: return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'excellent': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'satisfactory': return 'bg-green-100 text-green-800 border-green-200';
      case 'needs_attention': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
          <p className="text-gray-600">Loading headlight post-checklist form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 via-emerald-500 to-teal-600 text-white px-8 py-6 shadow-lg">
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
                {mode === 'edit' ? 'Edit Headlight Post-Checklist' : 'Headlight Post-Service Inspection'}
              </h1>
              <p className="text-green-100">
                {mode === 'edit' 
                  ? `Editing: Post-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Automotive Lighting Post-Service Quality Checklist'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Completed: {stats.completed}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Pending: {stats.incomplete}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>N/A: {stats.na}</span>
              </div>
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
            {['inspection', 'photos', 'warranty', 'feedback', 'terms'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'border-green-600 text-green-600 bg-green-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {tab === 'inspection' && 'Inspection Items'}
                {tab === 'photos' && 'Photos'}
                {tab === 'warranty' && 'Warranty'}
                {tab === 'feedback' && 'Customer Feedback'}
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
                <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                <div className="text-sm text-green-600">Completed</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-yellow-700">{stats.incomplete}</div>
                <div className="text-sm text-yellow-600">Pending</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-gray-700">{stats.na}</div>
                <div className="text-sm text-gray-600">N/A</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-xl text-center">
                <div className="text-2xl font-bold text-blue-700">{stats.completionPercentage}%</div>
                <div className="text-sm text-blue-600">Completion</div>
              </div>
            </div>
          </div>

          {/* Customer Details */}

          {/* Inspection Items Section */}
          {activeTab === 'inspection' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-green-600" />
                  Customer & Service Details
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
              
              {opportunity && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-700">
                        Customer details and warranty information are populated from the connected opportunity.
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="font-medium text-green-800">Opportunity:</span>
                          <span className="ml-1 text-green-900">{opportunity.subject}</span>
                        </div>
                        <div>
                          <span className="font-medium text-green-800">Type:</span>
                          <span className="ml-1 text-green-900 capitalize">{opportunity.opportunityType}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => handleInputChange('customerName', e.target.value)}
                    placeholder="Customer full name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                  {opportunity?.customer?.name && (
                    <p className="mt-1 text-xs text-gray-500">
                      From opportunity: {opportunity.customer.name}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.dateTime.split('.')[0]}
                    onChange={(e) => handleInputChange('dateTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Duration *
                </label>
                <div className="flex items-center gap-4">
                  <select
                    value={formData.warrantyDuration}
                    onChange={(e) => handleInputChange('warrantyDuration', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="6 months">6 Months</option>
                    <option value="12 months">12 Months</option>
                    <option value="18 months">18 Months</option>
                    <option value="24 months">24 Months</option>
                    <option value="36 months">36 Months</option>
                    <option value="lifetime">Lifetime</option>
                  </select>
                  {opportunity?.servicesProducts && (
                    <div className="text-xs text-gray-600">
                      <span className="font-medium">Based on:</span> {opportunity.servicesProducts.length} item(s)
                    </div>
                  )}
                </div>
              </div>

              {opportunity?.servicesProducts && opportunity.servicesProducts.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">
                    Services/Products Covered
                  </h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-h-32 overflow-y-auto">
                    <ul className="space-y-1 text-sm">
                      {opportunity.servicesProducts.map((item, index) => (
                        <li key={index} className="flex items-center justify-between">
                          <span className="text-gray-700">{item.title}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.type === 'SERVICE' ? 'bg-blue-100 text-blue-800' :
                            item.type === 'PRODUCT' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Photos Section */}
          {activeTab === 'photos' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Camera className="h-5 w-5 text-green-600" />
                Before & After Photos
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Before Photos
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[200px]">
                    {formData.beforePhotos.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {formData.beforePhotos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={photo} 
                                alt={`Before ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => {
                                  const newPhotos = [...formData.beforePhotos];
                                  newPhotos.splice(index, 1);
                                  handleInputChange('beforePhotos', newPhotos);
                                }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {/* Implement upload logic */}}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add More Photos
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Upload photos before service</p>
                        <p className="text-sm text-gray-500">Document pre-existing condition</p>
                        <button
                          onClick={() => {/* Implement upload logic */}}
                          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Upload Photos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    After Photos
                  </h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[200px]">
                    {formData.afterPhotos.length > 0 ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          {formData.afterPhotos.map((photo, index) => (
                            <div key={index} className="relative">
                              <img 
                                src={photo} 
                                alt={`After ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg"
                              />
                              <button
                                onClick={() => {
                                  const newPhotos = [...formData.afterPhotos];
                                  newPhotos.splice(index, 1);
                                  handleInputChange('afterPhotos', newPhotos);
                                }}
                                className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          onClick={() => {/* Implement upload logic */}}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                          Add More Photos
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 mb-2">Upload photos after service</p>
                        <p className="text-sm text-gray-500">Document completed work</p>
                        <button
                          onClick={() => {/* Implement upload logic */}}
                          className="mt-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                        >
                          Upload Photos
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Warranty Section */}
          {activeTab === 'warranty' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-green-600" />
                  Warranty Information
                </h2>
                {opportunity && (
                  <button
                    onClick={handleRefreshFromOpportunity}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Update from Opportunity
                  </button>
                )}
              </div>
              
              {opportunity && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Building className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Opportunity Reference</h4>
                      <p className="text-sm text-blue-700">
                        This warranty is linked to Opportunity: <strong>{opportunity.subject}</strong>
                      </p>
                      {opportunity.customer?.companyName && (
                        <p className="text-sm text-blue-700 mt-1">
                          Customer: {opportunity.customer.companyName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Start Date
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyStartDate.split('T')[0]}
                    onChange={(e) => handleInputChange('warrantyStartDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty End Date
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyEndDate.split('T')[0]}
                    onChange={(e) => handleInputChange('warrantyEndDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {formData.warrantyDuration && (
                    <p className="mt-1 text-xs text-gray-500">
                      Duration: {formData.warrantyDuration}
                    </p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product/Service Covered
                </label>
                <input
                  type="text"
                  value={formData.productServiceNeeded}
                  onChange={(e) => handleInputChange('productServiceNeeded', e.target.value)}
                  placeholder="Headlight replacement, LED upgrade, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                {opportunity?.servicesProducts && opportunity.servicesProducts.length > 0 && (
                  <p className="mt-1 text-xs text-gray-500">
                    Based on {opportunity.servicesProducts.length} item(s) from opportunity
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Warranty Notes
                </label>
                <textarea
                  value={formData.warrantyNotes}
                  onChange={(e) => handleInputChange('warrantyNotes', e.target.value)}
                  placeholder="Add any special warranty conditions, limitations, or notes..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                />
                {opportunity?.notes && (
                  <p className="mt-1 text-xs text-gray-500">
                    Opportunity notes: {opportunity.notes.substring(0, 100)}...
                  </p>
                )}
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-800 mb-1">Warranty Information</h4>
                    <p className="text-sm text-blue-700">
                      Eagle Lights provides a limited warranty for workmanship. Manufacturer warranties vary and are not our responsibility. 
                      Unauthorized modifications may void the warranty. Warranty period: Six Months to One Year depending on the product.
                    </p>
                    {opportunity?.total !== undefined && (
                      <div className="mt-2 text-sm text-blue-800">
                        <span className="font-medium">Opportunity Value:</span> KES {opportunity.total.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Section */}
          {activeTab === 'feedback' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ThumbsUp className="h-5 w-5 text-green-600" />
                Customer Feedback
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Condition
                </label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {['pending', 'satisfactory', 'needs_attention', 'excellent'].map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => handleInputChange('overallCondition', condition)}
                      className={`p-4 border rounded-lg text-center transition-all ${
                        formData.overallCondition === condition
                          ? `${getConditionColor(condition)} border-2`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 capitalize">
                        {condition.replace('_', ' ')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rate Our Service
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleInputChange('rating', star)}
                      className="p-1"
                    >
                      <Star className={`h-8 w-8 ${
                        star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`} />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {formData.rating === 0 ? 'No rating yet' : `${formData.rating} out of 5`}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments About Our Services
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => handleInputChange('comments', e.target.value)}
                  placeholder="Please share your feedback about our service..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any service notes or observations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', e.target.value)}
                  placeholder="Add any recommendations for future maintenance..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Terms & Signatures Section */}
          {activeTab === 'terms' && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-green-600" />
                  Terms & Signatures
                </h2>
                <span className="text-sm text-gray-500">Required Fields *</span>
              </div>
              
              {/* Scrollable Terms Container */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="h-64 overflow-y-auto p-4">
                  
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
                  <div className="mb-4">
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
                  
                  {/* Key Headlight Terms Summary */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Key Headlight Service Terms</h3>
                    <ul className="text-xs text-gray-700 space-y-1">
                      <li className="flex items-start gap-2">
                        <Shield className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>Limited warranty for workmanship (6-12 months)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertTriangle className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <span>Unauthorized modifications void warranty</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-3 w-3 text-red-600 mt-0.5 flex-shrink-0" />
                        <span>Customers acknowledge customization risks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <FileText className="h-3 w-3 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span>Full terms available in service agreement</span>
                      </li>
                    </ul>
                  </div>
                  
                </div>
              </div>
              
              {/* Acceptance Checkboxes */}
              <div className="mt-6 space-y-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptDiagnosticCharges"
                    checked={formData.acceptDiagnosticCharges || false}
                    onChange={(e) => handleInputChange('acceptDiagnosticCharges', e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <label htmlFor="acceptDiagnosticCharges" className="text-sm text-gray-700">
                    I understand that dashboard error diagnosis/clearing incurs additional charges *
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
              
              {/* Customer Signature & Rating */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Signature *
                  </label>
                  <div className="h-24 border border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                    <div className="text-center">
                      <FileSignature className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                      <p className="text-xs text-gray-500">Sign to accept completed work</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Our Service (Optional)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleInputChange('rating', star)}
                        className="p-0.5"
                      >
                        <Star className={`h-8 w-8 ${
                          star <= formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comments (Optional)
                  </label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    placeholder="Share your feedback..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows={2}
                  />
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
              <CarIcon className="h-5 w-5 text-green-600" />
              Vehicle Information
            </h2>
            
            {vehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CarIcon className="h-8 w-8 text-green-600" />
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
              <Building className="h-5 w-5 text-green-600" />
              Opportunity Information
            </h2>
            
            {opportunity ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Building className="h-8 w-8 text-green-600" />
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

          {/* Pre-Checklist Information */}
          {preChecklist && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                Pre-Service Checklist
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
                  <ClipboardCheck className="h-8 w-8 text-purple-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      Pre-Inspection #{preChecklist._id?.slice(-8)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {preChecklist.inspectionItems?.length || 0} items inspected
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Pre-Checklist ID
                    </label>
                    <div className="text-sm font-medium text-gray-900">
                      {preChecklist._id?.slice(-8)}
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <Link
                      href={`/prechecklists/${preChecklist._id}`}
                      className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-800"
                    >
                      <Eye className="h-4 w-4" />
                      View Pre-Checklist
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Completion Status */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Completion Status
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Progress</span>
                  <span className="text-sm font-bold text-green-700">{stats.completionPercentage}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                    style={{ width: `${stats.completionPercentage}%` }}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Completed Items</span>
                  <span className="font-medium text-green-700">{stats.completed}/{stats.total}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Required Items</span>
                  <span className="font-medium text-gray-700">
                    {formData.inspectionItems.filter(item => item.required !== false).length}
                  </span>
                </div>
                {stats.completionPercentage === 100 && (
                  <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <Award className="h-4 w-4" />
                      <span className="font-medium">Ready for customer approval!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Panel */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Actions</h2>
            
            <div className="space-y-4">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {mode === 'edit' ? 'Update Checklist' : 'Save Checklist'}
                  </>
                )}
              </button>
              
              {stats.completionPercentage === 100 && (
                <button
                  onClick={handleSubmitForApproval}
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ThumbsUp className="h-5 w-5" />
                  Submit for Customer Approval
                </button>
              )}
              
              <button
                onClick={handleCancel}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                <X className="h-5 w-5" />
                Cancel
              </button>
              
              {mode === 'edit' && existingChecklist && (
                <button
                  onClick={() => router.push(`/postchecklists/${existingChecklist._id}`)}
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
          <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-2xl border border-green-200 p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-green-600" />
              Post-Service Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Test all lighting functions in daylight and darkness</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Document work with clear before/after photos</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Explain warranty terms clearly to customer</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Get customer signature on completed checklist</span>
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
              {formData.inspectionItems.length} items • {stats.completed} Completed • {stats.completionPercentage}% Done
            </div>
            {stats.incomplete > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{stats.incomplete} item(s) pending</span>
              </div>
            )}
            {formData.rating > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <Star className="h-4 w-4" />
                <span>Rating: {formData.rating}/5</span>
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
              className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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