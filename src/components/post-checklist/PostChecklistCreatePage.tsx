'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { pdf } from '@react-pdf/renderer';
import Image from 'next/image';
import { userService, User } from '@/services/settings/userService';
import SignatureCanvas from 'react-signature-canvas';
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
  User as UserType,
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
  Sparkles,
  Check,
  ArrowRight,
  Download,
  Star,
  ThumbsUp,
  ThumbsDown,
  Award,
  Target,
  BarChart3,
  Copy,
  Calculator,
  DollarSign,
  Image as ImageIcon,
  File,
  Tag,
  Star as StarIcon
} from 'lucide-react';
import { postChecklistService, ChecklistItem, ChecklistItemStatus } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { preChecklistService } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

interface PostChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

// Define a local type that includes working status
interface PostChecklistInspectionItem extends Omit<ChecklistItem, 'status'> {
  working: boolean;
  status?: ChecklistItemStatus; // Keep status optional for compatibility
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
  const preChecklistId = searchParams.get('preChecklistId');
  const jobCardId = searchParams.get('jobCardId');
  const source = searchParams.get('source');

  const [loading, setLoading] = useState(mode === 'create');
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [preChecklist, setPreChecklist] = useState<any>(null);
  const [existingChecklist, setExistingChecklist] = useState<any>(null);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [selectedBeforeFiles, setSelectedBeforeFiles] = useState<File[]>([]);
  const [selectedAfterFiles, setSelectedAfterFiles] = useState<File[]>([]);

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // customer, inspection, photos, terms, feedback

  // Step titles and descriptions
  const stepTitles = [
    'Customer Details',
    'Inspection Results', 
    'Photos Documentation',
    'Terms & Signatures',
    'Feedback & Rating'
  ];

  const stepDescriptions = [
    'Enter customer information and service completion details',
    'Document post-service inspection results',
    'Upload before/after photos and documentation',
    'Review terms and obtain signatures',
    'Collect customer feedback and ratings'
  ];

  // Form state for post-checklist
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    preChecklistId: preChecklistId || '',
    jobCardId: jobCardId || '', // Add jobCardId
    inspectedBy: sessionStorage.getItem('userId') || '',
    dateTime: new Date().toISOString(),
    
    // Customer details
    customerDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    
    // Headlight inspection items with working status
    inspectionItems: [
      { item: 'High Beam', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Low Beam', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Daytime Running Light', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Turn Signal', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Fog Lights', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Parking Bulb', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Angel Lights', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Headlight Adjusters', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Adaptive Front Lights (AFS)', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Dimming Functionality', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Headlight Wiring and Connectors', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Beam Alignment', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Headlight Lens (Scratches, Cracks, Haziness)', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Water Proofing', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Dashboard Warning Lights', working: false, remarks: '', side: 'vehicle' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Bumper', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE }
    ] as PostChecklistInspectionItem[],
    
    // Warranty
    warrantyDuration: '12 months',
    
    // Uploads
    beforePhotos: [] as string[],
    afterPhotos: [] as string[],
    
    // Terms acceptance
    acceptTerms: false,
    
    // Customer feedback
    rating: 0,
    comments: '',
    
    // Signature
    customerSignature: '',
    
    // Additional fields
    additionalComments: '',
    diagnosticChargesAccepted: false,
    serviceRating: 5,
    serviceComments: ''
  });

  const [selectedTemplate, setSelectedTemplate] = useState('headlight_comprehensive');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);

  const [customerSignature, setCustomerSignature] = useState(formData.customerSignature);
  const [showCustomerSignature, setShowCustomerSignature] = useState(false);
  const customerSigRef = useRef<SignatureCanvas>(null);

  // Load related data
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, preChecklistId, checklistId, mode]);

  useEffect(() => {
    // Auto-populate form data when opportunity is loaded
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

  const autoPopulateFromOpportunity = () => {
    if (!opportunity || autoPopulated) return;

    try {
      // Extract customer name
      const customerName = opportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Update form data
      setFormData(prev => ({
        ...prev,
        customerDetails: {
          ...prev.customerDetails,
          firstName: firstName || '',
          lastName: lastName || '',
          email: opportunity.customer?.email || '',
          phone: opportunity.customer?.phone || '',
        }
      }));

      setAutoPopulated(true);
      
    } catch (error) {
      console.error('Error auto-populating from opportunity:', error);
      showToast('Error loading customer details from opportunity', 'warning');
    }
  };

  const handleRefreshFromOpportunity = () => {
    if (opportunity) {
      autoPopulateFromOpportunity();
      showToast('Refreshed data from opportunity', 'info');
    }
  };

  // Update the loadRelatedData function to properly set customerDetails
const loadRelatedData = async () => {
  try {
    setLoading(true);

    // Load existing checklist if in edit mode
    if (mode === 'edit' && checklistId) {
      const checklist = await postChecklistService.getPostChecklistById(checklistId);
      setExistingChecklist(checklist);
      
      // Transform inspection items - convert status to working
      const transformedInspectionItems = checklist.inspectionItems?.map(item => ({
        item: item.item || '',
        working: item.status === ChecklistItemStatus.COMPLETED, // Convert status to working
        remarks: item.remarks || '',
        side: (item.side || 'both') as 'both' | 'left' | 'right' | 'vehicle',
        status: item.status || ChecklistItemStatus.INCOMPLETE
      })) || [];
      
      // Get customerDetails properly - check if it's an object or needs to be constructed
      let customerDetails = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      };
      
      if (checklist.customerDetails && typeof checklist.customerDetails === 'object') {
        // If customerDetails is already an object
        customerDetails = {
          firstName: customerDetails.firstName || '',
          lastName: customerDetails.lastName || '',
          email: customerDetails.email || '',
          phone: customerDetails.phone || '',
        };
      } else if (checklist.customerName) {
        // If we only have customerName string, parse it
        const customerName = checklist.customerName || '';
        const [firstName, ...lastNameParts] = customerName.split(' ');
        const lastName = lastNameParts.join(' ') || '';
        
        customerDetails = {
          firstName,
          lastName,
          email: '',
          phone: '',
        };
      }
      
      setFormData({
        opportunityId: typeof checklist.opportunityId === 'object' 
          ? checklist.opportunityId._id 
          : checklist.opportunityId,
        vehicleId: typeof checklist.vehicleId === 'object' 
          ? checklist.vehicleId._id 
          : checklist.vehicleId,
        preChecklistId: checklist.preChecklistId || '',
        jobCardId: typeof checklist.jobCardId === 'object' 
          ? checklist.jobCardId._id 
          : checklist.jobCardId || '',
        inspectedBy: checklist.inspectedBy 
          ? (typeof checklist.inspectedBy === 'object' 
              ? checklist.inspectedBy._id 
              : checklist.inspectedBy)
          : sessionStorage.getItem('userId') || '',
        dateTime: checklist.dateTime || new Date().toISOString(),
        customerDetails: customerDetails, // Use the properly constructed object
        inspectionItems: transformedInspectionItems,
        warrantyDuration: checklist.warrantyDuration || '12 months',
        beforePhotos: checklist.beforePhotos || [],
        afterPhotos: checklist.afterPhotos || [],
        acceptTerms: checklist.acceptTerms || false,
        rating: checklist.rating || 0,
        comments: checklist.comments || '',
        customerSignature: checklist.customerSignature || '',
        additionalComments: checklist.additionalComments || '',
        diagnosticChargesAccepted: checklist.diagnosticChargesAccepted || false,
        serviceRating: checklist.serviceRating || 5,
        serviceComments: checklist.serviceComments || ''
      });

      // Set related data
      if (typeof checklist.opportunityId === 'object') {
        setOpportunity(checklist.opportunityId);
      }
      if (typeof checklist.vehicleId === 'object') {
        setVehicle(checklist.vehicleId);
      }
    }

    // Load pre-checklist if ID provided
    if (preChecklistId) {
      try {
        const preChecklist = await preChecklistService.getPreChecklistById(preChecklistId);
        setPreChecklist(preChecklist);
        
        // Populate customer details from pre-checklist
        if (preChecklist.customerDetails && typeof preChecklist.customerDetails === 'object') {
          setFormData(prev => ({
            ...prev,
            customerDetails: {
              firstName: preChecklist.customerDetails.firstName || '',
              lastName: preChecklist.customerDetails.lastName || '',
              email: preChecklist.customerDetails.email || '',
              phone: preChecklist.customerDetails.phone || '',
            }
          }));
        }
      } catch (error) {
        console.error('Error loading pre-checklist:', error);
        showToast('Could not load pre-checklist details', 'warning');
      }
    }

    // Load opportunity if provided
    if (opportunityId) {
      try {
        const opp = await opportunityService.getOpportunityById(opportunityId);
        setOpportunity(opp);
        
        // Set opportunity ID
        setFormData(prev => ({
          ...prev,
          opportunityId
        }));
      } catch (error) {
        console.error('Error loading opportunity:', error);
        showToast('Could not load opportunity details', 'warning');
      }
    }

    // Load vehicle if provided
    if (vehicleId) {
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

  const handleCustomerDetailChange = (field: keyof typeof formData.customerDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      customerDetails: {
        ...prev.customerDetails,
        [field]: value
      }
    }));
  };

  const handleItemChange = (index: number, field: keyof PostChecklistInspectionItem, value: any) => {
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

  const handleWorkingChange = (index: number, working: boolean) => {
    // Update working and also update status for API compatibility
    handleItemChange(index, 'working', working);
    handleItemChange(index, 'status', working ? ChecklistItemStatus.COMPLETED : ChecklistItemStatus.INCOMPLETE);
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    let items: PostChecklistInspectionItem[] = [];
    
    switch (template) {
      case 'headlight_basic':
        items = [
          { item: 'High Beam', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Low Beam', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Turn Signal', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Beam Alignment', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Headlight Lens', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Water Proofing', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE }
        ];
        break;
      case 'headlight_comprehensive':
        items = [
          { item: 'High Beam', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Low Beam', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Daytime Running Light', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Turn Signal', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Fog Lights', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Parking Bulb', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Angel Lights', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Headlight Adjusters', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Adaptive Front Lights (AFS)', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Dimming Functionality', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Headlight Wiring and Connectors', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Beam Alignment', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Headlight Lens (Scratches, Cracks, Haziness)', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Water Proofing', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Dashboard Warning Lights', working: false, remarks: '', side: 'vehicle', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Bumper', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE }
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
    const working = formData.inspectionItems.filter(item => item.working === true).length;
    const notWorking = formData.inspectionItems.filter(item => item.working === false).length;
    
    return { total, working, notWorking };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.customerDetails.firstName.trim() || !formData.customerDetails.lastName.trim()) {
        showToast('Customer name is required', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }

      if (!formData.acceptTerms) {
        showToast('Please accept the terms and conditions', 'error');
        setCurrentStep(4);
        setSubmitting(false);
        return;
      }

      if (!formData.customerSignature) {
        showToast('Customer signature is required', 'error');
        setCurrentStep(4);
        setSubmitting(false);
        return;
      }

      // Convert inspection items for API (convert working to status)
      const apiInspectionItems = formData.inspectionItems.map(item => ({
        item: item.item,
        status: item.working ? ChecklistItemStatus.COMPLETED : ChecklistItemStatus.INCOMPLETE,
        remarks: item.remarks,
        side: item.side,
        working: item.working // Keep working for reference
      }));

      // Prepare submission data
      const submissionData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        preChecklistId: formData.preChecklistId,
        jobCardId: formData.jobCardId,
        inspectedBy: formData.inspectedBy,
        dateTime: formData.dateTime,
        customerDetails: formData.customerDetails,
        inspectionItems: apiInspectionItems,
        warrantyDuration: formData.warrantyDuration,
        beforePhotos: formData.beforePhotos,
        afterPhotos: formData.afterPhotos,
        acceptTerms: formData.acceptTerms,
        rating: formData.rating,
        comments: formData.comments,
        customerSignature: formData.customerSignature,
        additionalComments: formData.additionalComments,
        diagnosticChargesAccepted: formData.diagnosticChargesAccepted,
        serviceRating: formData.serviceRating,
        serviceComments: formData.serviceComments
      };

      console.log('Submitting post-checklist:', submissionData);

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await postChecklistService.updatePostChecklist(checklistId, submissionData);
        showToast('Post-checklist updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await postChecklistService.createPostChecklist(submissionData, userId);
        showToast('Post-checklist created successfully', 'success');
      }

      // Navigate based on source
      if (source === 'workflow' && workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (result._id) {
        router.push(`/post-checklist/${result._id}`);
      } else {
        router.push('/postchecklists');
      }

    } catch (error: any) {
      console.error('Error submitting post-checklist:', error);
      showToast(error.message || 'Failed to save post-checklist', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (source === 'workflow' && workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else {
      router.push('/postchecklists');
    }
  };

  const getWorkingColor = (working: boolean) => {
    return working 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  const getWorkingIcon = (working: boolean) => {
    return working 
      ? <CheckCircle className="h-4 w-4" /> 
      : <AlertCircle className="h-4 w-4" />;
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
    return format(new Date(dateString), 'dd-MMM-yyyy HH:mm a');
  };

  const handleSaveAsDraft = () => {
    try {
      localStorage.setItem('postChecklistDraft', JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
      showToast('Draft saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save draft', 'error');
    }
  };

  // Handle file uploads
  const handleBeforeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
  
    const newFiles = Array.from(files);
    setSelectedBeforeFiles(prev => [...prev, ...newFiles]);
    
    // Preview images immediately
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFormData(prev => ({
            ...prev,
            beforePhotos: [...prev.beforePhotos, result]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
    
    showToast(`${newFiles.length} before photo(s) selected`, 'info');
  };

  const handleAfterFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
  
    const newFiles = Array.from(files);
    setSelectedAfterFiles(prev => [...prev, ...newFiles]);
    
    // Preview images immediately
    newFiles.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          setFormData(prev => ({
            ...prev,
            afterPhotos: [...prev.afterPhotos, result]
          }));
        };
        reader.readAsDataURL(file);
      }
    });
    
    showToast(`${newFiles.length} after photo(s) selected`, 'info');
  };

  const removeBeforePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      beforePhotos: prev.beforePhotos.filter((_, i) => i !== index)
    }));
    setSelectedBeforeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeAfterPhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      afterPhotos: prev.afterPhotos.filter((_, i) => i !== index)
    }));
    setSelectedAfterFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Progress Stepper Component
  const renderProgressStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
              currentStep === stepNumber 
                ? 'bg-green-600 border-green-600 text-white scale-110 shadow-lg' 
                : currentStep > stepNumber 
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-600'
                  : 'bg-transparent border-gray-300 text-gray-500'
            }`}>
              {currentStep > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
            </div>
            <div className="ml-3">
              <div className={`text-sm font-medium transition-all ${
                currentStep >= stepNumber ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {stepTitles[stepNumber - 1]}
              </div>
              <div className={`text-xs transition-all ${
                currentStep >= stepNumber ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {stepDescriptions[stepNumber - 1]}
              </div>
            </div>
            {stepNumber < 5 && (
              <div className={`h-0.5 w-16 md:w-24 mx-4 transition-all ${
                currentStep > stepNumber ? 'bg-emerald-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading headlight post-checklist form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50/30 via-white to-emerald-50/30">
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
                <ClipboardCheck className="h-6 w-6" />
                {mode === 'edit' ? 'Edit Headlight Post-Checklist' : 'Headlight Post-Service Inspection'}
              </h1>
              <p className="text-emerald-100">
                {mode === 'edit' 
                  ? `Editing: Post-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Post-Service Quality Assurance Checklist'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Working: {stats.working}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Not Working: {stats.notWorking}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Step-by-Step Wizard */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Progress Stepper */}
        {renderProgressStepper()}
        
        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[0]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[0]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserType className="h-5 w-5 text-green-600" />
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
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-700">
                        Customer details are automatically populated from the connected opportunity. 
                      </p>
                    </div>
                  </div>
                </div>
                
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                {/* Date & Time */}
                <div className="mt-6">
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
                  <p className="mt-1 text-xs text-gray-500">
                    Format: dd-MMM-yyyy HH:MM AM/PM
                  </p>
                </div>

                {/* Warranty Duration */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Warranty Duration *
                  </label>
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
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[1]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[1]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ClipboardCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Inspection Items (Tick if Working)</h2>
                        <p className="text-sm text-gray-600">R-RIGHT SIDE | L-LEFT SIDE</p>
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
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
                          }`}
                        >
                          <div className="font-medium text-gray-900 mb-1">Basic Headlight Check</div>
                          <p className="text-sm text-gray-600">6 essential post-service items</p>
                        </button>
                        <button
                          onClick={() => handleTemplateSelect('headlight_comprehensive')}
                          className={`p-4 border rounded-lg text-left transition-all ${
                            selectedTemplate === 'headlight_comprehensive'
                              ? 'border-green-500 bg-green-50'
                              : 'border-gray-200 hover:border-green-300 hover:bg-green-50/50'
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
                                    {item.side === 'both' ? 'R-RIGHT | L-LEFT' : item.side === 'vehicle' ? 'VEHICLE' : 'BOTH SIDES'}
                                  </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getWorkingColor(item.working)}`}>
                                  {getWorkingIcon(item.working)}
                                  <span className="capitalize">{item.working ? 'Working' : 'Not Working'}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-3">
                                <label className="inline-flex items-center gap-2 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={item.working}
                                    onChange={(e) => handleWorkingChange(index, e.target.checked)}
                                    className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                                  />
                                  <span className="text-sm text-gray-700">Tick if working</span>
                                </label>
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
                                  placeholder="Add specific observations or notes..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                  rows={2}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Summary Stats */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium text-gray-700">
                      Inspection Summary
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm text-gray-700">Working: {stats.working}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm text-gray-700">Not Working: {stats.notWorking}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <span className="text-sm text-gray-700">Total: {stats.total}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Steps 3, 4, 5 remain the same as before */}
          {/* ... (rest of the component code remains unchanged) */}
        </div>
        
        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => currentStep > 1 && setCurrentStep(currentStep - 1)}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium flex items-center gap-2 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <ArrowLeft className="h-5 w-5" />
            Previous
          </button>
          
          <div className="flex gap-4">
            <button
              onClick={handleSaveAsDraft}
              className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              Save as Draft
              {draftSaved && (
                <span className="text-xs text-green-600">
                  ✓ Saved
                </span>
              )}
            </button>
            
            {currentStep < totalSteps ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-2"
              >
                Next
                <ArrowRight className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 rounded-lg font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {mode === 'edit' ? 'Update Checklist' : 'Save & Submit'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper component for file icon
function FileIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}