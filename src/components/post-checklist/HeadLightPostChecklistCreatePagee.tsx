'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Wrench,
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
  Sun,
  Moon,
  Navigation,
  AlertTriangle as AlertTriangleIcon,
  Droplet,
  Wind,
  Battery,
  Activity,
  Gauge,
  Edit,
  RotateCw,
  Hammer,
  PaintBucket
} from 'lucide-react';
import { postChecklistService, ChecklistItem, ChecklistItemStatus } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { preChecklistService } from '@/services/preChecklistService';
import { serviceService, Service } from '@/services/serviceService';
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
  const [draftSaved, setDraftSaved] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);

  // Section expansion state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    customer: true,
    inspection: true,
    photos: true,
    handover: true,
    feedback: true
  });

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

  const [customerSignature, setCustomerSignature] = useState(formData.customerSignature);
  const [showCustomerSignature, setShowCustomerSignature] = useState(false);
  const customerSigRef = useRef<SignatureCanvas>(null);

  const loadServiceOptions = async () => {
    try {
      setLoadingServices(true);
      const services = await serviceService.getAllServices();
      const activeServices = services
        .filter((service) => service.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
      setAvailableServices(activeServices);
    } catch (error) {
      console.error('Error loading headlight post-checklist services:', error);
      showToast('Could not load services for dropdown selection', 'warning');
    } finally {
      setLoadingServices(false);
    }
  };

  // Load related data
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, preChecklistId, checklistId, mode]);

  useEffect(() => {
    loadServiceOptions();
  }, []);

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
        setSubmitting(false);
        return;
      }

      if (!formData.productHandoverConfirmed) {
        showToast('Please confirm product handover', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.acceptTerms) {
        showToast('Please accept the terms and conditions', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.customerSignature) {
        showToast('Customer signature is required', 'error');
        setSubmitting(false);
        return;
      }

      const normalizeId = (value: unknown): string => {
        if (typeof value === 'string') return value.trim();
        if (value && typeof value === 'object') {
          return String((value as any)._id || (value as any).id || '').trim();
        }
        return '';
      };

      const resolvedVehicleId =
        normalizeId(formData.vehicleId) ||
        normalizeId(vehicle) ||
        normalizeId(preChecklist?.vehicleId) ||
        normalizeId(opportunity?.vehicles?.[0]);

      if (!resolvedVehicleId) {
        showToast('Vehicle information is missing. Reload the checklist and try again.', 'error');
        setSubmitting(false);
        return;
      }

      const customerEmail = formData.customerDetails.email.trim();
      if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        showToast('Enter a valid customer email or leave it blank', 'error');
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
        vehicleId: resolvedVehicleId,
        preChecklistId: formData.preChecklistId,
        jobCardId: formData.jobCardId,
        workOrderId: workOrderId,
        inspectedBy: formData.inspectedBy,
        inspectorName: formData.inspectorName,
        dateTime: formData.dateTime,
        customerDetails: {
          ...formData.customerDetails,
          email: customerEmail,
        },
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

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-purple-50/30">
      {/* Header - Matching pre-checklist style */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-6 shadow-lg">
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
              <p className="text-blue-100">
                {mode === 'edit' 
                  ? `Editing: Post-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Post-Service Quality Assurance Checklist - All sections in one form'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm bg-white/10 px-4 py-2 rounded-lg">
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

      {/* Main Content - Single page form */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8 space-y-8">
            
            {/* SECTION 1: Customer & Warranty */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('customer')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <UserType className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Customer & Warranty Details</h3>
                    <p className="text-xs text-gray-600">Customer information, vehicle details, and warranty</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={handleRefreshData}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Refresh Data
                  </button>
                  {expandedSections.customer ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                </div>
              </div>
              
              {expandedSections.customer && (
                <div className="p-6 space-y-6">
                  {/* Data source info */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-2">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        Inspection Date & Time *
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.dateTime.split('.')[0]}
                        onChange={(e) => handleInputChange('dateTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  {/* Customer Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <UserType className="h-4 w-4 text-blue-600" />
                      Customer Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          value={formData.customerDetails.firstName}
                          onChange={(e) => handleCustomerDetailChange('firstName', e.target.value)}
                          placeholder="First Name"
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
                          placeholder="Last Name"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email
                        </label>
                        <input
                          type="email"
                          value={formData.customerDetails.email}
                          onChange={(e) => handleCustomerDetailChange('email', e.target.value)}
                          placeholder="Email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Phone
                        </label>
                        <input
                          type="tel"
                          value={formData.customerDetails.phone}
                          onChange={(e) => handleCustomerDetailChange('phone', e.target.value)}
                          placeholder="Phone"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Vehicle Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <CarIcon className="h-4 w-4 text-blue-600" />
                      Vehicle Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Registration Number *
                        </label>
                        <input
                          type="text"
                          value={formData.vehicleDetails.regNo}
                          onChange={(e) => handleVehicleDetailChange('regNo', e.target.value)}
                          placeholder="Reg No"
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
                          value={formData.vehicleDetails.make}
                          onChange={(e) => handleVehicleDetailChange('make', e.target.value)}
                          placeholder="Make"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model
                        </label>
                        <input
                          type="text"
                          value={formData.vehicleDetails.model}
                          onChange={(e) => handleVehicleDetailChange('model', e.target.value)}
                          placeholder="Model"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year
                        </label>
                        <input
                          type="text"
                          value={formData.vehicleDetails.year}
                          onChange={(e) => handleVehicleDetailChange('year', e.target.value)}
                          placeholder="Year"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Service Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4 text-blue-600" />
                      Service Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Service Description
                        </label>
                        <div className="space-y-2">
                          <select
                            value={formData.serviceDetails.productServiceNeeded}
                            onChange={(e) => handleInputChange('serviceDetails', {
                              ...formData.serviceDetails,
                              productServiceNeeded: e.target.value
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">
                              {loadingServices ? 'Loading services...' : 'Select service from dropdown'}
                            </option>
                            {formData.serviceDetails.productServiceNeeded &&
                              !availableServices.some(
                                (service) =>
                                  service.name.toLowerCase() ===
                                  formData.serviceDetails.productServiceNeeded.toLowerCase()
                              ) && (
                                <option value={formData.serviceDetails.productServiceNeeded}>
                                  {formData.serviceDetails.productServiceNeeded} (Current Value)
                                </option>
                              )}
                            {availableServices.map((service) => (
                              <option key={service.id} value={service.name}>
                                {service.serviceCode} - {service.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">
                              Choose the completed service from the dropdown list.
                            </p>
                            <button
                              type="button"
                              onClick={loadServiceOptions}
                              disabled={loadingServices}
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-60"
                            >
                              <RotateCw className={`h-3 w-3 ${loadingServices ? 'animate-spin' : ''}`} />
                              Refresh
                            </button>
                          </div>
                        </div>
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Warranty Duration */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      WARRANTY DURATION *
                    </label>
                    <select
                      value={formData.warrantyDuration}
                      onChange={(e) => handleInputChange('warrantyDuration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="6 months">6 Months</option>
                      <option value="12 months">12 Months</option>
                      <option value="18 months">18 Months</option>
                      <option value="24 months">24 Months</option>
                      <option value="36 months">36 Months</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Comments
                    </label>
                    <textarea
                      value={formData.additionalComments}
                      onChange={(e) => handleInputChange('additionalComments', e.target.value)}
                      placeholder="Any additional notes or comments..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
            
            {/* SECTION 2: Inspection Results */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('inspection')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Inspection Results</h3>
                    <p className="text-xs text-gray-600">Tick if component is working properly after service</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Working
                    </span>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> Not Working
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setShowTemplateSelector(!showTemplateSelector); }}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    Templates
                  </button>
                  {expandedSections.inspection ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                </div>
              </div>
              
              {showTemplateSelector && (
                <div className="p-4 bg-blue-50 border-b border-blue-200">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect('headlight_basic')}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTemplate === 'headlight_basic'
                          ? 'border-blue-500 bg-white shadow-md'
                          : 'border-blue-200 bg-white/50 hover:bg-white'
                      }`}
                    >
                      <div className="font-medium text-gray-900">Basic Check</div>
                      <p className="text-xs text-gray-600 mt-1">Essential post-service items</p>
                      <div className="mt-2 text-xs text-blue-600">6 items</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTemplateSelect('headlight_comprehensive')}
                      className={`p-4 border rounded-lg text-left transition-all ${
                        selectedTemplate === 'headlight_comprehensive'
                          ? 'border-blue-500 bg-white shadow-md'
                          : 'border-blue-200 bg-white/50 hover:bg-white'
                      }`}
                    >
                      <div className="font-medium text-gray-900">Comprehensive</div>
                      <p className="text-xs text-gray-600 mt-1">Detailed inspection</p>
                      <div className="mt-2 text-xs text-blue-600">16 items</div>
                    </button>
                  </div>
                </div>
              )}
              
              {expandedSections.inspection && (
                <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                  {formData.inspectionItems.map((item, index) => (
                    <div key={index} className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          <Lightbulb className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">{item.item}</span>
                              <span className="ml-3 text-xs text-gray-500">
                                {item.side === 'both' ? 'Both sides' : item.side === 'vehicle' ? 'Vehicle' : item.side}
                              </span>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getWorkingColor(item.working)}`}>
                              {getWorkingIcon(item.working)}
                              <span>{item.working ? 'Working' : 'Not Working'}</span>
                            </span>
                          </div>
                          
                          {/* Working Toggle */}
                          <div className="flex items-center gap-2 mb-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.working}
                                onChange={(e) => handleWorkingChange(index, e.target.checked)}
                                className="h-4 w-4 text-green-600 rounded focus:ring-green-500"
                              />
                              <span className="text-sm text-gray-700">Tick if working properly</span>
                            </label>
                          </div>
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              value={item.remarks}
                              onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {expandedSections.inspection && (
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
              )}
            </div>
            
            {/* SECTION 3: Photos Documentation */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('photos')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Camera className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Photos Documentation</h3>
                    <p className="text-xs text-gray-600">Upload before and after photos</p>
                  </div>
                </div>
                {expandedSections.photos ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </div>
              
              {expandedSections.photos && (
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Before Photos */}
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Camera className="h-4 w-4 text-blue-600" />
                        UPLOAD BEFORE PHOTOS
                      </h4>
                      
                      <div 
                        onClick={() => document.getElementById('before-file-input')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
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
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            Before Photos ({formData.beforePhotos.length})
                          </h5>
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
                      <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Camera className="h-4 w-4 text-blue-600" />
                        UPLOAD AFTER PHOTOS
                      </h4>
                      
                      <div 
                        onClick={() => document.getElementById('after-file-input')?.click()}
                        className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
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
                          <h5 className="text-sm font-medium text-gray-700 mb-2">
                            After Photos ({formData.afterPhotos.length})
                          </h5>
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
              )}
            </div>
            
            {/* SECTION 4: Product Handover & Terms */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('handover')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Product Handover & Terms</h3>
                    <p className="text-xs text-gray-600">Confirm handover, accept terms, and sign</p>
                  </div>
                </div>
                {expandedSections.handover ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </div>
              
              {expandedSections.handover && (
                <div className="p-6 space-y-6">
                  {/* Product Handover Confirmation */}
                  <div className="p-6 border border-gray-200 rounded-lg bg-blue-50">
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Initial Product Handover Confirmation *
                    </h4>
                    
                    <div className="flex items-start gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="productHandoverConfirmed"
                        checked={formData.productHandoverConfirmed}
                        onChange={(e) => handleInputChange('productHandoverConfirmed', e.target.checked)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded"
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
                          name="productSatisfactory"
                          checked={formData.productSatisfactory}
                          onChange={() => handleInputChange('productSatisfactory', true)}
                          className="mt-1 h-5 w-5 text-blue-600"
                        />
                        <label htmlFor="productSatisfactory" className="text-sm text-gray-700">
                          The initial product is satisfactory
                        </label>
                      </div>
                      
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          id="issuesNoted"
                          name="productSatisfactory"
                          checked={!formData.productSatisfactory}
                          onChange={() => handleInputChange('productSatisfactory', false)}
                          className="mt-1 h-5 w-5 text-blue-600"
                        />
                        <div className="flex-1">
                          <label htmlFor="issuesNoted" className="text-sm text-gray-700 block mb-2">
                            Issues noted (if any):
                          </label>
                          <textarea
                            value={formData.issuesNoted}
                            onChange={(e) => handleInputChange('issuesNoted', e.target.value)}
                            placeholder="Describe any issues with the installation..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={3}
                            disabled={formData.productSatisfactory}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Terms and Conditions */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-blue-600" />
                      Terms and Conditions
                    </h4>
                    
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="h-48 overflow-y-auto p-4 bg-gray-50">
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
                    </div>
                  </div>
                  
                  {/* Terms Acceptance */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptTerms"
                      checked={formData.acceptTerms}
                      onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                      className="mt-1 h-5 w-5 text-blue-600 rounded"
                      required
                    />
                    <label htmlFor="acceptTerms" className="text-sm text-gray-700">
                      I accept the Terms and Conditions *
                    </label>
                  </div>
                  
                  {/* Customer Signature */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
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
                              width: 600,
                              height: 150,
                              className: 'w-full h-32 border rounded bg-white'
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={saveSignature}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
                        className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
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
              )}
            </div>
            
            {/* SECTION 5: Feedback & Rating */}
            <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
              <div 
                className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between cursor-pointer"
                onClick={() => toggleSection('feedback')}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Star className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Feedback & Rating</h3>
                    <p className="text-xs text-gray-600">Customer satisfaction and comments</p>
                  </div>
                </div>
                {expandedSections.feedback ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
              </div>
              
              {expandedSections.feedback && (
                <div className="p-6 space-y-6">
                  {/* Service Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
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
                    <div className="mt-2 text-sm text-gray-600">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  
                  {/* Overall Experience */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Form Actions */}
          <div className="mt-8 flex justify-between gap-4">
            <button
              type="button"
              onClick={handleCancel}
              className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
              disabled={submitting}
            >
              <ArrowLeft className="h-5 w-5" />
              Cancel
            </button>
            
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleSaveAsDraft}
                className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                disabled={submitting}
              >
                <Save className="h-5 w-5" />
                Save Draft
                {draftSaved && <span className="text-xs text-green-600">✓</span>}
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {mode === 'edit' ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    {mode === 'edit' ? 'Update Inspection' : 'Create Post-Checklist'}
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
