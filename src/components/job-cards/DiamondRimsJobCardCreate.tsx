'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Wrench, ArrowLeft, Save, Plus, Trash2,
  Loader2, Calendar, Clock, User as UserIcon, 
  Car, FileText, DollarSign, Package, ChevronDown,
  CheckCircle, Briefcase, Shield, Tag,
  Search, Mail, Phone, Car as CarIcon,
  Home, MapPin, Target, Settings, AlertCircle, Zap, Thermometer,
  AlertTriangle, Info, Sparkles, FileSignature, Upload, X,
  FileCheck, ClipboardList, Check, RotateCw,
  PaintBucket, Hammer, Gauge, Sparkles as DiamondIcon,
  Layers, Hexagon, Award, ShieldOff, FileText as NotesIcon,
  UserCheck, Users, CalendarDays, Clock as ClockIcon
} from 'lucide-react';
import { jobCardService, CreateJobCardData } from '@/services/jobCardService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { userService, User } from '@/services/settings/userService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { workOrderService } from '@/services/workOrderService';
import { preChecklistService, PreChecklist } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import { format, parseISO } from 'date-fns';
import debounce from 'lodash/debounce';
import SignatureCanvas from 'react-signature-canvas';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';

interface FormData {
  opportunityId: string;
  workOrderId?: string;
  jobTitle: string;
  jobDescription: string;
  assignedTo: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedHours: number;
  actualHours: number;
  laborCost: number;
  partsCost: number;
  totalCost: number;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
  estimatedCompletionDate: string;
  estimatedCompletionTime: string;
  completedDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  notes: string[];
  newNote: string;
  partsUsed: Array<{
    partId: string;
    partNumber: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalCost: number;
    description?: string;
  }>;
  
  // Customer Information
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  jobCardOwner: string;
  customerResidence: string;
  customerSource: string;
  customerOther: string;
  customerOccupation: string;
  
  // Car Details
  regNumber: string;
  carModel: string;
  yom: string;
  mileage: string;
  carMake: string;
  
  // DIAMOND RIMS SPECIFIC FIELDS
  
  // Rim Details
  rimBrand: string;
  rimModel: string;
  rimSize: string;
  rimMaterial: string;
  rimColor: string;
  numberOfRims: number;
  
  // Rim Condition Assessment
  rimConditionOverall: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  hasCracks: boolean;
  hasBends: boolean;
  hasCurbRash: boolean;
  hasCorrosion: boolean;
  hasPreviousRepairs: boolean;
  structuralIntegrity: 'intact' | 'compromised' | 'unknown';
  
  // Rim Services Required - Auto-populated from pre-checklist
  servicesRequired: {
    brakeDiscSkimming: boolean;
    diamondCutting: boolean;
    powderCoating: boolean;
    rimStraightening: boolean;
    welding: boolean;
    wheelBalancing: boolean;
    rimPolishing: boolean;
    rimRepair: boolean;
  };
  
  // Powder Coating Details
  powderCoatingColor: string;
  powderCoatingRAL: string;
  powderCoatingFinish: 'gloss' | 'matte' | 'satin' | 'metallic';
  coatingLayers: number;
  
  // Diamond Cutting Details
  diamondCutPattern: string;
  cuttingDepth: string;
  preserveLogo: boolean;
  
  // Brake Disc Skimming
  brakeDiscThickness: string;
  minimumAllowableThickness: string;
  skimmingPassesNeeded: number;
  
  // Tire Details
  tireBrands: {
    fr: string;
    fl: string;
    br: string;
    bl: string;
    spare: string;
  };
  
  tireDOT: {
    fr: string;
    fl: string;
    br: string;
    bl: string;
    spare: string;
  };
  
  tireTreadDepth: {
    fr: string;
    fl: string;
    br: string;
    bl: string;
    spare: string;
  };
  
  // Accessories
  wheelNutsTotal: number;
  nozzleCapsTotal: number;
  nozzleCapsType: string;
  lockNutsTotal: number;
  centerCaps: string;
  tpmsSensors: boolean;
  tpmsSensorCondition: 'working' | 'needs_replacement' | 'missing';
  
  // Installation & Alignment
  wheelAlignmentNeeded: boolean;
  wheelBalancingNeeded: boolean;
  torqueSpecification: string;
  
  // Quality Checks
  visualInspectionPass: boolean;
  structuralTestPass: boolean;
  finishQuality: 'excellent' | 'good' | 'acceptable' | 'poor';
  colorMatch: 'perfect' | 'good' | 'acceptable' | 'poor';
  
  // Safety & Compliance
  safetyInspections: {
    weightTest: boolean;
    pressureTest: boolean;
    xRayInspection: boolean;
    ultrasonicTest: boolean;
  };
  
  complianceStandards: string[];
  
  // Customer Requirements
  customerRequirements: string;
  specialRequests: string;
  
  // Pricing & Quotation
  quotedAmount: number;
  paymentTerms: string;
  warrantyPeriod: string;
  
  // Progress Tracking
  processStage: 'inspection' | 'preparation' | 'service' | 'coating' | 'finishing' | 'quality_check' | 'ready';
  stageProgress: number;
  
  // Notes & Remarks
  technicianNotes: string;
  qualityRemarks: string;
  deliveryInstructions: string;

  // Signatures
  technicianSignature: string;
  customerSignature: string;
  acceptTerms: boolean;
  acceptWarrantyTerms: boolean;

  // New fields based on requirements
  jobCardNotes: string;
}

export default function DiamondRimsJobCardCreate({ mode = 'create' }: { mode?: 'create' | 'edit' }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  // Get parameters from URL
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');
  const vehicleId = searchParams.get('vehicleId');
  const source = searchParams.get('source');
  const preChecklistId = searchParams.get('preChecklistId');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<Vehicle | null>(null);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [preChecklist, setPreChecklist] = useState<PreChecklist | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [showCustomerSignature, setShowCustomerSignature] = useState(false);
  const [showTechnicianSignature, setShowTechnicianSignature] = useState(false);
  const customerSigRef = useRef<SignatureCanvas>(null);
  const technicianSigRef = useRef<SignatureCanvas>(null);
  
  // Set default time to current time + 1 hour
  const defaultStartTime = format(new Date(Date.now() + 60 * 60 * 1000), 'HH:mm');
  const defaultEndTime = format(new Date(Date.now() + 8 * 60 * 60 * 1000), 'HH:mm'); // 8 hours later
  
  const [formData, setFormData] = useState<FormData>({
    opportunityId: opportunityId || '',
    jobTitle: 'Diamond Rims Service',
    jobDescription: '',
    assignedTo: '',
    priority: 'medium',
    estimatedHours: 4,
    actualHours: 0,
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: defaultStartTime,
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    endTime: defaultEndTime,
    estimatedCompletionDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    estimatedCompletionTime: defaultEndTime,
    completedDate: '',
    status: 'pending',
    notes: [],
    newNote: '',
    partsUsed: [],
    
    // Customer Information - Default values
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    jobCardOwner: sessionStorage.getItem('userName') || 'Diamond Rims Technician',
    customerResidence: '',
    customerSource: 'None',
    customerOther: '',
    customerOccupation: '',
    
    // Car Details - Default values
    regNumber: '',
    carModel: '',
    yom: '',
    mileage: '',
    carMake: '',
    
    // Rim Details - Default values
    rimBrand: '',
    rimModel: '',
    rimSize: '',
    rimMaterial: 'aluminum',
    rimColor: '',
    numberOfRims: 4,
    
    // Rim Condition Assessment
    rimConditionOverall: 'good',
    hasCracks: false,
    hasBends: false,
    hasCurbRash: false,
    hasCorrosion: false,
    hasPreviousRepairs: false,
    structuralIntegrity: 'intact',
    
    // Rim Services Required - Auto-populated from pre-checklist
    servicesRequired: {
      brakeDiscSkimming: false,
      diamondCutting: false,
      powderCoating: false,
      rimStraightening: false,
      welding: false,
      wheelBalancing: false,
      rimPolishing: false,
      rimRepair: false,
    },
    
    // Powder Coating Details
    powderCoatingColor: '',
    powderCoatingRAL: '',
    powderCoatingFinish: 'gloss',
    coatingLayers: 1,
    
    // Diamond Cutting Details
    diamondCutPattern: '',
    cuttingDepth: '',
    preserveLogo: true,
    
    // Brake Disc Skimming
    brakeDiscThickness: '',
    minimumAllowableThickness: '',
    skimmingPassesNeeded: 1,
    
    // Tire Details
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
    
    tireTreadDepth: {
      fr: '',
      fl: '',
      br: '',
      bl: '',
      spare: '',
    },
    
    // Accessories
    wheelNutsTotal: 16,
    nozzleCapsTotal: 0,
    nozzleCapsType: 'plastic',
    lockNutsTotal: 4,
    centerCaps: '',
    tpmsSensors: false,
    tpmsSensorCondition: 'working',
    
    // Installation & Alignment
    wheelAlignmentNeeded: true,
    wheelBalancingNeeded: true,
    torqueSpecification: '110 Nm',
    
    // Quality Checks
    visualInspectionPass: false,
    structuralTestPass: false,
    finishQuality: 'good',
    colorMatch: 'good',
    
    // Safety & Compliance
    safetyInspections: {
      weightTest: false,
      pressureTest: false,
      xRayInspection: false,
      ultrasonicTest: false,
    },
    
    complianceStandards: [],
    
    // Customer Requirements
    customerRequirements: '',
    specialRequests: '',
    
    // Pricing & Quotation
    quotedAmount: 0,
    paymentTerms: '50% deposit, 50% on completion',
    warrantyPeriod: '6 months',
    
    // Progress Tracking
    processStage: 'inspection',
    stageProgress: 0,
    
    // Notes & Remarks
    technicianNotes: '',
    qualityRemarks: '',
    deliveryInstructions: '',
    jobCardNotes: '',

    // Signatures
    technicianSignature: '',
    customerSignature: '',
    acceptTerms: false,
    acceptWarrantyTerms: false
  });

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔵' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
  ];

  // Rim condition options
  const rimConditionOptions = [
    { value: 'excellent', label: 'Excellent', color: 'text-green-600' },
    { value: 'good', label: 'Good', color: 'text-blue-600' },
    { value: 'fair', label: 'Fair', color: 'text-yellow-600' },
    { value: 'poor', label: 'Poor', color: 'text-orange-600' },
    { value: 'damaged', label: 'Damaged', color: 'text-red-600' },
  ];

  // Rim material options
  const rimMaterialOptions = [
    'aluminum',
    'steel',
    'alloy',
    'forged',
    'carbon_fiber',
    'magnesium'
  ];

  // Powder coating finish options
  const finishOptions = [
    { value: 'gloss', label: 'Gloss' },
    { value: 'matte', label: 'Matte' },
    { value: 'satin', label: 'Satin' },
    { value: 'metallic', label: 'Metallic' },
  ];

  // Process stage options
  const processStages = [
    { value: 'inspection', label: 'Inspection', icon: '🔍' },
    { value: 'preparation', label: 'Preparation', icon: '🧼' },
    { value: 'service', label: 'Service', icon: '🔧' },
    { value: 'coating', label: 'Coating', icon: '🎨' },
    { value: 'finishing', label: 'Finishing', icon: '✨' },
    { value: 'quality_check', label: 'Quality Check', icon: '✅' },
    { value: 'ready', label: 'Ready', icon: '🚗' },
  ];

  // Diamond rim services options
  const diamondRimServices = [
    { id: 'brakeDiscSkimming', label: 'Brake Disc Skimming', icon: <RotateCw className="h-4 w-4" /> },
    { id: 'diamondCutting', label: 'Diamond Cutting', icon: <DiamondIcon className="h-4 w-4" /> },
    { id: 'powderCoating', label: 'Powder Coating', icon: <PaintBucket className="h-4 w-4" /> },
    { id: 'rimStraightening', label: 'Rim Straightening', icon: <Hammer className="h-4 w-4" /> },
    { id: 'welding', label: 'Welding', icon: <Zap className="h-4 w-4" /> },
    { id: 'wheelBalancing', label: 'Wheel Balancing', icon: <Gauge className="h-4 w-4" /> },
    { id: 'rimPolishing', label: 'Rim Polishing', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'rimRepair', label: 'Rim Repair', icon: <Wrench className="h-4 w-4" /> },
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

  // Load related data on component mount
  useEffect(() => {
    if (opportunityId) {
      loadRelatedData();
    } else {
      showToast('No opportunity specified in URL', 'error');
      router.push('/job-cards');
    }
  }, [opportunityId]);

  // Auto-populate form when pre-checklist is loaded
  useEffect(() => {
    if (preChecklist && !autoPopulated) {
      autoPopulateFromPreChecklist();
    }
  }, [preChecklist]);

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load opportunity
      if (opportunityId) {
        const opp = await opportunityService.getOpportunityById(opportunityId, false);
        setOpportunity(opp);
        
        // Get vehicle from opportunity
        if (opp.vehicles && opp.vehicles.length > 0) {
          const primaryVehicle = opp.vehicles[0];
          setVehicleDetails(primaryVehicle);
          
          // Try to fetch detailed vehicle info if we have vehicleId
          if (primaryVehicle._id) {
            try {
              const detailedVehicle = await vehicleService.getVehicleById(primaryVehicle._id);
              setVehicleDetails(detailedVehicle);
            } catch (vehicleError) {
              console.warn('Could not fetch detailed vehicle:', vehicleError);
            }
          }
        } else if (vehicleId) {
          // Fallback to vehicleId parameter
          try {
            const veh = await vehicleService.getVehicleById(vehicleId);
            setVehicleDetails(veh);
          } catch (vehError) {
            //
          }
        }
      }

      // Load work order if provided
      if (workOrderId) {
        try {
          const wo = await workOrderService.getWorkOrderById(workOrderId);
          setWorkOrder(wo);
        } catch (error) {
          console.error('Error loading work order:', error);
        }
      }

      // Load pre-checklist if provided (might have Diamond Rims data)
      if (preChecklistId) {
        try {
          const pc = await preChecklistService.getPreChecklistById(preChecklistId);
          setPreChecklist(pc);
        } catch (error) {
          console.error('Error loading pre-checklist:', error);
          showToast('Failed to load pre-checklist', 'warning');
        }
      }

      // Load technicians and parts
      await Promise.all([
        fetchTechnicians(),
        fetchParts()
      ]);

    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add this effect to auto-populate from opportunity when loaded
  useEffect(() => {
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

  // Function to auto-populate from opportunity with servicesProducts
// Function to auto-populate from opportunity
const autoPopulateFromOpportunity = () => {
  if (!opportunity || autoPopulated) return;

  try {
    
    // Extract customer information
    const customerName = opportunity.customer?.name || '';
    
    // Get vehicle details
    const vehicleData = vehicleDetails || opportunity.vehicles?.[0] || {};
    const carMake = vehicleData.make || vehicleData.manufacturer || vehicleData.brand || '';
    const carModel = vehicleData.model || vehicleData.modelName || '';
    
    // Get license plate
    const getLicensePlate = (vehicle: any) => {
      if (!vehicle) return '';
      const fields = ['registrationNumber', 'regNumber', 'licensePlate', 'plateNumber'];
      for (const field of fields) {
        if (vehicle[field]) return vehicle[field];
      }
      return '';
    };
    
    const licensePlate = getLicensePlate(vehicleData);
    
    // Get year
    let yearOfManufacture = '';
    if (vehicleData.year) yearOfManufacture = vehicleData.year.toString();
    else if (vehicleData.yearOfManufacture) yearOfManufacture = vehicleData.yearOfManufacture.toString();
    else if (vehicleData.modelYear) yearOfManufacture = vehicleData.modelYear.toString();

    // Get mileage
    const mileage = vehicleData.mileage || '';

    // JOB TITLE: From opportunity subject (in uppercase)
    let jobTitle = 'DIAMOND RIMS SERVICE'; // Default
    
    if (opportunity.subject) {
      jobTitle = opportunity.subject.toUpperCase();
    } else if (customerName) {
      const firstName = customerName.split(' ')[0] || customerName;
      jobTitle = `${firstName.toUpperCase()}'S RIM SERVICE`;
    }

    // JOB DESCRIPTION: List services required and color selected ONLY
    let jobDescription = '';
    
    // Check if we have services from pre-checklist
    if (preChecklist && preChecklist.services && preChecklist.services.actualService) {
      const services = preChecklist.services.actualService;
      
      // Get color from pre-checklist if powder coating is selected
      let colorInfo = '';
      if (preChecklist.powderCoating && preChecklist.powderCoating.colourRAL) {
        colorInfo = ` | Color: ${preChecklist.powderCoating.colourRAL}`;
      }
      
      // Create concise service list
      jobDescription = services.join(', ') + colorInfo;
    } 
    // If no pre-checklist, create simple description
    else {
      jobDescription = 'Rim services requested';
    }

    // Map services from pre-checklist if available
    let servicesRequired = formData.servicesRequired;
    if (preChecklist && preChecklist.services && preChecklist.services.actualService) {
      servicesRequired = mapPreChecklistServices(preChecklist.services.actualService);
    }

    // Get logged-in user info
    const loggedInUserName = sessionStorage.getItem('userName') || '';

    // Update form data
    const updatedFormData: Partial<FormData> = {
      opportunityId: opportunity._id || opportunityId || '',
      customerName: customerName,
      customerPhone: opportunity.customer?.phone || '',
      customerEmail: opportunity.customer?.email || '',
      jobCardOwner: loggedInUserName || 'Diamond Rims Technician',
      
      // Vehicle details
      regNumber: licensePlate,
      carMake: carMake,
      carModel: carModel,
      yom: yearOfManufacture,
      mileage: mileage,
      
      // Job details
      jobTitle: jobTitle,
      jobDescription: jobDescription, // Only services and color, NO amounts
      
      // Services from pre-checklist
      servicesRequired: servicesRequired,
      
      // Color from pre-checklist
      powderCoatingRAL: preChecklist?.powderCoating?.colourRAL || '',
      
      // Customer information
      customerSource: opportunity.source || 'None',
      quotedAmount: opportunity.total || 0,
    };
    
    setFormData(prev => ({ ...prev, ...updatedFormData }));
    setAutoPopulated(true);
    
    showToast('Job card data loaded successfully', 'success');
    
  } catch (error) {
    console.error('Error auto-populating from opportunity:', error);
    showToast('Error loading opportunity data', 'warning');
  }
};

// Helper function to map pre-checklist services
const mapPreChecklistServices = (services: string[]) => {
  const servicesRequired = {
    brakeDiscSkimming: false,
    diamondCutting: false,
    powderCoating: false,
    rimStraightening: false,
    welding: false,
    wheelBalancing: false,
    rimPolishing: false,
    rimRepair: false,
  };

  services.forEach(service => {
    const serviceLower = service.toLowerCase();
    
    if (serviceLower.includes('brake') || serviceLower.includes('skimming')) {
      servicesRequired.brakeDiscSkimming = true;
    }
    if (serviceLower.includes('diamond') || serviceLower.includes('cutting')) {
      servicesRequired.diamondCutting = true;
    }
    if (serviceLower.includes('powder') || serviceLower.includes('coating')) {
      servicesRequired.powderCoating = true;
    }
    if (serviceLower.includes('straight')) {
      servicesRequired.rimStraightening = true;
    }
    if (serviceLower.includes('weld')) {
      servicesRequired.welding = true;
    }
    if (serviceLower.includes('balance')) {
      servicesRequired.wheelBalancing = true;
    }
    if (serviceLower.includes('polish')) {
      servicesRequired.rimPolishing = true;
    }
    if (serviceLower.includes('repair')) {
      servicesRequired.rimRepair = true;
    }
  });

  return servicesRequired;
};

  // Update the autoPopulateFromPreChecklist function to not overwrite opportunity data
  const autoPopulateFromPreChecklist = () => {
    if (!preChecklist || autoPopulated) return;

    try {
      
      // Extract services from pre-checklist
      const servicesFromPreChecklist = preChecklist.services?.actualService || [];
      
      // Map pre-checklist services to our service structure
      const mappedServices = {
        brakeDiscSkimming: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('brake') || 
          s.toLowerCase().includes('skimming')
        ),
        diamondCutting: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('diamond') || 
          s.toLowerCase().includes('cutting')
        ),
        powderCoating: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('powder') || 
          s.toLowerCase().includes('coating')
        ),
        rimStraightening: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('straight') || 
          s.toLowerCase().includes('straightening')
        ),
        welding: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('weld')
        ),
        wheelBalancing: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('balance') || 
          s.toLowerCase().includes('balancing')
        ),
        rimPolishing: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('polish')
        ),
        rimRepair: servicesFromPreChecklist.some(s => 
          s.toLowerCase().includes('repair')
        ),
      };
      
      // Extract powder coating color
      const powderCoatingRAL = preChecklist.powderCoating?.colourRAL || '';
      
      // Extract other details
      const wheelNutsTotal = preChecklist.wheelNutsTotal || 16;
      const nozzleCapsTotal = preChecklist.nozzleCapsTotal || 0;
      const nozzleCapsType = preChecklist.nozzleCapsType || 'plastic';
      const lockNutsTotal = preChecklist.lockNutsTotal || 4;
      const centerCaps = preChecklist.centerCaps || '';
      const tpmsSensors = preChecklist.tpmsSensorsFitted || false;
      
      // Extract tire brands
      const tireBrands = preChecklist.tireBrands || {
        fr: '',
        fl: '',
        br: '',
        bl: '',
        spare: '',
      };
      
      // If pre-checklist has a date, use it for start date
      let startDate = formData.startDate; // Keep existing date from opportunity
      if (preChecklist.serviceIntake?.date) {
        try {
          startDate = format(parseISO(preChecklist.serviceIntake.date), 'yyyy-MM-dd');
        } catch (e) {
          console.warn('Could not parse pre-checklist date:', e);
        }
      }
      
      // Update form data with pre-checklist information
      const updatedFormData: Partial<FormData> = {
        // Services from pre-checklist
        servicesRequired: mappedServices,
        
        // Powder coating details
        powderCoatingRAL: powderCoatingRAL,
        
        // Accessories
        wheelNutsTotal: wheelNutsTotal,
        nozzleCapsTotal: nozzleCapsTotal,
        nozzleCapsType: nozzleCapsType,
        lockNutsTotal: lockNutsTotal,
        tpmsSensors: tpmsSensors,
        
        // Start date from pre-checklist
        startDate: startDate,
        
        // Job description - enhance with pre-checklist services if needed
        jobDescription: formData.jobDescription || getServiceDescriptionFromPreChecklist(servicesFromPreChecklist, powderCoatingRAL),
      };
      
      setFormData(prev => ({ 
        ...prev, 
        ...updatedFormData,
        // DO NOT overwrite job title from opportunity
      }));
      
      showToast('Pre-checklist service data loaded successfully', 'success');
      
    } catch (error) {
      console.error('Error auto-populating from pre-checklist:', error);
      showToast('Error loading pre-checklist service details', 'warning');
    }
  };

  // Helper function to generate service description from pre-checklist
  const getServiceDescriptionFromPreChecklist = (services: string[], color?: string): string => {
    const serviceList = services.join(', ');
    if (color) {
      return `${serviceList} • Color: ${color}`;
    }
    return serviceList;
  };

  const fetchTechnicians = async () => {
    try {
      const users = await userService.getAllUsers();
      const technicianUsers = users.filter(user => {
        if (!user.active) return false;
        const roleName = userService.getUserRoleName(user);
        return roleName?.toLowerCase() === 'technician';
      });
      setTechnicians(technicianUsers);
      
    } catch (error) {
      console.error('Error fetching technicians:', error);
      showToast('Failed to load technicians', 'error');
    }
  };

  const fetchParts = async () => {
    // Diamond Rims specific parts
    setParts([
      { _id: '1', partNumber: 'PC-KIT-001', name: 'Powder Coating Kit', description: 'Complete powder coating materials kit', unitPrice: 85.99, category: 'Coating', stock: 25 },
      { _id: '2', partNumber: 'DC-BIT-002', name: 'Diamond Cutting Bit Set', description: 'Precision diamond cutting bits', unitPrice: 150.50, category: 'Cutting', stock: 12 },
      { _id: '3', partNumber: 'RIM-WELD-003', name: 'Rim Welding Rods', description: 'Aluminum rim welding rods', unitPrice: 45.75, category: 'Repair', stock: 38 },
      { _id: '4', partNumber: 'BAL-WGT-004', name: 'Wheel Balance Weights', description: 'Self-adhesive wheel balance weights', unitPrice: 12.99, category: 'Balancing', stock: 150 },
      { _id: '5', partNumber: 'PRIMER-005', name: 'Rim Primer', description: 'High-temp rim primer', unitPrice: 28.00, category: 'Coating', stock: 45 },
      { _id: '6', partNumber: 'CLEAR-006', name: 'Clear Coat', description: 'UV-resistant clear coat', unitPrice: 35.50, category: 'Coating', stock: 32 },
      { _id: '7', partNumber: 'TPMS-007', name: 'TPMS Sensor Kit', description: 'Complete TPMS sensor replacement kit', unitPrice: 89.99, category: 'Electronics', stock: 18 },
      { _id: '8', partNumber: 'NUTS-008', name: 'Wheel Nut Set', description: 'Complete wheel nut set (16 pcs)', unitPrice: 42.50, category: 'Hardware', stock: 56 },
    ]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
        newValue = value ? parseFloat(value) : 0;
    } else if (type === 'checkbox') {
        const target = e.target as HTMLInputElement;
        newValue = target.checked;
    }
    
    // Automatically convert job title to uppercase
    if (name === 'jobTitle') {
        newValue = value.toUpperCase();
    }
    
    if (name === 'assignedTo') {
      const tech = technicians.find(t => t.id === value);
      setSelectedTechnician(tech || null);
    }
    
    setFormData(prev => {
      const updated = { ...prev, [name]: newValue };
      
      // Recalculate totals if labor cost changes
      if (name === 'laborCost') {
        const partsTotal = updated.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
        updated.totalCost = (updated.laborCost || 0) + partsTotal;
      }
      
      return updated;
    });
  };

  const handleServiceToggle = (serviceId: string) => {
    setFormData(prev => ({
      ...prev,
      servicesRequired: {
        ...prev.servicesRequired,
        [serviceId]: !prev.servicesRequired[serviceId as keyof typeof prev.servicesRequired]
      }
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddNote = () => {
    if (formData.newNote.trim()) {
      setFormData(prev => ({
        ...prev,
        notes: [...prev.notes, `${format(new Date(), 'HH:mm')}: ${prev.newNote.trim()}`],
        newNote: ''
      }));
      showToast('Note added', 'success');
    }
  };

  const handleRemoveNote = (index: number) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    if (!formData.assignedTo.trim()) errors.push('Technician assignment is required');
    if (!formData.startDate) errors.push('Start date is required');
    if (!formData.startTime) errors.push('Start time is required');
    
    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Prepare job card data
      const createData: CreateJobCardData = {
        opportunityId: formData.opportunityId,
        workOrderId: workOrderId,
        jobTitle: formData.jobTitle,
        jobDescription: getServiceDescription(), // Use concise service description
        assignedTo: formData.assignedTo, // Include technician assignment
        estimatedHours: formData.estimatedHours || 0,
        status: 'pending',
        priority: formData.priority || 'medium',
      };
      
      // Create job card
      const newJobCard = await jobCardService.createJobCard(createData);
      
      showToast('Diamond Rims Job Card created successfully!', 'success');
      
      // Link to work order if applicable
      if (workOrderId && (newJobCard._id || newJobCard.id)) {
        try {
          const jobCardId = newJobCard._id || newJobCard.id;
          await workOrderService.addJobCardToWorkOrder(workOrderId, jobCardId);
        } catch (updateError) {
          console.error('Error linking job card to work order:', updateError);
          showToast('Job card created but could not link to work order', 'warning');
        }
      }

      // Navigate back
      if (workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}?t=${Date.now()}`);
      } else {
        router.push('/job-cards');
      }
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      showToast(`Failed to create job card: ${errorMessage}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Generate concise service description based on selected services
  const getServiceDescription = () => {
    const services: string[] = [];
    
    // Add selected services
    Object.entries(formData.servicesRequired).forEach(([key, value]) => {
      if (value) {
        const serviceName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        services.push(serviceName);
      }
    });
    
    // Add color if powder coating is selected
    if (formData.servicesRequired.powderCoating && formData.powderCoatingRAL) {
      services.push(`Color: ${formData.powderCoatingRAL}`);
    }
    
    // Add rim condition
    services.push(`Rim Condition: ${formData.rimConditionOverall}`);
    
    // Add rim details
    if (formData.rimBrand) {
      services.push(`Brand: ${formData.rimBrand}`);
    }
    if (formData.rimSize) {
      services.push(`Size: ${formData.rimSize}`);
    }
    
    return services.join(' • ');
  };

  const handleCancel = () => {
    if (source === 'workflow' && workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else {
      router.push('/job-cards');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Diamond Rims job card form...</p>
          {opportunityId && (
            <p className="text-sm text-gray-500 mt-2">Fetching opportunity: {opportunityId}</p>
          )}
        </div>
      </div>
    );
  }

  // Get pre-checklist services for display
  const preChecklistServices = preChecklist?.services?.actualService || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-bluee-50 via-white to-purple-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                disabled={submitting}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <DiamondIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  Create Job Card
                </h1>
              </div>
            </div>
            
            <div className="flex justify-between items-center gap-4 mt-6">
              <button
                type="button"
                onClick={() => {
                  if (workOrderId) {
                    router.push(`/orders/work-orders/${workOrderId}`);
                  } else {
                    router.push('/orders/work-orders');
                  }
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2 bg-white"
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel & Back to Work Order
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Pre-Checklist Summary Section */}
        {(preChecklist || opportunity || vehicleDetails) && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-emerald-100 rounded-xl p-4 border border-green-200">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-green-600" />
                <h3 className="font-bold text-gray-800">Pre-Checklist Information</h3>
              </div>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-md">
                Loaded from Checklist
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Customer Summary */}
              <div className="bg-white/60 p-3 rounded-lg">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Customer Information</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Name:</span> {formData.customerName || preChecklist?.customerDetails?.name || opportunity?.customer?.name || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {formData.customerPhone || preChecklist?.customerDetails?.mobile || opportunity?.customer?.phone || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {formData.customerEmail || preChecklist?.customerDetails?.email || opportunity?.customer?.email || 'Not specified'}
                  </p>
                </div>
              </div>
              
              {/* Vehicle Summary */}
              <div className="bg-white/60 p-3 rounded-lg">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Vehicle Information</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Registration:</span> {formData.regNumber || preChecklist?.carDetails?.licensePlate || vehicleDetails?.registrationNumber || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Make & Model:</span> {formData.carMake || preChecklist?.carDetails?.carMake || vehicleDetails?.make || ''} {formData.carModel || preChecklist?.carDetails?.carModel || vehicleDetails?.model || ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Year:</span> {formData.yom || preChecklist?.carDetails?.yearOfManufacture || vehicleDetails?.year || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Pre-Checklist Services Summary */}
            {preChecklistServices.length > 0 && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Services Selected in Pre-Checklist</h4>
                <div className="flex flex-wrap gap-2">
                  {preChecklistServices.map((service, index) => (
                    <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                      {service}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-purple-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Job Card Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Job Card Information</h2>
              
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
                {/* Job Title - From opportunity in uppercase */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle.toUpperCase()}
                    onChange={handleChange}
                    placeholder="e.g., JUSTIN JUSTIN'S SERVICE REQUEST"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-white uppercase font-bold"
                    required
                  />
                </div>

                {/* Job Description - Services only, no amounts */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Services <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleChange}
                    rows={2}
                    placeholder="e.g., Powder Coating, Diamond Cutting | Color: RAL 9010"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none"
                    required
                  />
                </div>

                {/* Show services summary */}
                {Object.values(formData.servicesRequired).some(value => value) && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800 mb-1">Selected Services:</p>
                    <div className="flex flex-wrap gap-2">
                      {diamondRimServices.map(service => {
                        if (formData.servicesRequired[service.id as keyof typeof formData.servicesRequired]) {
                          return (
                            <span key={service.id} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md flex items-center gap-1">
                              {service.icon}
                              {service.label}
                            </span>
                          );
                        }
                        return null;
                      })}
                      {formData.powderCoatingRAL && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md flex items-center gap-1">
                          <PaintBucket className="h-3 w-3" />
                          Color: {formData.powderCoatingRAL}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date and Time Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                Date & Time Information
              </h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="space-y-6">
                  {/* Start Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="time"
                          name="startTime"
                          value={formData.startTime}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Date & Time */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <div className="relative">
                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="time"
                          name="endTime"
                          value={formData.endTime}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Technician Assignment Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Technician Assignment
              </h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Assign Technician<span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        name="assignedTo"
                        value={formData.assignedTo}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none appearance-none"
                        required
                      >
                        <option value="">Select a Technician</option>
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name} ({tech.email})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {selectedTechnician && (
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {selectedTechnician.name?.charAt(0) || selectedTechnician.email?.charAt(0) || 'T'}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{selectedTechnician.name}</div>
                          <div className="text-sm text-gray-600">{selectedTechnician.email}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Technical Notes Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Technical Notes
              </h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <textarea
                  value={formData.technicianNotes}
                  onChange={(e) => handleInputChange('technicianNotes', e.target.value)}
                  placeholder="Enter technical notes, observations, and recommendations..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  For technician use only - technical specifications and service details
                </p>
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-700 text-white font-semibold rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Create Diamond Rims Job Card
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}