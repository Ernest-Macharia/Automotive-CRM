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
  Search,
  Edit,
  Mail as MailIcon
} from 'lucide-react';
import { CreatePreChecklistDto, PreChecklist, preChecklistService } from '@/services/preChecklistService';
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
  const [showCustomerEdit, setShowCustomerEdit] = useState(false);
  const [showVehicleEdit, setShowVehicleEdit] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DIAMOND RIMS FORM STATE
  const [formData, setFormData] = useState({
    checklistType: 'diamond_rims',
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    inspectorName: '',
    remarks: '',
    approved: false,
    
    serviceIntake: {
      date: new Date().toISOString().split('T')[0],
      customerServiceRep: sessionStorage.getItem('userName') || '',
      inspectorNotes: '',
      backendAccessCode: '',
      priorityLevel: 'normal',
      specialInstructions: ''
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
    
    // Add edit space for pre-service section
    preServiceInspection: {
      condition: [] as string[],
      inspectorAccessNotes: '',
      inspectionNotes: '',
      photosRequired: false,
      videoRequired: false
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
    
    // Create a "Center Caps" section
    centerCaps: {
      present: false,
      quantity: 0,
      condition: 'good',
      type: '',
      notes: ''
    },
    
    // Change Rim and Tire details - dropdown option for either Rims or Tires
    rimOrTireSelection: '',
    rimsDetails: {
      quantity: 0,
      size: '',
      type: '',
      condition: ''
    },
    tiresDetails: {
      quantity: 0,
      size: '',
      type: '',
      treadDepth: ''
    },
    
    tireBrands: {
      fr: '',
      fl: '',
      br: '',
      bl: '',
      spare: '',
    },
    
    // Have the "DOT" section in full
    tireDOT: {
      fr: {
        code: '',
        week: '',
        year: '',
        plant: ''
      },
      fl: {
        code: '',
        week: '',
        year: '',
        plant: ''
      },
      br: {
        code: '',
        week: '',
        year: '',
        plant: ''
      },
      bl: {
        code: '',
        week: '',
        year: '',
        plant: ''
      },
      spare: {
        code: '',
        week: '',
        year: '',
        plant: ''
      },
    },
    
    // "Suitability" section should have its own space
    suitability: {
      skimming: '',
      powderCoating: '',
      straightening: '',
      welding: '',
      diamondCutting: '',
      notes: '',
      recommendations: ''
    },
    
    // "Declared Valuable" section should have its own space
    declaredValuable: {
      value: false,
      declaredValue: 0,
      insuranceRequired: false,
      insuranceProvider: '',
      policyNumber: '',
      notes: ''
    },
    
    additionalInformation: '',
    
    // MUST KNOW - Already accepted
    mustKnowAccepted: false,
    
    // CLIENT UPDATE - Well defined section
    clientUpdate: {
      // Associated Risks separated from Must Knows
      associatedRisks: {
        brakeDiscSkimming: false,
        powderCoating: false,
        straightening: false,
        welding: false,
        diamondCutting: false,
        general: false
      },
      // Must Knows
      mustKnows: {
        processExplained: false,
        clientRiskAcceptance: false,
        personalBelongings: false,
        timelineEstimates: false,
        fullPaymentRequired: false,
        storageFees: false,
        storageRisk: false
      }
    },
    
    // Terms acceptance - Check buttons only in main acceptance section
    acceptTerms: false,
    
    // Client and Inspector section - Separate signatures
    clientSignature: '',
    inspectorSignature: '',
    
    // Upload section for photos (6 image limit for 50mbs)
    uploadedImages: [] as string[],
    
    // Client signing options
    clientSigningMethod: '',
    clientEmail: ''
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

  // Required field indicator component
  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode]);

  useEffect(() => {
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerServiceDropdownRef.current && !customerServiceDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerServiceDropdown(false);
        setUserSearch('');
      }
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

  const mapChecklistToForm = (checklist: PreChecklist) => {
    console.log('Mapping checklist to form:', checklist);
    
    return {
      checklistType: checklist?.checklistType || 'diamond_rims',
      opportunityId: toId(checklist?.opportunityId),
      vehicleId: toId(checklist?.vehicleId),
      inspectedBy: checklist?.inspectedBy || toId(checklist?.inspectedBy) || sessionStorage.getItem('userId') || '',
      inspectorName: checklist?.inspectorName || '',
      remarks: checklist?.remarks || '',
      approved: !!checklist?.approved,

      serviceIntake: {
        date: checklist?.serviceIntake?.date,
        customerServiceRep: checklist?.serviceIntake?.customerServiceRep || sessionStorage.getItem('userName') || '',
        inspectorNotes: checklist?.serviceIntake?.inspectorNotes || '',
        backendAccessCode: checklist?.serviceIntake?.backendAccessCode || '',
        priorityLevel: checklist?.serviceIntake?.priorityLevel || 'normal',
        specialInstructions: checklist?.serviceIntake?.specialInstructions || ''
      },

      customerDetails: {
        name: checklist?.customerDetails?.name || '',
        firstName: checklist?.customerDetails?.firstName || '',
        lastName: checklist?.customerDetails?.lastName || '',
        mobile: checklist?.customerDetails?.mobile || '',
        email: checklist?.customerDetails?.email || '',
      },

      carDetails: {
        carMake: checklist?.carDetails?.carMake || '',
        carModel: checklist?.carDetails?.carModel || '',
        mileage: checklist?.carDetails?.mileage || '',
        yearOfManufacture: checklist?.carDetails?.yearOfManufacture || '',
        licensePlate: checklist?.carDetails?.licensePlate || '',
        vehicleType: checklist?.carDetails?.vehicleType || '',
        color: checklist?.carDetails?.color || '',
        engineSize: checklist?.carDetails?.engineSize || '',
        fuelType: checklist?.carDetails?.fuelType || '',
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
        inspectorAccessNotes: checklist?.preServiceInspection?.inspectorAccessNotes || '',
        inspectionNotes: checklist?.preServiceInspection?.inspectionNotes || '',
        photosRequired: !!checklist?.preServiceInspection?.photosRequired,
        videoRequired: !!checklist?.preServiceInspection?.videoRequired
      },

      powderCoating: {
        colourRAL: checklist?.powderCoating?.colourRAL || '',
      },

      deliveryMode: checklist?.deliveryMode || '',
      tpmsSensorsFitted: !!checklist?.tpmsSensorsFitted,
      wheelNutsTotal: checklist?.wheelNutsTotal || 4,
      nozzleCapsTotal: checklist?.nozzleCapsTotal || 0,
      nozzleCapsType: checklist?.nozzleCapsType || '',
      lockNutsTotal: checklist?.lockNutsTotal || 0,

      centerCaps: {
        present: !!checklist?.centerCaps?.present,
        quantity: checklist?.centerCaps?.quantity || 0,
        condition: checklist?.centerCaps?.condition || 'good',
        type: checklist?.centerCaps?.type || '',
        notes: checklist?.centerCaps?.notes || ''
      },

      rimOrTireSelection: checklist?.rimOrTireSelection || '',
      rimsDetails: {
        quantity: checklist?.rimsDetails?.quantity || 0,
        size: checklist?.rimsDetails?.size || '',
        type: checklist?.rimsDetails?.type || '',
        condition: checklist?.rimsDetails?.condition || ''
      },
      tiresDetails: {
        quantity: checklist?.tiresDetails?.quantity || 0,
        size: checklist?.tiresDetails?.size || '',
        type: checklist?.tiresDetails?.type || '',
        treadDepth: checklist?.tiresDetails?.treadDepth || ''
      },

      tireBrands: {
        fr: checklist?.tireBrands?.fr || '',
        fl: checklist?.tireBrands?.fl || '',
        br: checklist?.tireBrands?.br || '',
        bl: checklist?.tireBrands?.bl || '',
        spare: checklist?.tireBrands?.spare || '',
      },

      tireDOT: {
        fr: {
          code: checklist?.tireDOT?.fr?.code || '',
          week: checklist?.tireDOT?.fr?.week || '',
          year: checklist?.tireDOT?.fr?.year || '',
          plant: checklist?.tireDOT?.fr?.plant || ''
        },
        fl: {
          code: checklist?.tireDOT?.fl?.code || '',
          week: checklist?.tireDOT?.fl?.week || '',
          year: checklist?.tireDOT?.fl?.year || '',
          plant: checklist?.tireDOT?.fl?.plant || ''
        },
        br: {
          code: checklist?.tireDOT?.br?.code || '',
          week: checklist?.tireDOT?.br?.week || '',
          year: checklist?.tireDOT?.br?.year || '',
          plant: checklist?.tireDOT?.br?.plant || ''
        },
        bl: {
          code: checklist?.tireDOT?.bl?.code || '',
          week: checklist?.tireDOT?.bl?.week || '',
          year: checklist?.tireDOT?.bl?.year || '',
          plant: checklist?.tireDOT?.bl?.plant || ''
        },
        spare: {
          code: checklist?.tireDOT?.spare?.code || '',
          week: checklist?.tireDOT?.spare?.week || '',
          year: checklist?.tireDOT?.spare?.year || '',
          plant: checklist?.tireDOT?.spare?.plant || ''
        },
      },

      suitability: {
        skimming: checklist?.suitability?.skimming || '',
        powderCoating: checklist?.suitability?.powderCoating || '',
        straightening: checklist?.suitability?.straightening || '',
        welding: checklist?.suitability?.welding || '',
        diamondCutting: checklist?.suitability?.diamondCutting || '',
        notes: checklist?.suitability?.notes || '',
        recommendations: checklist?.suitability?.recommendations || ''
      },

      declaredValuable: {
        value: !!checklist?.declaredValuable?.value,
        declaredValue: checklist?.declaredValuable?.declaredValue || 0,
        insuranceRequired: !!checklist?.declaredValuable?.insuranceRequired,
        insuranceProvider: checklist?.declaredValuable?.insuranceProvider || '',
        policyNumber: checklist?.declaredValuable?.policyNumber || '',
        notes: checklist?.declaredValuable?.notes || ''
      },

      additionalInformation: checklist?.additionalInformation || '',
      mustKnowAccepted: !!checklist?.mustKnowAccepted,

      clientUpdate: {
        associatedRisks: {
          brakeDiscSkimming: !!checklist?.clientUpdate?.associatedRisks?.brakeDiscSkimming,
          powderCoating: !!checklist?.clientUpdate?.associatedRisks?.powderCoating,
          straightening: !!checklist?.clientUpdate?.associatedRisks?.straightening,
          welding: !!checklist?.clientUpdate?.associatedRisks?.welding,
          diamondCutting: !!checklist?.clientUpdate?.associatedRisks?.diamondCutting,
          general: !!checklist?.clientUpdate?.associatedRisks?.general
        },
        mustKnows: {
          processExplained: !!checklist?.clientUpdate?.mustKnows?.processExplained,
          clientRiskAcceptance: !!checklist?.clientUpdate?.mustKnows?.clientRiskAcceptance,
          personalBelongings: !!checklist?.clientUpdate?.mustKnows?.personalBelongings,
          timelineEstimates: !!checklist?.clientUpdate?.mustKnows?.timelineEstimates,
          fullPaymentRequired: !!checklist?.clientUpdate?.mustKnows?.fullPaymentRequired,
          storageFees: !!checklist?.clientUpdate?.mustKnows?.storageFees,
          storageRisk: !!checklist?.clientUpdate?.mustKnows?.storageRisk
        }
      },

      acceptTerms: !!checklist?.acceptTerms,
      clientSignature: checklist?.clientSignature || '',
      inspectorSignature: checklist?.inspectorSignature || '',
      uploadedImages: Array.isArray(checklist?.uploadedImages) ? checklist.uploadedImages : [],
      clientSigningMethod: checklist?.clientSigningMethod || '',
      clientEmail: checklist?.clientEmail || ''
    };
  };

  const loadRelatedData = async () => {
    try {
      setLoading(true);

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

      if (opportunityId) {
        try {
          const opp = await opportunityService.getOpportunityById(opportunityId, false);
          setOpportunity(opp);
          
          // Check if vehicles exist
          if (opp.vehicles && opp.vehicles.length > 0) {
            const primaryVehicle = opp.vehicles[0];
            
            // First, try to load detailed vehicle info
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
                setVehicle(primaryVehicle);
                
                setFormData(prev => ({
                  ...prev,
                  opportunityId,
                  vehicleId: primaryVehicle._id || vehicleId || ''
                }));
              }
            } else {
              setVehicle(primaryVehicle);
              
              setFormData(prev => ({
                ...prev,
                opportunityId,
                vehicleId: vehicleId || ''
              }));
            }
          } else {
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
                console.error('Error loading vehicle:', vehError);
              }
            }
          }
        } catch (error) {
          console.error('Error loading opportunity:', error);
          showToast('Could not load opportunity details', 'warning');
        }
      }

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
      
      // Extract customer information
      const customerName = opportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Use the detailed vehicle data if available, otherwise use opportunity vehicle
      const vehicleData = vehicle || opportunity.vehicles?.[0] || {};
      
      // Extract the fields that should be pre-filled (Make, Model, License Plate, Year)
      const carMake = vehicleData.make || vehicleData.manufacturer || vehicleData.brand || '';
      const carModel = vehicleData.model || vehicleData.modelName || '';
      
      // Get license plate from various possible field names
      const getLicensePlate = (vehicle: any) => {
        if (!vehicle) return '';
        
        const fields = [
          'registrationNumber',
          'regNumber',
          'regNo',
          'licensePlate',
          'plateNumber',
          'plate',
          'numberPlate',
          'license'
        ];
        
        for (const field of fields) {
          if (vehicle[field]) {
            return vehicle[field];
          }
        }
        
        return '';
      };
      
      const licensePlate = getLicensePlate(vehicleData);
      
      // Try different possible year fields
      let yearOfManufacture = '';
      if (vehicleData.year) {
        yearOfManufacture = vehicleData.year.toString();
      } else if (vehicleData.yearOfManufacture) {
        yearOfManufacture = vehicleData.yearOfManufacture.toString();
      } else if (vehicleData.modelYear) {
        yearOfManufacture = vehicleData.modelYear.toString();
      }

      // Get logged-in user info
      const loggedInUserName = sessionStorage.getItem('userName') || '';
      const loggedInUserId = sessionStorage.getItem('userId') || '';

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
          carMake: carMake,
          carModel: carModel,
          licensePlate: licensePlate || '',
          yearOfManufacture: yearOfManufacture,
          color: prev.carDetails.color || '',
          mileage: prev.carDetails.mileage || '',
          vehicleType: prev.carDetails.vehicleType,
          engineSize: prev.carDetails.engineSize,
          fuelType: prev.carDetails.fuelType
        },
        additionalInformation: prev.additionalInformation || opportunity.notes || '',
        inspectorName: prev.inspectorName || loggedInUserName,
        serviceIntake: {
          ...prev.serviceIntake,
          customerServiceRep: loggedInUserName || ''
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    const newFiles = Array.from(files);
    
    // Validate file count
    // if (formData.uploadedImages.length + newFiles.length > 6) {
    //   showToast('Maximum 6 images allowed', 'error');
    //   return;
    // }
    
    // Validate file sizes
    const totalSize = newFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) { // 50MB
      showToast('Total file size exceeds 50MB limit', 'error');
      return;
    }
    
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
    
    showToast(`${newFiles.length} image(s) uploaded`, 'success');
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
  };

  const loadCustomerServiceUsers = async () => {
    try {
      setLoadingUsers(true);
      // Load all users first
      const allUsers = await userService.getAllUsers();
      
      // Filter to show customer service users first, then others
      const sortedUsers = [...allUsers].sort((a, b) => {
        const aIsCS = isCustomerServicePerson(a);
        const bIsCS = isCustomerServicePerson(b);
        
        if (aIsCS && !bIsCS) return -1;
        if (!aIsCS && bIsCS) return 1;
        return 0;
      });
      
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      // Don't show error toast as this is a secondary feature
    } finally {
      setLoadingUsers(false);
    }
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

  const sendForClientApproval = async () => {
    try {
      if (!formData.clientEmail || !formData.clientEmail.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      
      // Save draft first
      await handleSaveAsDraft();
      
      // Simulate email sending
      showToast('Approval email sent successfully!', 'success');
      
    } catch (error) {
      console.error('Error sending approval email:', error);
      showToast('Error sending approval email', 'error');
    }
  };

  const saveSignature = async (type: 'client' | 'inspector') => {
    try {
      let dataUrl = '';
      
      if (type === 'client' && clientSigRef.current) {
        dataUrl = clientSigRef.current.getTrimmedCanvas().toDataURL('image/png');
        setClientSignature(dataUrl);
      } else if (type === 'inspector' && inspectorSigRef.current) {
        dataUrl = inspectorSigRef.current.getTrimmedCanvas().toDataURL('image/png');
        setInspectorSignature(dataUrl);
      }
      
      if (!dataUrl) {
        showToast('No signature detected', 'error');
        return;
      }
      
      // If we have a checklist ID (edit mode), use the API endpoint
      if (checklistId) {
        const signatureData = {
          name: type === 'client' 
            ? `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`
            : formData.inspectorName || sessionStorage.getItem('userName') || 'Inspector',
          signatureData: dataUrl,
          role: type === 'client' ? 'Vehicle Owner' : 'Inspector'
        };
        
        // Save signature to backend
        await preChecklistService.signPreChecklist(checklistId, signatureData);
        
        showToast(`${type === 'client' ? 'Client' : 'Inspector'} signature saved to server`, 'success');
      } else {
        // If no checklist ID (create mode), just update local state
        if (type === 'client') {
          handleInputChange('clientSignature', dataUrl);
        } else {
          handleInputChange('inspectorSignature', dataUrl);
        }
        showToast(`${type === 'client' ? 'Client' : 'Inspector'} signature saved`, 'success');
      }
      
      // Close signature modal
      if (type === 'client') {
        setShowClientSignature(false);
      } else {
        setShowInspectorSignature(false);
      }
      
    } catch (error: any) {
      console.error(`Error saving ${type} signature:`, error);
      showToast(error.message || `Failed to save ${type} signature`, 'error');
    }
  };

  // Update the handleSubmit function to use signatures properly
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
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

      if (!formData.inspectorSignature) {
        showToast('Please provide inspector signature', 'error');
        setSubmitting(false);
        return;
      }

      // Create submission data - ensure all required fields are included
      const submissionData: CreatePreChecklistDto = {
        checklistType: 'diamond_rims',
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        inspectedBy: sessionStorage.getItem('userId') || formData.inspectedBy,
        inspectorName: formData.inspectorName,
        remarks: formData.remarks,
        approved: false, // Set to false initially
        
        serviceIntake: {
          date: formData.serviceIntake.date,
          customerServiceRep: formData.serviceIntake.customerServiceRep,
          inspectorNotes: formData.serviceIntake.inspectorNotes,
          backendAccessCode: formData.serviceIntake.backendAccessCode,
          priorityLevel: formData.serviceIntake.priorityLevel,
          specialInstructions: formData.serviceIntake.specialInstructions
        },
        
        customerDetails: {
          firstName: formData.customerDetails.firstName,
          lastName: formData.customerDetails.lastName,
          mobile: formData.customerDetails.mobile,
          email: formData.customerDetails.email
        },
        
        carDetails: {
          carMake: formData.carDetails.carMake,
          carModel: formData.carDetails.carModel,
          mileage: formData.carDetails.mileage,
          yearOfManufacture: formData.carDetails.yearOfManufacture,
          licensePlate: formData.carDetails.licensePlate,
          color: formData.carDetails.color,
          vehicleType: formData.carDetails.vehicleType,
          engineSize: formData.carDetails.engineSize,
          fuelType: formData.carDetails.fuelType
        },
        
        services: {
          actualService: formData.services.actualService
        },
        
        preServiceInspection: {
          condition: formData.preServiceInspection.condition,
          inspectorAccessNotes: formData.preServiceInspection.inspectorAccessNotes,
          inspectionNotes: formData.preServiceInspection.inspectionNotes,
          photosRequired: formData.preServiceInspection.photosRequired,
          videoRequired: formData.preServiceInspection.videoRequired
        },
        
        powderCoating: {
          colourRAL: formData.powderCoating.colourRAL
        },
        
        deliveryMode: formData.deliveryMode,
        tpmsSensorsFitted: formData.tpmsSensorsFitted,
        wheelNutsTotal: formData.wheelNutsTotal,
        nozzleCapsTotal: formData.nozzleCapsTotal,
        nozzleCapsType: formData.nozzleCapsType,
        lockNutsTotal: formData.lockNutsTotal,
        
        centerCaps: formData.centerCaps,
        rimOrTireSelection: formData.rimOrTireSelection,
        rimsDetails: formData.rimsDetails,
        tiresDetails: formData.tiresDetails,
        tireBrands: formData.tireBrands,
        tireDOT: formData.tireDOT,
        suitability: formData.suitability,
        declaredValuable: formData.declaredValuable,
        additionalInformation: formData.additionalInformation,
        mustKnowAccepted: formData.mustKnowAccepted,
        clientUpdate: formData.clientUpdate,
        acceptTerms: formData.acceptTerms,
        clientSignature: formData.clientSignature,
        inspectorSignature: formData.inspectorSignature,
        uploadedImages: formData.uploadedImages,
        clientSigningMethod: formData.clientSigningMethod,
        clientEmail: formData.clientEmail
      };

      console.log('Submitting pre-checklist data:', submissionData);

      let result: PreChecklist;
      const userId = sessionStorage.getItem('userId') || undefined;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData as any);
        showToast('Diamond Rims pre-checklist updated successfully', 'success');
      } else {
        result = await preChecklistService.createPreChecklist(submissionData, userId);
        showToast('Diamond Rims pre-checklist created successfully', 'success');
      }

      console.log('Pre-checklist saved:', result);

      if (workOrderId && result._id) {
        await workOrderService.updateWorkOrder(workOrderId, {
          preChecklistId: result._id,
          preChecklistStatus: 'pending'
        });
        showToast('Pre-checklist created and linked to work order', 'success');
      }

      if (workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (source === 'opportunity' && formData.opportunityId) {
        router.push(`/opportunities/${formData.opportunityId}`);
      } else if (result._id) {
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

  // Add a function to download PDF using the API endpoint
  const downloadPDFViaAPI = async () => {
    try {
      if (!checklistId) {
        // If no checklist ID, generate local PDF
        await downloadPDF();
        return;
      }
      
      setUploading(true);
      showToast('Generating PDF from server...', 'info');
      
      // First generate the PDF
      await preChecklistService.generatePDF(checklistId);
      
      // Then download it
      const blob = await preChecklistService.downloadPDF(checklistId);
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Diamond_Rims_PreChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('PDF downloaded from server successfully!', 'success');
    } catch (error: any) {
      console.error('Error downloading PDF from API:', error);
      showToast('Failed to download PDF from server. Generating local copy...', 'warning');
      
      // Fallback to local PDF generation
      await downloadPDF();
    } finally {
      setUploading(false);
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
      return Promise.resolve();
    } catch (error) {
      showToast('Failed to save draft', 'error');
      return Promise.reject(error);
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
        ['Center Caps Present:', formData.centerCaps.present ? 'Yes' : 'No', '', '', '', '', ''],
        ['Declared Valuable:', formData.declaredValuable.value ? 'Yes' : 'No', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['TIRE BRANDS', '', '', '', '', '', ''],
        ['FR:', formData.tireBrands.fr, '', 'FL:', formData.tireBrands.fl, '', ''],
        ['BR:', formData.tireBrands.br, '', 'BL:', formData.tireBrands.bl, '', ''],
        ['Spare:', formData.tireBrands.spare, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['SUITABILITY', '', '', '', '', '', ''],
        ['Skimming:', formData.suitability.skimming, '', 'Powder Coating:', formData.suitability.powderCoating, '', ''],
        ['Straightening:', formData.suitability.straightening, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['ADDITIONAL INFORMATION', '', '', '', '', '', ''],
        [formData.additionalInformation, '', '', '', '', '', ''],
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

  const isCustomerServicePerson = (user: User): boolean => {
    if (!user.role) return false;
    
    if (typeof user.role === 'string') {
      const lowerRole = user.role.toLowerCase();
      return lowerRole.includes('customer') && lowerRole.includes('service');
    } else if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name?.toLowerCase() || user.role.display_name?.toLowerCase() || '';
      return roleName.includes('customer') && roleName.includes('service');
    }
    return false;
  };

  const getUserDisplayInfo = (user: User) => {
    const roleInfo = getUserRoleName(user);
    return {
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      roleName: roleInfo,
      isCustomerService: isCustomerServicePerson(user),
      email: user.email || '',
    };
  };

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
              onClick={downloadPDFViaAPI}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
              {uploading ? 'Generating...' : 'Download PDF'}
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

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
            {/* Service Intake Information */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Service Intake Information
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Inspector Access</span>
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Service Representative <RequiredField />
                  </label>
                  <div className="relative" ref={customerServiceDropdownRef}>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.serviceIntake.customerServiceRep}
                        onChange={(e) => handleNestedInputChange('serviceIntake', 'customerServiceRep', e.target.value)}
                        onFocus={() => {
                          // If empty, set to logged-in user
                          if (!formData.serviceIntake.customerServiceRep.trim()) {
                            const loggedInUser = sessionStorage.getItem('userName') || '';
                            if (loggedInUser) {
                              handleNestedInputChange('serviceIntake', 'customerServiceRep', loggedInUser);
                            }
                          }
                          // Load users if not already loaded
                          if (users.length === 0 && !loadingUsers) {
                            loadCustomerServiceUsers();
                          }
                          setShowCustomerServiceDropdown(true);
                        }}
                        placeholder="Select or type customer service representative..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pl-10 pr-8"
                        required
                      />
                      <UserType className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <button
                        type="button"
                        onClick={() => {
                          // Load users if not already loaded
                          if (users.length === 0 && !loadingUsers) {
                            loadCustomerServiceUsers();
                          }
                          setShowCustomerServiceDropdown(!showCustomerServiceDropdown);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCustomerServiceDropdown ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    
                    {/* Current user display badge */}
                    {formData.serviceIntake.customerServiceRep === sessionStorage.getItem('userName') && (
                      <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                              <UserType className="h-3 w-3 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formData.serviceIntake.customerServiceRep}
                              </p>
                              <p className="text-xs text-gray-500">You (Logged-in User)</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setShowCustomerServiceDropdown(true);
                              setUserSearch('');
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 px-2 py-1 hover:bg-blue-100 rounded"
                          >
                            Change
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Customer Service Dropdown */}
                    {showCustomerServiceDropdown && (
                      <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {/* Search Header */}
                        <div className="sticky top-0 bg-white p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              type="text"
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              placeholder="Search by name, email, or role..."
                              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              autoFocus
                            />
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            Select a customer service representative
                          </div>
                        </div>
                        
                        {/* Loading State */}
                        {loadingUsers && (
                          <div className="p-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                              <span className="text-sm text-gray-600">Loading team members...</span>
                            </div>
                          </div>
                        )}
                        
                        {/* Empty State */}
                        {!loadingUsers && users.length === 0 && (
                          <div className="p-4 text-center">
                            <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 mb-2">
                              <UserType className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm font-medium text-gray-900 mb-1">No team members found</p>
                            <p className="text-xs text-gray-500">Add customer service users in the admin panel</p>
                          </div>
                        )}
                        
                        {/* Users List */}
                        {!loadingUsers && users.length > 0 && (
                          <div className="max-h-48 overflow-y-auto">
                            {/* Current User (Logged-in) - Always show first */}
                            {sessionStorage.getItem('userName') && (
                              <button
                                type="button"
                                onClick={() => {
                                  const currentUserName = sessionStorage.getItem('userName') || '';
                                  handleNestedInputChange('serviceIntake', 'customerServiceRep', currentUserName);
                                  setShowCustomerServiceDropdown(false);
                                  setUserSearch('');
                                }}
                                className={`w-full px-3 py-3 text-left flex items-center gap-3 border-b border-gray-100 hover:bg-blue-50 transition-colors ${
                                  formData.serviceIntake.customerServiceRep === sessionStorage.getItem('userName') 
                                    ? 'bg-blue-50 border-blue-100' 
                                    : ''
                                }`}
                              >
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white">
                                    <span className="text-sm font-medium">
                                      {sessionStorage.getItem('userName')?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-medium text-gray-900 truncate">
                                      {sessionStorage.getItem('userName')}
                                    </p>
                                    <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                                      You
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-500 truncate">Current User</p>
                                </div>
                                {formData.serviceIntake.customerServiceRep === sessionStorage.getItem('userName') && (
                                  <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                )}
                              </button>
                            )}
                            
                            {/* Filtered Users List */}
                            {users
                              .filter(user => {
                                const displayInfo = getUserDisplayInfo(user);
                                const searchLower = userSearch.toLowerCase();
                                return (
                                  displayInfo.name.toLowerCase().includes(searchLower) ||
                                  displayInfo.email.toLowerCase().includes(searchLower) ||
                                  displayInfo.roleName.toLowerCase().includes(searchLower)
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
                                    className={`w-full px-3 py-3 text-left flex items-center gap-3 border-b border-gray-100 hover:bg-purple-50 transition-colors ${
                                      formData.serviceIntake.customerServiceRep === displayInfo.name 
                                        ? 'bg-purple-50 border-purple-100' 
                                        : ''
                                    }`}
                                  >
                                    <div className="flex-shrink-0">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                        displayInfo.isCustomerService 
                                          ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700'
                                          : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700'
                                      }`}>
                                        <span className="text-sm font-medium">
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
                                          displayInfo.isCustomerService 
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-gray-100 text-gray-800'
                                        }`}>
                                          {displayInfo.roleName}
                                        </span>
                                      </div>
                                      <p className="text-xs text-gray-500 truncate">{displayInfo.email}</p>
                                    </div>
                                    {formData.serviceIntake.customerServiceRep === displayInfo.name && (
                                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                                    )}
                                  </button>
                                );
                              })}
                          </div>
                        )}
                        
                        {/* Footer */}
                        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                              {users.length} team member{users.length !== 1 ? 's' : ''} available
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCustomerServiceDropdown(false);
                                setUserSearch('');
                              }}
                              className="text-xs text-gray-500 hover:text-gray-700"
                            >
                              Close
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Helper text */}
                  <p className="mt-1 text-xs text-gray-500">
                    Select the customer service representative handling this intake. Defaults to you.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date <RequiredField />
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
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Actual Service <RequiredField />
                  </label>
                </div>
                
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
                  
                  {/* Custom services display */}
                  {formData.services.actualService
                    .filter(service => !diamondRimServices.some(s => s.label === service))
                    .map((customService, index) => (
                      <div key={`custom-${index}`} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-blue-600" />
                          <span className="text-gray-700">{customService}</span>
                          <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">Custom</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleServiceSelect(customService, false)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                </div>
                
                {formData.services.actualService.length === 0 && (
                  <p className="mt-2 text-sm text-red-600">Please select at least one service</p>
                )}
              </div>
            </div>

            {/* Delivery Mode */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Delivery Mode <RequiredField />
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

            {/* Customer Details - Pre-filled with edit button */}
            <div className="mb-8 border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserType className="h-5 w-5 text-purple-600" />
                  Customer Details
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCustomerEdit(!showCustomerEdit)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    {showCustomerEdit ? 'Hide Edit' : 'Edit Details'}
                  </button>
                  {opportunity && (
                    <button
                      type="button"
                      onClick={handleRefreshFromOpportunity}
                      className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Sparkles className="h-4 w-4" />
                      Refresh
                    </button>
                  )}
                </div>
              </div>
              
              {/* Customer details display */}
              {!showCustomerEdit ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Full Name</h4>
                      <p className="text-gray-900 font-medium">
                        {formData.customerDetails.firstName} {formData.customerDetails.lastName}
                      </p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Mobile</h4>
                      <p className="text-gray-900 font-medium">{formData.customerDetails.mobile}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                      <p className="text-gray-900 font-medium">{formData.customerDetails.email}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name <RequiredField />
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
                        Last Name <RequiredField />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile <RequiredField />
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
                        Email <RequiredField />
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
              )}
            </div>

            {/* Vehicle Details - Show only Make, Model, License Plate, and Year */}
            <div className="mb-8 border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Car className="h-5 w-5 text-purple-600" />
                  Vehicle Details
                </h2>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowVehicleEdit(!showVehicleEdit)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                    {showVehicleEdit ? 'Hide Edit' : 'Edit Details'}
                  </button>
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
              </div>
              
              {/* Vehicle details - Show only Make, Model, License Plate, Year */}
              {!showVehicleEdit ? (
                <div className="space-y-4">
                  {/* Pre-filled section (Make, Model, License Plate, Year) */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Vehicle Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Make</h4>
                        <p className="text-gray-900 font-medium text-lg">
                          {formData.carDetails.carMake || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Model</h4>
                        <p className="text-gray-900 font-medium text-lg">
                          {formData.carDetails.carModel || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">License Plate</h4>
                        <p className="text-gray-900 font-medium text-lg">
                          {getVehicleInfo()?.licensePlate || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-1">Year</h4>
                        <p className="text-gray-900 font-medium text-lg">
                          {formData.carDetails.yearOfManufacture || 'Not specified'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Full edit mode - All fields editable */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Make <RequiredField />
                        </label>
                        <input
                          type="text"
                          value={formData.carDetails.carMake}
                          onChange={(e) => handleNestedInputChange('carDetails', 'carMake', e.target.value)}
                          placeholder="e.g., Toyota, BMW"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Model <RequiredField />
                        </label>
                        <input
                          type="text"
                          value={formData.carDetails.carModel}
                          onChange={(e) => handleNestedInputChange('carDetails', 'carModel', e.target.value)}
                          placeholder="e.g., Corolla, X5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          License Plate <RequiredField />
                        </label>
                        <input
                          type="text"
                          value={formData.carDetails.licensePlate}
                          onChange={(e) => handleNestedInputChange('carDetails', 'licensePlate', e.target.value)}
                          placeholder="e.g., KCT 324Y"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Year <RequiredField />
                        </label>
                        <input
                          type="text"
                          value={formData.carDetails.yearOfManufacture}
                          onChange={(e) => handleNestedInputChange('carDetails', 'yearOfManufacture', e.target.value)}
                          placeholder="e.g., 2023"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Color <RequiredField />
                        </label>
                        <input
                          type="text"
                          value={formData.carDetails.color}
                          onChange={(e) => handleNestedInputChange('carDetails', 'color', e.target.value)}
                          placeholder="e.g., Red"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mileage <RequiredField />
                        </label>
                        <input
                          type="text"
                          value={formData.carDetails.mileage}
                          onChange={(e) => handleNestedInputChange('carDetails', 'mileage', e.target.value)}
                          placeholder="e.g., 45,000 km"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pre-Service Inspection */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-purple-600" />
                Pre-Service Inspection
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Inspector Access</span>
              </h2>
              
              {/* Condition Assessment */}
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Condition <RequiredField />
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
              
              {/* Inspector Access Notes Section */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-4">
                  Inspection Notes (Inspector Access)
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="photosRequired"
                      checked={formData.preServiceInspection.photosRequired}
                      onChange={(e) => handleNestedInputChange('preServiceInspection', 'photosRequired', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="photosRequired" className="text-sm text-blue-700">
                      Photos Required
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="videoRequired"
                      checked={formData.preServiceInspection.videoRequired}
                      onChange={(e) => handleNestedInputChange('preServiceInspection', 'videoRequired', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="videoRequired" className="text-sm text-blue-700">
                      Video Recording Required
                    </label>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-blue-700 mb-2">
                    Additional Inspection Notes
                  </label>
                  <textarea
                    value={formData.preServiceInspection.inspectionNotes}
                    onChange={(e) => handleNestedInputChange('preServiceInspection', 'inspectionNotes', e.target.value)}
                    placeholder="Additional notes for inspector access..."
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                  />
                </div>
              </div>
              
              {/* Rim & Tire Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Rim & Tire Details</h3>
                
                {/* Rim or Tire Selection - Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Item Type <RequiredField />
                  </label>
                  <select
                    value={formData.rimOrTireSelection}
                    onChange={(e) => handleInputChange('rimOrTireSelection', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    required
                  >
                    <option value="">-- Select Item Type --</option>
                    <option value="rims-only">Rims Only</option>
                    <option value="tires-only">Tires Only</option>
                    <option value="rims-with-tires">Rims with Tires</option>
                  </select>
                </div>
                
                {/* Conditionally show Rims or Tires details */}
                {formData.rimOrTireSelection === 'rims-only' || formData.rimOrTireSelection === 'rims-with-tires' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rim Quantity <RequiredField />
                      </label>
                      <input
                        type="number"
                        value={formData.rimsDetails.quantity}
                        onChange={(e) => handleNestedInputChange('rimsDetails', 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        max="8"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rim Size
                      </label>
                      <input
                        type="text"
                        value={formData.rimsDetails.size}
                        onChange={(e) => handleNestedInputChange('rimsDetails', 'size', e.target.value)}
                        placeholder="e.g., 17x8J"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                ) : null}
                
                {formData.rimOrTireSelection === 'tires-only' || formData.rimOrTireSelection === 'rims-with-tires' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tire Quantity <RequiredField />
                      </label>
                      <input
                        type="number"
                        value={formData.tiresDetails.quantity}
                        onChange={(e) => handleNestedInputChange('tiresDetails', 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        max="8"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tire Size
                      </label>
                      <input
                        type="text"
                        value={formData.tiresDetails.size}
                        onChange={(e) => handleNestedInputChange('tiresDetails', 'size', e.target.value)}
                        placeholder="e.g., 225/45R17"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                ) : null}
                
                {/* Center Caps Section */}
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Center Caps Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Center Caps Present?
                      </label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="centerCapsPresent"
                            checked={formData.centerCaps.present === true}
                            onChange={() => handleNestedInputChange('centerCaps', 'present', true)}
                            className="text-purple-600"
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="centerCapsPresent"
                            checked={formData.centerCaps.present === false}
                            onChange={() => handleNestedInputChange('centerCaps', 'present', false)}
                            className="text-purple-600"
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    
                    {formData.centerCaps.present && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quantity
                          </label>
                          <input
                            type="number"
                            value={formData.centerCaps.quantity}
                            onChange={(e) => handleNestedInputChange('centerCaps', 'quantity', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                            max="8"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Condition
                          </label>
                          <select
                            value={formData.centerCaps.condition}
                            onChange={(e) => handleNestedInputChange('centerCaps', 'condition', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          >
                            <option value="">Select Condition</option>
                            <option value="good">Good</option>
                            <option value="damaged">Damaged</option>
                            <option value="missing">Missing</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Type
                          </label>
                          <input
                            type="text"
                            value={formData.centerCaps.type}
                            onChange={(e) => handleNestedInputChange('centerCaps', 'type', e.target.value)}
                            placeholder="e.g., BMW OEM, Aftermarket"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Center Caps Notes
                    </label>
                    <textarea
                      value={formData.centerCaps.notes}
                      onChange={(e) => handleNestedInputChange('centerCaps', 'notes', e.target.value)}
                      placeholder="Additional notes about center caps..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      rows={2}
                    />
                  </div>
                </div>
                
                {/* Wheel Nuts, Nozzle Caps, Lock Nuts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Wheel Nuts <RequiredField />
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
                      Total Number of Nozzle Caps <RequiredField />
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
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Lock Nuts <RequiredField />
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
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nozzle Caps Type <RequiredField />
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
              
              {/* Tire DOT Section - Full implementation */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Tire DOT Numbers (Full Details)</h3>
                
                {/* FR DOT */}
                <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">FR (Front Right)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DOT Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fr.code}
                        onChange={(e) => handleNestedInputChange('tireDOT.fr', 'code', e.target.value)}
                        placeholder="XXXX"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Week</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fr.week}
                        onChange={(e) => handleNestedInputChange('tireDOT.fr', 'week', e.target.value)}
                        placeholder="01-52"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Year</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fr.year}
                        onChange={(e) => handleNestedInputChange('tireDOT.fr', 'year', e.target.value)}
                        placeholder="2023"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Plant Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fr.plant}
                        onChange={(e) => handleNestedInputChange('tireDOT.fr', 'plant', e.target.value)}
                        placeholder="Plant"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                
                {/* FL DOT */}
                <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">FL (Front Left)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DOT Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fl.code}
                        onChange={(e) => handleNestedInputChange('tireDOT.fl', 'code', e.target.value)}
                        placeholder="XXXX"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Week</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fl.week}
                        onChange={(e) => handleNestedInputChange('tireDOT.fl', 'week', e.target.value)}
                        placeholder="01-52"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Year</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fl.year}
                        onChange={(e) => handleNestedInputChange('tireDOT.fl', 'year', e.target.value)}
                        placeholder="2023"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Plant Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.fl.plant}
                        onChange={(e) => handleNestedInputChange('tireDOT.fl', 'plant', e.target.value)}
                        placeholder="Plant"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                
                {/* BR DOT */}
                <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">BR (Back Right)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DOT Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.br.code}
                        onChange={(e) => handleNestedInputChange('tireDOT.br', 'code', e.target.value)}
                        placeholder="XXXX"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Week</label>
                      <input
                        type="text"
                        value={formData.tireDOT.br.week}
                        onChange={(e) => handleNestedInputChange('tireDOT.br', 'week', e.target.value)}
                        placeholder="01-52"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Year</label>
                      <input
                        type="text"
                        value={formData.tireDOT.br.year}
                        onChange={(e) => handleNestedInputChange('tireDOT.br', 'year', e.target.value)}
                        placeholder="2023"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Plant Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.br.plant}
                        onChange={(e) => handleNestedInputChange('tireDOT.br', 'plant', e.target.value)}
                        placeholder="Plant"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                
                {/* BL DOT */}
                <div className="mb-4 p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">BL (Back Left)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DOT Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.bl.code}
                        onChange={(e) => handleNestedInputChange('tireDOT.bl', 'code', e.target.value)}
                        placeholder="XXXX"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Week</label>
                      <input
                        type="text"
                        value={formData.tireDOT.bl.week}
                        onChange={(e) => handleNestedInputChange('tireDOT.bl', 'week', e.target.value)}
                        placeholder="01-52"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Year</label>
                      <input
                        type="text"
                        value={formData.tireDOT.bl.year}
                        onChange={(e) => handleNestedInputChange('tireDOT.bl', 'year', e.target.value)}
                        placeholder="2023"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Plant Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.bl.plant}
                        onChange={(e) => handleNestedInputChange('tireDOT.bl', 'plant', e.target.value)}
                        placeholder="Plant"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Spare DOT */}
                <div className="p-4 border border-gray-200 rounded-lg">
                  <h4 className="font-medium text-gray-700 mb-3">Spare</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">DOT Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.spare.code}
                        onChange={(e) => handleNestedInputChange('tireDOT.spare', 'code', e.target.value)}
                        placeholder="XXXX"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Week</label>
                      <input
                        type="text"
                        value={formData.tireDOT.spare.week}
                        onChange={(e) => handleNestedInputChange('tireDOT.spare', 'week', e.target.value)}
                        placeholder="01-52"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Year</label>
                      <input
                        type="text"
                        value={formData.tireDOT.spare.year}
                        onChange={(e) => handleNestedInputChange('tireDOT.spare', 'year', e.target.value)}
                        placeholder="2023"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Plant Code</label>
                      <input
                        type="text"
                        value={formData.tireDOT.spare.plant}
                        onChange={(e) => handleNestedInputChange('tireDOT.spare', 'plant', e.target.value)}
                        placeholder="Plant"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Suitability Section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SUITABILITY ASSESSMENT</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suitable For Skimming
                      </label>
                      <select
                        value={formData.suitability.skimming}
                        onChange={(e) => handleNestedInputChange('suitability', 'skimming', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suitable For Powder Coating
                      </label>
                      <select
                        value={formData.suitability.powderCoating}
                        onChange={(e) => handleNestedInputChange('suitability', 'powderCoating', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suitable For Straightening
                      </label>
                      <select
                        value={formData.suitability.straightening}
                        onChange={(e) => handleNestedInputChange('suitability', 'straightening', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suitable For Welding
                      </label>
                      <select
                        value={formData.suitability.welding}
                        onChange={(e) => handleNestedInputChange('suitability', 'welding', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Suitable For Diamond Cutting
                      </label>
                      <select
                        value={formData.suitability.diamondCutting}
                        onChange={(e) => handleNestedInputChange('suitability', 'diamondCutting', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                        <option value="maybe">Maybe</option>
                        <option value="not-applicable">Not Applicable</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Additional Notes Section */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Suitability Notes & Recommendations
                    </label>
                    <textarea
                      value={formData.suitability.notes}
                      onChange={(e) => handleNestedInputChange('suitability', 'notes', e.target.value)}
                      placeholder="Detailed notes on suitability assessment and recommendations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={3}
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Technician Recommendations
                    </label>
                    <textarea
                      value={formData.suitability.recommendations}
                      onChange={(e) => handleNestedInputChange('suitability', 'recommendations', e.target.value)}
                      placeholder="Specific recommendations for the customer..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      rows={2}
                    />
                  </div>
                </div>
              </div>
              
              {/* Declared Valuable Section */}
              <div className="mt-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-yellow-900 mb-4">DECLARED VALUABLE SECTION</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-yellow-800 mb-2">
                      Is this item declared valuable? <RequiredField />
                    </label>
                    <div className="flex gap-6">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="declaredValuable"
                          checked={formData.declaredValuable.value === true}
                          onChange={() => handleNestedInputChange('declaredValuable', 'value', true)}
                          className="text-yellow-600"
                          required
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="declaredValuable"
                          checked={formData.declaredValuable.value === false}
                          onChange={() => handleNestedInputChange('declaredValuable', 'value', false)}
                          className="text-yellow-600"
                          required
                        />
                        <span>No</span>
                      </label>
                    </div>
                  </div>
                  
                  {formData.declaredValuable.value && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-yellow-800 mb-2">
                            Declared Value (KES)
                          </label>
                          <input
                            type="number"
                            value={formData.declaredValuable.declaredValue}
                            onChange={(e) => handleNestedInputChange('declaredValuable', 'declaredValue', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-yellow-800 mb-2">
                            Insurance Required?
                          </label>
                          <select
                            value={formData.declaredValuable.insuranceRequired ? 'yes' : 'no'}
                            onChange={(e) => handleNestedInputChange('declaredValuable', 'insuranceRequired', e.target.value === 'yes')}
                            className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                          >
                            <option value="no">No</option>
                            <option value="yes">Yes</option>
                          </select>
                        </div>
                      </div>
                      
                      {formData.declaredValuable.insuranceRequired && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <label className="block text-sm font-medium text-yellow-800 mb-2">
                              Insurance Provider
                            </label>
                            <input
                              type="text"
                              value={formData.declaredValuable.insuranceProvider}
                              onChange={(e) => handleNestedInputChange('declaredValuable', 'insuranceProvider', e.target.value)}
                              placeholder="Insurance company name"
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-yellow-800 mb-2">
                              Policy Number
                            </label>
                            <input
                              type="text"
                              value={formData.declaredValuable.policyNumber}
                              onChange={(e) => handleNestedInputChange('declaredValuable', 'policyNumber', e.target.value)}
                              placeholder="Policy number"
                              className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                            />
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <label className="block text-sm font-medium text-yellow-800 mb-2">
                          Declared Valuable Notes
                        </label>
                        <textarea
                          value={formData.declaredValuable.notes}
                          onChange={(e) => handleNestedInputChange('declaredValuable', 'notes', e.target.value)}
                          placeholder="Additional notes regarding declared valuable items..."
                          className="w-full px-3 py-2 border border-yellow-300 rounded-lg"
                          rows={3}
                        />
                      </div>
                    </>
                  )}
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
              </div>
              
              {/* Service-specific Risks */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ASSOCIATED RISKS</h3>
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
                  </div>
                  
                  {/* SINGLE ACCEPTANCE CHECKBOX */}
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="acceptTermsConditions"
                        checked={formData.acceptTerms}
                        onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                        className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        required
                      />
                      <div className="flex-1">
                        <label htmlFor="acceptTermsConditions" className="text-sm font-medium text-gray-700">
                          I HAVE READ, UNDERSTOOD, AND ACCEPT ALL TERMS, CONDITIONS, MUST KNOWS AND ASSOCIATED RISKS <RequiredField />
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          By checking this box, you acknowledge that you have reviewed all terms, must knows, and associated risks, 
                          and agree to be bound by all provisions.
                        </p>
                      </div>
                    </div>
                    {!formData.acceptTerms && (
                      <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center gap-2 text-sm text-red-700">
                          <AlertCircle className="h-4 w-4 flex-shrink-0" />
                          <span>You must accept all terms and conditions to proceed with service</span>
                        </div>
                      </div>
                    )}
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
              
              {/* Upload Photos Section (First) */}
              <div className="mb-8">
                <div className="relative">
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    onClick={() => document.getElementById('image-upload')?.click()}
                  >
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      ref={fileInputRef}
                    />
                    <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Click to upload inspection photos</p>
                    
                    {/* File count and size validation */}
                    {formData.uploadedImages.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-700">
                          {formData.uploadedImages.length} image(s) uploaded
                          {formData.uploadedImages.length >= 6 && (
                            <span className="ml-2 text-red-600 text-xs">(Maximum reached)</span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Image preview grid */}
                {formData.uploadedImages.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {formData.uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg overflow-hidden border border-gray-200">
                          <img
                            src={image}
                            alt={`Inspection Image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Signatures Section - Inspector first, then Client */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Inspector Signature (First) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Inspector Signature <RequiredField />
                    </label>
                    {formData.inspectorSignature && (
                      <div className="flex gap-2">
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Signed
                        </span>
                        <button
                          type="button"
                          onClick={() => clearSignature('inspector')}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Inspector signature canvas */}
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
                          Save Inspector Signature
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
                      {formData.inspectorSignature ? (
                        <div className="text-center p-2">
                          <img 
                            src={formData.inspectorSignature} 
                            alt="Inspector Signature" 
                            className="h-20 mx-auto object-contain"
                          />
                          <p className="text-xs text-gray-500 mt-1">Click to change signature</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <FileSignature className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">Inspector Signature</p>
                          <p className="text-xs text-gray-500">Click to sign</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="text-xs text-gray-500">
                    Inspector must sign first before client approval
                  </div>
                </div>
                
                {/* Client Signature */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-medium text-gray-700">
                      Client Signature <RequiredField />
                    </label>
                    {formData.clientSignature && (
                      <div className="flex gap-2">
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Signed
                        </span>
                        <button
                          type="button"
                          onClick={() => clearSignature('client')}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Client signing method selection */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Signing Method
                    </label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="clientSigningMethod"
                          value="present"
                          checked={formData.clientSigningMethod === 'present'}
                          onChange={(e) => handleInputChange('clientSigningMethod', e.target.value)}
                          className="text-purple-600"
                        />
                        <span>Client Present</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="clientSigningMethod"
                          value="absent"
                          checked={formData.clientSigningMethod === 'absent'}
                          onChange={(e) => handleInputChange('clientSigningMethod', e.target.value)}
                          className="text-purple-600"
                        />
                        <span>Client Absent</span>
                      </label>
                    </div>
                  </div>
                  
                  {/* Client signature based on method */}
                  {formData.clientSigningMethod === 'present' && (
                    <>
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
                              Save Client Signature
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
                          {formData.clientSignature ? (
                            <div className="text-center p-2">
                              <img 
                                src={formData.clientSignature} 
                                alt="Client Signature" 
                                className="h-20 mx-auto object-contain"
                              />
                              <p className="text-xs text-gray-500 mt-1">Click to change signature</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <FileSignature className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                              <p className="text-sm text-gray-600">Client Signature</p>
                              <p className="text-xs text-gray-500">Click to sign</p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                  
                  {formData.clientSigningMethod === 'absent' && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <MailIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 mb-2">
                            Send for Client Approval
                          </p>
                          <p className="text-xs text-blue-700 mb-3">
                            The client will receive an email with a link to review and sign this pre-checklist.
                          </p>
                          
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-blue-700 mb-1">
                              Client Email
                            </label>
                            <input
                              type="email"
                              value={formData.clientEmail}
                              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                              placeholder="client@example.com"
                              className="w-full px-3 py-2 text-sm border border-blue-300 rounded-lg"
                            />
                          </div>
                          
                          <button
                            type="button"
                            onClick={sendForClientApproval}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                          >
                            Send Email for Approval
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Remarks */}
              <div className="mt-6">
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
            </div>

            {/* Form Actions */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleSaveAsDraft}
                    className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    disabled={submitting}
                  >
                    <Save className="h-5 w-5" />
                    Save Draft
                    {draftSaved && (
                      <span className="text-xs text-green-600">
                        ✓ Saved
                      </span>
                    )}
                  </button>
                </div>
                
                <div className="flex gap-4">
                  
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
