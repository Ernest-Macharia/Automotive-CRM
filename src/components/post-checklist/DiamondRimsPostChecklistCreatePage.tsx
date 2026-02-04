'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import SignatureCanvas from 'react-signature-canvas';
import {
  ClipboardCheck,
  ArrowLeft,
  Save,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
  User as UserType,
  Upload,
  Loader2,
  AlertTriangle,
  Info,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  FileSignature,
  Sparkles,
  Car as CarIcon,
  Package,
  CheckSquare,
  AlertOctagon,
  Camera,
  CreditCard,
  Truck,
  Home,
  Mail,
  Phone,
  FileCheck,
  ClipboardList,
  Thermometer,
  Droplets,
  Zap,
  Wrench as WrenchIcon,
  Check,
  ArrowRight,
  Download,
  RotateCw,
  Shield,
  Gauge,
  ThermometerSnowflake,
  Settings,
  Users,
  Award,
  ShieldCheck,
  Star,
  ThumbsUp,
  Battery,
  Radio,
  Palette,
  Hammer,
  Layers,
  PackageOpen,
  CircleCheck,
  ExternalLink,
  ChevronRight,
  PaintBucket,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import { postChecklistService } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { userService, User } from '@/services/settings/userService';
import { ROLES } from '@/services/settings/roleService';
import { useToast } from '@/contexts/ToastContext';
import TermsModal from '@/components/pre-checklist/TermsModal';
import DiamondRimsPostChecklistPDF from './DiamondRimsPostChecklistPDF';
import * as XLSX from 'xlsx';
import { preChecklistService } from '@/services/preChecklistService';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';

interface DiamondRimsPostChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
  preChecklistId?: string;
}

export default function DiamondRimsPostChecklistCreatePage({ 
  mode = 'create', 
  checklistId,
  preChecklistId: initialPreChecklistId 
}: DiamondRimsPostChecklistCreatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Get parameters from URL
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');
  const vehicleId = searchParams.get('vehicleId');
  const source = searchParams.get('source');
  const preChecklistId = searchParams.get('preChecklistId') || initialPreChecklistId;

  const [loading, setLoading] = useState(mode === 'create');
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [existingChecklist, setExistingChecklist] = useState<any>(null);
  const [preChecklist, setPreChecklist] = useState<any>(null);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const technicianDropdownRef = useRef<HTMLDivElement>(null);

  const [showTermsModal, setShowTermsModal] = useState(false);

  // POST CHECKLIST FORM STATE
  const [formData, setFormData] = useState({
    checklistType: 'diamond_rims_post',
    opportunityId: opportunityId || '',
    workOrderId: workOrderId || '',
    vehicleId: vehicleId || '',
    preChecklistId: preChecklistId || '',
    
    // SERVICE COMPLETION FORM FIELDS
    serviceCompletion: {
      date: new Date().toISOString().split('T')[0],
      completedBy: sessionStorage.getItem('userName') || '',
      completionTime: new Date().toISOString().split('T')[1]?.substring(0, 5) || '',
    },
    
    // Basic Information
    inspectedBy: sessionStorage.getItem('userId') || '',
    inspectorName: sessionStorage.getItem('userName') || '',
    
    // Contact Information
    customerDetails: {
      name: '',
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
    },
    
    // Vehicle Information
    carDetails: {
      carMake: '',
      carModel: '',
      licensePlate: '',
      mileage: '',
      yearOfManufacture: '',
    },
    
    // SERVICES (completed)
    services: {
      actualService: [] as string[],
    },
    
    // FINAL CHECKS
    finalChecks: {
      tpmsSensorsFitted: false,
      lockNuts: false,
      numberOfLockNuts: 0,
      nozzleCaps: false,
      nozzleCapsType: '',
      centerCaps: '',
      tires: false,
      tireCondition: '',
      wheelBalanced: false,
      checkedForPuncture: false,
      rimStraightness: '',
      coatingQuality: '',
      weldingQuality: '',
      diamondCuttingQuality: '',
    },
    
    // Tire Specifications
    tireSpecifications: {
      brand: '',
      inflationPSI: '',
      dot: '',
      treadDepth: '',
      manufacturingDate: '',
    },
    
    // Powder Coating Details
    powderCoating: {
      colourRAL: '',
      finishQuality: '',
      coverage: '',
    },
    
    // Additional Information
    additionalInformation: '',
    
    // Quality Assurance
    qualityAssurance: {
      leadTechnicianConfirmation: false,
      operationsCounterCheck: false,
      finalInspectionPassed: false,
      customerReadyForCollection: false,
    },
    
    // AGENT DETAILS
    agentDetails: {
      firstName: '',
      lastName: '',
      idNumber: '',
    },
    
    // Delivery Information
    deliveryInformation: {
      mode: '',
      collectionDate: '',
      collectionTime: '',
      collectedBy: '',
    },
    
    // Terms acceptance
    mustKnowAccepted: false,
    acceptTerms: false,
    clientSignature: '',
    inspectorSignature: '',
    
    // Uploads
    uploadedImages: [] as string[],
    remarks: '',
    
    // Status
    approved: false,
    completed: true,
    completionDate: new Date().toISOString()
  });

  const [clientSignature, setClientSignature] = useState(formData.clientSignature);
  const [inspectorSignature, setInspectorSignature] = useState(formData.inspectorSignature);
  const [showClientSignature, setShowClientSignature] = useState(false);
  const [showInspectorSignature, setShowInspectorSignature] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);
  const inspectorSigRef = useRef<SignatureCanvas>(null);

  // Service options for Post Checklist
  const serviceOptions = [
    { id: 'balancing', label: 'Wheel Balancing', icon: <Gauge className="h-4 w-4" /> },
    { id: 'diamond_cutting', label: 'Diamond Cutting', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'powder_coating', label: 'Powder Coating', icon: <PaintBucket className="h-4 w-4" /> },
    { id: 'rim_inspection', label: 'Rim Inspection', icon: <Eye className="h-4 w-4" /> },
    { id: 'rim_straightening', label: 'Rim Straightening', icon: <Hammer className="h-4 w-4" /> },
    { id: 'skimming', label: 'Brake Disc Skimming', icon: <RotateCw className="h-4 w-4" /> },
    { id: 'welding', label: 'Welding', icon: <Zap className="h-4 w-4" /> }
  ];

  // Tire Condition options
  const tireConditionOptions = [
    'Excellent - Like new, no wear',
    'Good - Minor wear, still safe',
    'Fair - Moderate wear, monitor closely',
    'Poor - Significant wear, consider replacement',
    'Replace Immediately - Unsafe for use'
  ];

  // PSI options
  const psiOptions = [
    '28-32 PSI',
    '33-36 PSI',
    '37-40 PSI',
    '41-45 PSI',
    '46-50 PSI',
    'Custom'
  ];

  // Quality options
  const qualityOptions = [
    'Excellent',
    'Good',
    'Satisfactory',
    'Needs Improvement',
    'Poor'
  ];

  // RAL Colors options
  const ralColors = [
    'RAL 9010 (Pure White)',
    'RAL 9005 (Jet Black)',
    'RAL 7021 (Black Grey)',
    'RAL 7016 (Anthracite Grey)',
    'RAL 7047 (Telegrey)',
    'RAL 5002 (Ultramarine Blue)',
    'RAL 5024 (Pastel Blue)',
    'RAL 6018 (Yellow Green)',
    'RAL 6029 (Mint Green)',
    'RAL 3000 (Flame Red)',
    'RAL 3020 (Traffic Red)',
    'RAL 2004 (Pure Orange)',
    'RAL 1003 (Signal Yellow)',
    'RAL 1018 (Zinc Yellow)',
    'RAL 8017 (Chocolate Brown)',
    'Custom Color'
  ];

  // Delivery mode options
  const deliveryModeOptions = [
    { id: 'customer_pickup', label: 'Customer Pickup', icon: <Home className="h-5 w-5" /> },
    { id: 'courier_delivery', label: 'Courier Delivery', icon: <Truck className="h-5 w-5" /> },
    { id: 'mobile_delivery_install', label: 'Mobile Service', icon: <CarIcon className="h-5 w-5" /> }
  ];

  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode, preChecklistId]);

  useEffect(() => {
    if ((opportunity || preChecklist) && !autoPopulated) {
      autoPopulateFromPreChecklist();
    }
  }, [opportunity, preChecklist]);

  // Add this useEffect to fetch technicians
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersData = await userService.getAllUsers();
        const technicianUsers = usersData.filter(user => isTechnician(user) && user.active);
        setUsers(technicianUsers || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Failed to load technicians', 'error', 3000);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [showToast]);

  // Update your existing useEffect for click outside to include the technician dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // ... existing code for other dropdowns ...

      if (technicianDropdownRef.current && !technicianDropdownRef.current.contains(event.target as Node)) {
        setShowTechnicianDropdown(false);
        setUserSearch('');
      }

      // ... rest of existing code ...
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toId = (v: any): string => {
    if (!v) return '';
    return typeof v === 'string' ? v : (v._id ?? '');
  };

  const toISODate = (d: any): string => {
    if (!d) return new Date().toISOString();
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? new Date().toISOString() : dt.toISOString();
  };

  const mapPostChecklistToForm = (checklist: any) => {
    const userId = sessionStorage.getItem('userId') || '';

    return {
      ...formData,
      ...checklist,

      checklistType: 'diamond_rims_post',

      opportunityId: toId(checklist?.opportunityId) || formData.opportunityId,
      vehicleId: toId(checklist?.vehicleId) || formData.vehicleId,
      workOrderId: toId(checklist?.workOrderId) || formData.workOrderId,
      preChecklistId: toId(checklist?.preChecklistId) || formData.preChecklistId,

      serviceCompletion: {
        date: checklist?.serviceCompletion?.date
          ? toISODate(checklist.serviceCompletion.date)
          : formData.serviceCompletion.date,
        completedBy: toId(checklist?.serviceCompletion?.completedBy) || formData.serviceCompletion.completedBy || userId,
        completionTime: checklist?.serviceCompletion?.completionTime ?? formData.serviceCompletion.completionTime,
      },

      completionDate: checklist?.completionDate
        ? toISODate(checklist.completionDate)
        : formData.completionDate,

      customerDetails: {
        ...formData.customerDetails,
        ...(checklist?.customerDetails ?? {}),
      },

      carDetails: {
        ...formData.carDetails,
        ...(checklist?.carDetails ?? {}),
      },

      services: {
        ...formData.services,
        ...(checklist?.services ?? {}),
        actualService: Array.isArray(checklist?.services?.actualService)
          ? checklist.services.actualService
          : (formData.services.actualService ?? []),
      },

      finalChecks: {
        ...formData.finalChecks,
        ...(checklist?.finalChecks ?? {}),
      },

      qualityAssurance: {
        ...formData.qualityAssurance,
        ...(checklist?.qualityAssurance ?? {}),
      },

      mustKnowAccepted: !!checklist?.mustKnowAccepted,
      acceptTerms: !!checklist?.acceptTerms,
      clientSignature: checklist?.clientSignature ?? formData.clientSignature,
    };
  };

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // 1) Load existing post checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await postChecklistService.getPostChecklistById(checklistId);
        setExistingChecklist(checklist);
        setFormData(mapPostChecklistToForm(checklist));

        if (typeof checklist.opportunityId === 'object') setOpportunity(checklist.opportunityId);
        if (typeof checklist.vehicleId === 'object') setVehicle(checklist.vehicleId);

        const preId = toId(checklist.preChecklistId);
        if (preId) {
          try {
            const preCheck = await preChecklistService.getPreChecklistById(preId);
            setPreChecklist(preCheck);
          } catch (error) {
            console.error('Error loading pre-checklist:', error);
          }
        }
      }

      // 2) Load pre-checklist if provided
      if (preChecklistId) {
        try {
          const preCheck = await preChecklistService.getPreChecklistById(preChecklistId);
          setPreChecklist(preCheck);

          const oppId = toId(preCheck?.opportunityId);
          if (oppId) {
            const opp = await opportunityService.getOpportunityById(oppId);
            setOpportunity(opp);
          }

          const vehId = toId(preCheck?.vehicleId);
          if (vehId) {
            const veh = await vehicleService.getVehicleById(vehId);
            setVehicle(veh);
          }

          setFormData(prev => ({
            ...prev,
            opportunityId: toId(preCheck?.opportunityId) || prev.opportunityId,
            vehicleId: toId(preCheck?.vehicleId) || prev.vehicleId,
            preChecklistId: preChecklistId,
          }));
        } catch (error) {
          console.error('Error loading pre-checklist:', error);
        }
      }

      // 3) Load opportunity if provided
      if (opportunityId && !opportunity) {
        try {
          const opp = await opportunityService.getOpportunityById(opportunityId);
          setOpportunity(opp);

          if (opp?.vehicles?.length) {
            setVehicle(opp.vehicles[0]);
          }

          setFormData(prev => ({
            ...prev,
            opportunityId: prev.opportunityId || opportunityId,
            vehicleId: prev.vehicleId || toId(opp?.vehicles?.[0]),
          }));
        } catch (error) {
          console.error('Error loading opportunity:', error);
        }
      }

      // 4) Load work order if ID provided
      if (workOrderId) {
        try {
          const wo = await workOrderService.getWorkOrderById(workOrderId);
          setWorkOrder(wo);

          setFormData(prev => ({
            ...prev,
            workOrderId: workOrderId,
          }));

          if (wo?.opportunityId && !opportunity) {
            const oppId = toId(wo.opportunityId);
            if (oppId) {
              const opp = await opportunityService.getOpportunityById(oppId);
              setOpportunity(opp);

              setFormData(prev => ({
                ...prev,
                opportunityId: prev.opportunityId || oppId,
                vehicleId: prev.vehicleId || toId(opp?.vehicles?.[0]),
              }));
            }
          }
        } catch (error) {
          console.error('Error loading work order:', error);
        }
      }
    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateFromPreChecklist = () => {
    if (!preChecklist && !opportunity) return;
    
    try {
      console.log('Auto-populating from pre-checklist:', preChecklist);
      
      const sourceData = preChecklist || opportunity;
      const customerDetails = preChecklist?.customerDetails || opportunity?.customer || {};
      const customerName = customerDetails.name || `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim();
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const carDetails = preChecklist?.carDetails || vehicle || {};
      const services = preChecklist?.services || { actualService: [] };
      const powderCoating = preChecklist?.powderCoating || { colourRAL: '' };
      const deliveryMode = preChecklist?.deliveryMode || '';
      const tpmsSensorsFitted = preChecklist?.tpmsSensorsFitted || false;
      const wheelNutsTotal = preChecklist?.wheelNutsTotal || 4;
      const lockNutsTotal = preChecklist?.lockNutsTotal || 0;
      const nozzleCapsTotal = preChecklist?.nozzleCapsTotal || 0;
      const nozzleCapsType = preChecklist?.nozzleCapsType || '';
      const centerCaps = preChecklist?.centerCaps || '';
      const tireBrands = preChecklist?.tireBrands || { fr: '', fl: '', br: '', bl: '', spare: '' };
      const tireDOT = preChecklist?.tireDOT || { fr: '', fl: '', br: '', bl: '', spare: '' };
      const agentDetails = preChecklist?.agentDetails || { firstName: '', lastName: '', idNumber: '' };
      const additionalInformation = preChecklist?.additionalInformation || '';

      setFormData(prev => ({
        ...prev,
        customerDetails: {
          firstName: firstName || customerDetails.firstName || '',
          lastName: lastName || customerDetails.lastName || '',
          mobile: customerDetails.mobile || customerDetails.phone || '',
          email: customerDetails.email || '',
          name: customerName
        },
        carDetails: {
          carMake: carDetails.carMake || vehicle?.make || '',
          carModel: carDetails.carModel || vehicle?.model || '',
          licensePlate: carDetails.licensePlate || carDetails.regNo || vehicle?.registrationNumber || '',
          mileage: carDetails.mileage || '',
          yearOfManufacture: (carDetails.yearOfManufacture || vehicle?.year)?.toString() || '',
        },
        services: {
          actualService: services.actualService || [],
        },
        powderCoating: {
          colourRAL: powderCoating.colourRAL || '',
          finishQuality: '',
          coverage: '',
        },
        finalChecks: {
          ...prev.finalChecks,
          tpmsSensorsFitted: tpmsSensorsFitted,
          lockNuts: lockNutsTotal > 0,
          numberOfLockNuts: lockNutsTotal,
          nozzleCaps: nozzleCapsTotal > 0,
          nozzleCapsType: nozzleCapsType,
          centerCaps: centerCaps,
        },
        tireSpecifications: {
          brand: tireBrands.fr || tireBrands.fl || tireBrands.br || tireBrands.bl || '',
          dot: tireDOT.fr || tireDOT.fl || tireDOT.br || tireDOT.bl || '',
          inflationPSI: '',
          treadDepth: '',
          manufacturingDate: '',
        },
        deliveryInformation: {
          ...prev.deliveryInformation,
          mode: deliveryMode,
        },
        additionalInformation: additionalInformation,
        agentDetails: agentDetails,
        mustKnowAccepted: preChecklist?.mustKnowAccepted || false,
        acceptTerms: preChecklist?.acceptTerms || false,
        clientSignature: preChecklist?.clientSignature || '',
        inspectorSignature: preChecklist?.inspectorSignature || ''
      }));
      
      if (preChecklist?.clientSignature) {
        setClientSignature(preChecklist.clientSignature);
      }
      if (preChecklist?.inspectorSignature) {
        setInspectorSignature(preChecklist.inspectorSignature);
      }
      
      setAutoPopulated(true);
      
    } catch (error) {
      console.error('Error auto-populating from pre-checklist:', error);
      showToast('Error loading data from pre-checklist', 'warning');
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

  const handleMultiSelectChange = (section: string, field: string, value: string, checked: boolean) => {
    setFormData(prev => {
      const currentArray = prev[section][field] || [];
      let newArray;
      
      if (checked) {
        newArray = [...currentArray, value];
      } else {
        newArray = currentArray.filter(item => item !== value);
      }
      
      return {
        ...prev,
        [section]: {
          ...prev[section],
          [field]: newArray
        }
      };
    });
  };

  const handleServiceSelect = (serviceId: string, checked: boolean) => {
    const serviceLabel = serviceOptions.find(s => s.id === serviceId)?.label || serviceId;
    handleMultiSelectChange('services', 'actualService', serviceLabel, checked);
  };

  const clearSignature = (type: 'client' | 'inspector') => {
    if (type === 'client' && clientSigRef.current) {
      clientSigRef.current.clear();
      setClientSignature('');
      handleInputChange('clientSignature', '');
    } else if (type === 'inspector' && inspectorSigRef.current) {
      inspectorSigRef.current.clear();
      setInspectorSignature('');
      handleInputChange('inspectorSignature', '');
    }
  };

  const saveSignature = (type: 'client' | 'inspector') => {
    if (type === 'client' && clientSigRef.current) {
      const dataUrl = clientSigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setClientSignature(dataUrl);
      handleInputChange('clientSignature', dataUrl);
      setShowClientSignature(false);
    } else if (type === 'inspector' && inspectorSigRef.current) {
      const dataUrl = inspectorSigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setInspectorSignature(dataUrl);
      handleInputChange('inspectorSignature', dataUrl);
      setShowInspectorSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (
        !formData.customerDetails.firstName
      ) {
        showToast('Please fill in all required customer details', 'error');
        setSubmitting(false);
        return;
      }

      if (formData.services.actualService.length === 0) {
        showToast('Please select at least one service', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.finalChecks.tireCondition) {
        showToast('Tire condition is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.qualityAssurance.leadTechnicianConfirmation) {
        showToast('Lead technician confirmation is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.qualityAssurance.operationsCounterCheck) {
        showToast('Operations counter check is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.mustKnowAccepted) {
        showToast('Please acknowledge the MUST KNOW section', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.acceptTerms) {
        showToast('Please accept the terms and conditions', 'error');
        setSubmitting(false);
        return;
      }

      // Normalize IDs to strings before submit
      const normalizedSubmissionData = {
        ...formData,
        checklistType: 'diamond_rims_post',
        opportunityId: toId(formData.opportunityId),
        vehicleId: toId(formData.vehicleId),
        workOrderId: toId((formData as any).workOrderId) || workOrderId || '',
        jobCardId: toId((formData as any).jobCardId) || undefined,
        approved: false, // SET TO FALSE - NO AUTO-APPROVAL
        completed: true,
        completionDate: new Date().toISOString(),
        clientSignature: formData.clientSignature || '',
        inspectorSignature: formData.inspectorSignature || ''
      };

      // Create post-checklist
      let result: any;
      const userId = sessionStorage.getItem('userId') || undefined;
      
      if (mode === 'edit' && checklistId) {
        result = await postChecklistService.updatePostChecklist(checklistId, normalizedSubmissionData as any, userId);
        showToast('Diamond Rims post-checklist updated successfully', 'success');
      } else {
        result = await postChecklistService.createPostChecklist(normalizedSubmissionData as any, userId);
        showToast('Diamond Rims post-checklist created successfully', 'success');
      }

      // Update work order with post-checklist ID
      if (workOrderId && result._id) {
        await workOrderService.updateWorkOrder(workOrderId, {
          postChecklistId: result._id,
          postChecklistStatus: 'pending', // Set status to pending, not approved
          updatedAt: new Date().toISOString()
        });
      }

      // DO NOT auto-approve. The checklist will remain pending.
      showToast('Post-checklist created. Please return to work order to approve it.', 'success');

      // Redirect back to work order details
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
    if (workOrderId) {
      // Always prioritize work order if available
      router.push(`/orders/work-orders/${workOrderId}`);
    } else if (source === 'prechecklist' && preChecklistId) {
      router.push(`/pre-checklist/diamond-rims/${preChecklistId}`);
    } else {
      router.push('/postchecklists');
    }
  };

  // Add these functions
  const isTechnician = (user: User): boolean => {
    if (!user.role) return false;
    
    if (typeof user.role === 'string') {
      const lowerRole = user.role.toLowerCase();
      return lowerRole === 'technician' ||
            lowerRole.includes('technician') ||
            lowerRole === 'tech' ||
            lowerRole.includes('mechanic') ||
            lowerRole.includes('workshop');
    } else if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name?.toLowerCase() || user.role.display_name?.toLowerCase() || '';
      return roleName === 'technician' ||
            roleName.includes('technician') ||
            roleName === 'tech' ||
            roleName.includes('mechanic') ||
            roleName.includes('workshop');
    }
    return false;
  };

  const getUserRoleName = (user: User): string => {
    if (typeof user.role === 'string') {
      return user.role;
    } else if (user.role && typeof user.role === 'object') {
      return user.role.name || 'User';
    }
    return 'User';
  };

  const getUserDisplayInfo = (user: User) => {
    const roleInfo = getUserRoleName(user);
    return {
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      roleName: roleInfo,
      isTechnician: isTechnician(user),
      email: user.email || '',
    };
  };

  const handleRefreshFromPreChecklist = () => {
    if (preChecklist) {
      autoPopulateFromPreChecklist();
      showToast('Refreshed data from pre-checklist', 'info');
    }
  };

  const handleSaveAsDraft = () => {
    try {
      localStorage.setItem('diamondRimsPostChecklistDraft', JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
      showToast('Draft saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save draft', 'error');
    }
  };

  const downloadPDF = async () => {
    try {
      const blob = await pdf(
        <DiamondRimsPostChecklistPDF 
          formData={formData}
          preChecklist={preChecklist}
          opportunity={opportunity}
          vehicle={vehicle}
          workOrder={workOrder}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Diamond_Rims_PostChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('PDF file generated successfully!', 'success');
    } catch (error) {
      console.error('Error generating PDF:', error);
      showToast('Failed to generate PDF file', 'error');
    }
  };

  const downloadExcel = () => {
    try {
      // Create worksheet data
      const data = [
        ['DIAMOND RIMZ LTD', '', '', '', '', '', ''],
        ['POST-SERVICE COMPLETION FORM', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['SERVICE COMPLETION:', formData.serviceCompletion.completedBy, '', 'DATE:', formData.serviceCompletion.date, 'TIME:', formData.serviceCompletion.completionTime],
        ['', '', '', '', '', '', ''],
        ['CUSTOMER DETAILS', '', '', '', '', '', ''],
        ['Name:', `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`, '', '', '', '', ''],
        ['Mobile:', formData.customerDetails.mobile, '', 'Email:', formData.customerDetails.email, '', ''],
        ['', '', '', '', '', '', ''],
        ['CAR DETAILS', '', '', '', '', '', ''],
        ['Car Make:', formData.carDetails.carMake, '', 'Car Model:', formData.carDetails.carModel, '', ''],
        ['Mileage:', formData.carDetails.mileage, '', 'Year:', formData.carDetails.yearOfManufacture, '', ''],
        ['License Plate:', formData.carDetails.licensePlate, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['SERVICES COMPLETED', '', '', '', '', '', ''],
        ['Actual Services:', formData.services.actualService.join(', '), '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['FINAL CHECKS & QUALITY', '', '', '', '', '', ''],
        ['TPMS Sensors Fitted:', formData.finalChecks.tpmsSensorsFitted ? 'Yes' : 'No', '', '', '', '', ''],
        ['Lock Nuts:', formData.finalChecks.lockNuts ? 'Yes' : 'No', '', 'Number of Lock Nuts:', formData.finalChecks.numberOfLockNuts, '', ''],
        ['Nozzle Caps:', formData.finalChecks.nozzleCaps ? 'Yes' : 'No', '', 'Nozzle Caps Type:', formData.finalChecks.nozzleCapsType, '', ''],
        ['Center Caps:', formData.finalChecks.centerCaps, '', 'Tires:', formData.finalChecks.tires ? 'Yes' : 'No', '', ''],
        ['Tire Condition:', formData.finalChecks.tireCondition, '', 'Wheel Balanced:', formData.finalChecks.wheelBalanced ? 'Yes' : 'No', '', ''],
        ['Puncture Check:', formData.finalChecks.checkedForPuncture ? 'Yes' : 'No', '', 'Rim Straightness:', formData.finalChecks.rimStraightness, '', ''],
        ['Coating Quality:', formData.finalChecks.coatingQuality, '', 'Welding Quality:', formData.finalChecks.weldingQuality, '', ''],
        ['Diamond Cutting Quality:', formData.finalChecks.diamondCuttingQuality, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['TIRE SPECIFICATIONS', '', '', '', '', '', ''],
        ['Tire Brand:', formData.tireSpecifications.brand, '', 'Inflation PSI:', formData.tireSpecifications.inflationPSI, '', ''],
        ['Tire DOT:', formData.tireSpecifications.dot, '', 'Tread Depth:', formData.tireSpecifications.treadDepth, '', ''],
        ['Manufacturing Date:', formData.tireSpecifications.manufacturingDate, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['POWDER COATING DETAILS', '', '', '', '', '', ''],
        ['Colour (RAL):', formData.powderCoating.colourRAL, '', 'Finish Quality:', formData.powderCoating.finishQuality, '', ''],
        ['Coverage:', formData.powderCoating.coverage, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['QUALITY ASSURANCE', '', '', '', '', '', ''],
        ['Lead Technician Confirmation:', formData.qualityAssurance.leadTechnicianConfirmation ? 'Yes' : 'No', '', 'Operations Counter Check:', formData.qualityAssurance.operationsCounterCheck ? 'Yes' : 'No', '', ''],
        ['Final Inspection Passed:', formData.qualityAssurance.finalInspectionPassed ? 'Yes' : 'No', '', 'Ready for Collection:', formData.qualityAssurance.customerReadyForCollection ? 'Yes' : 'No', '', ''],
        ['', '', '', '', '', '', ''],
        ['DELIVERY INFORMATION', '', '', '', '', '', ''],
        ['Delivery Mode:', formData.deliveryInformation.mode, '', 'Collection Date:', formData.deliveryInformation.collectionDate, '', ''],
        ['Collection Time:', formData.deliveryInformation.collectionTime, '', 'Collected By:', formData.deliveryInformation.collectedBy, '', ''],
        ['', '', '', '', '', '', ''],
        ['ADDITIONAL INFORMATION', '', '', '', '', '', ''],
        [formData.additionalInformation, '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['AGENT DETAILS', '', '', '', '', '', ''],
        ['Name:', `${formData.agentDetails.firstName} ${formData.agentDetails.lastName}`, '', 'ID:', formData.agentDetails.idNumber, '', ''],
        ['', '', '', '', '', '', ''],
        ['TERMS ACCEPTANCE', '', '', '', '', '', ''],
        ['Must Know Accepted:', formData.mustKnowAccepted ? 'YES' : 'NO', '', 'Terms Accepted:', formData.acceptTerms ? 'YES' : 'NO', '', ''],
        ['Client Signature:', formData.clientSignature ? 'SIGNED' : 'NOT SIGNED', '', 'Inspector Signature:', formData.inspectorSignature ? 'SIGNED' : 'NOT SIGNED', '', ''],
        ['Remarks:', formData.remarks, '', 'Uploaded Images:', formData.uploadedImages?.length || 0, 'image(s)', ''],
        ['Status:', formData.completed ? 'COMPLETED' : 'PENDING', '', 'Completion Date:', formData.completionDate ? new Date(formData.completionDate).toLocaleDateString() : 'N/A', '', '']
      ];
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      const colWidths = [
        { wch: 25 },
        { wch: 30 },
        { wch: 10 },
        { wch: 25 },
        { wch: 30 },
        { wch: 10 },
        { wch: 10 }
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Diamond Rimz Post-Checklist');
      
      const filename = `Diamond_Rimz_PostChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      showToast('Excel file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      showToast('Failed to generate Excel file', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Diamond Rims post-checklist form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-6 shadow-lg">
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
                <CircleCheck className="h-6 w-6" />
                {mode === 'edit' ? 'Edit Diamond Rims Post-Checklist' : 'Diamond Rims Post-Service Completion'}
              </h1>
              <p className="text-purple-100">
                {mode === 'edit' 
                  ? `Editing: Post-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Quality Assurance & Service Completion Verification'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={downloadPDF}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
            >
              <FileText className="h-5 w-5" />
              Download PDF
            </button>
            <button
              onClick={downloadExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download className="h-5 w-5" />
              Download Excel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Single Page Form */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Opportunity Info Banner */}
        {opportunity && (
          <div className="mb-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Opportunity Information</h3>
                <p className="text-sm text-gray-600">
                  {opportunity.subject} • {opportunity.customer?.name}
                  {opportunity.customer?.companyName && ` • ${opportunity.customer.companyName}`}
                </p>
                {vehicle && (
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-gray-700">
                      <Car className="h-4 w-4 inline mr-1" />
                      {vehicle.make} {vehicle.model} • {vehicle.registrationNumber}
                    </span>
                    {vehicle.year && (
                      <span className="text-gray-600">Year: {vehicle.year}</span>
                    )}
                    {vehicle.color && (
                      <span className="text-gray-600">Color: {vehicle.color}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                  opportunity.status === 'won' ? 'bg-green-100 text-green-800' :
                  opportunity.status === 'lost' ? 'bg-red-100 text-red-800' :
                  opportunity.status === 'new' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {opportunity.status?.replace(/_/g, ' ')}
                </span>
                {preChecklist && (
                  <button
                    type="button"
                    onClick={handleRefreshFromPreChecklist}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Refresh from Pre-Checklist
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form Content - All in one page */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8 space-y-8">
            
            {/* Service Completion Details */}
            <div className="border-b pb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Service Completion Details
                </h2>
                {preChecklist && (
                  <button
                    type="button"
                    onClick={handleRefreshFromPreChecklist}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Refresh from Pre-Checklist
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    DATE
                  </label>
                  <input
                    type="date"
                    value={formData.serviceCompletion.date}
                    onChange={(e) => handleNestedInputChange('serviceCompletion', 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="relative" ref={technicianDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    COMPLETED BY
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.serviceCompletion.completedBy}
                      onChange={(e) => handleNestedInputChange('serviceCompletion', 'completedBy', e.target.value)}
                      onFocus={() => setShowTechnicianDropdown(true)}
                      placeholder="Select technician..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pl-10 pr-8"
                    />
                    <UserType className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowTechnicianDropdown(!showTechnicianDropdown)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showTechnicianDropdown ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {showTechnicianDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search technicians..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                              Loading technicians...
                            </div>
                          </div>
                        ) : users.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm">No technicians found</p>
                            <p className="text-xs mt-1">Add technician team members in user management</p>
                          </div>
                        ) : (
                          users
                            .filter(user => {
                              const displayInfo = getUserDisplayInfo(user);
                              return (
                                displayInfo.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                displayInfo.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                                displayInfo.roleName.toLowerCase().includes(userSearch.toLowerCase())
                              );
                            })
                            .map((user) => {
                              const displayInfo = getUserDisplayInfo(user);
                              
                              return (
                                <button
                                  key={user._id || user.id}
                                  type="button"
                                  onClick={() => {
                                    handleNestedInputChange('serviceCompletion', 'completedBy', displayInfo.name);
                                    setShowTechnicianDropdown(false);
                                    setUserSearch('');
                                  }}
                                  className="w-full px-3 py-3 text-left hover:bg-purple-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-indigo-700">
                                        {displayInfo.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                      <p className="text-sm font-medium text-gray-900 truncate">
                                        {displayInfo.name}
                                      </p>
                                      <span className={`text-xs px-2 py-1 rounded-full ${
                                        displayInfo.roleName.toLowerCase().includes('technician') ? 
                                        'bg-blue-100 text-blue-800' : 
                                        'bg-gray-100 text-gray-800'
                                      }`}>
                                        {displayInfo.roleName}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{displayInfo.email}</p>
                                    {/* {displayInfo.department && (
                                      <p className="text-xs text-gray-400 mt-1">{displayInfo.department}</p>
                                    )} */}
                                  </div>
                                </button>
                              );
                            })
                        )}
                        {/* Add option for current user if not in the list */}
                        {sessionStorage.getItem('userName') && !users.some(u => 
                          getUserDisplayInfo(u).name === sessionStorage.getItem('userName')
                        ) && (
                          <button
                            type="button"
                            onClick={() => {
                              const currentUserName = sessionStorage.getItem('userName') || '';
                              handleNestedInputChange('serviceCompletion', 'completedBy', currentUserName);
                              setShowTechnicianDropdown(false);
                              setUserSearch('');
                            }}
                            className="w-full px-3 py-3 text-left hover:bg-green-50 flex items-center gap-3 border-t border-gray-200"
                          >
                            <div className="flex-shrink-0">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-100 to-teal-100 flex items-center justify-center">
                                <UserType className="h-4 w-4 text-green-600" />
                              </div>
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {sessionStorage.getItem('userName')}
                              </p>
                              <p className="text-xs text-gray-500">Current User</p>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {formData.serviceCompletion.completedBy && (
                    <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">
                            Selected: {formData.serviceCompletion.completedBy}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNestedInputChange('serviceCompletion', 'completedBy', '')}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Clear
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    COMPLETION TIME
                  </label>
                  <input
                    type="time"
                    value={formData.serviceCompletion.completionTime}
                    onChange={(e) => handleNestedInputChange('serviceCompletion', 'completionTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Services Completed */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Services Completed *Required
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {serviceOptions.map((service) => (
                    <div key={service.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                      <input
                        type="checkbox"
                        id={`post-service-${service.id}`}
                        checked={formData.services.actualService.includes(service.label)}
                        onChange={(e) => handleServiceSelect(service.id, e.target.checked)}
                        className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`post-service-${service.id}`}
                        className="ml-3 flex items-center gap-2 text-gray-700 cursor-pointer flex-1"
                      >
                        {service.icon}
                        <span>{service.label}</span>
                      </label>
                    </div>
                  ))}
                </div>
                {formData.services.actualService.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">Please select at least one service</p>
                )}
              </div>

              {/* Powder Coating Details */}
              {formData.services.actualService.includes('Powder Coating') && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">POWDER COATING DETAILS</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Colour (RAL)
                      </label>
                      <select
                        value={formData.powderCoating.colourRAL}
                        onChange={(e) => handleNestedInputChange('powderCoating', 'colourRAL', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select RAL Colour</option>
                        {ralColors.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Finish Quality
                      </label>
                      <select
                        value={formData.powderCoating.finishQuality}
                        onChange={(e) => handleNestedInputChange('powderCoating', 'finishQuality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Quality</option>
                        {qualityOptions.map((quality) => (
                          <option key={quality} value={quality}>{quality}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Coverage
                      </label>
                      <select
                        value={formData.powderCoating.coverage}
                        onChange={(e) => handleNestedInputChange('powderCoating', 'coverage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Coverage</option>
                        <option value="Full">Full Coverage</option>
                        <option value="Partial">Partial Coverage</option>
                        <option value="Uneven">Uneven Coverage</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customer & Vehicle Details */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <UserType className="h-5 w-5 text-purple-600" />
                Customer & Vehicle Details
              </h2>
              
              {/* Customer Details */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">CUSTOMER DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *Required
                    </label>
                    <input
                      type="text"
                      value={formData.customerDetails.firstName}
                      onChange={(e) => handleNestedInputChange('customerDetails', 'firstName', e.target.value)}
                      placeholder="First name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *Required
                    </label>
                    <input
                      type="text"
                      value={formData.customerDetails.lastName}
                      onChange={(e) => handleNestedInputChange('customerDetails', 'lastName', e.target.value)}
                      placeholder="Last name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile *Required
                    </label>
                    <input
                      type="tel"
                      value={formData.customerDetails.mobile}
                      onChange={(e) => handleNestedInputChange('customerDetails', 'mobile', e.target.value)}
                      placeholder="+254 712 345 678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *Required
                    </label>
                    <input
                      type="email"
                      value={formData.customerDetails.email}
                      onChange={(e) => handleNestedInputChange('customerDetails', 'email', e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                </div>
              </div>
              
              {/* Vehicle Details */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">CAR DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Car Make
                    </label>
                    <input
                      type="text"
                      value={formData.carDetails.carMake}
                      onChange={(e) => handleNestedInputChange('carDetails', 'carMake', e.target.value)}
                      placeholder="e.g., Toyota, BMW"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Car Model
                    </label>
                    <input
                      type="text"
                      value={formData.carDetails.carModel}
                      onChange={(e) => handleNestedInputChange('carDetails', 'carModel', e.target.value)}
                      placeholder="e.g., Land Cruiser, X5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mileage
                    </label>
                    <input
                      type="text"
                      value={formData.carDetails.mileage}
                      onChange={(e) => handleNestedInputChange('carDetails', 'mileage', e.target.value)}
                      placeholder="e.g., 45,000 km"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year of Manufacture
                    </label>
                    <input
                      type="text"
                      value={formData.carDetails.yearOfManufacture}
                      onChange={(e) => handleNestedInputChange('carDetails', 'yearOfManufacture', e.target.value)}
                      placeholder="e.g., 2020"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Plate
                    </label>
                    <input
                      type="text"
                      value={formData.carDetails.licensePlate}
                      onChange={(e) => handleNestedInputChange('carDetails', 'licensePlate', e.target.value)}
                      placeholder="e.g., KAA 123A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>

              {/* Agent Details */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">AGENT DETAILS</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={formData.agentDetails.firstName}
                      onChange={(e) => handleNestedInputChange('agentDetails', 'firstName', e.target.value)}
                      placeholder="Agent first name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={formData.agentDetails.lastName}
                      onChange={(e) => handleNestedInputChange('agentDetails', 'lastName', e.target.value)}
                      placeholder="Agent last name"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Number
                    </label>
                    <input
                      type="text"
                      value={formData.agentDetails.idNumber}
                      onChange={(e) => handleNestedInputChange('agentDetails', 'idNumber', e.target.value)}
                      placeholder="National ID/Passport"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Final Checks & Tire Details */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                Final Inspection & Tire Details
              </h2>
              
              {/* FINAL CHECKS */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">FINAL CHECKS</h3>
                
                <div className="space-y-6">
                  {/* TPMS Sensors */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TPMS Sensors Fitted *Required
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tpmsSensors"
                          checked={formData.finalChecks.tpmsSensorsFitted === true}
                          onChange={() => handleNestedInputChange('finalChecks', 'tpmsSensorsFitted', true)}
                          className="text-purple-600"
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tpmsSensors"
                          checked={formData.finalChecks.tpmsSensorsFitted === false}
                          onChange={() => handleNestedInputChange('finalChecks', 'tpmsSensorsFitted', false)}
                          className="text-purple-600"
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Lock Nuts */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lock Nuts Fitted *Required
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="lockNuts"
                          checked={formData.finalChecks.lockNuts === true}
                          onChange={() => handleNestedInputChange('finalChecks', 'lockNuts', true)}
                          className="text-purple-600"
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="lockNuts"
                          checked={formData.finalChecks.lockNuts === false}
                          onChange={() => handleNestedInputChange('finalChecks', 'lockNuts', false)}
                          className="text-purple-600"
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                    
                    {formData.finalChecks.lockNuts && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Lock Nuts
                        </label>
                        <input
                          type="number"
                          value={formData.finalChecks.numberOfLockNuts}
                          onChange={(e) => handleNestedInputChange('finalChecks', 'numberOfLockNuts', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          min="0"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Nozzle Caps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nozzle Caps Fitted *Required
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="nozzleCaps"
                          checked={formData.finalChecks.nozzleCaps === true}
                          onChange={() => handleNestedInputChange('finalChecks', 'nozzleCaps', true)}
                          className="text-purple-600"
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="nozzleCaps"
                          checked={formData.finalChecks.nozzleCaps === false}
                          onChange={() => handleNestedInputChange('finalChecks', 'nozzleCaps', false)}
                          className="text-purple-600"
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                    
                    {formData.finalChecks.nozzleCaps && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nozzle Caps Type
                        </label>
                        <input
                          type="text"
                          value={formData.finalChecks.nozzleCapsType}
                          onChange={(e) => handleNestedInputChange('finalChecks', 'nozzleCapsType', e.target.value)}
                          placeholder="e.g., Metal, Plastic, Rubber"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Center Caps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Center Caps
                    </label>
                    <input
                      type="text"
                      value={formData.finalChecks.centerCaps}
                      onChange={(e) => handleNestedInputChange('finalChecks', 'centerCaps', e.target.value)}
                      placeholder="e.g., BMW logo, Mercedes star, Missing"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  {/* Tires */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tires Fitted *Required
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tires"
                          checked={formData.finalChecks.tires === true}
                          onChange={() => handleNestedInputChange('finalChecks', 'tires', true)}
                          className="text-purple-600"
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="tires"
                          checked={formData.finalChecks.tires === false}
                          onChange={() => handleNestedInputChange('finalChecks', 'tires', false)}
                          className="text-purple-600"
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Tire Condition */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tire Condition *Required
                    </label>
                    <select
                      value={formData.finalChecks.tireCondition}
                      onChange={(e) => handleNestedInputChange('finalChecks', 'tireCondition', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    >
                      <option value="">Select Condition</option>
                      {tireConditionOptions.map((condition) => (
                        <option key={condition} value={condition}>{condition}</option>
                      ))}
                    </select>
                    {!formData.finalChecks.tireCondition && (
                      <p className="mt-1 text-sm text-red-600">Tire condition is required</p>
                    )}
                  </div>
                  
                  {/* Wheel Balanced */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wheel Balanced *Required
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="wheelBalanced"
                          value="yes"
                          checked={formData.finalChecks.wheelBalanced === true}
                          onChange={() => handleNestedInputChange('finalChecks', 'wheelBalanced', true)}
                          className="text-purple-600"
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="wheelBalanced"
                          value="no"
                          checked={formData.finalChecks.wheelBalanced === false}
                          onChange={() => handleNestedInputChange('finalChecks', 'wheelBalanced', false)}
                          className="text-purple-600"
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Checked For Puncture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Checked For Puncture *Required
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="checkedForPuncture"
                          value="yes"
                          checked={formData.finalChecks.checkedForPuncture === true}
                          onChange={() => handleNestedInputChange('finalChecks', 'checkedForPuncture', true)}
                          className="text-purple-600"
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="checkedForPuncture"
                          value="no"
                          checked={formData.finalChecks.checkedForPuncture === false}
                          onChange={() => handleNestedInputChange('finalChecks', 'checkedForPuncture', false)}
                          className="text-purple-600"
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>

                  {/* Service Quality Checks */}
                  {formData.services.actualService.includes('Rim Straightening') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rim Straightness Quality
                      </label>
                      <select
                        value={formData.finalChecks.rimStraightness}
                        onChange={(e) => handleNestedInputChange('finalChecks', 'rimStraightness', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Quality</option>
                        {qualityOptions.map((quality) => (
                          <option key={quality} value={quality}>{quality}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.services.actualService.includes('Welding') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Welding Quality
                      </label>
                      <select
                        value={formData.finalChecks.weldingQuality}
                        onChange={(e) => handleNestedInputChange('finalChecks', 'weldingQuality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Quality</option>
                        {qualityOptions.map((quality) => (
                          <option key={quality} value={quality}>{quality}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.services.actualService.includes('Diamond Cutting') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diamond Cutting Quality
                      </label>
                      <select
                        value={formData.finalChecks.diamondCuttingQuality}
                        onChange={(e) => handleNestedInputChange('finalChecks', 'diamondCuttingQuality', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select Quality</option>
                        {qualityOptions.map((quality) => (
                          <option key={quality} value={quality}>{quality}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              
              {/* TIRE SPECIFICATIONS */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">TIRE SPECIFICATIONS</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tire Brand
                    </label>
                    <input
                      type="text"
                      value={formData.tireSpecifications.brand}
                      onChange={(e) => handleNestedInputChange('tireSpecifications', 'brand', e.target.value)}
                      placeholder="e.g., Michelin, Bridgestone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Inflation PSI
                    </label>
                    <select
                      value={formData.tireSpecifications.inflationPSI}
                      onChange={(e) => handleNestedInputChange('tireSpecifications', 'inflationPSI', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select PSI Range</option>
                      {psiOptions.map((psi) => (
                        <option key={psi} value={psi}>{psi}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tire DOT
                    </label>
                    <input
                      type="text"
                      value={formData.tireSpecifications.dot}
                      onChange={(e) => handleNestedInputChange('tireSpecifications', 'dot', e.target.value)}
                      placeholder="e.g., DOT XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tread Depth (mm)
                    </label>
                    <input
                      type="text"
                      value={formData.tireSpecifications.treadDepth}
                      onChange={(e) => handleNestedInputChange('tireSpecifications', 'treadDepth', e.target.value)}
                      placeholder="e.g., 6.5"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Manufacturing Date
                    </label>
                    <input
                      type="text"
                      value={formData.tireSpecifications.manufacturingDate}
                      onChange={(e) => handleNestedInputChange('tireSpecifications', 'manufacturingDate', e.target.value)}
                      placeholder="e.g., Week 24, 2023"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Delivery Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">DELIVERY INFORMATION</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Delivery Mode
                    </label>
                    <div className="grid grid-cols-1 gap-4">
                      {deliveryModeOptions.map((mode) => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => handleNestedInputChange('deliveryInformation', 'mode', mode.label)}
                          className={`p-3 border-2 rounded-lg text-left transition-all flex items-center gap-2 ${
                            formData.deliveryInformation.mode === mode.label
                              ? 'border-purple-500 bg-purple-50 text-purple-700'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {mode.icon}
                          <div className="font-medium">{mode.label}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collection Date
                      </label>
                      <input
                        type="date"
                        value={formData.deliveryInformation.collectionDate}
                        onChange={(e) => handleNestedInputChange('deliveryInformation', 'collectionDate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Collection Time
                      </label>
                      <input
                        type="time"
                        value={formData.deliveryInformation.collectionTime}
                        onChange={(e) => handleNestedInputChange('deliveryInformation', 'collectionTime', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Collected By
                  </label>
                  <input
                    type="text"
                    value={formData.deliveryInformation.collectedBy}
                    onChange={(e) => handleNestedInputChange('deliveryInformation', 'collectedBy', e.target.value)}
                    placeholder="Name of person collecting"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="mt-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information / Notes
                </label>
                <textarea
                  value={formData.additionalInformation}
                  onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                  placeholder="Any additional notes, observations, or special instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={4}
                />
              </div>
            </div>

            {/* Quality Assurance */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                Quality Assurance & Compliance
              </h2>
              
              <div className="space-y-8">
                {/* MUST KNOW Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">MUST KNOW</h3>
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <ul className="space-y-2 text-sm text-gray-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>All services have been completed as per Diamond Rimz quality standards.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Tyres, caps, locknuts, sensors, and other items have been inspected and confirmed.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Vehicle/rims have been cleaned and prepared for customer collection.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>All safety checks have been completed and verified.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Workmanship warranty applies as per service agreement.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>Customer has been notified of completion and collection details.</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="flex items-start gap-3 mt-4">
                    <input
                      type="checkbox"
                      id="mustKnowAccepted"
                      checked={formData.mustKnowAccepted}
                      onChange={(e) => handleInputChange('mustKnowAccepted', e.target.checked)}
                      className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      required
                    />
                    <label htmlFor="mustKnowAccepted" className="text-sm text-gray-700">
                      I acknowledge and understand all the above points *
                    </label>
                  </div>
                  {!formData.mustKnowAccepted && (
                    <p className="mt-2 text-sm text-red-600">Please acknowledge the MUST KNOW section</p>
                  )}
                </div>
                
                {/* Lead Technician Confirmation */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Award className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Lead Technician Confirmation</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Confirm that all services have been completed to Diamond Rimz quality standards
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="leadTechnicianConfirmation"
                      checked={formData.qualityAssurance.leadTechnicianConfirmation}
                      onChange={(e) => handleNestedInputChange('qualityAssurance', 'leadTechnicianConfirmation', e.target.checked)}
                      className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      required
                    />
                    <label htmlFor="leadTechnicianConfirmation" className="text-sm text-gray-700">
                      I confirm that all services have been completed as per Diamond Rimz quality standards and specifications *
                    </label>
                  </div>
                  {!formData.qualityAssurance.leadTechnicianConfirmation && (
                    <p className="mt-2 text-sm text-red-600">Lead technician confirmation is required</p>
                  )}
                </div>
                
                {/* Operations Counter Check */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Operations Counter Check</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Final verification by operations team before customer handover
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="operationsCounterCheck"
                      checked={formData.qualityAssurance.operationsCounterCheck}
                      onChange={(e) => handleNestedInputChange('qualityAssurance', 'operationsCounterCheck', e.target.checked)}
                      className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      required
                    />
                    <label htmlFor="operationsCounterCheck" className="text-sm text-gray-700">
                      I confirm that all operations checks have been completed and the vehicle is ready for customer collection *
                    </label>
                  </div>
                  {!formData.qualityAssurance.operationsCounterCheck && (
                    <p className="mt-2 text-sm text-red-600">Operations counter check is required</p>
                  )}
                </div>

                {/* Final Inspection */}
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Eye className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Final Inspection</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Final quality inspection and approval
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="finalInspectionPassed"
                      checked={formData.qualityAssurance.finalInspectionPassed}
                      onChange={(e) => handleNestedInputChange('qualityAssurance', 'finalInspectionPassed', e.target.checked)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="finalInspectionPassed" className="text-sm text-gray-700">
                      Final inspection passed - All quality checks completed successfully
                    </label>
                  </div>
                </div>

                {/* Customer Ready for Collection */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <CheckCircle className="h-6 w-6 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Customer Collection Status</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Confirm readiness for customer collection
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="customerReadyForCollection"
                      checked={formData.qualityAssurance.customerReadyForCollection}
                      onChange={(e) => handleNestedInputChange('qualityAssurance', 'customerReadyForCollection', e.target.checked)}
                      className="h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                    />
                    <label htmlFor="customerReadyForCollection" className="text-sm text-gray-700">
                      Vehicle/rims are cleaned, packed, and ready for customer collection
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Signatures, Terms & Documentation */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-600" />
                Signatures, Terms & Documentation
              </h2>
              
              {/* Terms and Conditions */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">TERMS AND CONDITIONS</h3>
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(true)}
                    className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                  >
                    View Complete Terms
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="space-y-4">
                    {/* Terms Preview Card */}
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="w-full p-4 border border-purple-200 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg">
                            <FileText className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">Diamond Rimz Service Completion Agreement</div>
                            <div className="text-sm text-gray-600">Complete terms and conditions document</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 group-hover:text-purple-600 transition-colors">
                            Click to view
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                        </div>
                      </div>
                    </button>
                    
                    {/* Quick Summary */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Key Points Summary:</h5>
                      <ul className="text-sm text-gray-600 space-y-2">
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Workmanship warranty period varies by service type (6-12 months)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>No liability for personal items left with vehicle/rims</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Storage fees: KES 500/day per part after 5 days</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Full payment required before collection</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Customer accepts inherent risks of rim services</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>Collection signifies acceptance of completed work</span>
                        </li>
                      </ul>
                    </div>
                    
                    {/* Download Section */}
                    {/* <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="p-2 bg-white rounded-lg">
                        <Download className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">Need a copy for your records?</p>
                        <p className="text-xs text-blue-700">Download the complete PDF document</p>
                      </div>
                      <a
                        href="/api/documents/terms?filename=Diamond-Rimz-Terms-Conditions.pdf"
                        download="Diamond-Rimz-Terms-Conditions.pdf"
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    </div> */}
                  </div>
                  
                  {/* Terms Acceptance */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="acceptTermsPost"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                        className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        required
                      />
                      <div className="flex-1">
                        <label htmlFor="acceptTermsPost" className="text-sm font-medium text-gray-700">
                          I HAVE READ, UNDERSTOOD, AND ACCEPT THE TERMS AND CONDITIONS OF DIAMOND RIMZ *
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          By checking this box, you acknowledge that you have reviewed the complete terms and agree to be bound by all provisions. 
                          You confirm you have had opportunity to ask questions and seek clarification.
                        </p>
                      </div>
                    </div>
                    {!formData.acceptTerms && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>You must accept the terms and conditions to proceed with service completion</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Client Signature */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Client Signature *Required
                    </label>
                    {clientSignature && (
                      <button
                        type="button"
                        onClick={() => clearSignature('client')}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {showClientSignature ? (
                    <div className="space-y-3">
                      <div className="border border-gray-300 rounded-lg bg-white p-2">
                        <SignatureCanvas
                          ref={clientSigRef}
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
                          onClick={() => saveSignature('client')}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Save Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClientSignature(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowClientSignature(true)}
                      className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      {clientSignature ? (
                        <div className="text-center p-2">
                          <img 
                            src={clientSignature} 
                            alt="Client Signature" 
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
                  {/* {!formData.clientSignature && (
                    <p className="mt-1 text-sm text-red-600">Client signature is required</p>
                  )} */}
                </div>
                
                {/* Inspector Signature */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Inspector / Technician Signature
                    </label>
                    {inspectorSignature && (
                      <button
                        type="button"
                        onClick={() => clearSignature('inspector')}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {showInspectorSignature ? (
                    <div className="space-y-3">
                      <div className="border border-gray-300 rounded-lg bg-white p-2">
                        <SignatureCanvas
                          ref={inspectorSigRef}
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
                          onClick={() => saveSignature('inspector')}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Save Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowInspectorSignature(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowInspectorSignature(true)}
                      className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      {inspectorSignature ? (
                        <div className="text-center p-2">
                          <img 
                            src={inspectorSignature} 
                            alt="Inspector Signature" 
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
              
              {/* Remarks */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Remarks / Notes
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Any final notes, observations, or feedback..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Completion Photos (Optional)
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  onClick={() => document.getElementById('post-checklist-file-input')?.click()}
                >
                  <input
                    id="post-checklist-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      
                      const newFiles = Array.from(files);
                      setSelectedFiles(prev => [...prev, ...newFiles]);
                      
                      newFiles.forEach(file => {
                        if (file.type.startsWith('image/')) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const result = e.target?.result as string;
                            setFormData(prev => ({
                              ...prev,
                              uploadedImages: [...prev.uploadedImages, result]
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      });
                      
                      showToast(`${newFiles.length} image(s) selected`, 'info');
                    }}
                    className="hidden"
                  />
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">Click to upload completion photos</p>
                  <p className="text-xs text-gray-500">Upload final images of completed work (before & after)</p>
                </div>

                {/* Uploaded Images Preview */}
                {formData.uploadedImages.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Uploaded Images ({formData.uploadedImages.length})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {formData.uploadedImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                            <img
                              src={image}
                              alt={`Completion Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
                              }));
                            }}
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

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitting}
                >
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
                    Save as Draft
                    {draftSaved && (
                      <span className="text-xs text-green-600">
                        ✓ Saved
                      </span>
                    )}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 via-teal-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-green-700 hover:via-teal-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === 'edit' ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        {mode === 'edit' ? 'Update Postchecklist' : 'Complete Postchecklist'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
      />
    </div>
  );
}