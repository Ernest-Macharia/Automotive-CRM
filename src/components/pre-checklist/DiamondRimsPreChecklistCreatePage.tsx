'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import Image from 'next/image';
import DiamondRimsPDF from './DiamondRimsPDF';
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
  Sparkles,
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
  Check,
  ArrowRight,
  Download,
  Circle,
  Square,
  RotateCw,
  ShieldOff,
  Award,
  PackageOpen,
  Hexagon,
  Layers,
  PaintBucket,
  Hammer,
  Gauge,
  ThermometerSnowflake,
  ChevronRight,
  ExternalLink,
  Search
} from 'lucide-react';
import { preChecklistService } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';
import { lifecycleService } from '@/services/lifecycleService';
import TermsModal from '@/components/pre-checklist/TermsModal';

interface DiamondRimsPreChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

export default function DiamondRimsPreChecklistCreatePage({ 
  mode = 'create', 
  checklistId 
}: DiamondRimsPreChecklistCreatePageProps) {
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
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCustomerServiceDropdown, setShowCustomerServiceDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const customerServiceDropdownRef = useRef<HTMLDivElement>(null);

  // DIAMOND RIMS FORM STATE
  const [formData, setFormData] = useState({
    checklistType: 'diamond_rims',
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    inspectorName: '',
    remarks: '',
    approved: false,
    
    // SERVICE INTAKE FORM FIELDS
    serviceIntake: {
      date: new Date().toISOString().split('T')[0],
      customerServiceRep: sessionStorage.getItem('userName') || '',
    },
    
    customerDetails: {
      name: '',
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
    },
    
    carDetails: {
      carMake: '',
      carModel: '',
      mileage: '',
      yearOfManufacture: '',
      licensePlate: '',
      vehicleType: '',
      color: '',
      engineSize: '',
      fuelType: '',
    },
    
    services: {
      actualService: [] as string[],
    },
    
    preServiceInspection: {
      condition: [] as string[],
    },
    
    powderCoating: {
      colourRAL: '',
    },
    
    deliveryMode: '',
    tpmsSensorsFitted: false,
    wheelNutsTotal: 4,
    nozzleCapsTotal: 0,
    nozzleCapsType: '',
    lockNutsTotal: 0,
    centerCaps: '',
    
    tireBrands: {
      fr: '',
      fl: '',
      br: '',
      bl: '',
      spare: '',
    },
    
    tireDOT: {
      fr: '',
      fl: '',
      br: '',
      bl: '',
      spare: '',
    },
    
    rimsTires: '',
    declaredValuable: false,
    additionalInformation: '',
    
    suitability: {
      skimming: '',
      powderCoating: '',
      straightening: '',
    },
    
    // MUST KNOW - Already accepted
    mustKnowAccepted: false,
    
    // CLIENT UPDATE - Risks explained
    clientUpdate: {
      brakeDiscSkimming: false,
      powderCoating: false,
      straightening: false,
      welding: false,
      diamondCutting: false,
    },
    
    // AGREED AMOUNT
    agreedAmount: {
      total: 0,
      breakdown: '',
    },
    
    // AGENT DETAILS
    agentDetails: {
      firstName: '',
      lastName: '',
      idNumber: '',
    },
    
    // Terms acceptance
    acceptTerms: false,
    clientSignature: '',
    inspectorSignature: '',
    
    // Uploads
    uploadedImages: [] as string[]
  });

  const [clientSignature, setClientSignature] = useState(formData.clientSignature);
  const [inspectorSignature, setInspectorSignature] = useState(formData.inspectorSignature);
  const [showClientSignature, setShowClientSignature] = useState(false);
  const [showInspectorSignature, setShowInspectorSignature] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);
  const inspectorSigRef = useRef<SignatureCanvas>(null);

  // Service options for Diamond Rims
  const diamondRimServices = [
    { id: 'brake_disc_skimming', label: 'Brake Disc Skimming', icon: <RotateCw className="h-4 w-4" /> },
    { id: 'diamond_cutting', label: 'Diamond Cutting', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'powder_coating', label: 'Powder Coating', icon: <PaintBucket className="h-4 w-4" /> },
    { id: 'rim_inspection', label: 'Rim Inspection', icon: <Eye className="h-4 w-4" /> },
    { id: 'rim_straightening', label: 'Rim Straightening', icon: <Hammer className="h-4 w-4" /> },
    { id: 'welding', label: 'Welding', icon: <Zap className="h-4 w-4" /> },
    { id: 'wheel_balancing', label: 'Wheel Balancing', icon: <Gauge className="h-4 w-4" /> }
  ];

  // Condition options for Diamond Rims
  const conditionOptions = [
    { id: 'cracks', label: 'Cracks', severity: 'high' },
    { id: 'bends', label: 'Bends', severity: 'high' },
    { id: 'pitting_corrosion', label: 'Pitting / Corrosion', severity: 'medium' },
    { id: 'deep_scratches', label: 'Deep Scratches / Gouges', severity: 'medium' },
    { id: 'curb_rash', label: 'Curb Rash / Edge Damage', severity: 'low' },
    { id: 'previously_welded', label: 'Previously Welded', severity: 'high' },
    { id: 'poor_previous_paint', label: 'Poor Previous Paint / Coating', severity: 'low' },
    { id: 'discoloration', label: 'Discoloration / Fading', severity: 'low' },
    { id: 'uneven_finish', label: 'Uneven Finish', severity: 'medium' },
    { id: 'normal', label: 'Normal', severity: 'none' }
  ];

  // Delivery mode options
  const deliveryModeOptions = [
    { id: 'customer_pickup', label: 'Customer Pickup', icon: <Home className="h-5 w-5" /> },
    { id: 'courier_delivery', label: 'Courier Delivery', icon: <Truck className="h-5 w-5" /> },
    { id: 'mobile_delivery_install', label: 'Mobile Service', icon: <CarIcon className="h-5 w-5" /> }
  ];

  // RAL Colors options (common powder coating colors)
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

  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode]);

  useEffect(() => {
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);
  // Update your existing useEffect for click outside
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // ... existing code ...

    if (customerServiceDropdownRef.current && !customerServiceDropdownRef.current.contains(event.target as Node)) {
      setShowCustomerServiceDropdown(false);
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
  if (!d) return new Date().toISOString().split('T')[0];
  const dt = new Date(d);
  return isNaN(dt.getTime())
    ? new Date().toISOString().split('T')[0]
    : dt.toISOString().split('T')[0];
};

/**
 * Map API checklist (may contain populated refs, missing fields, etc.)
 * into the strict shape your formData state expects.
 */
  const mapChecklistToForm = (checklist: any) => {
    return {
      ...formData, // keep your defaults for anything missing
      ...checklist, // allow simple scalar overwrites
      checklistType: checklist?.checklistType ?? 'diamond_rims',

      // IMPORTANT: keep relation fields as strings only
      opportunityId: toId(checklist?.opportunityId),
      vehicleId: toId(checklist?.vehicleId),
      workOrderId: toId(checklist?.workOrderId),

      // preChecklistId can be null -> normalize to string
      preChecklistId: toId(checklist?.preChecklistId),

      // normalize known date fields if you have them in post-checklist;
      // if your form uses serviceIntake.date (like in your snippet), keep that too.
      date: toISODate(checklist?.date),

      inspectedBy: toId(checklist?.inspectedBy) || sessionStorage.getItem('userId') || '',
      inspectorName: checklist?.inspectorName ?? '',

      // Ensure nested structures exist with defaults
      serviceIntake: {
        date: toISODate(checklist?.serviceIntake?.date ?? checklist?.date),
        customerServiceRep:
          checklist?.serviceIntake?.customerServiceRep ?? sessionStorage.getItem('userName') ?? '',
      },

      customerDetails: {
        name: checklist?.customerDetails?.name ?? '',
        firstName: checklist?.customerDetails?.firstName ?? '',
        lastName: checklist?.customerDetails?.lastName ?? '',
        mobile: checklist?.customerDetails?.mobile ?? '',
        email: checklist?.customerDetails?.email ?? '',
      },

      carDetails: {
        carMake: checklist?.carDetails?.carMake ?? '',
        carModel: checklist?.carDetails?.carModel ?? '',
        mileage: checklist?.carDetails?.mileage ?? '',
        yearOfManufacture: checklist?.carDetails?.yearOfManufacture ?? '',
        licensePlate: checklist?.carDetails?.licensePlate ?? '',
      },

      services: {
        actualService: Array.isArray(checklist?.services?.actualService)
          ? checklist.services.actualService
          : [],
      },

      preServiceInspection: {
        condition: Array.isArray(checklist?.preServiceInspection?.condition)
          ? checklist.preServiceInspection.condition
          : [],
      },

      powderCoating: {
        colourRAL: checklist?.powderCoating?.colourRAL ?? '',
      },

      clientUpdate: {
        brakeDiscSkimming: !!checklist?.clientUpdate?.brakeDiscSkimming,
        powderCoating: !!checklist?.clientUpdate?.powderCoating,
        straightening: !!checklist?.clientUpdate?.straightening,
        welding: !!checklist?.clientUpdate?.welding,
        diamondCutting: !!checklist?.clientUpdate?.diamondCutting,
      },

      agreedAmount: {
        total: Number(checklist?.agreedAmount?.total ?? 0),
        breakdown: checklist?.agreedAmount?.breakdown ?? '',
      },

      agentDetails: {
        firstName: checklist?.agentDetails?.firstName ?? '',
        lastName: checklist?.agentDetails?.lastName ?? '',
        idNumber: checklist?.agentDetails?.idNumber ?? '',
      },

      acceptTerms: !!checklist?.acceptTerms,
      mustKnowAccepted: !!checklist?.mustKnowAccepted,

      clientSignature: checklist?.clientSignature ?? '',
      inspectorSignature: checklist?.inspectorSignature ?? '',

      uploadedImages: Array.isArray(checklist?.uploadedImages) ? checklist.uploadedImages : [],
    };
  };


  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        if (checklist?.checklistType === 'diamond_rims') {
          setFormData(mapChecklistToForm(checklist));
        }
        
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
          const opp = await opportunityService.getOpportunityById(opportunityId, false);
          setOpportunity(opp);
          
          // Try to get detailed vehicle information
          if (opp.vehicles && opp.vehicles.length > 0) {
            const primaryVehicle = opp.vehicles[0];
            
            // If vehicle has an ID, try to fetch detailed vehicle info
            if (primaryVehicle._id) {
              try {
                const detailedVehicle = await vehicleService.getVehicleById(primaryVehicle._id);
                setVehicle(detailedVehicle);
                
                setFormData(prev => ({
                  ...prev,
                  opportunityId,
                  vehicleId: primaryVehicle._id || vehicleId || ''
                }));
              } catch (vehError) {
                console.warn('Could not fetch detailed vehicle:', vehError);
                // Use the vehicle data from opportunity
                setVehicle(primaryVehicle);
                
                setFormData(prev => ({
                  ...prev,
                  opportunityId,
                  vehicleId: primaryVehicle._id || vehicleId || ''
                }));
              }
            } else {
              // Use the vehicle data from opportunity
              setVehicle(primaryVehicle);
              
              setFormData(prev => ({
                ...prev,
                opportunityId,
                vehicleId: vehicleId || ''
              }));
            }
          } else if (vehicleId) {
            // Fallback to vehicleId parameter
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

    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateFromOpportunity = () => {
    if (!opportunity || autoPopulated) return;

    try {
      console.log('Auto-populating from opportunity:', opportunity);
      
      // Extract customer information
      const customerName = opportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Get vehicle details from opportunity or loaded vehicle
      const primaryVehicle = opportunity.vehicles?.[0] || vehicle || {};
      
      // Helper function to get registration number from vehicle object
      const getRegistrationNumber = (vehicle: any) => {
        if (!vehicle) return '';
        
        // Check common field names for registration/plate number
        const fields = [
          'registrationNumber',
          'regNumber',
          'regNo',
          'licensePlate',
          'plateNumber',
          'plate',
          'numberPlate'
        ];
        
        for (const field of fields) {
          if (vehicle[field]) {
            console.log(`Found registration in field "${field}":`, vehicle[field]);
            return vehicle[field];
          }
        }
        
        return '';
      };
      
      const licensePlate = getRegistrationNumber(primaryVehicle);
      
      // Extract other vehicle details
      const carMake = primaryVehicle.make || primaryVehicle.manufacturer || '';
      const carModel = primaryVehicle.model || '';
      const yearOfManufacture = (primaryVehicle.year || primaryVehicle.yearOfManufacture)?.toString() || '';
      const mileage = primaryVehicle.mileage || primaryVehicle.odometer || '';
      const vehicleType = primaryVehicle.type || primaryVehicle.vehicleType || '';
      const color = primaryVehicle.color || primaryVehicle.colour || '';
      const engineSize = primaryVehicle.engineSize || primaryVehicle.engineCapacity || '';
      const fuelType = primaryVehicle.fuelType || primaryVehicle.fuel || '';
      
      // Get total price from opportunity
      let totalPrice = opportunity.total || 0;
      if (opportunity.lineItems && opportunity.lineItems.length > 0) {
        totalPrice = opportunity.lineItems.reduce((sum: number, item: any) => sum + (item.total || 0), 0);
      }

      setFormData(prev => ({
        ...prev,
        customerDetails: {
          ...prev.customerDetails,
          firstName: firstName || '',
          lastName: lastName || '',
          email: opportunity.customer?.email || '',
          mobile: opportunity.customer?.phone || '',
          name: customerName
        },
        carDetails: {
          ...prev.carDetails,
          licensePlate: licensePlate || '',
          carMake: carMake,
          carModel: carModel,
          yearOfManufacture: yearOfManufacture,
          mileage: mileage,
          vehicleType: vehicleType,
          color: color,
          engineSize: engineSize,
          fuelType: fuelType
        },
        agreedAmount: {
          ...prev.agreedAmount,
          total: totalPrice
        },
        additionalInformation: prev.additionalInformation || opportunity.notes || '',
        inspectorName: prev.inspectorName || sessionStorage.getItem('userName') || '',
        serviceIntake: {
          ...prev.serviceIntake,
          customerServiceRep: sessionStorage.getItem('userName') || ''
        }
      }));
      
      setAutoPopulated(true);
      showToast('Vehicle data loaded from opportunity', 'success');
      
    } catch (error) {
      console.error('Error auto-populating from opportunity:', error);
      showToast('Error loading vehicle details from opportunity', 'warning');
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
    const serviceLabel = diamondRimServices.find(s => s.id === serviceId)?.label || serviceId;
    handleMultiSelectChange('services', 'actualService', serviceLabel, checked);
  };

  const handleConditionSelect = (conditionId: string, checked: boolean) => {
    const conditionLabel = conditionOptions.find(c => c.id === conditionId)?.label || conditionId;
    handleMultiSelectChange('preServiceInspection', 'condition', conditionLabel, checked);
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

      // Validate required fields (keep existing validation)
      if (!formData.customerDetails.firstName || 
          !formData.customerDetails.lastName ||
          !formData.customerDetails.mobile ||
          !formData.customerDetails.email) {
        showToast('Please fill in all required customer details', 'error');
        setSubmitting(false);
        return;
      }
      
      if (formData.services.actualService.length === 0) {
        showToast('Please select at least one service', 'error');
        setSubmitting(false);
        return;
      }
      
      if (!formData.deliveryMode) {
        showToast('Please select delivery mode', 'error');
        setSubmitting(false);
        return;
      }
      
      if (formData.preServiceInspection.condition.length === 0) {
        showToast('Please select at least one condition', 'error');
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

      // Normalize relation IDs to strings before submit
      const normalizedSubmissionData = {
        ...formData,
        checklistType: 'diamond_rims',
        opportunityId: toId(formData.opportunityId),
        vehicleId: toId(formData.vehicleId),
        workOrderId: toId((formData as any).workOrderId) || workOrderId || '',
        approved: true, // Set to true for auto-approval
        clientSignature: formData.clientSignature || 'auto-approved', // Ensure signature exists
        inspectorSignature: formData.inspectorSignature || 'auto-approved'
      };

      // Create pre-checklist
      let result: any;
      const userId = sessionStorage.getItem('userId') || undefined;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, normalizedSubmissionData as any);
        showToast('Diamond Rims pre-checklist updated successfully', 'success');
      } else {
        result = await preChecklistService.createPreChecklist(normalizedSubmissionData as any, userId);
        showToast('Diamond Rims pre-checklist created successfully', 'success');
      }

      // Update work order with pre-checklist ID
      if (workOrderId && result._id) {
        await workOrderService.updateWorkOrder(workOrderId, {
          preChecklistId: result._id
        });
      }

      // Auto-approve pre-checklist ONLY (do NOT auto-transition).
      // Stage transition must happen when the user clicks "Move to Job Card" on WorkOrderDetail.
      try {
        const approveResult = await lifecycleIntegrationService.handlePreChecklistCompletion(
          result._id,
          userId
        );
        showToast(approveResult.message, 'success');
      } catch (approveError) {
        console.warn('Auto-approval warning:', approveError);
        // Don't block user flow; we'll still redirect back to the work order.
      }

      // Fallback redirection logic
      if (workOrderId) {
        // Redirect back to work order details
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (source === 'opportunity' && formData.opportunityId) {
        // If coming from opportunity, go to opportunity page
        router.push(`/opportunities/${formData.opportunityId}`);
      } else if (result._id) {
        // Fallback: Go to pre-checklist details
        router.push(`/pre-checklist/${result._id}`);
      } else {
        router.push('/prechecklists');
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

  const handleRefreshFromOpportunity = () => {
    if (opportunity) {
      autoPopulateFromOpportunity();
      showToast('Refreshed data from opportunity', 'info');
    }
  };

  const handleSaveAsDraft = () => {
    try {
      localStorage.setItem('diamondRimsPreChecklistDraft', JSON.stringify(formData));
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
        <DiamondRimsPDF 
          formData={formData}
          opportunity={opportunity}
          vehicle={vehicle}
          workOrder={workOrder}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Diamond_Rims_PreChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
        ['SERVICE INTAKE FORM', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['CUSTOMER SERVICE:', formData.serviceIntake.customerServiceRep, '', 'DATE:', formData.serviceIntake.date, '', ''],
        ['', '', '', '', '', '', ''],
        ['CUSTOMER DETAILS', '', '', '', '', '', ''],
        ['Name:', `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`, '', '', '', '', ''],
        ['Mobile:', formData.customerDetails.mobile, '', 'Email:', formData.customerDetails.email, '', ''],
        ['', '', '', '', '', '', ''],
        ['CAR DETAILS', '', '', '', '', '', ''],
        ['Car Make:', formData.carDetails.carMake, '', 'Car Model:', formData.carDetails.carModel, '', ''],
        ['Mileage:', formData.carDetails.mileage, '', 'Year:', formData.carDetails.yearOfManufacture, '', ''],
        ['License Plate:', formData.carDetails.licensePlate, '', 'Color:', formData.carDetails.color, '', ''],
        ['Fuel Type:', formData.carDetails.fuelType, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['SERVICES', '', '', '', '', '', ''],
        ['Actual Services:', formData.services.actualService.join(', '), '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['PRE-SERVICE INSPECTION', '', '', '', '', '', ''],
        ['Condition:', formData.preServiceInspection.condition.join(', '), '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['POWDER COATING COLOURS', '', '', '', '', '', ''],
        ['Powder Coating Colour (RAL):', formData.powderCoating.colourRAL, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['DELIVERY & ACCESSORIES', '', '', '', '', '', ''],
        ['Delivery Mode:', formData.deliveryMode, '', 'TPMS Sensors:', formData.tpmsSensorsFitted ? 'Yes' : 'No', '', ''],
        ['Wheel Nuts:', formData.wheelNutsTotal, '', 'Nozzle Caps:', formData.nozzleCapsTotal, '', ''],
        ['Nozzle Caps Type:', formData.nozzleCapsType, '', 'Lock Nuts:', formData.lockNutsTotal, '', ''],
        ['Center Caps:', formData.centerCaps, '', 'Rims/Tires:', formData.rimsTires, '', ''],
        ['Declared Valuable:', formData.declaredValuable ? 'Yes' : 'No', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['TIRE BRANDS', '', '', '', '', '', ''],
        ['FR:', formData.tireBrands.fr, '', 'FL:', formData.tireBrands.fl, '', ''],
        ['BR:', formData.tireBrands.br, '', 'BL:', formData.tireBrands.bl, '', ''],
        ['Spare:', formData.tireBrands.spare, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['TIRE DOT NUMBERS', '', '', '', '', '', ''],
        ['FR:', formData.tireDOT.fr, '', 'FL:', formData.tireDOT.fl, '', ''],
        ['BR:', formData.tireDOT.br, '', 'BL:', formData.tireDOT.bl, '', ''],
        ['Spare:', formData.tireDOT.spare, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['SUITABILITY', '', '', '', '', '', ''],
        ['Skimming:', formData.suitability.skimming, '', 'Powder Coating:', formData.suitability.powderCoating, '', ''],
        ['Straightening:', formData.suitability.straightening, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['ADDITIONAL INFORMATION', '', '', '', '', '', ''],
        [formData.additionalInformation, '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['AGREED AMOUNT', '', '', '', '', '', ''],
        ['Total Amount:', `KES ${formData.agreedAmount.total.toLocaleString()}`, '', '', '', '', ''],
        ['Breakdown:', formData.agreedAmount.breakdown, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['AGENT DETAILS', '', '', '', '', '', ''],
        ['Name:', `${formData.agentDetails.firstName} ${formData.agentDetails.lastName}`, '', 'ID:', formData.agentDetails.idNumber, '', ''],
        ['', '', '', '', '', '', ''],
        ['TERMS ACCEPTANCE', '', '', '', '', '', ''],
        ['Must Know Accepted:', formData.mustKnowAccepted ? 'YES' : 'NO', '', 'Terms Accepted:', formData.acceptTerms ? 'YES' : 'NO', '', ''],
        ['Client Signature:', formData.clientSignature ? 'SIGNED' : 'NOT SIGNED', '', 'Inspector Signature:', formData.inspectorSignature ? 'SIGNED' : 'NOT SIGNED', '', ''],
        ['Remarks:', formData.remarks, '', '', '', '', '']
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
      
      XLSX.utils.book_append_sheet(wb, ws, 'Diamond Rimz Pre-Checklist');
      
      const filename = `Diamond_Rimz_PreChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      showToast('Excel file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      showToast('Failed to generate Excel file', 'error');
    }
  };

  // Helper function to extract vehicle info
  const getVehicleInfo = () => {
    if (!vehicle) return null;
    
    return {
      make: vehicle.make || vehicle.manufacturer || '',
      model: vehicle.model || '',
      year: vehicle.year || vehicle.yearOfManufacture || '',
      licensePlate: vehicle.registrationNumber || vehicle.regNumber || vehicle.licensePlate || '',
      color: vehicle.color || vehicle.colour || '',
      mileage: vehicle.mileage || vehicle.odometer || '',
      vin: vehicle.vin || vehicle.chassisNumber || '',
      engineSize: vehicle.engineSize || vehicle.engineCapacity || '',
      fuelType: vehicle.fuelType || vehicle.fuel || ''
    };
  };

  // Update the isCustomerServicePerson function to check for the specific role name
  const isCustomerServicePerson = (user: User): boolean => {
    if (!user.role) return false;
    
    if (typeof user.role === 'string') {
      const lowerRole = user.role.toLowerCase();
      // Check for exact role name or variations
      return lowerRole.includes('customer') && lowerRole.includes('service');
    } else if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name?.toLowerCase() || user.role.display_name?.toLowerCase() || '';
      return  roleName.includes('customer') && roleName.includes('service');
    }
    return false;
  };

  const isSalesPerson = (user: User): boolean => {
    if (typeof user.role === 'string') {
      const lowerRole = user.role.toLowerCase();
      return lowerRole.includes('sales') || lowerRole.includes('representative');
    } else if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name?.toLowerCase() || user.role.display_name?.toLowerCase() || '';
      return roleName.includes('sales') || roleName.includes('representative');
    }
    return false;
  };

  // Add function to get user display info
  const getUserDisplayInfo = (user: User) => {
    const roleInfo = getUserRoleName(user);
    return {
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      roleName: roleInfo,
      isCustomerService: isCustomerServicePerson(user),
      email: user.email || '',
    };
  };

  // Add function to get role name
  const getUserRoleName = (user: User): string => {
    if (typeof user.role === 'string') {
      return user.role;
    } else if (user.role && typeof user.role === 'object') {
      return user.role.name || 'User';
    }
    return 'User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Diamond Rims pre-checklist form...</p>
          {opportunityId && (
            <p className="text-sm text-gray-500 mt-2">Loading opportunity and vehicle data...</p>
          )}
        </div>
      </div>
    );
  }

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
                <Sparkles className="h-6 w-6" />
                {mode === 'edit' ? 'Edit Diamond Rims Pre-Checklist' : 'Diamond Rims Service Intake Form'}
              </h1>
              <p className="text-purple-100">
                {mode === 'edit' 
                  ? `Editing: Diamond Rims Pre-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Complete Service Intake and Inspection Form'
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

      {/* Main Content */}
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
                      {getVehicleInfo()?.make} {getVehicleInfo()?.model} • {getVehicleInfo()?.licensePlate}
                    </span>
                    {getVehicleInfo()?.year && (
                      <span className="text-gray-600">Year: {getVehicleInfo()?.year}</span>
                    )}
                    {getVehicleInfo()?.color && (
                      <span className="text-gray-600">Color: {getVehicleInfo()?.color}</span>
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
                <button
                  type="button"
                  onClick={handleRefreshFromOpportunity}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form Content - All sections in one form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
            {/* Service Intake Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Service Intake Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Replace this section in your form - Service Intake Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Service Representative *
                  </label>
                  <div className="relative" ref={customerServiceDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.serviceIntake.customerServiceRep}
                        onChange={(e) => handleNestedInputChange('serviceIntake', 'customerServiceRep', e.target.value)}
                        onFocus={() => setShowCustomerServiceDropdown(true)}
                        placeholder="Select or type customer service representative..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pl-10 pr-8"
                        required
                      />
                      <UserType className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => setShowCustomerServiceDropdown(!showCustomerServiceDropdown)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCustomerServiceDropdown ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {showCustomerServiceDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        <div className="sticky top-0 bg-white p-2 border-b">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="Search customer service representatives..."
                              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {loadingUsers ? (
                            <div className="p-4 text-center text-gray-500">
                              <div className="flex items-center justify-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                                Loading customer service team...
                              </div>
                            </div>
                          ) : users.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm">No customer service representatives found</p>
                              <p className="text-xs mt-1">Add customer service team members in user management</p>
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
                                    key={user.id}
                                    type="button"
                                    onClick={() => {
                                      handleNestedInputChange('serviceIntake', 'customerServiceRep', displayInfo.name);
                                      setShowCustomerServiceDropdown(false);
                                      setUserSearch('');
                                    }}
                                    className="w-full px-3 py-3 text-left hover:bg-purple-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                  >
                                    <div className="flex-shrink-0">
                                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
                                        <span className="text-sm font-medium text-purple-700">
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
                                          displayInfo.roleName.toLowerCase().includes('customer service') ? 
                                          'bg-purple-100 text-purple-800' : 
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
                                handleNestedInputChange('serviceIntake', 'customerServiceRep', currentUserName);
                                setShowCustomerServiceDropdown(false);
                                setUserSearch('');
                              }}
                              className="w-full px-3 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-t border-gray-200"
                            >
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                                  <UserType className="h-4 w-4 text-blue-600" />
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
                  </div>
                  
                  {formData.serviceIntake.customerServiceRep && (
                    <div className="mt-2 p-2 rounded-lg bg-purple-50 border border-purple-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-gray-700">
                            Selected: {formData.serviceIntake.customerServiceRep}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleNestedInputChange('serviceIntake', 'customerServiceRep', '')}
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
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.serviceIntake.date}
                    onChange={(e) => handleNestedInputChange('serviceIntake', 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Service Selection */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Actual Service *Required
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {diamondRimServices.map((service) => (
                    <div key={service.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                      <input
                        type="checkbox"
                        id={`service-${service.id}`}
                        checked={formData.services.actualService.includes(service.label)}
                        onChange={(e) => handleServiceSelect(service.id, e.target.checked)}
                        className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                      <label
                        htmlFor={`service-${service.id}`}
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
              
              {/* Delivery Mode */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Delivery Mode *Required
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {deliveryModeOptions.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => handleInputChange('deliveryMode', mode.label)}
                      className={`p-4 border-2 rounded-lg text-center transition-all flex flex-col items-center gap-2 ${
                        formData.deliveryMode === mode.label
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {mode.icon}
                      <div className="font-medium">{mode.label}</div>
                    </button>
                  ))}
                </div>
                {!formData.deliveryMode && (
                  <p className="mt-2 text-sm text-red-600">Please select a delivery mode</p>
                )}
              </div>
              
              {/* Powder Coating Colour */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Powder Coating Colour (RAL)
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
              
              {/* TPMS Sensors */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  TPMS Sensors Fitted
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tpmsSensors"
                      checked={formData.tpmsSensorsFitted === true}
                      onChange={() => handleInputChange('tpmsSensorsFitted', true)}
                      className="text-purple-600"
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="tpmsSensors"
                      checked={formData.tpmsSensorsFitted === false}
                      onChange={() => handleInputChange('tpmsSensorsFitted', false)}
                      className="text-purple-600"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-8 border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserType className="h-5 w-5 text-purple-600" />
                  Customer Details
                </h2>
                {opportunity && (
                  <button
                    type="button"
                    onClick={handleRefreshFromOpportunity}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    Refresh from Opportunity
                  </button>
                )}
              </div>
              
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
            <div className="mb-8 border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Car className="h-5 w-5 text-purple-600" />
                Vehicle Details
              </h2>
              
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

              {/* Vehicle Information Preview */}
              {vehicle && (
                <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                    <Info className="h-4 w-4" />
                    Vehicle Information from Opportunity
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                    {getVehicleInfo()?.make && (
                      <div>
                        <span className="text-gray-600">Make:</span>
                        <span className="ml-2 font-medium">{getVehicleInfo()?.make}</span>
                      </div>
                    )}
                    {getVehicleInfo()?.model && (
                      <div>
                        <span className="text-gray-600">Model:</span>
                        <span className="ml-2 font-medium">{getVehicleInfo()?.model}</span>
                      </div>
                    )}
                    {getVehicleInfo()?.year && (
                      <div>
                        <span className="text-gray-600">Year:</span>
                        <span className="ml-2 font-medium">{getVehicleInfo()?.year}</span>
                      </div>
                    )}
                    {getVehicleInfo()?.licensePlate && (
                      <div>
                        <span className="text-gray-600">License Plate:</span>
                        <span className="ml-2 font-medium">{getVehicleInfo()?.licensePlate}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Pre-Service Inspection */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                Pre-Service Inspection
              </h2>
              
              {/* Condition Assessment */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Condition *Required
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {conditionOptions.map((condition) => {
                    const severityColor = {
                      high: 'bg-red-100 border-red-300 text-red-800',
                      medium: 'bg-yellow-100 border-yellow-300 text-yellow-800',
                      low: 'bg-blue-100 border-blue-300 text-blue-800',
                      none: 'bg-gray-100 border-gray-300 text-gray-800'
                    }[condition.severity];
                    
                    return (
                      <div key={condition.id} className={`flex items-center p-3 border rounded-lg ${severityColor} transition-colors`}>
                        <input
                          type="checkbox"
                          id={`condition-${condition.id}`}
                          checked={formData.preServiceInspection.condition.includes(condition.label)}
                          onChange={(e) => handleConditionSelect(condition.id, e.target.checked)}
                          className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`condition-${condition.id}`}
                          className="ml-3 text-gray-700 cursor-pointer flex-1"
                        >
                          {condition.label}
                        </label>
                      </div>
                    );
                  })}
                </div>
                {formData.preServiceInspection.condition.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">Please select at least one condition</p>
                )}
              </div>
              
              {/* Rim/Tire Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Rim & Tire Details</h3>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rims/Tires *Required
                  </label>
                  <input
                    type="text"
                    value={formData.rimsTires}
                    onChange={(e) => handleInputChange('rimsTires', e.target.value)}
                    placeholder="e.g., 4 rims with tires, 2 rims only"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Wheel Nuts *Required
                    </label>
                    <input
                      type="number"
                      value={formData.wheelNutsTotal}
                      onChange={(e) => handleInputChange('wheelNutsTotal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Nozzle Caps *Required
                    </label>
                    <input
                      type="number"
                      value={formData.nozzleCapsTotal}
                      onChange={(e) => handleInputChange('nozzleCapsTotal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nozzle Caps Type *Required
                    </label>
                    <input
                      type="text"
                      value={formData.nozzleCapsType}
                      onChange={(e) => handleInputChange('nozzleCapsType', e.target.value)}
                      placeholder="e.g., Metal, Plastic, Rubber"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Lock Nuts *Required
                    </label>
                    <input
                      type="number"
                      value={formData.lockNutsTotal}
                      onChange={(e) => handleInputChange('lockNutsTotal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                      min="0"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Center Caps
                  </label>
                  <input
                    type="text"
                    value={formData.centerCaps}
                    onChange={(e) => handleInputChange('centerCaps', e.target.value)}
                    placeholder="e.g., BMW logo, Mercedes star, Missing"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
              
              {/* Tire Brands */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tire Brands</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      FR (Front Right)
                    </label>
                    <input
                      type="text"
                      value={formData.tireBrands.fr}
                      onChange={(e) => handleNestedInputChange('tireBrands', 'fr', e.target.value)}
                      placeholder="e.g., Michelin"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      FL (Front Left)
                    </label>
                    <input
                      type="text"
                      value={formData.tireBrands.fl}
                      onChange={(e) => handleNestedInputChange('tireBrands', 'fl', e.target.value)}
                      placeholder="e.g., Bridgestone"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BR (Back Right)
                    </label>
                    <input
                      type="text"
                      value={formData.tireBrands.br}
                      onChange={(e) => handleNestedInputChange('tireBrands', 'br', e.target.value)}
                      placeholder="e.g., Goodyear"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BL (Back Left)
                    </label>
                    <input
                      type="text"
                      value={formData.tireBrands.bl}
                      onChange={(e) => handleNestedInputChange('tireBrands', 'bl', e.target.value)}
                      placeholder="e.g., Pirelli"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spare
                    </label>
                    <input
                      type="text"
                      value={formData.tireBrands.spare}
                      onChange={(e) => handleNestedInputChange('tireBrands', 'spare', e.target.value)}
                      placeholder="e.g., Dunlop"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Tire DOT */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tire DOT Numbers</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      FR DOT
                    </label>
                    <input
                      type="text"
                      value={formData.tireDOT.fr}
                      onChange={(e) => handleNestedInputChange('tireDOT', 'fr', e.target.value)}
                      placeholder="e.g., DOT XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      FL DOT
                    </label>
                    <input
                      type="text"
                      value={formData.tireDOT.fl}
                      onChange={(e) => handleNestedInputChange('tireDOT', 'fl', e.target.value)}
                      placeholder="e.g., DOT XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BR DOT
                    </label>
                    <input
                      type="text"
                      value={formData.tireDOT.br}
                      onChange={(e) => handleNestedInputChange('tireDOT', 'br', e.target.value)}
                      placeholder="e.g., DOT XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      BL DOT
                    </label>
                    <input
                      type="text"
                      value={formData.tireDOT.bl}
                      onChange={(e) => handleNestedInputChange('tireDOT', 'bl', e.target.value)}
                      placeholder="e.g., DOT XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Spare DOT
                    </label>
                    <input
                      type="text"
                      value={formData.tireDOT.spare}
                      onChange={(e) => handleNestedInputChange('tireDOT', 'spare', e.target.value)}
                      placeholder="e.g., DOT XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Suitability */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SUITABILITY</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suitable For Skimming
                    </label>
                    <select
                      value={formData.suitability.skimming}
                      onChange={(e) => handleNestedInputChange('suitability', 'skimming', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="maybe">Maybe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suitable For Powder Coating
                    </label>
                    <select
                      value={formData.suitability.powderCoating}
                      onChange={(e) => handleNestedInputChange('suitability', 'powderCoating', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="maybe">Maybe</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suitable For Straightening
                    </label>
                    <select
                      value={formData.suitability.straightening}
                      onChange={(e) => handleNestedInputChange('suitability', 'straightening', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="maybe">Maybe</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Declared Valuable */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Declared Valuable *Required
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="declaredValuable"
                      checked={formData.declaredValuable === true}
                      onChange={() => handleInputChange('declaredValuable', true)}
                      className="text-purple-600"
                      required
                    />
                    <span>Yes</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="declaredValuable"
                      checked={formData.declaredValuable === false}
                      onChange={() => handleInputChange('declaredValuable', false)}
                      className="text-purple-600"
                      required
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>
              
              {/* Additional Information */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Information
                </label>
                <textarea
                  value={formData.additionalInformation}
                  onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                  placeholder="Any additional notes or special requests..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Terms & Conditions
              </h2>
              
              {/* MUST KNOW Section */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">MUST KNOW</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Entire Process Explained to the Customers.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Tyres, caps, locknuts, sensors, and other items are accepted at the client's own risk.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Personal belongings left in or with the vehicle/rims are the client's responsibility.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Completion timelines are estimates only.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Diamond Rimz will not release any item until full payment is received.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Uncollected rims/parts after 5 days will attract a storage fee of KES 500 per day per part.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Rims not collected within 12 hours of completion notification are stored at the client's risk.</span>
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
              </div>
              
              {/* Service-specific Risks */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">CLIENT UPDATE</h3>
                <p className="text-sm text-gray-600 mb-4">
                  The client has been explained to the following inherent risks related with the services.
                </p>
                
                <div className="space-y-6">
                  {/* Brake Disc Skimming Risks */}
                  {formData.services.actualService.includes('Brake Disc Skimming') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <RotateCw className="h-4 w-4" />
                        Brake Disc Skimming Risks
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Skimming is only possible if your brake disc still has enough thickness above the manufacturer's minimum spec</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>If your disc is cracked, heat-damaged, or severely warped, skimming may worsen the condition — replacement is advised</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>We recommend fitting new brake pads with skimmed discs. Old or uneven pads can reduce braking effectiveness.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Noise or squealing may continue post-skimming if poor-quality or worn pads are used.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>We do not guarantee results if the disc has been skimmed before or has unknown machining history.</span>
                        </li>
                      </ul>
                      <div className="flex items-start gap-3 mt-3">
                        <input
                          type="checkbox"
                          id="brakeDiscRisks"
                          checked={formData.clientUpdate.brakeDiscSkimming}
                          onChange={(e) => handleNestedInputChange('clientUpdate', 'brakeDiscSkimming', e.target.checked)}
                          className="mt-1 h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="brakeDiscRisks" className="text-sm text-amber-700">
                          I understand and accept these risks
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Powder Coating Risks */}
                  {formData.services.actualService.includes('Powder Coating') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <PaintBucket className="h-4 w-4" />
                        Powder Coating Risks
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Exclusion of hidden flaws (scratches, gouges, casting pits)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>No warranty for high-heat areas (engine, brake)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Colour match disclaimer (shade, lighting, material)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>No guarantee of OEM matching</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Hidden flaws may appear after stripping/blasting</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Redo policy (only for technical failure, not color dissatisfaction)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Customer aesthetic dissatisfaction not a valid claim</span>
                        </li>
                      </ul>
                      <div className="flex items-start gap-3 mt-3">
                        <input
                          type="checkbox"
                          id="powderCoatingRisks"
                          checked={formData.clientUpdate.powderCoating}
                          onChange={(e) => handleNestedInputChange('clientUpdate', 'powderCoating', e.target.checked)}
                          className="mt-1 h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="powderCoatingRisks" className="text-sm text-amber-700">
                          I understand and accept these risks
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Straightening Risks */}
                  {formData.services.actualService.includes('Rim Straightening') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <Hammer className="h-4 w-4" />
                        Straightening Risks
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Cracked rims should not be straightened.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Welded rims are at high risk of failure during straightening.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Severely bent rims may not return to true shape.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Rims that have been straightened multiple times may fatigue.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Out-of-round rims may remain slightly distorted even after straightening.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>There is no warranty on straightening services.</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Rims may crack during straightening</span>
                        </li>
                      </ul>
                      <div className="flex items-start gap-3 mt-3">
                        <input
                          type="checkbox"
                          id="straighteningRisks"
                          checked={formData.clientUpdate.straightening}
                          onChange={(e) => handleNestedInputChange('clientUpdate', 'straightening', e.target.checked)}
                          className="mt-1 h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="straighteningRisks" className="text-sm text-amber-700">
                          I understand and accept these risks
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Diamond Cutting Risks */}
                  {formData.services.actualService.includes('Diamond Cutting') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Diamond Cutting Risks
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Diamond cutting removes material from the rim surface</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Cannot be done on all rim types (check manufacturer specifications)</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>May weaken structural integrity if done multiple times</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Not recommended for heavily damaged or repaired rims</span>
                        </li>
                      </ul>
                      <div className="flex items-start gap-3 mt-3">
                        <input
                          type="checkbox"
                          id="diamondCuttingRisks"
                          checked={formData.clientUpdate.diamondCutting}
                          onChange={(e) => handleNestedInputChange('clientUpdate', 'diamondCutting', e.target.checked)}
                          className="mt-1 h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="diamondCuttingRisks" className="text-sm text-amber-700">
                          I understand and accept these risks
                        </label>
                      </div>
                    </div>
                  )}
                  
                  {/* Welding Risks */}
                  {formData.services.actualService.includes('Welding') && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium text-amber-800 mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Welding Risks
                      </h4>
                      <ul className="text-sm text-amber-700 space-y-2">
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Welding may cause heat distortion in surrounding areas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Color match issues on painted rims after welding</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Stress points may develop near weld areas</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>Not all rim materials are suitable for welding</span>
                        </li>
                      </ul>
                      <div className="flex items-start gap-3 mt-3">
                        <input
                          type="checkbox"
                          id="weldingRisks"
                          checked={formData.clientUpdate.welding}
                          onChange={(e) => handleNestedInputChange('clientUpdate', 'welding', e.target.checked)}
                          className="mt-1 h-5 w-5 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <label htmlFor="weldingRisks" className="text-sm text-amber-700">
                          I understand and accept these risks
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* TERMS AND CONDITIONS SECTION */}
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
                            <div className="font-medium text-gray-900">Diamond Rimz Service Agreement</div>
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
                      </ul>
                    </div>
                    
                    {/* Download Section */}
                    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
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
                        onClick={(e) => e.stopPropagation()} // Prevent modal opening
                      >
                        <Download className="h-4 w-4" />
                        Download PDF
                      </a>
                    </div>
                  </div>
                  
                  {/* Terms Acceptance */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="acceptTermsDiamond"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                        className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        required
                      />
                      <div className="flex-1">
                        <label htmlFor="acceptTermsDiamond" className="text-sm font-medium text-gray-700">
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
                          <span>You must accept the terms and conditions to proceed with service</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* AGREED AMOUNT */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">AGREED AMOUNT</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Amount (KES)
                    </label>
                    <input
                      type="number"
                      value={formData.agreedAmount.total}
                      onChange={(e) => handleNestedInputChange('agreedAmount', 'total', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Breakdown (If Any)
                    </label>
                    <textarea
                      value={formData.agreedAmount.breakdown}
                      onChange={(e) => handleNestedInputChange('agreedAmount', 'breakdown', e.target.value)}
                      placeholder="Itemized breakdown..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
              
              {/* AGENT DETAILS */}
              <div className="mb-8">
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

            {/* Signatures & Uploads */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-600" />
                Signatures & Uploads
              </h2>
              
              {/* Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Client Signature */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Client Signature *
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
                </div>
                
                {/* Inspector Signature */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Inspector Signature *
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
                  Additional Remarks
                </label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => handleInputChange('remarks', e.target.value)}
                  placeholder="Any additional notes or observations..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  rows={3}
                />
              </div>
              
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Images (Optional)
                </label>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                  onClick={() => document.getElementById('diamond-rims-file-input')?.click()}
                >
                  <input
                    id="diamond-rims-file-input"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      
                      const newFiles = Array.from(files);
                      setSelectedFiles(prev => [...prev, ...newFiles]);
                      
                      // Preview images
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
                  <p className="text-sm text-gray-600 mb-1">Click to upload images of rims</p>
                  <p className="text-xs text-gray-500">Supports JPG, PNG, WebP formats</p>
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
                              alt={`Rim Image ${index + 1}`}
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
                    className="px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === 'edit' ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {mode === 'edit' ? 'Update Pre-Checklist' : 'Create Pre-Checklist'}
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