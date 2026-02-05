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
  Layers, Hexagon, Award, ShieldOff, FileText as NotesIcon
} from 'lucide-react';
import { jobCardService, CreateJobCardData } from '@/services/jobCardService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { userService, User } from '@/services/settings/userService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { workOrderService } from '@/services/workOrderService';
import { preChecklistService } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
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
  endDate: string;
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
  
  // Rim Services Required
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
  const [preChecklist, setPreChecklist] = useState<any>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [parts, setParts] = useState<any[]>([]);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [showCustomerSignature, setShowCustomerSignature] = useState(false);
  const [showTechnicianSignature, setShowTechnicianSignature] = useState(false);
  const customerSigRef = useRef<SignatureCanvas>(null);
  const technicianSigRef = useRef<SignatureCanvas>(null);
  
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
    endDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
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
    
    // Rim Services Required
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

  // Auto-populate form when opportunity is loaded
  useEffect(() => {
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load opportunity
      if (opportunityId) {
        const opp = await opportunityService.getOpportunityById(opportunityId, false);
        setOpportunity(opp);
        console.log('Loaded opportunity:', opp);
        
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
            console.error('Error loading vehicle:', vehError);
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
          
          // If pre-checklist has diamond rims data, populate form
          if (pc.checklistType === 'diamond_rims') {
            populateFromDiamondRimsPreChecklist(pc);
          }
        } catch (error) {
          console.error('Error loading pre-checklist:', error);
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

  const populateFromDiamondRimsPreChecklist = (preChecklist: any) => {
    try {
      console.log('Populating from Diamond Rims pre-checklist:', preChecklist);
      
      setFormData(prev => ({
        ...prev,
        customerName: preChecklist.customerDetails?.name || '',
        customerPhone: preChecklist.customerDetails?.mobile || '',
        customerEmail: preChecklist.customerDetails?.email || '',
        regNumber: preChecklist.carDetails?.licensePlate || '',
        carMake: preChecklist.carDetails?.carMake || '',
        carModel: preChecklist.carDetails?.carModel || '',
        yom: preChecklist.carDetails?.yearOfManufacture || '',
        mileage: preChecklist.carDetails?.mileage || '',
        
        // Rim services from pre-checklist
        servicesRequired: {
          ...prev.servicesRequired,
          brakeDiscSkimming: preChecklist.services?.actualService?.includes('Brake Disc Skimming') || false,
          diamondCutting: preChecklist.services?.actualService?.includes('Diamond Cutting') || false,
          powderCoating: preChecklist.services?.actualService?.includes('Powder Coating') || false,
          rimStraightening: preChecklist.services?.actualService?.includes('Rim Straightening') || false,
          welding: preChecklist.services?.actualService?.includes('Welding') || false,
          wheelBalancing: preChecklist.services?.actualService?.includes('Wheel Balancing') || false,
        },
        
        // Powder coating details
        powderCoatingRAL: preChecklist.powderCoating?.colourRAL || '',
        
        // Accessories
        wheelNutsTotal: preChecklist.wheelNutsTotal || 16,
        nozzleCapsTotal: preChecklist.nozzleCapsTotal || 0,
        nozzleCapsType: preChecklist.nozzleCapsType || 'plastic',
        lockNutsTotal: preChecklist.lockNutsTotal || 4,
        centerCaps: preChecklist.centerCaps || '',
        tpmsSensors: preChecklist.tpmsSensorsFitted || false,
        
        // Tire details
        tireBrands: preChecklist.tireBrands || prev.tireBrands,
        tireDOT: preChecklist.tireDOT || prev.tireDOT,
        
        // Additional information
        technicianNotes: preChecklist.additionalInformation || '',
        
        // Job title based on services - This should appear in Job Title segment
        jobTitle: `${preChecklist.customerDetails?.name || 'Customer'}'s ${preChecklist.services?.actualService?.join(', ') || 'Wheel Alignment'}`,
        jobDescription: `Rim services for ${preChecklist.carDetails?.carMake || ''} ${preChecklist.carDetails?.carModel || ''}. ${preChecklist.additionalInformation || ''}`
      }));
      
      showToast('Diamond Rims data loaded from pre-checklist', 'success');
    } catch (error) {
      console.error('Error populating from pre-checklist:', error);
    }
  };

  const autoPopulateFromOpportunity = () => {
    if (!opportunity || autoPopulated) return;

    try {
      console.log('Auto-populating from opportunity:', opportunity);
      
      // Extract customer name
      const customerName = opportunity.customer?.name || '';
      const customerPhone = opportunity.customer?.phone || '';
      const customerEmail = opportunity.customer?.email || '';
      
      // Get vehicle from opportunity vehicles array
      const primaryVehicle = opportunity.vehicles?.[0] || vehicleDetails || {};
      
      // Simple registration number extraction
      const getRegistrationNumber = (vehicle: any) => {
        if (!vehicle) return '';
        
        // Check common field names
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
      
      const registrationNumber = getRegistrationNumber(primaryVehicle);
      
      // Update form data with opportunity information
      const updatedFormData: Partial<FormData> = {
        opportunityId: opportunity._id || opportunityId || '',
        customerName: customerName,
        customerPhone: customerPhone,
        customerEmail: customerEmail,
        jobCardOwner: sessionStorage.getItem('userName') || 'Diamond Rims Technician',
        customerSource: opportunity.source || 'None',
        
        // Vehicle details
        regNumber: registrationNumber || '',
        carMake: primaryVehicle.make || '',
        carModel: primaryVehicle.model || '',
        yom: primaryVehicle.year?.toString() || '',
        mileage: primaryVehicle.mileage || '',
        
        // Job title based on customer name
        jobTitle: `${customerName}'s Wheel Alignment`,
        jobDescription: '',
        
        // Pricing
        quotedAmount: opportunity.total || 0,
      };
      
      setFormData(prev => ({ ...prev, ...updatedFormData }));
      setAutoPopulated(true);
      
      showToast('Opportunity data loaded successfully', 'success');
      
    } catch (error) {
      console.error('Error auto-populating from opportunity:', error);
      showToast('Error loading vehicle details from opportunity', 'warning');
    }
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

  const handleNestedChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section as keyof FormData],
        [field]: value
      }
    } as FormData));
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

  // Signature handling functions
  const clearSignature = (type: 'customer' | 'technician') => {
    if (type === 'customer' && customerSigRef.current) {
      customerSigRef.current.clear();
      setFormData(prev => ({ ...prev, customerSignature: '' }));
    } else if (type === 'technician' && technicianSigRef.current) {
      technicianSigRef.current.clear();
      setFormData(prev => ({ ...prev, technicianSignature: '' }));
    }
  };

  const saveSignature = (type: 'customer' | 'technician') => {
    if (type === 'customer' && customerSigRef.current) {
      const dataUrl = customerSigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setFormData(prev => ({ ...prev, customerSignature: dataUrl }));
      setShowCustomerSignature(false);
    } else if (type === 'technician' && technicianSigRef.current) {
      const dataUrl = technicianSigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setFormData(prev => ({ ...prev, technicianSignature: dataUrl }));
      setShowTechnicianSignature(false);
    }
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

  const handlePartChange = (index: number, field: string, value: string | number) => {
    setFormData(prev => {
      const partsUsed = [...prev.partsUsed];
      
      if (partsUsed[index]) {
        const updatedPart = {
          ...partsUsed[index],
          [field]: typeof value === 'string' && !['name', 'partNumber', 'description'].includes(field)
            ? parseFloat(value) || 0
            : value
        };
        
        if (field === 'quantity' || field === 'unitPrice') {
          updatedPart.totalCost = updatedPart.quantity * updatedPart.unitPrice;
        }
        
        partsUsed[index] = updatedPart;
      }
      
      const partsCost = partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
      const totalCost = partsCost + (prev.laborCost || 0);
      
      return {
        ...prev,
        partsUsed,
        partsCost,
        totalCost
      };
    });
  };

  const addPart = () => {
    setFormData(prev => ({
      ...prev,
      partsUsed: [
        ...prev.partsUsed,
        {
          partId: '',
          partNumber: '',
          name: '',
          description: '',
          quantity: 1,
          unitPrice: 0,
          totalCost: 0
        }
      ]
    }));
  };

  const removePart = (index: number) => {
    setFormData(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index)
    }));
  };

  const handleSelectPart = (index: number, partId: string) => {
    const selectedPart = parts.find(p => p._id === partId);
    if (selectedPart) {
      handlePartChange(index, 'partId', selectedPart._id);
      handlePartChange(index, 'partNumber', selectedPart.partNumber);
      handlePartChange(index, 'name', selectedPart.name);
      handlePartChange(index, 'description', selectedPart.description || '');
      handlePartChange(index, 'unitPrice', selectedPart.unitPrice);
      showToast(`Added part: ${selectedPart.name}`, 'success');
    }
  };

  const validateForm = (): boolean => {
    const errors: string[] = [];
    
    if (!formData.opportunityId) errors.push('Opportunity ID is required');
    if (!formData.jobTitle.trim()) errors.push('Job title is required');
    if (!formData.customerName.trim()) errors.push('Customer name is required');
    
    // Check if at least one service is selected
    const hasService = Object.values(formData.servicesRequired).some(value => value === true);
    if (!hasService) errors.push('Please select at least one rim service');
    
    if (errors.length > 0) {
      showToast(errors.join(', '), 'error');
      return false;
    }
    
    return true;
  };

  const calculateTotals = () => {
    const partsTotal = formData.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
    const laborCost = formData.laborCost || 0;
    const totalCost = partsTotal + laborCost;
    
    return { partsTotal, laborCost, totalCost };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      
      // Prepare job card data - simplified based on requirements
      const createData: CreateJobCardData = {
        opportunityId: formData.opportunityId,
        workOrderId: workOrderId,
        jobTitle: formData.jobTitle,
        jobDescription: getServiceDescription(), // Use concise service description
        assignedTo: '', // Removed as per requirements (first come first served)
        estimatedHours: formData.estimatedHours || 0,
        status: 'pending',
        priority: formData.priority || 'medium',
      };
      
      console.log('🔧 Creating Diamond Rims job card with data:', createData);
      
      // Create job card
      const newJobCard = await jobCardService.createJobCard(createData);
      console.log('✅ Job card created successfully:', newJobCard);
      
      showToast('Diamond Rims Job Card created successfully!', 'success');
      
      // Link to work order if applicable
      if (workOrderId && (newJobCard._id || newJobCard.id)) {
        try {
          const jobCardId = newJobCard._id || newJobCard.id;
          await workOrderService.addJobCardToWorkOrder(workOrderId, jobCardId);
          showToast('Job card linked to work order successfully!', 'success');
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
      console.error('❌ Error creating job card:', error);
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
                    <span className="font-medium">Name:</span> {formData.customerName || opportunity?.customer?.name || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Phone:</span> {formData.customerPhone || opportunity?.customer?.phone || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Email:</span> {formData.customerEmail || opportunity?.customer?.email || 'Not specified'}
                  </p>
                </div>
              </div>
              
              {/* Vehicle Summary */}
              <div className="bg-white/60 p-3 rounded-lg">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Vehicle Information</h4>
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Registration:</span> {formData.regNumber || vehicleDetails?.registrationNumber || 'Not specified'}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Make & Model:</span> {formData.carMake || vehicleDetails?.make || ''} {formData.carModel || vehicleDetails?.model || ''}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">Year:</span> {formData.yom || vehicleDetails?.year || 'Not specified'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Additional Pre-Checklist Details */}
            {preChecklist && (
              <div className="mt-4 pt-4 border-t border-green-200">
                <h4 className="font-medium text-gray-700 text-sm mb-2">Services Selected in Pre-Checklist</h4>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(formData.servicesRequired).map(([key, value]) => {
                    if (value) {
                      const serviceName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                      return (
                        <span key={key} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-md">
                          {serviceName}
                        </span>
                      );
                    }
                    return null;
                  })}
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
                {/* Job Title Segment */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g., James Mukabwa's Wheel Alignment"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none bg-white"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Service already selected in pre-checklist should appear here
                  </p>
                </div>

                {/* Services List - Brief and Concise */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Services Required
                  </label>
                  
                  {/* Services Checkboxes */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {diamondRimServices.map((service) => (
                      <div key={service.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                        <input
                          type="checkbox"
                          id={`service-${service.id}`}
                          checked={formData.servicesRequired[service.id as keyof typeof formData.servicesRequired]}
                          onChange={() => handleServiceToggle(service.id)}
                          className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`service-${service.id}`}
                          className="ml-3 flex items-center gap-2 text-gray-700 cursor-pointer flex-1"
                        >
                          {service.icon}
                          <span className="text-sm">{service.label}</span>
                        </label>
                      </div>
                    ))}
                  </div>

                  {/* Service Details Section */}
                  <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-700 mb-3">Service Specifications</h4>
                    
                    {/* Powder Coating Color if selected */}
                    {formData.servicesRequired.powderCoating && (
                      <div className="mb-3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Powder Coating Color
                        </label>
                        <select
                          value={formData.powderCoatingRAL}
                          onChange={(e) => handleInputChange('powderCoatingRAL', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        >
                          <option value="">Select Color</option>
                          {ralColors.map((color) => (
                            <option key={color} value={color}>{color}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    
                    {/* Rim Details */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rim Brand
                        </label>
                        <input
                          type="text"
                          value={formData.rimBrand}
                          onChange={(e) => handleInputChange('rimBrand', e.target.value)}
                          placeholder="e.g., BBS"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Rim Size
                        </label>
                        <input
                          type="text"
                          value={formData.rimSize}
                          onChange={(e) => handleInputChange('rimSize', e.target.value)}
                          placeholder="e.g., 18x8.5"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <NotesIcon className="h-5 w-5 text-purple-600" />
                    <label className="block text-sm font-medium text-gray-700">
                      Notes & Specifications
                    </label>
                  </div>
                  <textarea
                    name="jobCardNotes"
                    value={formData.jobCardNotes}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Any specifications the client may have concerning their vehicle or the service they have selected..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This section caters for any specifications the client may have concerning their vehicle or the service they have selected
                  </p>
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

            {/* Priority & Settings */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Priority & Settings</h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Priority Level
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange('priority', option.value)}
                          className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-2 ${
                            formData.priority === option.value
                              ? `${option.color} border-purple-500 ring-2 ring-purple-200`
                              : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span>{option.icon}</span>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          onChange={handleChange}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Completion Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          onChange={handleChange}
                          min={formData.startDate}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
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