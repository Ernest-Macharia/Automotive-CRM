'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { userService, User } from '@/services/settings/userService';
import SignatureCanvas from 'react-signature-canvas';
import {
  ClipboardCheck,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
  User as UserType,
  Calendar,
  Upload,
  Loader2,
  Info,
  ChevronDown,
  ChevronUp,
  Clock,
  FileSignature,
  Settings,
  Lightbulb,
  Car as CarIcon,
  Package,
  Timer,
  BarChart3,
  Camera,
  Shield,
  Check,
  ArrowRight,
  Download,
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Sparkles,
  File,
  Eye,
  Trash2,
  Plus,
  Wrench
} from 'lucide-react';
import { postChecklistService, ChecklistItem, ChecklistItemStatus } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { preChecklistService } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';

interface PostChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

// Define a local type that includes working status
interface PostChecklistInspectionItem extends Omit<ChecklistItem, 'status'> {
  working: boolean;
  status?: ChecklistItemStatus;
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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedBeforeFiles, setSelectedBeforeFiles] = useState<File[]>([]);
  const [selectedAfterFiles, setSelectedAfterFiles] = useState<File[]>([]);
  const [inspectorName, setInspectorName] = useState('');

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step titles and descriptions
  const stepTitles = [
    'Customer & Warranty',
    'Inspection Results', 
    'Photos Documentation',
    'Product Handover & Terms',
    'Feedback & Rating'
  ];

  const stepDescriptions = [
    'Enter customer information and warranty details',
    'Document post-service inspection results',
    'Upload before/after photos and documentation',
    'Confirm product handover and accept terms',
    'Collect customer feedback and ratings'
  ];

  // Form state for post-checklist
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    preChecklistId: preChecklistId || '',
    jobCardId: jobCardId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    dateTime: new Date().toISOString(),
    
    // Customer details - will be populated from opportunity/pre-checklist
    customerDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    
    // Vehicle details - will be populated from opportunity/pre-checklist
    vehicleDetails: {
      regNo: '',
      make: '',
      model: '',
      year: '',
    },
    
    // Service details - will be populated from opportunity/pre-checklist
    serviceDetails: {
      productServiceNeeded: '',
      productPrice: 0,
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
      { item: 'Adaptive Front Lights(AFS)', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Dimming Functionality', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Wiring And Connectors', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Beam Alignment', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Headlight Lens(Scratches, Cracks, Haziness)', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Water Proofing', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Dashboard Warning Lights', working: false, remarks: '', side: 'vehicle' as const, status: ChecklistItemStatus.INCOMPLETE },
      { item: 'Bumper', working: false, remarks: '', side: 'both' as const, status: ChecklistItemStatus.INCOMPLETE }
    ] as PostChecklistInspectionItem[],
    
    // Warranty
    warrantyDuration: '12 months',
    
    // Uploads
    beforePhotos: [] as string[],
    afterPhotos: [] as string[],
    
    // Product handover confirmation
    productHandoverConfirmed: false,
    productSatisfactory: true,
    issuesNoted: '',
    
    // Terms acceptance
    acceptTerms: false,
    
    // Customer feedback
    rating: 0,
    comments: '',
    
    // Signature
    customerSignature: '',
    
    // Additional fields
    serviceRating: 5,
    serviceComments: '',
    inspectorName: '',
    additionalComments: ''
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

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await postChecklistService.getPostChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        const transformedInspectionItems = checklist.inspectionItems?.map(item => ({
          item: item.item || '',
          working: item.status === ChecklistItemStatus.COMPLETED,
          remarks: item.remarks || '',
          side: (item.side || 'both') as 'both' | 'left' | 'right' | 'vehicle',
          status: item.status || ChecklistItemStatus.INCOMPLETE
        })) || [];
        
        let customerDetails = {
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        };
        
        let vehicleDetails = {
          regNo: '',
          make: '',
          model: '',
          year: '',
        };
        
        let serviceDetails = {
          productServiceNeeded: '',
          productPrice: 0,
        };
        
        // Load from checklist data
        if (checklist.customerDetails !== null && typeof checklist.customerDetails === 'object') {
          customerDetails = {
            firstName: checklist.customerDetails.firstName || '',
            lastName: checklist.customerDetails.lastName || '',
            email: checklist.customerDetails.email || '',
            phone: checklist.customerDetails.phone || '',
          };
        }
        
        if (checklist.vehicleDetails && typeof checklist.vehicleDetails === 'object') {
          vehicleDetails = {
            regNo: checklist.vehicleDetails.regNo || '',
            make: checklist.vehicleDetails.make || '',
            model: checklist.vehicleDetails.model || '',
            year: checklist.vehicleDetails.year || '',
          };
        }
        
        if (checklist.serviceDetails && typeof checklist.serviceDetails === 'object') {
          serviceDetails = {
            productServiceNeeded: checklist.serviceDetails.productServiceNeeded || '',
            productPrice: checklist.serviceDetails.productPrice || 0,
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
          customerDetails,
          vehicleDetails,
          serviceDetails,
          inspectionItems: transformedInspectionItems,
          warrantyDuration: checklist.warrantyDuration || '12 months',
          beforePhotos: checklist.beforePhotos || [],
          afterPhotos: checklist.afterPhotos || [],
          productHandoverConfirmed: checklist.productHandoverConfirmed || false,
          productSatisfactory: checklist.productSatisfactory ?? true,
          issuesNoted: checklist.issuesNoted || '',
          acceptTerms: checklist.acceptTerms || false,
          rating: checklist.rating || 0,
          comments: checklist.comments || '',
          customerSignature: checklist.customerSignature || '',
          serviceRating: checklist.serviceRating || 5,
          serviceComments: checklist.serviceComments || '',
          inspectorName: checklist.inspectorName || '',
          additionalComments: checklist.additionalComments || ''
        });

        // Set inspector name from session
        const userName = sessionStorage.getItem('userName') || 'Inspector';
        setInspectorName(userName);
        setFormData(prev => ({
          ...prev,
          inspectorName: userName
        }));

        if (typeof checklist.opportunityId === 'object') {
          setOpportunity(checklist.opportunityId);
        }
        if (typeof checklist.vehicleId === 'object') {
          setVehicle(checklist.vehicleId);
        }
        
        setDataLoaded(true);
      } else {
        // For create mode, load data from opportunity and pre-checklist
        await loadDataFromSources();
      }

    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDataFromSources = async () => {
    try {
      let customerDetails = {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      };
      
      let vehicleDetails = {
        regNo: '',
        make: '',
        model: '',
        year: '',
      };
      
      let serviceDetails = {
        productServiceNeeded: '',
        productPrice: 0,
      };

      // 1. First try to load from pre-checklist (if provided)
      if (preChecklistId) {
        try {
          const preChecklistData = await preChecklistService.getPreChecklistById(preChecklistId);
          setPreChecklist(preChecklistData);
          
          // if (preChecklistData.customerDetails && typeof preChecklistData.customerDetails === 'object') {
          //   customerDetails = {
          //     firstName: preChecklistData.customerDetails.firstName || '',
          //     lastName: preChecklistData.customerDetails.lastName || '',
          //     email: preChecklistData.customerDetails.email || '',
          //     phone: preChecklistData.customerDetails.phone || '',
          //   };
          // }
          
          // if (preChecklistData.carDetails && typeof preChecklistData.carDetails === 'object') {
          //   vehicleDetails = {
          //     regNo: preChecklistData.carDetails.regNo || '',
          //     make: preChecklistData.carDetails.make || '',
          //     model: preChecklistData.carDetails.model || '',
          //     year: preChecklistData.carDetails.year || '',
          //   };
          // }
          
          serviceDetails = {
            productServiceNeeded: preChecklistData.productServiceNeeded || '',
            productPrice: preChecklistData.productPrice || 0,
          };
          
          showToast('Data loaded from pre-checklist', 'success');
        } catch (error) {
          console.error('Error loading from pre-checklist:', error);
        }
      }

      // 2. If no pre-checklist or missing data, load from opportunity
      if ((!customerDetails.firstName || !vehicleDetails.regNo) && opportunityId) {
        try {
          const opp = await opportunityService.getOpportunityById(opportunityId);
          setOpportunity(opp);
          
          // Extract customer name
          const customerName = opp.customer?.name || '';
          const [firstName, ...lastNameParts] = customerName.split(' ');
          const lastName = lastNameParts.join(' ') || '';
          
          if (!customerDetails.firstName) {
            customerDetails = {
              firstName: firstName || '',
              lastName: lastName || '',
              email: opp.customer?.email || customerDetails.email,
              phone: opp.customer?.phone || customerDetails.phone,
            };
          }
          
          // Get vehicle from opportunity
          if (!vehicleDetails.regNo && opp.vehicles && opp.vehicles.length > 0) {
            const primaryVehicle = opp.vehicles[0];
            const vehicleId = typeof primaryVehicle === 'object' ? primaryVehicle._id : primaryVehicle;
            
            try {
              const veh = await vehicleService.getVehicleById(vehicleId);
              setVehicle(veh);
              
              vehicleDetails = {
                regNo: veh.registrationNumber || '',
                make: veh.make || '',
                model: veh.model || '',
                year: veh.year?.toString() || '',
              };
            } catch (vehError) {
              console.error('Error loading vehicle:', vehError);
            }
          }
          
          // Get service details from opportunity
          if (!serviceDetails.productServiceNeeded) {
            serviceDetails = {
              productServiceNeeded: opp.subject || 'Headlight Service',
              productPrice: opp.total || 0,
            };
          }
          
          if (preChecklistId) {
            showToast('Missing data supplemented from opportunity', 'info');
          } else {
            showToast('Data loaded from opportunity', 'success');
          }
        } catch (error) {
          console.error('Error loading from opportunity:', error);
        }
      }

      // 3. Set inspector name
      const userName = sessionStorage.getItem('userName') || 'Inspector';
      setInspectorName(userName);

      // 4. Update form data with loaded information
      setFormData(prev => ({
        ...prev,
        customerDetails,
        vehicleDetails,
        serviceDetails,
        inspectorName: userName,
        opportunityId: opportunityId || prev.opportunityId,
        vehicleId: vehicleId || prev.vehicleId,
        preChecklistId: preChecklistId || prev.preChecklistId,
        jobCardId: jobCardId || prev.jobCardId,
      }));

      setDataLoaded(true);
      
    } catch (error) {
      console.error('Error loading data from sources:', error);
      showToast('Failed to load source data', 'error');
    }
  };

  const handleRefreshData = async () => {
    try {
      setLoading(true);
      await loadDataFromSources();
      showToast('Data refreshed successfully', 'success');
    } catch (error) {
      console.error('Error refreshing data:', error);
      showToast('Failed to refresh data', 'error');
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

  const handleVehicleDetailChange = (field: keyof typeof formData.vehicleDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      vehicleDetails: {
        ...prev.vehicleDetails,
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
          { item: 'Adaptive Front Lights(AFS)', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Dimming Functionality', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Wiring And Connectors', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Beam Alignment', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
          { item: 'Headlight Lens(Scratches, Cracks, Haziness)', working: false, remarks: '', side: 'both', status: ChecklistItemStatus.INCOMPLETE },
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

      // Validation checks
      if (!formData.customerDetails.firstName.trim() || !formData.customerDetails.lastName.trim()) {
        showToast('Customer name is required', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }

      if (!formData.productHandoverConfirmed) {
        showToast('Please confirm product handover', 'error');
        setCurrentStep(4);
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

      // Prepare inspection items
      const apiInspectionItems = formData.inspectionItems.map(item => ({
        item: item.item,
        status: item.working ? ChecklistItemStatus.COMPLETED : ChecklistItemStatus.INCOMPLETE,
        remarks: item.remarks,
        side: item.side,
        working: item.working
      }));

      const allItemsCompleted = apiInspectionItems.every(item => 
        item.status === ChecklistItemStatus.COMPLETED
      );

      const submissionData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        preChecklistId: formData.preChecklistId,
        jobCardId: formData.jobCardId,
        workOrderId: workOrderId,
        inspectedBy: formData.inspectedBy,
        inspectorName: formData.inspectorName,
        dateTime: formData.dateTime,
        customerDetails: formData.customerDetails,
        vehicleDetails: formData.vehicleDetails,
        serviceDetails: formData.serviceDetails,
        inspectionItems: apiInspectionItems,
        warrantyDuration: formData.warrantyDuration,
        beforePhotos: formData.beforePhotos,
        afterPhotos: formData.afterPhotos,
        productHandoverConfirmed: formData.productHandoverConfirmed,
        productSatisfactory: formData.productSatisfactory,
        issuesNoted: formData.issuesNoted,
        acceptTerms: formData.acceptTerms,
        rating: formData.rating,
        comments: formData.comments,
        customerSignature: formData.customerSignature,
        serviceRating: formData.serviceRating,
        serviceComments: formData.serviceComments,
        additionalComments: formData.additionalComments,
        approved: allItemsCompleted
      };

      let result: any;
        const userId = sessionStorage.getItem('userId') || undefined;
        
        if (mode === 'edit' && checklistId) {
          result = await postChecklistService.updatePostChecklist(checklistId, submissionData as any, userId);
          showToast('Post-checklist updated successfully', 'success');
        } else {
          result = await postChecklistService.createPostChecklist(submissionData as any, userId);
          showToast('Post-checklist created successfully', 'success');
        }

        // Update work order with post-checklist ID
        if (workOrderId && result._id) {
          await workOrderService.updateWorkOrder(workOrderId, {
            postChecklistId: result._id,
            postChecklistStatus: 'pending',
            updatedAt: new Date().toISOString()
          });
        }

        showToast('Post-checklist completed successfully', 'success');

        // Redirect based on context
        if (workOrderId) {
          router.push(`/orders/work-orders/${workOrderId}`);
        } else if (source === 'opportunity' && formData.opportunityId) {
          router.push(`/opportunities/${formData.opportunityId}`);
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

  const handleBeforeFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
  
    const newFiles = Array.from(files);
    setSelectedBeforeFiles(prev => [...prev, ...newFiles]);
    
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

  const clearSignature = () => {
    if (customerSigRef.current) {
      customerSigRef.current.clear();
      setCustomerSignature('');
      handleInputChange('customerSignature', '');
    }
  };

  const saveSignature = () => {
    if (customerSigRef.current) {
      const dataUrl = customerSigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setCustomerSignature(dataUrl);
      handleInputChange('customerSignature', dataUrl);
      setShowCustomerSignature(false);
    }
  };

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
          <p className="text-gray-600">Loading post-checklist form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-6 shadow-lg">
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
        {renderProgressStepper()}
        
        <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[0]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[0]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserType className="h-5 w-5 text-green-600" />
                    CUSTOMER DETAILS
                  </h2>
                  <button
                    onClick={handleRefreshData}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Refresh Data from Sources
                  </button>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-green-700">
                        Customer, vehicle, and service details are automatically populated from the opportunity and pre-checklist.
                      </p>
                      <div className="mt-2 text-xs text-green-800 space-y-1">
                        {preChecklist && <div>✓ Data loaded from Pre-Checklist</div>}
                        {opportunity && <div>✓ Data loaded from Opportunity</div>}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Inspector Information */}
                <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Inspector Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inspector Name
                      </label>
                      <input
                        type="text"
                        value={formData.inspectorName}
                        onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                        placeholder="Enter inspector name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inspection Date
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
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name
                    </label>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.customerDetails.firstName}
                        onChange={(e) => handleCustomerDetailChange('firstName', e.target.value)}
                        placeholder="First Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <input
                        type="text"
                        value={formData.customerDetails.lastName}
                        onChange={(e) => handleCustomerDetailChange('lastName', e.target.value)}
                        placeholder="Last Name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Contact Information
                    </label>
                    <div className="space-y-3">
                      <input
                        type="email"
                        value={formData.customerDetails.email}
                        onChange={(e) => handleCustomerDetailChange('email', e.target.value)}
                        placeholder="Email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                      <input
                        type="tel"
                        value={formData.customerDetails.phone}
                        onChange={(e) => handleCustomerDetailChange('phone', e.target.value)}
                        placeholder="Phone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        value={formData.vehicleDetails.regNo}
                        onChange={(e) => handleVehicleDetailChange('regNo', e.target.value)}
                        placeholder="Reg No"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Make & Model
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          value={formData.vehicleDetails.make}
                          onChange={(e) => handleVehicleDetailChange('make', e.target.value)}
                          placeholder="Make"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                        <input
                          type="text"
                          value={formData.vehicleDetails.model}
                          onChange={(e) => handleVehicleDetailChange('model', e.target.value)}
                          placeholder="Model"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Service Information */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Service Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Description
                      </label>
                      <input
                        type="text"
                        value={formData.serviceDetails.productServiceNeeded}
                        onChange={(e) => handleInputChange('serviceDetails', {
                          ...formData.serviceDetails,
                          productServiceNeeded: e.target.value
                        })}
                        placeholder="Service Description"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Price (KES)
                      </label>
                      <input
                        type="number"
                        value={formData.serviceDetails.productPrice}
                        onChange={(e) => handleInputChange('serviceDetails', {
                          ...formData.serviceDetails,
                          productPrice: parseFloat(e.target.value) || 0
                        })}
                        placeholder="Price"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    WARRANTY DURATION *Required
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

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    value={formData.additionalComments}
                    onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                    placeholder="Any additional notes or comments..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                  />
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
                        <h2 className="text-xl font-bold text-gray-900">INSPECTION ITEM(TICK IF IT IS WORKING)</h2>
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

          {currentStep === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[2]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[2]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Photos */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Camera className="h-5 w-5 text-green-600" />
                      UPLOAD BEFORE PHOTOS
                    </h3>
                    
                    <div 
                      onClick={() => document.getElementById('before-file-input')?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                      <input
                        id="before-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleBeforeFileSelect}
                        className="hidden"
                      />
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Choose File(s)</p>
                      <p className="text-xs text-gray-500">Select multiple images</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {selectedBeforeFiles.length > 0 
                          ? `${selectedBeforeFiles.length} file(s) selected` 
                          : 'No file chosen'}
                      </div>
                    </div>

                    {formData.beforePhotos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          Before Photos ({formData.beforePhotos.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {formData.beforePhotos.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={image}
                                  alt={`Before ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeBeforePhoto(index)}
                                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* After Photos */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                      <Camera className="h-5 w-5 text-green-600" />
                      UPLOAD AFTER PHOTOS
                    </h3>
                    
                    <div 
                      onClick={() => document.getElementById('after-file-input')?.click()}
                      className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                      <input
                        id="after-file-input"
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleAfterFileSelect}
                        className="hidden"
                      />
                      <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-1">Choose File(s)</p>
                      <p className="text-xs text-gray-500">Select multiple images</p>
                      <div className="mt-2 text-xs text-gray-500">
                        {selectedAfterFiles.length > 0 
                          ? `${selectedAfterFiles.length} file(s) selected` 
                          : 'No file chosen'}
                      </div>
                    </div>

                    {formData.afterPhotos.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          After Photos ({formData.afterPhotos.length})
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          {formData.afterPhotos.map((image, index) => (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                                <img
                                  src={image}
                                  alt={`After ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAfterPhoto(index)}
                                className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[3]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[3]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-green-600" />
                    Product Handover & Terms
                  </h2>
                  <span className="text-sm text-gray-500">Required Fields *</span>
                </div>
                
                {/* Product Handover Confirmation */}
                <div className="mb-8 p-6 border border-gray-200 rounded-lg bg-blue-50">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Initial Product Handover Confirmation
                  </h3>
                  
                  <div className="flex items-start gap-3 mb-4">
                    <input
                      type="checkbox"
                      id="productHandoverConfirmed"
                      checked={formData.productHandoverConfirmed}
                      onChange={(e) => handleInputChange('productHandoverConfirmed', e.target.checked)}
                      className="mt-1"
                      required
                    />
                    <label htmlFor="productHandoverConfirmed" className="text-sm text-gray-700">
                      I confirm that I have received and reviewed the initial product after installation *
                    </label>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="productSatisfactory"
                        checked={formData.productSatisfactory}
                        onChange={() => handleInputChange('productSatisfactory', true)}
                        className="mt-1"
                      />
                      <label htmlFor="productSatisfactory" className="text-sm text-gray-700">
                        The initial product is satisfactory
                      </label>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        id="issuesNoted"
                        checked={!formData.productSatisfactory}
                        onChange={() => handleInputChange('productSatisfactory', false)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <label htmlFor="issuesNoted" className="text-sm text-gray-700 block mb-2">
                          Issues noted (if any):
                        </label>
                        <textarea
                          value={formData.issuesNoted}
                          onChange={(e) => handleInputChange('issuesNoted', e.target.value)}
                          placeholder="Describe any issues with the installation..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                          rows={3}
                          disabled={formData.productSatisfactory}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Terms and Conditions */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-64 overflow-y-auto p-4">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">TERMS AND CONDITIONS</h3>
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
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Additional Terms:</h4>
                      <div className="text-xs text-gray-700 space-y-1">
                        <p>1. Scope and Customer Obligations: Eagle Lights specialises in automotive lighting, offering headlight installations and customizations.</p>
                        <p>2. Manufacturer's Warranty and Voiding Conditions: While Eagle Lights provides a limited warranty for workmanship, manufacturer's warranties vary and are not their responsibility.</p>
                        <p>3. Warranty Period and Refund: The warranty period for workmanship is Six Months to One Year depending on the product.</p>
                        <p>14. Non-Liability for Damages Resulting from Customization: Eagle Lights shall not be held liable for any damages, losses, or costs resulting from the customization process.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Terms Acceptance */}
                <div className="mt-6 space-y-4">
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
                      I accept the Terms and Conditions *
                    </label>
                  </div>
                </div>
                
                {/* Customer Signature */}
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Customer Signature *
                    </label>
                    {customerSignature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {showCustomerSignature ? (
                    <div className="space-y-3">
                      <div className="border border-gray-300 rounded-lg bg-white p-2">
                        <SignatureCanvas
                          ref={customerSigRef}
                          penColor="black"
                          canvasProps={{
                            width: 400,
                            height: 150,
                            className: 'w-full h-32 border rounded bg-white'
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveSignature}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Save Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowCustomerSignature(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowCustomerSignature(true)}
                      className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-green-500 hover:bg-green-50 transition-colors"
                    >
                      {customerSignature ? (
                        <div className="text-center p-2">
                          <img 
                            src={customerSignature} 
                            alt="Customer Signature" 
                            className="h-20 mx-auto object-contain"
                          />
                          <p className="text-xs text-gray-500 mt-1">Click to change signature</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileSignature className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Click to sign</p>
                          <p className="text-xs text-gray-500">Draw your signature</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[4]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[4]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Feedback & Rating
                </h2>
                
                {/* Service Rating */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    RATE US
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleInputChange('serviceRating', star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`h-8 w-8 ${star <= formData.serviceRating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`} />
                      </button>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formData.serviceRating === 1 && 'Poor'}
                    {formData.serviceRating === 2 && 'Fair'}
                    {formData.serviceRating === 3 && 'Good'}
                    {formData.serviceRating === 4 && 'Very Good'}
                    {formData.serviceRating === 5 && 'Excellent'}
                  </div>
                </div>
                
                {/* Service Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    LEAVE A COMMENT ABOUT OUR SERVICES
                  </label>
                  <textarea
                    value={formData.serviceComments}
                    onChange={(e) => handleInputChange('serviceComments', e.target.value)}
                    placeholder="Tell us about your experience..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={4}
                  />
                </div>
                
                {/* Overall Experience */}
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Overall Experience
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => handleInputChange('rating', 5)}
                      className={`p-4 border rounded-lg flex items-center justify-center gap-3 transition-all ${
                        formData.rating === 5
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsUp className="h-6 w-6 text-green-600" />
                      <div className="text-left">
                        <div className="font-medium">Satisfied</div>
                        <div className="text-sm text-gray-600">Everything was perfect</div>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('rating', 1)}
                      className={`p-4 border rounded-lg flex items-center justify-center gap-3 transition-all ${
                        formData.rating === 1
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <ThumbsDown className="h-6 w-6 text-red-600" />
                      <div className="text-left">
                        <div className="font-medium">Needs Improvement</div>
                        <div className="text-sm text-gray-600">Issues need attention</div>
                      </div>
                    </button>
                  </div>
                </div>
                
                {/* Additional Comments */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments
                  </label>
                  <textarea
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    placeholder="Any additional feedback or suggestions..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
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
          
          <div className="flex justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel & Back to Work Order
            </button>
            
            <div className="flex gap-4">
              <button
                onClick={handleSaveAsDraft}
                className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                disabled={submitting}
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
                  className="px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  disabled={submitting}
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
                      {mode === 'edit' ? 'Update Checklist' : 'Create Post-Checklist'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
