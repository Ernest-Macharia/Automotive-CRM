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
  DollarSign,
  Package,
  CheckSquare,
  AlertOctagon,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  ClipboardList,
  BarChart3,
  Download,
  Copy,
  Star,
  Timer,
  Calculator,
  Award,
  Target,
  Sparkles
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

export default function PostChecklistCreatePage({ 
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
    inspectionItems: [
      { 
        item: 'Work Quality Verification', 
        status: ChecklistItemStatus.INCOMPLETE as ChecklistItemStatus, 
        remarks: '',
        required: true,
        category: 'quality'
      },
      { 
        item: 'Safety Systems Check', 
        status: ChecklistItemStatus.INCOMPLETE as ChecklistItemStatus, 
        remarks: '',
        required: true,
        category: 'safety'
      },
      { 
        item: 'Vehicle Cleanliness', 
        status: ChecklistItemStatus.INCOMPLETE as ChecklistItemStatus, 
        remarks: '',
        required: true,
        category: 'cleanliness'
      },
      { 
        item: 'Tools & Equipment Returned', 
        status: ChecklistItemStatus.INCOMPLETE as ChecklistItemStatus, 
        remarks: '',
        required: false,
        category: 'tools'
      },
      { 
        item: 'Documentation Complete', 
        status: ChecklistItemStatus.INCOMPLETE as ChecklistItemStatus, 
        remarks: '',
        required: true,
        category: 'documentation'
      }
    ] as ChecklistItem[],
    notes: '',
    overallCondition: 'pending' as 'pending' | 'satisfactory' | 'needs_attention' | 'excellent',
    recommendations: '',
    approved: false,
    approvedBy: '',
    approvedAt: '',
    partsUsed: [] as Array<{
      partId: string;
      partName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>,
    laborHours: 0,
    laborRate: 85,
    totalCost: 0,
    qualityCheck: {
      passed: false,
      checkedBy: '',
      checkedAt: '',
      notes: ''
    },
    customerApproval: {
      approved: false,
      approvedBy: '',
      approvedAt: '',
      signature: '',
      notes: ''
    }
  });

  const [selectedTemplate, setSelectedTemplate] = useState('standard');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [newPart, setNewPart] = useState({
    partName: '',
    quantity: 1,
    unitPrice: 0
  });

  // Load related data
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, jobCardId, preChecklistId, checklistId, mode]);

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await postChecklistService.getPostChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        // Safely convert overallCondition to the correct type
        const overallCondition = (
          checklist.overallCondition === 'satisfactory' ||
          checklist.overallCondition === 'needs_attention' ||
          checklist.overallCondition === 'excellent'
        ) ? checklist.overallCondition : 'pending' as const;
        
        // Set form data from existing checklist
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
          inspectedBy: checklist.inspectedBy 
            ? (typeof checklist.inspectedBy === 'object' 
                ? checklist.inspectedBy._id 
                : checklist.inspectedBy)
            : sessionStorage.getItem('userId') || '',
          inspectionItems: checklist.inspectionItems || prev.inspectionItems,
          notes: checklist.notes || '',
          overallCondition: overallCondition,
          recommendations: checklist.recommendations || '',
          approved: checklist.approved || false,
          approvedBy: checklist.approvedBy 
            ? (typeof checklist.approvedBy === 'object' 
                ? checklist.approvedBy._id 
                : checklist.approvedBy)
            : '',
          approvedAt: checklist.approvedAt ? new Date(checklist.approvedAt).toISOString() : '',
        }));

        // Set related data from existing checklist
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

      // Load job card if ID provided
      if (jobCardId) {
        try {
          // Assuming you have a job card service
          // const jc = await jobCardService.getJobCardById(jobCardId);
          // setJobCard(jc);
          setFormData(prev => ({
            ...prev,
            jobCardId
          }));
        } catch (error) {
          console.error('Error loading job card:', error);
          showToast('Could not load job card details', 'warning');
        }
      }

      // Load pre-checklist if ID provided
      if (preChecklistId) {
        try {
          const preChecklist = await preChecklistService.getPreChecklistById(preChecklistId);
          setPreChecklist(preChecklist);
          
          // Populate inspection items from pre-checklist if not already set
          if (preChecklist.inspectionItems && formData.inspectionItems.length <= 5) {
            const mappedItems = preChecklist.inspectionItems.map((item: any) => ({
              item: item.item,
              status: ChecklistItemStatus.INCOMPLETE,
              remarks: '',
              required: true,
              category: 'service'
            }));
            
            setFormData(prev => ({
              ...prev,
              preChecklistId,
              inspectionItems: [
                ...prev.inspectionItems,
                ...mappedItems.filter((newItem: any) => 
                  !prev.inspectionItems.some(existing => existing.item === newItem.item)
                )
              ]
            }));
          }
        } catch (error) {
          console.error('Error loading pre-checklist:', error);
          showToast('Could not load pre-checklist details', 'warning');
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

  const handleAddItem = () => {
    setFormData(prev => ({
      ...prev,
      inspectionItems: [
        ...prev.inspectionItems,
        { item: '', status: ChecklistItemStatus.INCOMPLETE, remarks: '', required: true, category: 'general' }
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

  const handleStatusChange = (index: number, status: ChecklistItemStatus) => {
    handleItemChange(index, 'status', status);
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    let items: ChecklistItem[] = [];
    
    switch (template) {
      case 'basic':
        items = [
          { item: 'Work Quality Verification', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'quality' },
          { item: 'Safety Check Complete', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'safety' },
          { item: 'Vehicle Clean', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'cleanliness' },
          { item: 'Documentation Done', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'documentation' }
        ];
        break;
      case 'standard':
        items = [
          { item: 'Work Quality Verification', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'quality' },
          { item: 'Safety Systems Functional', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'safety' },
          { item: 'Vehicle Interior Clean', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'cleanliness' },
          { item: 'Vehicle Exterior Clean', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'cleanliness' },
          { item: 'Tools & Equipment Returned', status: ChecklistItemStatus.INCOMPLETE, required: false, category: 'tools' },
          { item: 'Service Documentation Complete', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'documentation' },
          { item: 'Test Drive Completed', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'testing' },
          { item: 'Customer Items Returned', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'customer' }
        ];
        break;
      case 'comprehensive':
        items = [
          { item: 'Work Quality - Mechanical', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'quality' },
          { item: 'Work Quality - Electrical', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'quality' },
          { item: 'Work Quality - Body/Interior', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'quality' },
          { item: 'Safety Systems - Brakes', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'safety' },
          { item: 'Safety Systems - Lights', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'safety' },
          { item: 'Safety Systems - Steering', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'safety' },
          { item: 'Interior Deep Clean', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'cleanliness' },
          { item: 'Exterior Wash & Polish', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'cleanliness' },
          { item: 'Engine Bay Clean', status: ChecklistItemStatus.INCOMPLETE, required: false, category: 'cleanliness' },
          { item: 'Special Tools Returned', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'tools' },
          { item: 'All Documentation Complete', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'documentation' },
          { item: 'Test Drive - City', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'testing' },
          { item: 'Test Drive - Highway', status: ChecklistItemStatus.INCOMPLETE, required: false, category: 'testing' },
          { item: 'Customer Belongings Returned', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'customer' },
          { item: 'Final Inspection Sign-off', status: ChecklistItemStatus.INCOMPLETE, required: true, category: 'approval' }
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

  const handleAddPart = () => {
    if (!newPart.partName.trim() || newPart.quantity <= 0 || newPart.unitPrice < 0) {
      showToast('Please fill all part details correctly', 'error');
      return;
    }

    const partId = `part-${Date.now()}`;
    const totalPrice = newPart.quantity * newPart.unitPrice;

    setFormData(prev => ({
      ...prev,
      partsUsed: [
        ...prev.partsUsed,
        {
          partId,
          partName: newPart.partName,
          quantity: newPart.quantity,
          unitPrice: newPart.unitPrice,
          totalPrice
        }
      ],
      totalCost: prev.totalCost + totalCost
    }));

    setNewPart({
      partName: '',
      quantity: 1,
      unitPrice: 0
    });
    setShowPartsModal(false);
    showToast('Part added successfully', 'success');
  };

  const handleRemovePart = (index: number) => {
    const partToRemove = formData.partsUsed[index];
    setFormData(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index),
      totalCost: prev.totalCost - partToRemove.totalPrice
    }));
  };

  const calculateTotalCost = () => {
    const partsCost = formData.partsUsed.reduce((sum, part) => sum + part.totalPrice, 0);
    const laborCost = formData.laborHours * formData.laborRate;
    return partsCost + laborCost;
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

      if (!formData.jobCardId) {
        showToast('Job Card ID is required', 'error');
        setSubmitting(false);
        return;
      }

      // Filter out empty items
      const validItems = formData.inspectionItems.filter(item => item.item.trim() !== '');

      if (validItems.length === 0) {
        showToast('Please add at least one inspection item', 'error');
        setSubmitting(false);
        return;
      }

      // Calculate final total
      const finalTotalCost = calculateTotalCost();

      const submissionData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        jobCardId: formData.jobCardId,
        preChecklistId: formData.preChecklistId || undefined,
        inspectionItems: validItems,
        notes: formData.notes,
        overallCondition: formData.overallCondition,
        recommendations: formData.recommendations,
        approved: false,
        // Add additional calculated fields if needed
      };

      let result;
      
      if (mode === 'edit' && checklistId) {
        // Update existing checklist
        result = await postChecklistService.updatePostChecklist(checklistId, submissionData);
        showToast('Post-checklist updated successfully', 'success');
      } else {
        // Create new checklist
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await postChecklistService.createPostChecklist(submissionData, userId);
        showToast('Post-checklist created successfully', 'success');
      }

      // Navigate based on source
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading post-checklist form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();
  const totalCost = calculateTotalCost();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
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
              <h1 className="text-2xl font-bold">
                {mode === 'edit' ? 'Edit Post-Checklist' : 'Create Post-Checklist'}
              </h1>
              <p className="text-green-100">
                {mode === 'edit' 
                  ? `Editing: Post-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Post-service quality inspection checklist'
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

          {/* Inspection Items Section */}
          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            {/* Section Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-teal-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Post-Service Inspection Items</h2>
                    <p className="text-sm text-gray-600">Mark each item as Completed, Incomplete, or N/A</p>
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
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
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
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Basic Inspection</div>
                      <p className="text-sm text-gray-600">4 essential items for quick verification</p>
                    </button>
                    <button
                      onClick={() => handleTemplateSelect('standard')}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTemplate === 'standard'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Standard Check</div>
                      <p className="text-sm text-gray-600">8 items for comprehensive service verification</p>
                    </button>
                    <button
                      onClick={() => handleTemplateSelect('comprehensive')}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTemplate === 'comprehensive'
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                      }`}
                    >
                      <div className="font-medium text-gray-900 mb-1">Comprehensive</div>
                      <p className="text-sm text-gray-600">15 items for thorough quality assurance</p>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Inspection Items List */}
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {formData.inspectionItems.map((item, index) => {
                const isExpanded = expandedSections.includes(index);
                const isRequired = item.required !== false;
                
                return (
                  <div key={index} className="hover:bg-gray-50 transition-colors">
                    {/* Item Header */}
                    <div className="px-6 py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            {isRequired && (
                              <Star className="h-3 w-3 text-red-500" aria-label="Required" />
                            )}
                            <input
                              type="text"
                              value={item.item}
                              onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                              placeholder="Enter inspection item"
                              className="flex-1 text-lg font-medium text-gray-900 bg-transparent border-0 focus:ring-0 focus:outline-none p-0"
                            />
                            {item.category && (
                              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                {item.category}
                              </span>
                            )}
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2 mt-3">
                            <button
                              onClick={() => handleStatusChange(index, ChecklistItemStatus.COMPLETED)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                item.status === ChecklistItemStatus.COMPLETED
                                  ? 'bg-green-100 text-green-800 border border-green-300'
                                  : 'text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-transparent'
                              }`}
                            >
                              <CheckCircle className="h-3 w-3" />
                              Completed
                            </button>
                            <button
                              onClick={() => handleStatusChange(index, ChecklistItemStatus.INCOMPLETE)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                item.status === ChecklistItemStatus.INCOMPLETE
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-300'
                                  : 'text-gray-600 hover:bg-yellow-50 hover:text-yellow-700 hover:border-yellow-200 border border-transparent'
                              }`}
                            >
                              <AlertCircle className="h-3 w-3" />
                              Incomplete
                            </button>
                            <button
                              onClick={() => handleStatusChange(index, ChecklistItemStatus.NOT_APPLICABLE)}
                              className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                item.status === ChecklistItemStatus.NOT_APPLICABLE
                                  ? 'bg-gray-100 text-gray-800 border border-gray-300'
                                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200 border border-transparent'
                              }`}
                            >
                              <FileText className="h-3 w-3" />
                              N/A
                            </button>
                            <select
                              value={item.category || 'general'}
                              onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                              className="text-sm border border-gray-300 rounded-lg px-2 py-1.5 hover:border-gray-400"
                            >
                              <option value="quality">Quality</option>
                              <option value="safety">Safety</option>
                              <option value="cleanliness">Cleanliness</option>
                              <option value="tools">Tools</option>
                              <option value="documentation">Documentation</option>
                              <option value="testing">Testing</option>
                              <option value="customer">Customer</option>
                              <option value="approval">Approval</option>
                              <option value="general">General</option>
                            </select>
                            <label className="flex items-center gap-1 text-sm text-gray-600">
                              <input
                                type="checkbox"
                                checked={isRequired}
                                onChange={(e) => handleItemChange(index, 'required', e.target.checked)}
                                className="rounded border-gray-300"
                              />
                              Required
                            </label>
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
                              Remarks & Notes
                            </label>
                            <textarea
                              value={item.remarks || ''}
                              onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                              placeholder="Add details, observations, or notes about this item..."
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                              rows={3}
                            />
                          </div>
                          
                          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                            <Info className="h-4 w-4" />
                            <span>Add specific details, measurements, or quality observations</span>
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

          {/* Parts & Labor Section */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Parts & Labor
            </h2>
            <div className="space-y-6">
              {/* Parts Used */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Parts Used</h3>
                  <button
                    onClick={() => setShowPartsModal(true)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Part
                  </button>
                </div>
                
                {formData.partsUsed.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 font-medium text-gray-700">Part Name</th>
                          <th className="text-left py-2 font-medium text-gray-700">Quantity</th>
                          <th className="text-left py-2 font-medium text-gray-700">Unit Price</th>
                          <th className="text-left py-2 font-medium text-gray-700">Total</th>
                          <th className="text-left py-2 font-medium text-gray-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {formData.partsUsed.map((part, index) => (
                          <tr key={part.partId} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3">{part.partName}</td>
                            <td className="py-3">{part.quantity}</td>
                            <td className="py-3">${part.unitPrice.toFixed(2)}</td>
                            <td className="py-3 font-medium">${part.totalPrice.toFixed(2)}</td>
                            <td className="py-3">
                              <button
                                onClick={() => handleRemovePart(index)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50 font-medium">
                          <td colSpan={3} className="py-3 text-right">Parts Total:</td>
                          <td className="py-3">${formData.partsUsed.reduce((sum, part) => sum + part.totalPrice, 0).toFixed(2)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No parts added yet</p>
                  </div>
                )}
              </div>

              {/* Labor Hours */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="font-medium text-gray-900 mb-4">Labor</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Labor Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.5"
                      value={formData.laborHours}
                      onChange={(e) => handleInputChange('laborHours', parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate per Hour
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={formData.laborRate}
                        onChange={(e) => handleInputChange('laborRate', parseFloat(e.target.value) || 0)}
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Labor Cost</div>
                    <div className="text-2xl font-bold text-blue-700">
                      ${(formData.laborHours * formData.laborRate).toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Cost */}
              <div className="border-t border-gray-200 pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-600">Total Estimated Cost</div>
                    <div className="text-3xl font-bold text-gray-900">${totalCost.toFixed(2)}</div>
                  </div>
                  <Calculator className="h-12 w-12 text-gray-300" />
                </div>
              </div>
            </div>
          </div>

          {/* Remarks & Recommendations Section */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Remarks & Recommendations
            </h2>
            <div className="space-y-6">
              {/* Overall Condition */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
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

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Add any notes about the service performed, observations, or special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>

              {/* Recommendations */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Recommendations for Customer
                </label>
                <textarea
                  value={formData.recommendations}
                  onChange={(e) => handleInputChange('recommendations', e.target.value)}
                  placeholder="Add any recommendations for future maintenance, warnings, or follow-up services..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Information & Actions */}
        <div className="space-y-6">
          {/* Vehicle Information */}
          <div className="bg-white rounded-2xl shadow-xl border p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Car className="h-5 w-5 text-green-600" />
              Vehicle Information
            </h2>
            
            {vehicle ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <Car className="h-8 w-8 text-green-600" />
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

          {/* Job Card Information */}
          {jobCard && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-blue-600" />
                Job Card Information
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                  <ClipboardList className="h-8 w-8 text-blue-600" />
                  <div>
                    <div className="font-medium text-gray-900">
                      {jobCard.jobTitle || 'Job Card'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {jobCard.status || 'Status unknown'}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      Job Card ID
                    </label>
                    <div className="text-sm font-medium text-gray-900">
                      {jobCard._id?.slice(-8)}
                    </div>
                  </div>
                  
                  {jobCard.assignedTo && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">
                        Assigned To
                      </label>
                      <div className="text-sm font-medium text-gray-900">
                        {typeof jobCard.assignedTo === 'object' 
                          ? `${jobCard.assignedTo.firstName} ${jobCard.assignedTo.lastName}`
                          : jobCard.assignedTo
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Pre-Checklist Information */}
          {preChecklist && (
            <div className="bg-white rounded-2xl shadow-xl border p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                Related Pre-Checklist
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
                      View Pre-Checklist Details
                    </Link>
                  </div>
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
                    {mode === 'edit' ? 'Update Checklist' : 'Save & Create Checklist'}
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
                  Submit for Approval
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
                      <span className="font-medium">Ready for approval!</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 rounded-2xl border border-blue-200 p-6">
            <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Quality Assurance Tips
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Mark items as "Completed" only when fully verified</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Add detailed remarks for any incomplete items</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Include photos of completed work for documentation</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Submit for approval only when all required items are complete</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Parts Modal */}
      {showPartsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Add New Part</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Part Name
                  </label>
                  <input
                    type="text"
                    value={newPart.partName}
                    onChange={(e) => setNewPart(prev => ({ ...prev, partName: e.target.value }))}
                    placeholder="Enter part name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newPart.quantity}
                      onChange={(e) => setNewPart(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit Price ($)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={newPart.unitPrice}
                      onChange={(e) => setNewPart(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                
                {newPart.quantity > 0 && newPart.unitPrice > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm text-gray-600">Total Price:</div>
                    <div className="text-2xl font-bold text-blue-700">
                      ${(newPart.quantity * newPart.unitPrice).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowPartsModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPart}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Part
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {totalCost > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                <DollarSign className="h-4 w-4" />
                <span>Total: ${totalCost.toFixed(2)}</span>
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