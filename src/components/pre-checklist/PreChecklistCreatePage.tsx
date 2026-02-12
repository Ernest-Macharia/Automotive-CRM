'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import PreChecklistPDF from './PreChecklistPDF';
import { userService, User } from '@/services/settings/userService';
import SignatureCanvas from 'react-signature-canvas';
import FileUploadSection from '@/components/pre-checklist/FileUploadSection';
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
  UserCheck,
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
  Edit,
  Search,
  ChevronRight,
  ExternalLink,
  Circle,
  RotateCw,
  Hammer,
  Gauge,
  PaintBucket
} from 'lucide-react';
import { preChecklistService, InspectionItem, ChecklistFile, CreatePreChecklistDto } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import TermsModal from '@/components/pre-checklist/TermsModal';

interface PreChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

type ServiceType = 'pickup_only' | 'workshop_installation' | 'mobile_service';
type InstallationTime = 'less_1_hour' | '1_2_hours' | '3_hours' | 'more_3_hours';
type DeliveryMethod = 'customer_pickup' | 'courier_delivery' | 'mobile_delivery_install';

export default function HeadlightPreChecklistCreatePage({ 
  mode = 'create', 
  checklistId 
}: PreChecklistCreatePageProps) {
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
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCustomerEdit, setShowCustomerEdit] = useState(false);
  const [showVehicleEdit, setShowVehicleEdit] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step titles and descriptions
  const stepTitles = [
    'Inspection Items',
    'Customer Details', 
    'Vehicle Details',
    'Installation Details',
    'Terms & Signatures'
  ];

  const stepDescriptions = [
    'Configure headlight inspection items and status',
    'Enter customer and inspector information',
    'Add vehicle and product/service details',
    'Set installation schedule and method',
    'Review terms and get signatures'
  ];

  // Form state - Matching Diamond Rims pattern
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    inspectorName: '',
    remarks: '',
    approved: false,
    
    // Service intake (matching Diamond Rims structure)
    serviceIntake: {
      date: new Date().toISOString().split('T')[0],
      customerServiceRep: sessionStorage.getItem('userName') || '',
      inspectorNotes: '',
      backendAccessCode: '',
      priorityLevel: 'normal',
      specialInstructions: ''
    },
    
    // Customer details - matching Diamond Rims DTO
    customerDetails: {
      name: '',
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
    },
    
    // Car details - matching Diamond Rims DTO
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
      vin: '',
    },
    
    // Services - matching Diamond Rims structure
    services: {
      actualService: [] as string[],
    },
    
    // Headlight specific fields mapped to Diamond Rims compatible structure
    serviceType: 'workshop_installation' as ServiceType,
    productServiceNeeded: '',
    productPrice: 0,
    servicePrice: 0,
    additionalInformation: '',
    
    installationDetails: {
      estimatedTime: '1_2_hours' as InstallationTime,
      assignedTechnician: '',
      workStartTime: new Date().toISOString()
    },
    
    deliveryPickupMethod: 'customer_pickup' as DeliveryMethod,
    
    // Headlight inspection items
    inspectionItems: [
      { item: 'High Beam', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Low Beam', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Daytime Running Light', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Turn Signal', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Fog Lights', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Parking Bulb', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Angel Lights', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Headlight Adjusters', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Adaptive Front Lights (AFS)', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Dimming Functionality', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Headlight Wiring and Connectors', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Beam Alignment', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Headlight Lens (Scratches, Cracks, Haziness)', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Water Proofing', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' },
      { item: 'Dashboard Warning Lights', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'vehicle' },
      { item: 'Bumper Condition', status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending', remarks: '', side: 'both' }
    ],
    
    // Terms acceptance
    acceptTerms: false,
    acceptDiagnosticCharges: false,
    clientSignature: '',
    inspectorSignature: '',
    clientSigningMethod: 'present',
    clientEmail: '',
    
    // Files and Uploads
    files: [] as ChecklistFile[],
    uploadedImages: [] as string[]
  });

  // Signature refs and state
  const [clientSignature, setClientSignature] = useState(formData.clientSignature);
  const [inspectorSignature, setInspectorSignature] = useState(formData.inspectorSignature);
  const [showClientSignature, setShowClientSignature] = useState(false);
  const [showInspectorSignature, setShowInspectorSignature] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);
  const inspectorSigRef = useRef<SignatureCanvas>(null);

  // Selected template
  const [selectedTemplate, setSelectedTemplate] = useState('headlight_basic');

  // Load related data
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode]);

  useEffect(() => {
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

  // Helper function to safely get ID from object or string
  const toId = (v: any): string => {
    if (!v) return '';
    return typeof v === 'string' ? v : (v._id ?? '');
  };

  // Map checklist to form data - Matching Diamond Rims pattern
  const mapChecklistToForm = (checklist: any) => {
    // Parse additionalInformation if it exists
    let additionalInfo = {};
    try {
      if (checklist?.additionalInformation) {
        additionalInfo = JSON.parse(checklist.additionalInformation);
      }
    } catch (e) {
      // If it's not JSON, treat as plain string
      additionalInfo = { notes: checklist.additionalInformation };
    }

    return {
      opportunityId: toId(checklist?.opportunityId),
      vehicleId: toId(checklist?.vehicleId),
      inspectedBy: toId(checklist?.inspectedBy) || sessionStorage.getItem('userId') || '',
      inspectorName: checklist?.inspectorName || '',
      remarks: checklist?.remarks || '',
      approved: !!checklist?.approved,
      
      serviceIntake: {
        date: checklist?.serviceIntake?.date || new Date().toISOString().split('T')[0],
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
        mobile: checklist?.customerDetails?.mobile || checklist?.customerDetails?.phone || '',
        email: checklist?.customerDetails?.email || '',
      },
      
      carDetails: {
        carMake: checklist?.carDetails?.carMake || checklist?.carDetails?.make || '',
        carModel: checklist?.carDetails?.carModel || checklist?.carDetails?.model || '',
        mileage: checklist?.carDetails?.mileage || '',
        yearOfManufacture: checklist?.carDetails?.yearOfManufacture || checklist?.carDetails?.year || '',
        licensePlate: checklist?.carDetails?.licensePlate || checklist?.carDetails?.regNo || '',
        vehicleType: checklist?.carDetails?.vehicleType || '',
        color: checklist?.carDetails?.color || '',
        engineSize: checklist?.carDetails?.engineSize || '',
        fuelType: checklist?.carDetails?.fuelType || '',
        vin: checklist?.carDetails?.vin || '', // Keep for local state
      },
      
      services: {
        actualService: Array.isArray(checklist?.services?.actualService)
          ? checklist.services.actualService
          : [],
      },
      
      // Headlight specific fields from parsed JSON
      serviceType: (additionalInfo as any)?.serviceType || 'workshop_installation',
      productServiceNeeded: (additionalInfo as any)?.productServiceNeeded || '',
      productPrice: (additionalInfo as any)?.productPrice || 0,
      servicePrice: (additionalInfo as any)?.servicePrice || 0,
      additionalInformation: typeof checklist?.additionalInformation === 'string' && !checklist.additionalInformation.startsWith('{') 
        ? checklist.additionalInformation 
        : '',
      
      installationDetails: (additionalInfo as any)?.installationDetails || {
        estimatedTime: '1_2_hours',
        assignedTechnician: '',
        workStartTime: new Date().toISOString()
      },
      
      deliveryPickupMethod: (additionalInfo as any)?.deliveryPickupMethod || 'customer_pickup',
      acceptDiagnosticCharges: (additionalInfo as any)?.acceptDiagnosticCharges || false,
      
      inspectionItems: Array.isArray(checklist?.inspectionItems) 
        ? checklist.inspectionItems.map((item: any) => ({
            item: item.item || '',
            status: item.status || 'pending',
            remarks: item.remarks || '',
            side: item.side || 'both'
          }))
        : [],
      
      acceptTerms: !!checklist?.acceptTerms,
      clientSignature: checklist?.clientSignature || '',
      inspectorSignature: checklist?.inspectorSignature || '',
      clientSigningMethod: checklist?.clientSigningMethod || 'present',
      clientEmail: checklist?.clientEmail || '',
      
      files: Array.isArray(checklist?.files) ? checklist.files : [],
      uploadedImages: Array.isArray(checklist?.uploadedImages) ? checklist.uploadedImages : []
    };
  };

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load technicians
      await fetchTechnicians();

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        const mappedFormData = mapChecklistToForm(checklist);
        setFormData(mappedFormData as any);
        
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

      // Load work order if provided
      if (workOrderId) {
        try {
          const wo = await workOrderService.getWorkOrderById(workOrderId);
          setWorkOrder(wo);
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
      // Extract customer name
      const customerName = opportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Get vehicle from opportunity
      const primaryVehicle = opportunity.vehicles?.[0] || {};
      
      // Get registration number
      const getLicensePlate = (vehicle: any) => {
        if (!vehicle) return '';
        const fields = ['registrationNumber', 'regNumber', 'regNo', 'licensePlate', 'plateNumber'];
        for (const field of fields) {
          if (vehicle[field]) return vehicle[field];
        }
        return '';
      };
      
      const licensePlate = getLicensePlate(primaryVehicle);
      
      // Get year
      let yearOfManufacture = '';
      if (primaryVehicle.year) {
        yearOfManufacture = primaryVehicle.year.toString();
      } else if (primaryVehicle.yearOfManufacture) {
        yearOfManufacture = primaryVehicle.yearOfManufacture.toString();
      }

      // Get price
      let totalPrice = 0;
      if (opportunity.total) {
        totalPrice = opportunity.total;
      } else if (opportunity.currentQuote?.total) {
        totalPrice = opportunity.currentQuote.total;
      }

      const loggedInUserName = sessionStorage.getItem('userName') || '';

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
          carMake: primaryVehicle.make || primaryVehicle.manufacturer || '',
          carModel: primaryVehicle.model || '',
          licensePlate: licensePlate || '',
          yearOfManufacture: yearOfManufacture,
          color: prev.carDetails.color || '',
          mileage: prev.carDetails.mileage || '',
        },
        additionalInformation: prev.additionalInformation || opportunity.notes || '',
        inspectorName: prev.inspectorName || loggedInUserName,
        serviceIntake: {
          ...prev.serviceIntake,
          customerServiceRep: loggedInUserName || ''
        },
        productServiceNeeded: opportunity.subject || 'Headlight service',
        productPrice: totalPrice
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

  const handleCustomerDetailChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      customerDetails: {
        ...prev.customerDetails,
        [field]: value
      }
    }));
  };

  const handleCarDetailChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      carDetails: {
        ...prev.carDetails,
        [field]: value
      }
    }));
  };

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const users = await userService.getAllUsers();
      
      const technicianUsers = users.filter(user => {
        if (!user.active) return false;
        const roleName = userService.getUserRoleName(user);
        return roleName?.toLowerCase() === 'technician';
      });
      
      setTechnicians(technicianUsers);
      
    } catch (error) {
      console.error('Error fetching technicians:', error);
      setTechnicians([]);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleRefreshFromOpportunity = () => {
    if (opportunity) {
      autoPopulateFromOpportunity();
      showToast('Refreshed data from opportunity', 'info');
    }
  };

  const handleItemChange = (index: number, field: keyof InspectionItem, value: any) => {
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

  const handleStatusChange = (index: number, status: 'ok' | 'fault' | 'n/a' | 'pending') => {
    handleItemChange(index, 'status', status);
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    let items: any[] = [];
    
    if (template === 'headlight_basic') {
      items = [
        { item: 'High Beam', status: 'pending', remarks: '', side: 'both' },
        { item: 'Low Beam', status: 'pending', remarks: '', side: 'both' },
        { item: 'Turn Signal', status: 'pending', remarks: '', side: 'both' },
        { item: 'Fog Lights', status: 'pending', remarks: '', side: 'both' },
        { item: 'Headlight Lens', status: 'pending', remarks: '', side: 'both' },
        { item: 'Water Proofing', status: 'pending', remarks: '', side: 'both' }
      ];
    } else if (template === 'headlight_comprehensive') {
      items = [
        { item: 'High Beam', status: 'pending', remarks: '', side: 'both' },
        { item: 'Low Beam', status: 'pending', remarks: '', side: 'both' },
        { item: 'Daytime Running Light', status: 'pending', remarks: '', side: 'both' },
        { item: 'Turn Signal', status: 'pending', remarks: '', side: 'both' },
        { item: 'Fog Lights', status: 'pending', remarks: '', side: 'both' },
        { item: 'Parking Bulb', status: 'pending', remarks: '', side: 'both' },
        { item: 'Angel Lights', status: 'pending', remarks: '', side: 'both' },
        { item: 'Headlight Adjusters', status: 'pending', remarks: '', side: 'both' },
        { item: 'Adaptive Front Lights (AFS)', status: 'pending', remarks: '', side: 'both' },
        { item: 'Dimming Functionality', status: 'pending', remarks: '', side: 'both' },
        { item: 'Headlight Wiring and Connectors', status: 'pending', remarks: '', side: 'both' },
        { item: 'Beam Alignment', status: 'pending', remarks: '', side: 'both' },
        { item: 'Headlight Lens (Scratches, Cracks, Haziness)', status: 'pending', remarks: '', side: 'both' },
        { item: 'Water Proofing', status: 'pending', remarks: '', side: 'both' },
        { item: 'Dashboard Warning Lights', status: 'pending', remarks: '', side: 'vehicle' },
        { item: 'Bumper Condition', status: 'pending', remarks: '', side: 'both' }
      ];
    }
    
    setFormData(prev => ({
      ...prev,
      inspectionItems: items
    }));
  };

  const calculateStats = () => {
    const total = formData.inspectionItems.length;
    const ok = formData.inspectionItems.filter(item => item.status === 'ok').length;
    const fault = formData.inspectionItems.filter(item => item.status === 'fault').length;
    const na = formData.inspectionItems.filter(item => item.status === 'n/a').length;
    const pending = formData.inspectionItems.filter(item => item.status === 'pending').length;
    return { total, ok, fault, na, pending };
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
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
      
      if (checklistId) {
        const signatureData = {
          name: type === 'client' 
            ? `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`
            : formData.inspectorName || sessionStorage.getItem('userName') || 'Inspector',
          signatureData: dataUrl,
          role: type === 'client' ? 'Vehicle Owner' : 'Inspector'
        };
        
        await preChecklistService.signPreChecklist(checklistId, signatureData);
        showToast(`${type === 'client' ? 'Client' : 'Inspector'} signature saved`, 'success');
      } else {
        if (type === 'client') {
          handleInputChange('clientSignature', dataUrl);
        } else {
          handleInputChange('inspectorSignature', dataUrl);
        }
        showToast(`${type === 'client' ? 'Client' : 'Inspector'} signature saved`, 'success');
      }
      
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

  const sendForClientApproval = async () => {
    try {
      if (!formData.customerDetails.email || !formData.customerDetails.email.includes('@')) {
        showToast('Please enter a valid email address', 'error');
        return;
      }
      
      if (!checklistId) {
        showToast('Please save the checklist first before sending for approval', 'warning');
        return;
      }
      
      await preChecklistService.requestEmailApproval(
        checklistId, 
        formData.customerDetails.email,
        `Please review and approve the headlight inspection checklist for vehicle ${formData.carDetails.licensePlate}`
      );
      
      showToast('Approval email sent successfully!', 'success');
      
    } catch (error) {
      console.error('Error sending approval email:', error);
      showToast('Error sending approval email', 'error');
    }
  };

  const handleSaveAsDraft = () => {
    try {
      localStorage.setItem('headlightPreChecklistDraft', JSON.stringify(formData));
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
      showToast('Draft saved successfully!', 'success');
    } catch (error) {
      showToast('Failed to save draft', 'error');
    }
  };

  const downloadPDF = async () => {
    try {
      const stats = calculateStats();
      const blob = await pdf(
        <PreChecklistPDF 
          formData={formData}
          stats={stats}
          existingChecklist={existingChecklist}
          opportunity={opportunity}
          vehicle={vehicle}
          workOrder={workOrder}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Headlight_PreChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
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

  const downloadPDFViaAPI = async () => {
    try {
      if (!checklistId) {
        await downloadPDF();
        return;
      }
      
      setUploading(true);
      showToast('Generating PDF from server...', 'info');
      
      await preChecklistService.generatePDF(checklistId);
      const blob = await preChecklistService.downloadPDF(checklistId);
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Headlight_PreChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      showToast('PDF downloaded from server successfully!', 'success');
    } catch (error: any) {
      console.error('Error downloading PDF from API:', error);
      showToast('Failed to download PDF from server. Generating local copy...', 'warning');
      await downloadPDF();
    } finally {
      setUploading(false);
    }
  };

  const downloadExcel = () => {
    try {
      // Simple Excel export - can be expanded if needed
      const data = [
        ['EAGLE LIGHTS AUTOMOTIVE LTD'],
        ['HEADLIGHT PRE-SERVICE INSPECTION'],
        [''],
        ['Date:', new Date().toLocaleDateString()],
        ['Inspector:', formData.inspectorName],
        [''],
        ['CUSTOMER DETAILS'],
        [`Name: ${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`],
        [`Email: ${formData.customerDetails.email}`],
        [`Phone: ${formData.customerDetails.mobile}`],
        [''],
        ['VEHICLE DETAILS'],
        [`Registration: ${formData.carDetails.licensePlate}`],
        [`Make: ${formData.carDetails.carMake}`],
        [`Model: ${formData.carDetails.carModel}`],
        [`Year: ${formData.carDetails.yearOfManufacture}`],
        [''],
        ['INSPECTION SUMMARY'],
        [`Total Items: ${formData.inspectionItems.length}`],
        [`OK: ${formData.inspectionItems.filter(i => i.status === 'ok').length}`],
        [`Faults: ${formData.inspectionItems.filter(i => i.status === 'fault').length}`],
        [`N/A: ${formData.inspectionItems.filter(i => i.status === 'n/a').length}`],
        [`Pending: ${formData.inspectionItems.filter(i => i.status === 'pending').length}`]
      ];
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Pre-Checklist');
      
      const filename = `Headlight_PreChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      showToast('Excel file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      showToast('Failed to generate Excel file', 'error');
    }
  };

  const handleFileUpload = async (file: File) => {
    if (checklistId) {
      const response = await preChecklistService.uploadFile(checklistId, file);
      if (response.success) {
        const updatedChecklist = await preChecklistService.getPreChecklistById(checklistId);
        setFormData(prev => ({
          ...prev,
          files: updatedChecklist.files || []
        }));
      }
    } else {
      const mockFile: ChecklistFile = {
        _id: Date.now().toString(),
        filename: file.name,
        originalName: file.name,
        fileType: file.type,
        mimeType: file.type,
        size: file.size,
        path: URL.createObjectURL(file),
        uploadedBy: sessionStorage.getItem('userId') || '',
        uploadedAt: new Date().toISOString()
      };
      
      setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), mockFile]
      }));
    }
  };

  const handleFileDelete = async (fileId: string) => {
    if (checklistId) {
      await preChecklistService.deleteFile(fileId);
      const updatedChecklist = await preChecklistService.getPreChecklistById(checklistId);
      setFormData(prev => ({
        ...prev,
        files: updatedChecklist.files || []
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        files: (prev.files || []).filter(file => file._id !== fileId)
      }));
    }
  };

  const handleFileView = (fileId: string) => {
    const file = formData.files?.find(f => f._id === fileId);
    if (file?.path) {
      window.open(file.path, '_blank');
    }
  };

  const handleFileDownload = async (fileId: string) => {
    try {
      const blob = await preChecklistService.downloadFile(fileId);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const file = formData.files?.find(f => f._id === fileId);
      link.download = file?.originalName || 'download';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      showToast('Failed to download file', 'error');
    }
  };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.customerDetails.firstName || !formData.customerDetails.lastName) {
        showToast('Please fill in customer name', 'error');
        setCurrentStep(2);
        setSubmitting(false);
        return;
      }
      
      if (!formData.carDetails.licensePlate) {
        showToast('Vehicle registration number is required', 'error');
        setCurrentStep(3);
        setSubmitting(false);
        return;
      }
      
      if (!formData.acceptTerms || !formData.acceptDiagnosticCharges) {
        showToast('Please accept all terms and conditions', 'error');
        setCurrentStep(5);
        setSubmitting(false);
        return;
      }

      if (!formData.inspectorSignature) {
        showToast('Please provide inspector signature', 'error');
        setCurrentStep(5);
        setSubmitting(false);
        return;
      }

      // Prepare inspection items
      const submissionItems = formData.inspectionItems.map(item => ({
        item: item.item,
        status: item.status === 'pending' ? 'n/a' : item.status,
        remarks: item.remarks || '',
        side: item.side || 'both'
      }));

      // Create submission data matching Diamond Rims DTO exactly
      const submissionData: CreatePreChecklistDto = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        inspectionItems: submissionItems as any,
        remarks: formData.remarks || '',
        approved: false,
        
        // Match Diamond Rims DTO structure
        checklistType: 'headlight',
        inspectedBy: formData.inspectedBy,
        inspectorName: formData.inspectorName,
        
        customerDetails: {
          firstName: formData.customerDetails.firstName,
          lastName: formData.customerDetails.lastName,
          mobile: formData.customerDetails.mobile,
          email: formData.customerDetails.email,
          name: `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`
        },
        
        carDetails: {
          carMake: formData.carDetails.carMake,
          carModel: formData.carDetails.carModel,
          mileage: formData.carDetails.mileage,
          yearOfManufacture: formData.carDetails.yearOfManufacture,
          licensePlate: formData.carDetails.licensePlate,
          color: formData.carDetails.color || '',
          vehicleType: formData.carDetails.vehicleType || '',
          engineSize: formData.carDetails.engineSize || '',
          fuelType: formData.carDetails.fuelType || '',
          // Note: vin is NOT in CreatePreChecklistDto, so don't include it here
        },
        
        serviceIntake: formData.serviceIntake,
        
        services: {
          actualService: formData.services.actualService
        },
        
        // Headlight specific fields - map to fields that exist in DTO
        additionalInformation: JSON.stringify({
          serviceType: formData.serviceType,
          productServiceNeeded: formData.productServiceNeeded,
          productPrice: formData.productPrice,
          servicePrice: formData.servicePrice,
          installationDetails: formData.installationDetails,
          deliveryPickupMethod: formData.deliveryPickupMethod,
          acceptDiagnosticCharges: formData.acceptDiagnosticCharges
        }),
        
        acceptTerms: formData.acceptTerms,
        clientSignature: formData.clientSignature,
        inspectorSignature: formData.inspectorSignature,
        clientSigningMethod: formData.clientSigningMethod,
        clientEmail: formData.clientEmail,
        
        uploadedImages: formData.uploadedImages,
        files: formData.files
      };

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData as any);
        showToast('Pre-checklist updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await preChecklistService.createPreChecklist(submissionData as any, userId);
        showToast('Pre-checklist created successfully', 'success');
        
        // Link to work order if provided
        if (workOrderId && result._id) {
          try {
            await workOrderService.updateWorkOrder(workOrderId, {
              preChecklistId: result._id
            });
          } catch (updateError) {
            console.error('Error updating work order:', updateError);
          }
        }
      }

      // Navigate back
      if (workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (source === 'opportunity' && formData.opportunityId) {
        router.push(`/opportunities/${formData.opportunityId}`);
      } else if (result?._id) {
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
    if (workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else if (source === 'opportunity' && formData.opportunityId) {
      router.push(`/opportunities/${formData.opportunityId}`);
    } else {
      router.push('/prechecklists');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800 border-green-200';
      case 'fault': return 'bg-red-100 text-red-800 border-red-200';
      case 'n/a': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'fault': return <AlertCircle className="h-4 w-4" />;
      case 'n/a': return <FileText className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
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
            <div className="ml-3 hidden md:block">
              <div className={`text-sm font-medium ${
                currentStep >= stepNumber ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {stepTitles[stepNumber - 1]}
              </div>
              <div className={`text-xs ${
                currentStep >= stepNumber ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {stepDescriptions[stepNumber - 1]}
              </div>
            </div>
            {stepNumber < 5 && (
              <div className={`h-0.5 w-8 md:w-16 mx-2 md:mx-4 transition-all ${
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
          <p className="text-gray-600">Loading pre-checklist form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
      {/* Header - Matching Diamond Rims style */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-6 shadow-lg">
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
                <Lightbulb className="h-6 w-6" />
                {mode === 'edit' ? 'Edit Headlight Pre-Checklist' : 'Headlight Pre-Service Inspection'}
              </h1>
              <p className="text-blue-100">
                {mode === 'edit' 
                  ? `Editing: Pre-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Complete headlight inspection and service form'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>OK: {stats.ok}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-500"></div>
                <span>Faults: {stats.fault}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>N/A: {stats.na}</span>
              </div>
            </div>
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
              Excel
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Progress Stepper */}
        {renderProgressStepper()}
        
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
            {/* Step 1: Inspection Items */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[0]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[0]}</p>
                
                {/* Service Type Selection */}
                <div className="bg-white rounded-lg border p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Service Type
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { value: 'pickup_only', label: 'Product Pickup Only', icon: <Package className="h-6 w-6" />, desc: 'Customer collects product' },
                      { value: 'workshop_installation', label: 'Workshop Installation', icon: <WrenchIcon className="h-6 w-6" />, desc: 'Installation at our workshop' },
                      { value: 'mobile_service', label: 'Mobile Service', icon: <Truck className="h-6 w-6" />, desc: 'We deliver & install' }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('serviceType', option.value)}
                        className={`p-4 border-2 rounded-lg text-center transition-all ${
                          formData.serviceType === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-center mb-2 text-gray-700">
                          {option.icon}
                        </div>
                        <div className="font-medium">{option.label}</div>
                        <p className="text-xs text-gray-600 mt-1">{option.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Inspection Items */}
                <div className="bg-white rounded-lg border overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ClipboardCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Headlight Inspection Items</h3>
                          <p className="text-xs text-gray-600">L-LEFT | R-RIGHT</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        <Settings className="h-4 w-4" />
                        Templates
                      </button>
                    </div>
                    
                    {showTemplateSelector && (
                      <div className="mt-4 p-4 bg-white border rounded-lg">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => handleTemplateSelect('headlight_basic')}
                            className={`p-3 border rounded-lg text-left ${
                              selectedTemplate === 'headlight_basic' ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                          >
                            <div className="font-medium">Basic Check</div>
                            <p className="text-xs text-gray-600">6 essential items</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTemplateSelect('headlight_comprehensive')}
                            className={`p-3 border rounded-lg text-left ${
                              selectedTemplate === 'headlight_comprehensive' ? 'border-blue-500 bg-blue-50' : ''
                            }`}
                          >
                            <div className="font-medium">Comprehensive</div>
                            <p className="text-xs text-gray-600">16 detailed items</p>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="divide-y max-h-[500px] overflow-y-auto">
                    {formData.inspectionItems.map((item, index) => {
                      const isExpanded = expandedSections.includes(index);
                      return (
                        <div key={index} className="p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className="text-xs font-medium text-gray-500">#{index + 1}</span>
                                <span className="font-medium">{item.item}</span>
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(item.status)}`}>
                                  {getStatusIcon(item.status)}
                                  <span className="capitalize">{item.status}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                {['ok', 'fault', 'n/a'].map((status) => (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(index, status as any)}
                                    className={`px-3 py-1 text-xs rounded-lg border ${
                                      item.status === status
                                        ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800'
                                        : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800'
                                        : 'bg-gray-100 border-gray-300 text-gray-800'
                                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                    }`}
                                  >
                                    {status.toUpperCase()}
                                  </button>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => toggleSection(index)}
                                  className="ml-auto p-1 text-gray-400 hover:text-gray-600"
                                >
                                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                              </div>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Remarks</label>
                                  <textarea
                                    value={item.remarks}
                                    onChange={(e) => handleItemChange(index, 'remarks', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg"
                                    rows={2}
                                    placeholder="Add observations..."
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-700 mb-1">Side</label>
                                  <select
                                    value={item.side}
                                    onChange={(e) => handleItemChange(index, 'side', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border rounded-lg"
                                  >
                                    <option value="both">Both Sides</option>
                                    <option value="left">Left Only</option>
                                    <option value="right">Right Only</option>
                                    <option value="vehicle">Vehicle</option>
                                  </select>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Customer Details */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[1]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[1]}</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <UserType className="h-5 w-5 text-blue-600" />
                      Customer Details
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCustomerEdit(!showCustomerEdit)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                      >
                        <Edit className="h-4 w-4" />
                        {showCustomerEdit ? 'View' : 'Edit'}
                      </button>
                      {opportunity && (
                        <button
                          type="button"
                          onClick={handleRefreshFromOpportunity}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          <Sparkles className="h-4 w-4" />
                          Refresh
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!showCustomerEdit ? (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Full Name</p>
                          <p className="font-medium">{formData.customerDetails.firstName} {formData.customerDetails.lastName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Phone</p>
                          <p className="font-medium">{formData.customerDetails.mobile}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium">{formData.customerDetails.email}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            type="text"
                            value={formData.customerDetails.firstName}
                            onChange={(e) => handleCustomerDetailChange('firstName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input
                            type="text"
                            value={formData.customerDetails.lastName}
                            onChange={(e) => handleCustomerDetailChange('lastName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                          <input
                            type="tel"
                            value={formData.customerDetails.mobile}
                            onChange={(e) => handleCustomerDetailChange('mobile', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input
                            type="email"
                            value={formData.customerDetails.email}
                            onChange={(e) => handleCustomerDetailChange('email', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Inspector Name *</label>
                        <input
                          type="text"
                          value={formData.inspectorName}
                          onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          required
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 3: Vehicle Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[2]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[2]}</p>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <CarIcon className="h-5 w-5 text-blue-600" />
                      Vehicle Details
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowVehicleEdit(!showVehicleEdit)}
                        className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
                      >
                        <Edit className="h-4 w-4" />
                        {showVehicleEdit ? 'View' : 'Edit'}
                      </button>
                      {opportunity && (
                        <button
                          type="button"
                          onClick={handleRefreshFromOpportunity}
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                        >
                          <Sparkles className="h-4 w-4" />
                          Refresh
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {!showVehicleEdit ? (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-gray-500">Registration</p>
                          <p className="font-medium">{formData.carDetails.licensePlate || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Make</p>
                          <p className="font-medium">{formData.carDetails.carMake || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Model</p>
                          <p className="font-medium">{formData.carDetails.carModel || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Year</p>
                          <p className="font-medium">{formData.carDetails.yearOfManufacture || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Registration *</label>
                          <input
                            type="text"
                            value={formData.carDetails.licensePlate}
                            onChange={(e) => handleCarDetailChange('licensePlate', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                          <input
                            type="text"
                            value={formData.carDetails.carMake}
                            onChange={(e) => handleCarDetailChange('carMake', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                          <input
                            type="text"
                            value={formData.carDetails.carModel}
                            onChange={(e) => handleCarDetailChange('carModel', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                          <input
                            type="text"
                            value={formData.carDetails.yearOfManufacture}
                            onChange={(e) => handleCarDetailChange('yearOfManufacture', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
                        <input
                          type="text"
                          value={formData.productServiceNeeded}
                          onChange={(e) => handleInputChange('productServiceNeeded', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          placeholder="e.g., Headlight restoration, LED upgrade"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Service Price (KES)</label>
                        <input
                          type="number"
                          value={formData.productPrice}
                          onChange={(e) => handleInputChange('productPrice', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Information</label>
                        <textarea
                          value={formData.additionalInformation}
                          onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                          className="w-full px-3 py-2 border rounded-lg"
                          rows={3}
                          placeholder="Any special instructions or notes..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Installation Details */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[3]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[3]}</p>
                
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <WrenchIcon className="h-5 w-5 text-blue-600" />
                    Installation Schedule
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Technician</label>
                      <select
                        value={formData.installationDetails.assignedTechnician}
                        onChange={(e) => handleNestedInputChange('installationDetails', 'assignedTechnician', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                        disabled={loadingTechnicians}
                      >
                        <option value="">Select Technician</option>
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Work Start Time</label>
                      <input
                        type="datetime-local"
                        value={formData.installationDetails.workStartTime.split('.')[0]}
                        onChange={(e) => handleNestedInputChange('installationDetails', 'workStartTime', e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Estimated Installation Time</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { value: 'less_1_hour', label: '< 1 hour' },
                        { value: '1_2_hours', label: '1-2 hours' },
                        { value: '3_hours', label: '3 hours' },
                        { value: 'more_3_hours', label: '> 3 hours' }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleNestedInputChange('installationDetails', 'estimatedTime', option.value)}
                          className={`p-3 border rounded-lg text-center ${
                            formData.installationDetails.estimatedTime === option.value
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery/Pickup Method</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { value: 'customer_pickup', label: 'Customer Pickup', icon: <Home className="h-5 w-5" /> },
                        { value: 'courier_delivery', label: 'Courier Delivery', icon: <Truck className="h-5 w-5" /> },
                        { value: 'mobile_delivery_install', label: 'Mobile Service', icon: <CarIcon className="h-5 w-5" /> }
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleInputChange('deliveryPickupMethod', option.value)}
                          className={`p-4 border rounded-lg flex flex-col items-center gap-2 ${
                            formData.deliveryPickupMethod === option.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:bg-gray-50'
                          }`}
                        >
                          {option.icon}
                          <span className="font-medium">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Terms & Signatures */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[4]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[4]}</p>
                
                {/* File Upload Section - Exactly like Diamond Rims */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Upload className="h-5 w-5 text-blue-600" />
                    File Attachments
                  </h3>
                  <FileUploadSection
                    checklistId={checklistId}
                    checklistType="pre"
                    files={formData.files}
                    onFileUpload={handleFileUpload}
                    onFileDelete={handleFileDelete}
                    onFileView={handleFileView}
                    onFileDownload={handleFileDownload}
                    disabled={!checklistId && formData.files.length >= 6}
                    maxFiles={6}
                    maxSizeMB={50}
                  />
                </div>
                
                {/* Terms Section */}
                <div className="bg-white rounded-lg border p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      Terms and Conditions
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      View Full Terms
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        Dashboard warning lights/errors may incur additional diagnostic charges.
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="acceptDiagnosticCharges"
                        checked={formData.acceptDiagnosticCharges}
                        onChange={(e) => handleInputChange('acceptDiagnosticCharges', e.target.checked)}
                        className="mt-1 h-5 w-5 text-blue-600 rounded"
                        required
                      />
                      <label htmlFor="acceptDiagnosticCharges" className="text-sm text-gray-700">
                        I understand that diagnostic services for dashboard errors will incur additional charges *
                      </label>
                    </div>
                    
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
                        I have read and accept all terms, conditions, and associated risks *
                      </label>
                    </div>
                  </div>
                </div>
                
                {/* Signatures Section - Exactly like Diamond Rims */}
                <div className="space-y-6">
                  {/* Inspector Signature */}
                  <div className="bg-gray-50 rounded-lg p-5 border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <UserCheck className="h-5 w-5 text-purple-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Inspector Signature</h4>
                          <p className="text-xs text-gray-500">Required before client approval</p>
                        </div>
                      </div>
                      {formData.inspectorSignature && (
                        <button
                          type="button"
                          onClick={() => clearSignature('inspector')}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-white rounded-lg border p-4">
                      {showInspectorSignature ? (
                        <div className="space-y-4">
                          <div className="border rounded-lg bg-white">
                            <SignatureCanvas
                              ref={inspectorSigRef}
                              penColor="black"
                              canvasProps={{
                                width: 600,
                                height: 150,
                                className: 'w-full h-32 rounded-lg'
                              }}
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setShowInspectorSignature(false)}
                              className="px-4 py-2 border rounded-lg text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveSignature('inspector')}
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm"
                            >
                              Save Signature
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setShowInspectorSignature(true)}
                          className="cursor-pointer"
                        >
                          {formData.inspectorSignature ? (
                            <div className="flex items-center justify-between">
                              <img src={formData.inspectorSignature} alt="Inspector Signature" className="h-16 object-contain" />
                              <span className="text-sm text-purple-600">Change</span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg hover:border-purple-400 hover:bg-purple-50">
                              <FileSignature className="h-10 w-10 text-gray-400 mb-2" />
                              <p className="text-sm font-medium">Click to sign as inspector</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Client Signature */}
                  <div className="bg-gray-50 rounded-lg p-5 border">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <UserType className="h-5 w-5 text-blue-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Client Approval</h4>
                          <p className="text-xs text-gray-500">
                            {formData.inspectorSignature ? 'Ready for client signature' : 'Awaiting inspector signature'}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex gap-4 p-1 bg-gray-100 rounded-lg inline-flex">
                        <button
                          type="button"
                          onClick={() => handleInputChange('clientSigningMethod', 'present')}
                          className={`px-4 py-2 rounded-lg text-sm ${
                            formData.clientSigningMethod === 'present'
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-gray-600'
                          }`}
                        >
                          Client Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleInputChange('clientSigningMethod', 'absent')}
                          className={`px-4 py-2 rounded-lg text-sm ${
                            formData.clientSigningMethod === 'absent'
                              ? 'bg-white text-blue-700 shadow-sm'
                              : 'text-gray-600'
                          }`}
                        >
                          Client Absent
                        </button>
                      </div>
                    </div>

                    {formData.clientSigningMethod === 'present' ? (
                      <div className="bg-white rounded-lg border p-4">
                        {showClientSignature ? (
                          <div className="space-y-4">
                            <div className="border rounded-lg bg-white">
                              <SignatureCanvas
                                ref={clientSigRef}
                                penColor="black"
                                canvasProps={{
                                  width: 600,
                                  height: 150,
                                  className: 'w-full h-32 rounded-lg'
                                }}
                              />
                            </div>
                            <div className="flex justify-end gap-3">
                              <button
                                type="button"
                                onClick={() => setShowClientSignature(false)}
                                className="px-4 py-2 border rounded-lg text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => saveSignature('client')}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm"
                                disabled={!formData.inspectorSignature}
                              >
                                Save Signature
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => formData.inspectorSignature && setShowClientSignature(true)}
                            className={`cursor-pointer ${!formData.inspectorSignature && 'opacity-50 cursor-not-allowed'}`}
                          >
                            {formData.clientSignature ? (
                              <div className="flex items-center justify-between">
                                <img src={formData.clientSignature} alt="Client Signature" className="h-16 object-contain" />
                                <span className="text-sm text-blue-600">Change</span>
                              </div>
                            ) : (
                              <div className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg ${
                                formData.inspectorSignature ? 'hover:border-blue-400 hover:bg-blue-50' : 'bg-gray-50'
                              }`}>
                                <FileSignature className="h-10 w-10 text-gray-400 mb-2" />
                                <p className="text-sm font-medium">
                                  {formData.inspectorSignature ? 'Click to capture client signature' : 'Inspector must sign first'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-white rounded-lg border border-blue-200 p-5">
                        <div className="flex items-start gap-4">
                          <div className="p-2 bg-blue-100 rounded-full">
                            <Mail className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium mb-1">Send for Remote Approval</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Client will receive an email with a secure link to sign
                            </p>
                            
                            <div className="flex gap-3">
                              <input
                                type="email"
                                value={formData.customerDetails.email}
                                onChange={(e) => handleCustomerDetailChange('email', e.target.value)}
                                placeholder="client@example.com"
                                className="flex-1 px-4 py-2 border rounded-lg text-sm"
                                disabled={!formData.inspectorSignature}
                              />
                              <button
                                type="button"
                                onClick={sendForClientApproval}
                                disabled={!formData.inspectorSignature || !formData.customerDetails.email}
                                className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
                              >
                                Send Email
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Remarks */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Remarks</label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                    placeholder="Any additional notes or observations..."
                  />
                </div>
              </div>
            )}
            
            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
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
                  type="button"
                  onClick={handleSaveAsDraft}
                  className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Save className="h-5 w-5" />
                  Save Draft
                  {draftSaved && <span className="text-xs text-green-600">✓</span>}
                </button>
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(currentStep + 1)}
                    className="px-6 py-3 rounded-lg font-medium bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
                  >
                    Next
                    <ArrowRight className="h-5 w-5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {mode === 'edit' ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {mode === 'edit' ? 'Update Checklist' : 'Create Checklist'}
                      </>
                    )}
                  </button>
                )}
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