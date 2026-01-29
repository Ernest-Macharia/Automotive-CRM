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
  ExternalLink
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

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;
  
  const stepTitles = [
    'Service Selection',
    'Customer & Vehicle Details',
    'Pre-Service Inspection',
    'Terms & Conditions', 
    'Signatures & Uploads'
  ];
  
  const stepDescriptions = [
    'Select services for diamond rim processing',
    'Enter customer and vehicle information',
    'Inspect rim condition and select coating options',
    'Review terms, risks, and acceptance',
    'Sign and upload images'
  ];

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

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        if (checklist.checklistType === 'diamond_rims') {
          setFormData(checklist);
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
          
          if (opp.vehicles && opp.vehicles.length > 0) {
            const primaryVehicle = opp.vehicles[0];
            setVehicle(primaryVehicle);
            
            setFormData(prev => ({
              ...prev,
              opportunityId,
              vehicleId: primaryVehicle._id || vehicleId || ''
            }));
          } else if (vehicleId) {
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
      
      const customerName = opportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      const primaryVehicle = opportunity.vehicles?.[0] || {};
      
      const getRegistrationNumber = (vehicle: any) => {
        if (!vehicle) return '';
        
        const fields = [
          'registrationNumber',
          'regNumber',
          'regNo',
          'licensePlate',
          'plateNumber'
        ];
        
        for (const field of fields) {
          if (vehicle[field]) {
            return vehicle[field];
          }
        }
        
        return '';
      };
      
      const licensePlate = getRegistrationNumber(primaryVehicle);
      let totalPrice = opportunity.total || 0;

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
          carMake: primaryVehicle.make || vehicle?.make || '',
          carModel: primaryVehicle.model || vehicle?.model || '',
          yearOfManufacture: (primaryVehicle.year || vehicle?.year)?.toString() || '',
          mileage: primaryVehicle.mileage || ''
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

      // Validate required fields
      if (!formData.customerDetails.firstName || 
          !formData.customerDetails.lastName ||
          !formData.customerDetails.mobile ||
          !formData.customerDetails.email) {
        showToast('Please fill in all required customer details', 'error');
        setCurrentStep(2);
        setSubmitting(false);
        return;
      }
      
    //   if (!formData.carDetails.licensePlate) {
    //     showToast('License plate is required', 'error');
    //     setCurrentStep(2);
    //     setSubmitting(false);
    //     return;
    //   }
      
      if (formData.services.actualService.length === 0) {
        showToast('Please select at least one service', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }
      
      if (!formData.deliveryMode) {
        showToast('Please select delivery mode', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }
      
      if (formData.preServiceInspection.condition.length === 0) {
        showToast('Please select at least one condition', 'error');
        setCurrentStep(3);
        setSubmitting(false);
        return;
      }
      
      if (!formData.mustKnowAccepted) {
        showToast('Please acknowledge the MUST KNOW section', 'error');
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
      
    //   if (!formData.clientSignature) {
    //     showToast('Client signature is required', 'error');
    //     setCurrentStep(5);
    //     setSubmitting(false);
    //     return;
    //   }
      
    //   if (!formData.inspectorSignature) {
    //     showToast('Inspector signature is required', 'error');
    //     setCurrentStep(5);
    //     setSubmitting(false);
    //     return;
    //   }

      // Prepare submission data
      const submissionData = {
        ...formData,
        approved: false
      };

      console.log('Submitting diamond rims pre-checklist:', submissionData);

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData);
        showToast('Diamond Rims pre-checklist updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await preChecklistService.createPreChecklist(submissionData, userId);
        showToast('Diamond Rims pre-checklist created successfully', 'success');
        
        // Update work order with pre-checklist ID if needed
        if (workOrderId && result._id) {
          try {
            await workOrderService.updateWorkOrder(workOrderId, {
              preChecklistId: result._id
            });
          } catch (updateError) {
            console.error('Error updating work order:', updateError);
          }
        }
        
        // Auto-transition if applicable
        const hasSeriousIssues = formData.preServiceInspection.condition.some(cond => 
          ['Cracks', 'Bends', 'Previously Welded'].includes(cond)
        );
        
        try {
          // Client signs on the form, so we auto-approve immediately
          const approvedChecklist = await preChecklistService.approvePreChecklist(result._id, userId);

          const oppId = result.opportunityId || formData.opportunityId;
          if (oppId) {
            await lifecycleIntegrationService.transitionToStage(
              oppId,
              'jobcard',
              {
                documentId: approvedChecklist?._id || result._id,
                completedBy: userId,
                notes: 'Auto-approved (client signed on form)'
              }
            );
          }
        } catch (approvalError) {
          console.warn('Auto-approval/transition failed:', approvalError);
        }
      }

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
        ['License Plate:', formData.carDetails.licensePlate, '', '', '', '', ''],
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

  const renderProgressStepper = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {[1, 2, 3, 4, 5].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
              currentStep === stepNumber 
                ? 'bg-blue-600 border-blue-600 text-white scale-110 shadow-lg' 
                : currentStep > stepNumber 
                  ? 'bg-green-100 border-green-500 text-green-600'
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
                currentStep > stepNumber ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Diamond Rims pre-checklist form...</p>
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
                {mode === 'edit' ? 'Edit Diamond Rims Pre-Checklist' : 'Diamond Rims Service Intake'}
              </h1>
              <p className="text-purple-100">
                {mode === 'edit' 
                  ? `Editing: Diamond Rims Pre-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Professional Rim Repair & Customization Services'
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
        {/* Progress Stepper */}
        {renderProgressStepper()}
        
        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[0]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[0]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-purple-600" />
                  Diamond Rim Services
                </h2>
                
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
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[1]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[1]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <UserType className="h-5 w-5 text-purple-600" />
                    Customer & Vehicle Details
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
                
                {/* Customer Details */}
                <div className="border-b pb-6">
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
                <div className="pt-6">
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
                        required
                      />
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
              
              <div className="bg-white rounded-2xl shadow-xl border p-6">
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
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[3]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[3]}</p>
                
                <div className="bg-white rounded-2xl shadow-xl border p-6">
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
                
                {/* NEW: TERMS AND CONDITIONS SECTION */}
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
            </div>
            )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[4]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[4]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-purple-600" />
                  Signatures & Uploads
                </h2>
                
                Signatures
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
            {/* Cancel & Back Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              disabled={submitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Cancel & Back
            </button>
            
            {/* Action Buttons */}
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
                  className="px-6 py-3 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
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
                      {mode === 'edit' ? 'Update Diamond Rims Checklist' : 'Create Diamond Rims Pre-Checklist'}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <TermsModal 
        isOpen={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        />
    </div>
  );
}