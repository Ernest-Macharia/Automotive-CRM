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
  FileCheck, ClipboardList, Check
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
  
  // Functionality Testing
  highBeamFunctionality: string;
  lowBeamFunctionality: string;
  turnSignalFunctionality: string;
  fogLightFunctionality: string;
  brakeLightsFunctionality: string;
  parkingLightFunctionality: string;
  conditionOfRearLights: string;
  afsFunctionality: string;
  angelRingsFunctionality: string;
  daytimeRunningLightFunctionality: string;
  reverseLightFunctionality: string;
  descReverseLight: string;
  
  // Special Diagnosis
  frontEndDamages: string;
  descFrontEndDamages: string;
  conditionOfCurrentHeadlights: string;
  descConditionOfHeadlights: string;
  existingWiringOrElectricalIssues: string;
  descExistingWiringIssue: string;
  conditionOfFrontGrille: string;
  descConditionOfFrontGrille: string;
  conditionOfFrontBumper: string;
  descConditionOfFrontBumper: string;
  conditionOfFogLights: string;
  
  // AFS Headlight Inspection
  adaptiveFrontLightingSystemHeadlights: string;
  afsFunctionalityInspection: string;
  afsLevelingFunctionality: string;
  afsAutoAdjustmentFunctionality: string;
  afsManualSwitchOnAndOff: string;
  
  // Interior Inspection
  conditionOfHeadlightSwitch: string;
  functionalityOfHeadlightSwitch: string;
  conditionOfDashboardControlsAndIndicators: string;
  displayOfDashboardLights: string;
  conditionOfInteriorRoofLights: string;
  conditionOfInteriorWiring: string;
  conditionOfInteriorDoorLights: string;
  
  // Dashboard Warning Lights
  checkEngineLight: string;
  absWarningLight: string;
  airbagWarningLight: string;
  batteryWarningLights: string;
  tpmsWarningLight: string;
  otherWarningLights: string;
  
  // Customer Requirements
  desiredOutcomeAndPreference: string;
  
  // Legal Considerations
  complianceWithLocalLawsAndRegulations: string;
  
  // Product Selection
  selectedProducts: string;
  partOfInstallation: string;
  additionalAccessoriesNeeded: string;
  
  // Budget and Pricing
  agreedUponCost: string;
  
  // Installation Process
  complexityAssessmentAndPotentialChallenges: string;
  
  // Alignment and Calibration
  headlightAlignmentAndCalibration: string;
  additionalStepsOrEquipmentNeeded: string;

  // Signatures
  technicianSignature: string;
  customerSignature: string;
  acceptTerms: boolean;
  acceptDiagnosticCharges: boolean;
}

export default function JobCardCreate(mode = 'create',) {
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
    jobTitle: '',
    jobDescription: '',
    assignedTo: '',
    priority: 'medium',
    estimatedHours: 2,
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
    jobCardOwner: sessionStorage.getItem('userName') || 'Dalton Ongeche',
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
    
    // Functionality Testing - Default values
    highBeamFunctionality: '-None-',
    lowBeamFunctionality: '-None-',
    turnSignalFunctionality: '-None-',
    fogLightFunctionality: '-None-',
    brakeLightsFunctionality: '-None-',
    parkingLightFunctionality: '-None-',
    conditionOfRearLights: '-None-',
    afsFunctionality: '-None-',
    angelRingsFunctionality: '-None-',
    daytimeRunningLightFunctionality: '-None-',
    reverseLightFunctionality: '-None-',
    descReverseLight: '',
    
    // Special Diagnosis - Default values
    frontEndDamages: '-None-',
    descFrontEndDamages: '',
    conditionOfCurrentHeadlights: '-None-',
    descConditionOfHeadlights: '',
    existingWiringOrElectricalIssues: '-None-',
    descExistingWiringIssue: '',
    conditionOfFrontGrille: '-None-',
    descConditionOfFrontGrille: '',
    conditionOfFrontBumper: '-None-',
    descConditionOfFrontBumper: '',
    conditionOfFogLights: '-None-',
    
    // AFS Headlight Inspection - Default values
    adaptiveFrontLightingSystemHeadlights: '-None-',
    afsFunctionalityInspection: '-None-',
    afsLevelingFunctionality: '-None-',
    afsAutoAdjustmentFunctionality: '-None-',
    afsManualSwitchOnAndOff: '-None-',
    
    // Interior Inspection - Default values
    conditionOfHeadlightSwitch: '',
    functionalityOfHeadlightSwitch: '-None-',
    conditionOfDashboardControlsAndIndicators: '',
    displayOfDashboardLights: '-None-',
    conditionOfInteriorRoofLights: '-None-',
    conditionOfInteriorWiring: '-None-',
    conditionOfInteriorDoorLights: '-None-',
    
    // Dashboard Warning Lights - Default values
    checkEngineLight: '-None-',
    absWarningLight: '-None-',
    airbagWarningLight: '-None-',
    batteryWarningLights: '-None-',
    tpmsWarningLight: '-None-',
    otherWarningLights: '',
    
    // Customer Requirements
    desiredOutcomeAndPreference: '',
    
    // Legal Considerations
    complianceWithLocalLawsAndRegulations: '',
    
    // Product Selection
    selectedProducts: '',
    partOfInstallation: '',
    additionalAccessoriesNeeded: '',
    
    // Budget and Pricing
    agreedUponCost: '',
    
    // Installation Process
    complexityAssessmentAndPotentialChallenges: '',
    
    // Alignment and Calibration
    headlightAlignmentAndCalibration: '-None-',
    additionalStepsOrEquipmentNeeded: '-None-',

    // Signatures
    technicianSignature: '',
    customerSignature: '',
    acceptTerms: false,
    acceptDiagnosticCharges: false
  });

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200', icon: '🟢' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: '🔵' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: '🟡' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200', icon: '🔴' },
  ];

  // Dropdown options for functionality testing and inspections
  const inspectionOptions = ['-None-', 'Working', 'Not Working', 'Damaged', 'Requires Replacement', 'Needs Adjustment'];

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

      // Load pre-checklist if provided
      if (preChecklistId) {
        try {
          const pc = await preChecklistService.getPreChecklistById(preChecklistId);
          setPreChecklist(pc);
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
        jobCardOwner: sessionStorage.getItem('userName') || 'Dalton Ongeche',
        customerSource: opportunity.source || 'None',
        
        // Vehicle details
        regNumber: registrationNumber || '',
        carMake: primaryVehicle.make || '',
        carModel: primaryVehicle.model || '',
        yom: primaryVehicle.year?.toString() || '',
        mileage: primaryVehicle.mileage || '',
        
        // Job details from opportunity
        jobTitle: opportunity.subject || 'Headlight Service',
        jobDescription: opportunity.notes || '',
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
    // Mock parts data for headlights and related components
    setParts([
      { _id: '1', partNumber: 'HLB-001', name: 'LED Headlight Bulbs', description: 'High-performance LED headlight bulbs', unitPrice: 45.99, category: 'Lighting', stock: 42 },
      { _id: '2', partNumber: 'HLA-002', name: 'Headlight Assembly', description: 'Complete headlight assembly with housing', unitPrice: 250.50, category: 'Lighting', stock: 15 },
      { _id: '3', partNumber: 'AFS-003', name: 'AFS Control Module', description: 'Adaptive Front Lighting System control module', unitPrice: 120.75, category: 'Electrical', stock: 8 },
      { _id: '4', partNumber: 'FOG-004', name: 'Fog Light Kit', description: 'Complete fog light installation kit', unitPrice: 89.99, category: 'Lighting', stock: 23 },
      { _id: '5', partNumber: 'WIR-005', name: 'Wiring Harness', description: 'Headlight wiring harness', unitPrice: 35.00, category: 'Electrical', stock: 56 },
    ]);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      newValue = value ? parseFloat(value) : 0;
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
    if (!formData.regNumber.trim()) errors.push('Vehicle registration number is required');
    if (!formData.acceptTerms) errors.push('Please accept terms and conditions');
    if (!formData.acceptDiagnosticCharges) errors.push('Please accept diagnostic charges policy');
    
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
    
    // Prepare job card data
    const createData: CreateJobCardData = {
      opportunityId: formData.opportunityId,
      workOrderId: formData.workOrderId,
      jobTitle: formData.jobTitle,
      jobDescription: formData.jobDescription,
      assignedTo: formData.assignedTo || undefined,
      priority: formData.priority || 'medium',
      estimatedHours: formData.estimatedHours || 0,
      status: formData.status || 'pending'
    };
    
    console.log('Creating job card with data:', createData);
    
    // Create job card
    const newJobCard = await jobCardService.createJobCard(createData);
    showToast('Job card created successfully!', 'success');
    
    // Update work order with job card ID and mark job card stage as completed
    if (workOrderId) {
      try {
        await workOrderService.updateWorkOrder(workOrderId, {
          updatedAt: new Date().toISOString(),
          // Add job card to work order's jobCards array if not already
        });
      } catch (updateError) {
        console.error('Error updating work order:', updateError);
      }
    }
    
        // IMPORTANT:
    // We DO NOT auto-transition to Post-Checklist when a Job Card is created.
    // The user must start and complete the Job Card explicitly, then we transition on completion
    // (handled from JobCardDetail when status is marked as 'completed').

// NAVIGATE BACK TO WORK ORDER DETAILS PAGE
    if (workOrderId) {
      // Redirect back to work order details
      router.push(`/orders/work-orders/${workOrderId}`);
    } else if (source === 'workflow' && opportunityId) {
      // If no workOrderId but have opportunityId, try to get work order
      const workOrders = await workOrderService.getWorkOrdersByOpportunity(opportunityId);
      if (workOrders.length > 0) {
        router.push(`/orders/work-orders/${workOrders[0]._id}`);
      } else if (newJobCard._id || newJobCard.id) {
        // Fallback: Go to job card details
        router.push(`/job-cards/${newJobCard._id || newJobCard.id}`);
      } else {
        router.push('/job-cards');
      }
    } else if (newJobCard._id || newJobCard.id) {
      // Fallback: Go to job card details
      router.push(`/job-cards/${newJobCard._id || newJobCard.id}`);
    } else {
      router.push('/job-cards');
    }
    
  } catch (error: any) {
    console.error('Error creating job card:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
    showToast(`Failed to create job card: ${errorMessage}`, 'error');
  } finally {
    setSubmitting(false);
  }
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job card form...</p>
          {opportunityId && (
            <p className="text-sm text-gray-500 mt-2">Fetching opportunity: {opportunityId}</p>
          )}
        </div>
      </div>
    );
  }

    if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading job card form...</p>
          {opportunityId && (
            <p className="text-sm text-gray-500 mt-2">Fetching opportunity: {opportunityId}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 shadow-xl">
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
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Create Job Card</h1>
                <p className="text-blue-100 text-sm">
                  {opportunity ? `For: ${opportunity.subject}` : 'Create a new work order for service tasks'}
                </p>
                {opportunityId && (
                  <p className="text-blue-200 text-xs mt-1">
                    Opportunity ID: {opportunityId.slice(-8)}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center gap-4 mt-6 pt-6 border-t border-gray-200">
              {/* Cancel & Back Button */}
              <button
                type="button"
                onClick={() => {
                  if (workOrderId) {
                    router.push(`/orders/work-orders/${workOrderId}`);
                  } else {
                    router.push('/orders/work-orders');
                  }
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                disabled={submitting}
              >
                <ArrowLeft className="h-4 w-4" />
                Cancel & Back to Work Order
              </button>
              
              {/* Create Job Card Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 flex items-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:shadow-xl"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {mode === 'edit' ? 'Update Job Card' : 'Create Job Card'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Opportunity Info Banner */}
        {opportunity && (
          <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-gray-800">Opportunity Information</h3>
                <p className="text-sm text-gray-600">
                  {opportunity.subject} • {opportunity.customer?.name}
                  {opportunity.customer?.companyName && ` • ${opportunity.customer.companyName}`}
                </p>
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
                  onClick={autoPopulateFromOpportunity}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  <Sparkles className="h-3 w-3" />
                  Refresh Data
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-6 border border-blue-100">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Customer & Vehicle Information */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Customer & Vehicle Information</h2>
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer Information */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <UserIcon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-800">Customer Information</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                        <input
                          type="text"
                          name="customerName"
                          value={formData.customerName}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Customer name"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone No. *</label>
                          <input
                            type="text"
                            name="customerPhone"
                            value={formData.customerPhone}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Phone number"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                          <input
                            type="email"
                            name="customerEmail"
                            value={formData.customerEmail}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Email address"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Job Card Owner</label>
                        <input
                          type="text"
                          name="jobCardOwner"
                          value={formData.jobCardOwner}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Job card owner"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Residence</label>
                          <input
                            type="text"
                            name="customerResidence"
                            value={formData.customerResidence}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Residence"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                          <select
                            name="customerSource"
                            value={formData.customerSource}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="None">None</option>
                            <option value="Walk-in">Walk-in</option>
                            <option value="Referral">Referral</option>
                            <option value="Online">Online</option>
                            <option value="Phone">Phone</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Other</label>
                          <input
                            type="text"
                            name="customerOther"
                            value={formData.customerOther}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Other information"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                          <input
                            type="text"
                            name="customerOccupation"
                            value={formData.customerOccupation}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Occupation"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Car Details */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CarIcon className="h-5 w-5 text-blue-600" />
                      <h4 className="font-semibold text-gray-800">Car Details</h4>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Reg Number *</label>
                        <input
                          type="text"
                          name="regNumber"
                          value={formData.regNumber}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Registration number"
                          required
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Car Model</label>
                          <input
                            type="text"
                            name="carModel"
                            value={formData.carModel}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Car model"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">YOM</label>
                          <input
                            type="text"
                            name="yom"
                            value={formData.yom}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Year of manufacture"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                          <input
                            type="text"
                            name="mileage"
                            value={formData.mileage}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Mileage"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Car Make</label>
                          <input
                            type="text"
                            name="carMake"
                            value={formData.carMake}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Car make"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Job Details Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    placeholder="e.g., Headlight Replacement & AFS Calibration"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="jobDescription"
                    value={formData.jobDescription}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Provide detailed description of work to be performed..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none resize-none"
                    required
                  />
                </div>

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
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Functionality Testing Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Functionality Testing</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">High beam functionality</label>
                    <select
                      name="highBeamFunctionality"
                      value={formData.highBeamFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low beam functionality</label>
                    <select
                      name="lowBeamFunctionality"
                      value={formData.lowBeamFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Turn signal functionality</label>
                    <select
                      name="turnSignalFunctionality"
                      value={formData.turnSignalFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Fog light functionality (if applicable)</label>
                    <select
                      name="fogLightFunctionality"
                      value={formData.fogLightFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brake lights functionality</label>
                    <select
                      name="brakeLightsFunctionality"
                      value={formData.brakeLightsFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parking Light functionality</label>
                    <select
                      name="parkingLightFunctionality"
                      value={formData.parkingLightFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of rear lights</label>
                    <select
                      name="conditionOfRearLights"
                      value={formData.conditionOfRearLights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AFS functionality</label>
                    <select
                      name="afsFunctionality"
                      value={formData.afsFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Angel Rings functionality (if applicable)</label>
                    <select
                      name="angelRingsFunctionality"
                      value={formData.angelRingsFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Daytime running light functionality (if applicable)</label>
                    <select
                      name="daytimeRunningLightFunctionality"
                      value={formData.daytimeRunningLightFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reverse light functionality</label>
                    <select
                      name="reverseLightFunctionality"
                      value={formData.reverseLightFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desc Reverse Light</label>
                    <textarea
                      name="descReverseLight"
                      value={formData.descReverseLight}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description of reverse light condition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Special Diagnosis Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">Special Diagnosis</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Front-end damages</label>
                    <select
                      name="frontEndDamages"
                      value={formData.frontEndDamages}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desc Front-end Damages</label>
                    <textarea
                      name="descFrontEndDamages"
                      value={formData.descFrontEndDamages}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description of front-end damages"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of current headlights</label>
                    <select
                      name="conditionOfCurrentHeadlights"
                      value={formData.conditionOfCurrentHeadlights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desc. condition of headlights</label>
                    <textarea
                      name="descConditionOfHeadlights"
                      value={formData.descConditionOfHeadlights}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description of headlight condition"
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Existing wiring or electrical issues</label>
                    <select
                      name="existingWiringOrElectricalIssues"
                      value={formData.existingWiringOrElectricalIssues}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desc. existing wiring issue</label>
                    <textarea
                      name="descExistingWiringIssue"
                      value={formData.descExistingWiringIssue}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description of wiring issues"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of front grille</label>
                    <select
                      name="conditionOfFrontGrille"
                      value={formData.conditionOfFrontGrille}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desc. condition of front grille</label>
                    <textarea
                      name="descConditionOfFrontGrille"
                      value={formData.descConditionOfFrontGrille}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description of front grille condition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of front bumper</label>
                    <select
                      name="conditionOfFrontBumper"
                      value={formData.conditionOfFrontBumper}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Desc. condition of front bumper</label>
                    <textarea
                      name="descConditionOfFrontBumper"
                      value={formData.descConditionOfFrontBumper}
                      onChange={handleChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Description of front bumper condition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of fog lights (if applicable)</label>
                    <select
                      name="conditionOfFogLights"
                      value={formData.conditionOfFogLights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* AFS Headlight Inspection Section */}
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-4">AFS Headlight Inspection</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Adaptive Front Lighting System (AFS) headlights</label>
                  <select
                    name="adaptiveFrontLightingSystemHeadlights"
                    value={formData.adaptiveFrontLightingSystemHeadlights}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {inspectionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AFS functionality</label>
                  <select
                    name="afsFunctionalityInspection"
                    value={formData.afsFunctionalityInspection}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {inspectionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AFS leveling functionality</label>
                  <select
                    name="afsLevelingFunctionality"
                    value={formData.afsLevelingFunctionality}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {inspectionOptions.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">AFS auto-adjustment functionality</label>
                    <select
                      name="afsAutoAdjustmentFunctionality"
                      value={formData.afsAutoAdjustmentFunctionality}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">AFS manual switch on and off</label>
                    <select
                      name="afsManualSwitchOnAndOff"
                      value={formData.afsManualSwitchOnAndOff}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Interior Inspection Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Interior Inspection</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of headlight switch (describe)</label>
                    <input
                      type="text"
                      name="conditionOfHeadlightSwitch"
                      value={formData.conditionOfHeadlightSwitch}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe headlight switch condition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Functionality of headlight switch</label>
                    <select
                      name="functionalityOfHeadlightSwitch"
                      value={formData.functionalityOfHeadlightSwitch}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of dashboard controls and indicators</label>
                    <input
                      type="text"
                      name="conditionOfDashboardControlsAndIndicators"
                      value={formData.conditionOfDashboardControlsAndIndicators}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe dashboard controls condition"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display of dashboard lights</label>
                    <select
                      name="displayOfDashboardLights"
                      value={formData.displayOfDashboardLights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of interior roof lights (if applicable)</label>
                    <select
                      name="conditionOfInteriorRoofLights"
                      value={formData.conditionOfInteriorRoofLights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of interior wiring (if applicable)</label>
                    <select
                      name="conditionOfInteriorWiring"
                      value={formData.conditionOfInteriorWiring}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Condition of interior door lights (if applicable)</label>
                    <select
                      name="conditionOfInteriorDoorLights"
                      value={formData.conditionOfInteriorDoorLights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Dashboard Warning Lights Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Dashboard Warning Lights</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Check Engine Light</label>
                    <select
                      name="checkEngineLight"
                      value={formData.checkEngineLight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ABS Warning Light</label>
                    <select
                      name="absWarningLight"
                      value={formData.absWarningLight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Airbag Warning Light</label>
                    <select
                      name="airbagWarningLight"
                      value={formData.airbagWarningLight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Battery Warning Lights</label>
                    <select
                      name="batteryWarningLights"
                      value={formData.batteryWarningLights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">TPMS Warning Light</label>
                    <select
                      name="tpmsWarningLight"
                      value={formData.tpmsWarningLight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Other Warning Lights (specify)</label>
                    <input
                      type="text"
                      name="otherWarningLights"
                      value={formData.otherWarningLights}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Specify other warning lights"
                    />
                  </div>
                </div>
              </div>

              {/* Customer Requirements Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Customer Requirements</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Desired outcome and preference</label>
                  <textarea
                    name="desiredOutcomeAndPreference"
                    value={formData.desiredOutcomeAndPreference}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="Enter customer's desired outcome and preferences..."
                  />
                  <button
                    type="button"
                    className="mt-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors"
                    onClick={() => {
                      const newRequirement = prompt('Enter new requirement:');
                      if (newRequirement) {
                        setFormData(prev => ({
                          ...prev,
                          desiredOutcomeAndPreference: prev.desiredOutcomeAndPreference 
                            ? prev.desiredOutcomeAndPreference + '\n• ' + newRequirement
                            : '• ' + newRequirement
                        }));
                      }
                    }}
                  >
                    <Plus className="h-4 w-4 inline mr-1" />
                    Add row
                  </button>
                </div>
              </div>

              {/* Legal Considerations Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Legal Considerations</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Compliance with local laws and regulations</label>
                  <textarea
                    name="complianceWithLocalLawsAndRegulations"
                    value={formData.complianceWithLocalLawsAndRegulations}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="Enter legal compliance notes..."
                  />
                </div>
              </div>

              {/* Product Selection Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Product Selection</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selected products</label>
                    <textarea
                      name="selectedProducts"
                      value={formData.selectedProducts}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      placeholder="Enter selected products..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Part of installation</label>
                    <textarea
                      name="partOfInstallation"
                      value={formData.partOfInstallation}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      placeholder="Enter installation parts..."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Additional accessories needed</label>
                    <textarea
                      name="additionalAccessoriesNeeded"
                      value={formData.additionalAccessoriesNeeded}
                      onChange={handleChange}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                      placeholder="Enter additional accessories needed..."
                    />
                  </div>
                </div>
              </div>

              {/* Budget and Pricing Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Budget and Pricing</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Agreed-upon cost (including labor and parts)</label>
                  <textarea
                    name="agreedUponCost"
                    value={formData.agreedUponCost}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="Enter agreed-upon cost details..."
                  />
                </div>
              </div>

              {/* Installation Process Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Installation Process</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Complexity assessment and potential challenges</label>
                  <textarea
                    name="complexityAssessmentAndPotentialChallenges"
                    value={formData.complexityAssessmentAndPotentialChallenges}
                    onChange={handleChange}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none"
                    placeholder="Enter complexity assessment and potential challenges..."
                  />
                </div>
              </div>

              {/* Alignment and Calibration Section */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Alignment and Calibration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Headlight alignment and calibration</label>
                    <select
                      name="headlightAlignmentAndCalibration"
                      value={formData.headlightAlignmentAndCalibration}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional steps or equipment needed</label>
                    <select
                      name="additionalStepsOrEquipmentNeeded"
                      value={formData.additionalStepsOrEquipmentNeeded}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      {inspectionOptions.map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Assignment & Settings */}
              <div>
                <h2 className="text-lg font-bold text-gray-800 mb-4">Assignment & Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Assignment Section */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Assignment</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Assign Technician
                        </label>
                        <div className="relative">
                          <select
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none appearance-none"
                          >
                            <option value="">Unassigned</option>
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
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
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

                  {/* Settings Section */}
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Settings</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          {priorityOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => handleInputChange('priority', option.value)}
                              className={`px-3 py-2.5 text-sm font-medium rounded-lg border transition-all flex items-center justify-center gap-2 ${
                                formData.priority === option.value
                                  ? `${option.color} border-blue-500 ring-2 ring-blue-200`
                                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              <span>{option.icon}</span>
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="relative">
                          <select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none appearance-none"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parts & Cost
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Parts & Cost</h2>
                  <button
                    type="button"
                    onClick={addPart}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-xl text-sm font-medium hover:from-blue-100 hover:to-blue-200 shadow-sm border border-blue-200 hover:border-blue-300 transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add Part
                  </button>
                </div>
                
                <div className="space-y-4">
                  {formData.partsUsed.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <h4 className="text-gray-700 font-medium mb-2">No parts added</h4>
                      <p className="text-gray-500 mb-4">Add parts that will be used for this job</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Part Number</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Qty</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Unit Price</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Total</th>
                            <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {formData.partsUsed.map((part, index) => (
                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="py-3 px-4">
                                <select
                                  value={part.partId}
                                  onChange={(e) => handleSelectPart(index, e.target.value)}
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white appearance-none min-w-[120px]"
                                >
                                  <option value="">Select Part</option>
                                  {parts.map(p => (
                                    <option key={p._id} value={p._id}>
                                      {p.partNumber}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="text"
                                  value={part.name}
                                  onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                                  placeholder="Part description"
                                  className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none min-w-[200px]"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={part.quantity}
                                  onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                  min="1"
                                  className="w-20 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                                />
                              </td>
                              <td className="py-3 px-4">
                                <input
                                  type="number"
                                  value={part.unitPrice}
                                  onChange={(e) => handlePartChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  min="0"
                                  step="0.01"
                                  className="w-32 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                                />
                              </td>
                              <td className="py-3 px-4 font-medium">
                                {jobCardService.formatCurrency(part.totalCost)}
                              </td>
                              <td className="py-3 px-4">
                                <button
                                  type="button"
                                  onClick={() => removePart(index)}
                                  className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <div className="flex justify-end">
                          <div className="w-64 space-y-3">
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">
                                Labor Cost (KES)
                              </label>
                              <input
                                type="number"
                                name="laborCost"
                                value={formData.laborCost}
                                onChange={handleChange}
                                min="0"
                                step="0.01"
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                              />
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Parts Total:</span>
                              <span className="font-medium">{jobCardService.formatCurrency(totals.partsTotal)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Labor Cost:</span>
                              <span className="font-medium">{jobCardService.formatCurrency(formData.laborCost)}</span>
                            </div>
                            <div className="pt-3 border-t border-gray-200">
                              <div className="flex justify-between font-semibold">
                                <span>Total Estimate:</span>
                                <span className="text-blue-600">{jobCardService.formatCurrency(totals.totalCost)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div> */}

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
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-semibold rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Create Job Card
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