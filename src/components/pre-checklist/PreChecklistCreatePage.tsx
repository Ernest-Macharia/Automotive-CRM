'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import Image from 'next/image';
import PreChecklistPDF from './PreChecklistPDF';
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
  Download
} from 'lucide-react';
import { preChecklistService, InspectionItem } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';

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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loadingTechnicians, setLoadingTechnicians] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<User | null>(null);

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5; // inspection, customer, vehicle, installation, terms

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

  // Headlight-specific form state
  const [formData, setFormData] = useState({
    opportunityId: opportunityId || '',
    vehicleId: vehicleId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    remarks: '',
    approved: false,
    
    // Headlight specific fields
    serviceType: 'workshop_installation' as ServiceType,
    inspectorName: '',
    customerDetails: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
    },
    carDetails: {
      regNo: '',
      make: '',
      year: '',
      model: '',
      vin: ''
    },
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
    
    // Headlight inspection items (L-LEFT, R-RIGHT)
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
    
    // Uploads
    uploadedImages: [] as string[]
  });

  const [selectedTemplate, setSelectedTemplate] = useState('headlight_basic');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [expandedSections, setExpandedSections] = useState<number[]>([]);
  const [draftSaved, setDraftSaved] = useState(false);

  const [clientSignature, setClientSignature] = useState(formData.clientSignature);
  const [inspectorSignature, setInspectorSignature] = useState(formData.inspectorSignature);
  const [showClientSignature, setShowClientSignature] = useState(false);
  const [showInspectorSignature, setShowInspectorSignature] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);
  const inspectorSigRef = useRef<SignatureCanvas>(null);

  // Load related data and auto-populate from opportunity
  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode]);

  useEffect(() => {
    // Auto-populate form data when opportunity is loaded
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

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

  // Add this function to save signature
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

  const autoPopulateFromOpportunity = () => {
    if (!opportunity || autoPopulated) return;

    try {
      console.log('Auto-populating from opportunity:', opportunity);
      
      // Extract customer name
      const customerName = opportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Get vehicle from opportunity vehicles array
      const primaryVehicle = opportunity.vehicles?.[0] || {};
      
      console.log('Primary vehicle data:', primaryVehicle);
      
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

      const productServiceNeeded = opportunity.subject || 
                            opportunity.customer?.name + "'s service" || 
                            'Headlight service';

      // Get price from opportunity - check multiple sources
      let totalPrice = 0;
      
      // 1. First check if opportunity has a direct total field
      if (opportunity.total !== undefined && opportunity.total !== null) {
        totalPrice = opportunity.total;
        console.log('Using opportunity.total:', totalPrice);
      }
      // 2. Check if there's a current quote with pricing
      else if (opportunity.currentQuote && typeof opportunity.currentQuote === 'object') {
        // If currentQuote is populated with data
        if (opportunity.currentQuote.total) {
          totalPrice = opportunity.currentQuote.total;
          console.log('Using currentQuote.total:', totalPrice);
        } else if (opportunity.currentQuote.items && Array.isArray(opportunity.currentQuote.items)) {
          totalPrice = opportunity.currentQuote.items.reduce((sum, item) => sum + (item.total || item.price || 0), 0);
          console.log('Calculated from currentQuote.items:', totalPrice);
        }
      }
      // 3. Check if quotes array has pricing
      else if (opportunity.quotes && opportunity.quotes.length > 0) {
        const latestQuote = opportunity.quotes[0]; // Get most recent quote
        if (latestQuote.total) {
          totalPrice = latestQuote.total;
          console.log('Using latest quote total:', totalPrice);
        } else if (latestQuote.items && Array.isArray(latestQuote.items)) {
          totalPrice = latestQuote.items.reduce((sum, item) => sum + (item.total || item.price || 0), 0);
          console.log('Calculated from quote items:', totalPrice);
        }
      }
      // 4. Check if there's a workOrder with pricing
      else if (opportunity.workOrder && typeof opportunity.workOrder === 'object') {
        if (opportunity.workOrder.total) {
          totalPrice = opportunity.workOrder.total;
          console.log('Using workOrder.total:', totalPrice);
        }
      }
      
      console.log('Final total price:', totalPrice);
      
      // Update form data
      setFormData(prev => ({
        ...prev,
        customerDetails: {
          ...prev.customerDetails,
          firstName: firstName || '',
          lastName: lastName || '',
          email: opportunity.customer?.email || '',
          phone: opportunity.customer?.phone || '',
        },
        carDetails: {
          ...prev.carDetails,
          regNo: registrationNumber || '', // Leave empty if not found, user will enter
          make: primaryVehicle.make || vehicle?.make || '',
          year: (primaryVehicle.year || vehicle?.year)?.toString() || '',
          model: primaryVehicle.model || vehicle?.model || '',
          vin: primaryVehicle.vin || primaryVehicle.chassisNumber || vehicle?.vin || ''
        },
        productServiceNeeded: productServiceNeeded,
        productPrice: totalPrice,
        servicePrice: 0,
        additionalInformation: prev.additionalInformation || opportunity.notes || '',
        inspectorName: prev.inspectorName || sessionStorage.getItem('userName') || ''
      }));

      console.log('Updated form data:', {
        registration: registrationNumber || 'Empty - needs manual entry',
        price: totalPrice,
        productService: productServiceNeeded
      });
      
      setAutoPopulated(true);
      
    } catch (error) {
      console.error('Error auto-populating from opportunity:', error);
      showToast('Error loading vehicle details from opportunity', 'warning');
    }
  };

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      await fetchTechnicians();

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        setExistingChecklist(checklist);

        const transformedInspectionItems = checklist.inspectionItems?.map(item => ({
          item: item.item || '',
          status: (item.status || 'pending') as 'ok' | 'fault' | 'n/a' | 'pending',
          remarks: item.remarks || '',
          side: item.side || 'both'
        })) || [];
        
        setFormData({
          opportunityId: typeof checklist.opportunityId === 'object' 
            ? checklist.opportunityId._id 
            : checklist.opportunityId,
          vehicleId: typeof checklist.vehicleId === 'object' 
            ? checklist.vehicleId._id 
            : checklist.vehicleId,
          inspectedBy: checklist.inspectedBy 
            ? (typeof checklist.inspectedBy === 'object' 
                ? checklist.inspectedBy._id 
                : checklist.inspectedBy)
            : sessionStorage.getItem('userId') || '',
          remarks: checklist.remarks || '',
          approved: checklist.approved || false,
          serviceType: checklist.serviceType || 'workshop_installation',
          inspectorName: checklist.inspectorName || '',
          customerDetails: checklist.customerDetails || {
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
          },
          carDetails: checklist.carDetails || {
            regNo: '',
            make: '',
            year: '',
            model: '',
            vin: ''
          },
          productServiceNeeded: checklist.productServiceNeeded || '',
          productPrice: checklist.productPrice || 0,
          servicePrice: checklist.servicePrice || 0,
          additionalInformation: checklist.additionalInformation || '',
          installationDetails: checklist.installationDetails || {
            estimatedTime: '1_2_hours',
            assignedTechnician: '',
            workStartTime: new Date().toISOString()
          },
          deliveryPickupMethod: checklist.deliveryPickupMethod || 'customer_pickup',
          inspectionItems: transformedInspectionItems,
          acceptTerms: checklist.acceptTerms || false,
          acceptDiagnosticCharges: checklist.acceptDiagnosticCharges || false,
          clientSignature: checklist.clientSignature || '',
          inspectorSignature: checklist.inspectorSignature || '',
          uploadedImages: checklist.uploadedImages || []
        });

        // Set opportunity and vehicle from existing checklist
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
        // Load opportunity with quotes populated
        const opp = await opportunityService.getOpportunityById(opportunityId, false); // false means get full data
        
        // If quotes array exists but isn't populated, fetch quotes separately
        if (opp.quotes && opp.quotes.length > 0 && typeof opp.quotes[0] === 'string') {
          try {
            // You might need a separate API call to get quote details
            // This depends on your API structure
          } catch (quoteError) {
            console.error('Error loading quote details:', quoteError);
          }
        }
        
        setOpportunity(opp);
        
        // Get vehicle from opportunity vehicles
        if (opp.vehicles && opp.vehicles.length > 0) {
          const primaryVehicle = opp.vehicles[0];
          setVehicle(primaryVehicle);
          
          // Set vehicle ID
          setFormData(prev => ({
            ...prev,
            opportunityId,
            vehicleId: primaryVehicle._id || vehicleId || ''
          }));
        } else if (vehicleId) {
          // Fallback to provided vehicleId
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

      // If we still don't have opportunity, but have IDs in formData, try to load them
      if (!opportunity && formData.opportunityId) {
        try {
          const opp = await opportunityService.getOpportunityById(formData.opportunityId);
          setOpportunity(opp);
        } catch (error) {
          console.error('Error loading opportunity by form ID:', error);
        }
      }

    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
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

  const handleNestedInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
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

  const fetchTechnicians = async () => {
    try {
      setLoadingTechnicians(true);
      const users = await userService.getAllUsers();
      
      // Filter for active technicians - using same logic as job card
      const technicianUsers = users.filter(user => {
        // Check if user is active
        if (!user.active) return false;
        
        // Get role name using the user service method
        const roleName = userService.getUserRoleName(user);
        console.log(`User ${user.name} has role: ${roleName}`);
        
        // Check if role matches technician (case insensitive)
        return roleName?.toLowerCase() === 'technician';
      });
      
      console.log('Filtered technicians:', technicianUsers);
      setTechnicians(technicianUsers);
      
      // Auto-select first technician if none selected (optional)
      if (technicianUsers.length > 0 && !formData.installationDetails.assignedTechnician) {
        const firstTech = technicianUsers[0];
        setSelectedTechnician(firstTech);
        handleNestedInputChange('installationDetails', 'assignedTechnician', firstTech.id || firstTech._id);
      }
      
    } catch (error) {
      console.error('Error fetching technicians:', error);
      showToast('Failed to load technicians', 'error');
      setTechnicians([]);
    } finally {
      setLoadingTechnicians(false);
    }
  };

  const handleCarDetailChange = (field: keyof typeof formData.carDetails, value: string) => {
    setFormData(prev => ({
      ...prev,
      carDetails: {
        ...prev.carDetails,
        [field]: value
      }
    }));
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
    
    switch (template) {
      case 'headlight_basic':
        items = [
          { item: 'High Beam', status: 'pending', remarks: '', side: 'both' },
          { item: 'Low Beam', status: 'pending', remarks: '', side: 'both' },
          { item: 'Turn Signal', status: 'pending', remarks: '', side: 'both' },
          { item: 'Fog Lights', status: 'pending', remarks: '', side: 'both' },
          { item: 'Headlight Lens', status: 'pending', remarks: '', side: 'both' },
          { item: 'Water Proofing', status: 'pending', remarks: '', side: 'both' }
        ];
        break;
      case 'headlight_comprehensive':
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
    const ok = formData.inspectionItems.filter(item => item.status === 'ok').length;
    const fault = formData.inspectionItems.filter(item => item.status === 'fault').length;
    const na = formData.inspectionItems.filter(item => item.status === 'n/a').length;
    const pending = formData.inspectionItems.filter(item => item.status === 'pending').length;
    
    return { total, ok, fault, na, pending };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.carDetails.regNo.trim()) {
        showToast('Vehicle registration number is required', 'error');
        setCurrentStep(3); // Go to vehicle step
        setSubmitting(false);
        return;
      }

      if (!formData.acceptTerms || !formData.acceptDiagnosticCharges) {
        showToast('Please accept all terms and conditions', 'error');
        setCurrentStep(5); // Go to terms step
        setSubmitting(false);
        return;
      }

      if (!formData.clientSignature) {
        showToast('Client signature is required', 'error');
        setCurrentStep(5); // Go to terms step
        setSubmitting(false);
        return;
      }

      if (!formData.inspectorSignature) {
        showToast('Inspector signature is required', 'error');
        setCurrentStep(5); // Go to terms step
        setSubmitting(false);
        return;
      }

      if (formData.serviceType === 'workshop_installation' && !formData.installationDetails.assignedTechnician) {
      showToast('Please assign a technician for workshop installation', 'error');
      setCurrentStep(4);
      setSubmitting(false);
      return;
    }

      // Prepare inspection items - convert pending to n/a
      const submissionItems = formData.inspectionItems.map(item => ({
        item: item.item,
        status: item.status === 'pending' ? 'n/a' : item.status,
        remarks: item.remarks || '',
        side: item.side || 'both'
      }));

      // Create submission data matching the CreatePreChecklistDto interface
      const submissionData = {
        opportunityId: formData.opportunityId,
        vehicleId: formData.vehicleId,
        inspectionItems: submissionItems,
        remarks: formData.remarks || '',
        approved: false,
        
        // Include headlight-specific data
        serviceType: formData.serviceType,
        inspectorName: formData.inspectorName,
        customerDetails: formData.customerDetails,
        carDetails: formData.carDetails,
        productServiceNeeded: formData.productServiceNeeded,
        productPrice: formData.productPrice,
        servicePrice: formData.servicePrice,
        additionalInformation: formData.additionalInformation,
        installationDetails: formData.installationDetails,
        deliveryPickupMethod: formData.deliveryPickupMethod,
        acceptTerms: formData.acceptTerms,
        acceptDiagnosticCharges: formData.acceptDiagnosticCharges,
        clientSignature: formData.clientSignature,
        inspectorSignature: formData.inspectorSignature,
        uploadedImages: formData.uploadedImages
      };

      console.log('Submitting pre-checklist:', submissionData);

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData);
        showToast('Pre-checklist updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await preChecklistService.createPreChecklist(submissionData, userId);
        showToast('Pre-checklist created successfully', 'success');
        
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
      }

      // Navigate based on source
      if (source === 'workflow' && workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
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

  const handleCancel = () => {
    if (source === 'workflow' && workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
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

  const toggleSection = (index: number) => {
    setExpandedSections(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const handleSaveAsDraft = () => {
    try {
      localStorage.setItem('preChecklistDraft', JSON.stringify(formData));
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
    link.download = `Headlight_PreChecklist_${formData.carDetails.regNo || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
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

// Add a button for immediate PDF download
const PDFDownloadButton = () => (
  <button
    onClick={downloadPDF}
    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm"
  >
    <FileText className="h-5 w-5" />
    Download PDF
  </button>
);

  // Excel Download Functionality
  const generateExcelData = () => {
    const worksheetData = [
      // Header
      ['EAGLE LIGHTS AUTOMOTIVE LTD', '', '', '', '', '', ''],
      ['HEADLIGHT PRE-SERVICE INSPECTION CHECKLIST', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['INSPECTION INFORMATION', '', '', '', '', '', ''],
      ['Checklist ID:', existingChecklist?._id || 'NEW', '', 'Date:', new Date().toLocaleDateString(), '', ''],
      ['Inspector:', formData.inspectorName, '', 'Service Type:', formData.serviceType, '', ''],
      ['', '', '', '', '', '', ''],
      ['CUSTOMER DETAILS', '', '', '', '', '', ''],
      ['Name:', `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`, '', 'Email:', formData.customerDetails.email, '', ''],
      ['Phone:', formData.customerDetails.phone, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['VEHICLE DETAILS', '', '', '', '', '', ''],
      ['Registration:', formData.carDetails.regNo, '', 'Make:', formData.carDetails.make, '', ''],
      ['Model:', formData.carDetails.model, '', 'Year:', formData.carDetails.year, '', ''],
      ['VIN:', formData.carDetails.vin, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['SERVICE DETAILS', '', '', '', '', '', ''],
      ['Product/Service:', formData.productServiceNeeded, '', '', '', '', ''],
      ['Product Price:', `KES ${formData.productPrice.toLocaleString()}`, '', 'Service Price:', `KES ${formData.servicePrice.toLocaleString()}`, '', ''],
      ['Additional Information:', formData.additionalInformation, '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['INSPECTION ITEMS', '', '', '', '', '', ''],
      ['No.', 'Item', 'Status', 'Side', 'Remarks', '', ''],
    ];

    // Add inspection items
    formData.inspectionItems.forEach((item, index) => {
      worksheetData.push([
        index + 1,
        item.item,
        item.status.toUpperCase(),
        item.side,
        item.remarks,
        '',
        ''
      ]);
    });

    // Add summary section
    worksheetData.push(['', '', '', '', '', '', '']);
    worksheetData.push(['INSPECTION SUMMARY', '', '', '', '', '', '']);
    const stats = calculateStats();
    worksheetData.push(['Total Items:', stats.total, '', 'OK:', stats.ok, '', '']);
    worksheetData.push(['Faults:', stats.fault, '', 'N/A:', stats.na, '', '']);
    worksheetData.push(['Pending:', stats.pending, '', '', '', '', '']);
    
    // Add installation details
    worksheetData.push(['', '', '', '', '', '', '']);
    worksheetData.push(['INSTALLATION DETAILS', '', '', '', '', '', '']);
    worksheetData.push(['Assigned Technician:', formData.installationDetails.assignedTechnician, '', '', '', '', '']);
    worksheetData.push(['Estimated Time:', formData.installationDetails.estimatedTime, '', 'Start Time:', new Date(formData.installationDetails.workStartTime).toLocaleString(), '', '']);
    worksheetData.push(['Delivery Method:', formData.deliveryPickupMethod, '', '', '', '', '']);
    
    // Add terms acceptance
    worksheetData.push(['', '', '', '', '', '', '']);
    worksheetData.push(['TERMS ACCEPTANCE', '', '', '', '', '', '']);
    worksheetData.push(['Terms Accepted:', formData.acceptTerms ? 'YES' : 'NO', '', 'Diagnostic Charges Accepted:', formData.acceptDiagnosticCharges ? 'YES' : 'NO', '', '']);
    worksheetData.push(['Client Signature:', formData.clientSignature ? 'SIGNED' : 'NOT SIGNED', '', 'Inspector Signature:', formData.inspectorSignature ? 'SIGNED' : 'NOT SIGNED', '', '']);
    worksheetData.push(['Remarks:', formData.remarks, '', '', '', '', '']);

    return worksheetData;
  };

  const downloadExcel = () => {
    try {
      const data = generateExcelData();
      
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      // Set column widths
      const colWidths = [
        { wch: 5 },   // No.
        { wch: 40 },  // Item
        { wch: 10 },  // Status
        { wch: 10 },  // Side
        { wch: 40 },  // Remarks
        { wch: 15 },  // Empty
        { wch: 15 },  // Empty
      ];
      ws['!cols'] = colWidths;
      
      // Add some styling through cell merges
      const merges = [
        // Merge title rows
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } }, // Company name
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } }, // Checklist title
        // Merge section headers
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
        { s: { r: 7, c: 0 }, e: { r: 7, c: 6 } },
        { s: { r: 11, c: 0 }, e: { r: 11, c: 6 } },
        { s: { r: 16, c: 0 }, e: { r: 16, c: 6 } },
        { s: { r: 21, c: 0 }, e: { r: 21, c: 6 } },
        { s: { r: 21 + formData.inspectionItems.length, c: 0 }, e: { r: 21 + formData.inspectionItems.length, c: 6 } },
        { s: { r: 26 + formData.inspectionItems.length, c: 0 }, e: { r: 26 + formData.inspectionItems.length, c: 6 } },
        { s: { r: 31 + formData.inspectionItems.length, c: 0 }, e: { r: 31 + formData.inspectionItems.length, c: 6 } },
      ];
      ws['!merges'] = merges;
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Pre-Checklist');
      
      // Generate filename
      const filename = `Headlight_PreChecklist_${formData.carDetails.regNo || 'NEW'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Download
      XLSX.writeFile(wb, filename);
      
      showToast('Excel file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      showToast('Failed to generate Excel file', 'error');
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
  
  const newFiles = Array.from(files);
    setSelectedFiles(prev => [...prev, ...newFiles]);
    
    // Preview images immediately
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
    
    showToast(`${newFiles.length} file(s) selected`, 'info');
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      showToast('Please select files first', 'warning');
      return;
    }

    try {
      setUploading(true);
      const uploadedUrls: string[] = [];
      
      for (const file of selectedFiles) {
        try {
          // Create a FormData object
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'pre-checklist');
          formData.append('checklistId', checklistId || 'new');
          
          // Upload the file
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error(`Failed to upload ${file.name}`);
          }
          
          const data = await response.json();
          uploadedUrls.push(data.url);
          
          // Update progress
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: 100
          }));
          
        } catch (error) {
          console.error(`Error uploading ${file.name}:`, error);
          showToast(`Failed to upload ${file.name}`, 'error');
        }
      }
      
      // Update form data with uploaded URLs
      setFormData(prev => ({
        ...prev,
        uploadedImages: [...prev.uploadedImages, ...uploadedUrls]
      }));
      
      showToast(`Successfully uploaded ${uploadedUrls.length} file(s)`, 'success');
      setSelectedFiles([]);
      setUploadProgress({});
      
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload files', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles(prev => [...prev, ...files]);
      
      // Preview images
      files.forEach(file => {
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
      
      showToast(`${files.length} file(s) added`, 'info');
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const removeUploadedImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
  };

  // Progress Stepper Component
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
          <p className="text-gray-600">Loading headlight pre-checklist form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-teal-600 text-white px-8 py-6 shadow-lg">
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
                  : 'Automotive Lighting Pre-Service Inspection Checklist'
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
            <PDFDownloadButton />
            {/* <button
              onClick={downloadExcel}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors shadow-sm"
            >
              <Download className="h-5 w-5" />
              Download Excel
            </button> */}
          </div>
        </div>
      </div>

      {/* Main Content with Step-by-Step Wizard */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Progress Stepper */}
        {renderProgressStepper()}
        
        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8">
          {currentStep === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[0]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[0]}</p>
              
              {/* Service Type Selection */}
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600" />
                  Service Type
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    type="button"
                    onClick={() => handleInputChange('serviceType', 'pickup_only')}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.serviceType === 'pickup_only'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <div className="font-medium">Product Pickup Only</div>
                    <p className="text-sm text-gray-600 mt-1">Customer collects product</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('serviceType', 'workshop_installation')}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.serviceType === 'workshop_installation'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <WrenchIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <div className="font-medium">Workshop Installation</div>
                    <p className="text-sm text-gray-600 mt-1">Installation at our workshop</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputChange('serviceType', 'mobile_service')}
                    className={`p-4 border-2 rounded-lg text-center transition-all ${
                      formData.serviceType === 'mobile_service'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Truck className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                    <div className="font-medium">Mobile Service</div>
                    <p className="text-sm text-gray-600 mt-1">We deliver & install</p>
                  </button>
                </div>
              </div>

              {/* Inspection Items Section */}
              <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-teal-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Headlight Inspection Items</h2>
                        <p className="text-sm text-gray-600">L-LEFT SIDE | R-RIGHT SIDE</p>
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
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                          }`}
                        >
                          <div className="font-medium text-gray-900 mb-1">Basic Headlight Check</div>
                          <p className="text-sm text-gray-600">6 essential lighting items</p>
                        </button>
                        <button
                          onClick={() => handleTemplateSelect('headlight_comprehensive')}
                          className={`p-4 border rounded-lg text-left transition-all ${
                            selectedTemplate === 'headlight_comprehensive'
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
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
                                    {item.side === 'both' ? 'L-LEFT | R-RIGHT' : item.side === 'vehicle' ? 'VEHICLE' : 'BOTH SIDES'}
                                  </div>
                                </div>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                                  {getStatusIcon(item.status)}
                                  <span className="capitalize">{item.status === 'pending' ? 'Pending' : item.status}</span>
                                </span>
                              </div>
                              
                              <div className="flex items-center gap-2 mt-3">
                                <button
                                  onClick={() => handleStatusChange(index, 'ok')}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    item.status === 'ok'
                                      ? 'bg-green-100 text-green-800 border border-green-300'
                                      : 'text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-200 border border-transparent'
                                  }`}
                                >
                                  <CheckCircle className="h-3 w-3" />
                                  OK
                                </button>
                                <button
                                  onClick={() => handleStatusChange(index, 'fault')}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    item.status === 'fault'
                                      ? 'bg-red-100 text-red-800 border border-red-300'
                                      : 'text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200 border border-transparent'
                                  }`}
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  Fault
                                </button>
                                <button
                                  onClick={() => handleStatusChange(index, 'n/a')}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                    item.status === 'n/a'
                                      ? 'bg-gray-100 text-gray-800 border border-gray-300'
                                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200 border border-transparent'
                                  }`}
                                >
                                  <FileText className="h-3 w-3" />
                                  N/A
                                </button>
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
                                  placeholder="Add specific observations, damage details, or notes..."
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                  rows={2}
                                />
                              </div>
                              
                              <div className="mt-3">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Side
                                </label>
                                <div className="flex gap-4">
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`side-${index}`}
                                      checked={item.side === 'both'}
                                      onChange={() => handleItemChange(index, 'side', 'both')}
                                      className="text-blue-600"
                                    />
                                    <span>Both Sides</span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`side-${index}`}
                                      checked={item.side === 'left'}
                                      onChange={() => handleItemChange(index, 'side', 'left')}
                                      className="text-blue-600"
                                    />
                                    <span>Left Only</span>
                                  </label>
                                  <label className="flex items-center gap-2">
                                    <input
                                      type="radio"
                                      name={`side-${index}`}
                                      checked={item.side === 'right'}
                                      onChange={() => handleItemChange(index, 'side', 'right')}
                                      className="text-blue-600"
                                    />
                                    <span>Right Only</span>
                                  </label>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
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
                    <UserType className="h-5 w-5 text-blue-600" />
                    Customer Details
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
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-700">
                        Customer details are automatically populated from the connected opportunity. 
                        You can edit any fields if needed.
                      </p>
                      {opportunity && (
                        <div className="mt-2 flex items-center gap-2 text-xs">
                          <span className="text-blue-600 font-medium">Source:</span>
                          <span className="text-blue-800">{opportunity.subject}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      Service Type *
                    </label>
                    <select
                      value={formData.serviceType}
                      onChange={(e) => handleInputChange('serviceType', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="workshop_installation">Workshop Installation</option>
                      <option value="pickup_only">Product Pickup Only</option>
                      <option value="mobile_service">Mobile Service</option>
                    </select>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <UserType className="h-4 w-4" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={formData.customerDetails.firstName}
                        onChange={(e) => handleCustomerDetailChange('firstName', e.target.value)}
                        placeholder="First name"
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
                        placeholder="Last name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *
                      </label>
                      <input
                        type="email"
                        value={formData.customerDetails.email}
                        onChange={(e) => handleCustomerDetailChange('email', e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        value={formData.customerDetails.phone}
                        onChange={(e) => handleCustomerDetailChange('phone', e.target.value)}
                        placeholder="+254 712 345 678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              
              <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <CarIcon className="h-5 w-5 text-blue-600" />
                    Vehicle Details
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
                
                {/* Vehicle Details Section */}
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">
                    CAR DETAILS
                  </h3>
                  
                  {/* Registration Number */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        REG NO *
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.carDetails.regNo}
                          onChange={(e) => handleCarDetailChange('regNo', e.target.value)}
                          placeholder="Enter registration number"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                        {!formData.carDetails.regNo && (
                          <div className="absolute right-3 top-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                          </div>
                        )}
                      </div>
                      {!formData.carDetails.regNo && (
                        <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          ⚠️ Registration number required. Please enter manually.
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MAKE
                      </label>
                      <input
                        type="text"
                        value={formData.carDetails.make}
                        onChange={(e) => handleCarDetailChange('make', e.target.value)}
                        placeholder="e.g., Toyota, BMW, Mercedes"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        YEAR OF MANUFACTURE
                      </label>
                      <input
                        type="text"
                        value={formData.carDetails.year}
                        onChange={(e) => handleCarDetailChange('year', e.target.value)}
                        placeholder="e.g., 2022, 2020"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        MODEL
                      </label>
                      <input
                        type="text"
                        value={formData.carDetails.model}
                        onChange={(e) => handleCarDetailChange('model', e.target.value)}
                        placeholder="e.g., Land Cruiser, X5, C-Class"
                        className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Service Details Section */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Service Details
                  </h3>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Description
                    </label>
                    <input
                      type="text"
                      value={formData.productServiceNeeded}
                      onChange={(e) => handleInputChange('productServiceNeeded', e.target.value)}
                      placeholder="Describe the service needed"
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  {/* Price Section */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Service Price (KES) *
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={formData.productPrice}
                          onChange={(e) => handleInputChange('productPrice', parseFloat(e.target.value) || 0)}
                          placeholder="Enter service price"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                          required
                        />
                        <div className="absolute right-3 top-3 text-gray-500">
                          KES
                        </div>
                      </div>
                      {formData.productPrice === 0 && (
                        <p className="mt-2 text-sm text-amber-600 bg-amber-50 p-2 rounded">
                          ⚠️ No price found in opportunity. Please enter manually.
                        </p>
                      )}
                    </div>
                    
                    {/* Price Summary */}
                    <div className={`p-4 rounded-lg border ${
                      formData.productPrice > 0 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-amber-50 border-amber-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-medium text-gray-700">Total Service Price</div>
                          <div className="text-2xl font-bold text-gray-900 mt-1">
                            KES {formData.productPrice.toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          {formData.productPrice > 0 ? (
                            <div className="flex items-center gap-1 text-green-600">
                              <CheckCircle className="h-5 w-5" />
                              <span className="text-sm">Price Set</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 text-amber-600">
                              <AlertTriangle className="h-5 w-5" />
                              <span className="text-sm">Enter Price</span>
                            </div>
                          )}
                        </div>
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
                      placeholder="Any additional notes, special requests, or observations..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[3]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[3]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6 space-y-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <WrenchIcon className="h-5 w-5 text-blue-600" />
                  Installation Details
                </h2>
                
                {/* Technician Assignment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned Technician {formData.serviceType === 'workshop_installation' && '*'}
                  </label>
                  
                  {loadingTechnicians ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading technicians...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="relative">
                        <select
                          name="assignedTechnician"
                          value={formData.installationDetails.assignedTechnician}
                          onChange={(e) => {
                            handleNestedInputChange('installationDetails', 'assignedTechnician', e.target.value);
                            const selected = technicians.find(t => t.id === e.target.value);
                            setSelectedTechnician(selected || null);
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none appearance-none"
                          disabled={loadingTechnicians}
                        >
                          <option value="">Select Technician</option>
                          {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>
                              {tech.name} ({tech.email})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                      </div>

                      {selectedTechnician && (
                        <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                              {selectedTechnician.name?.charAt(0) || selectedTechnician.email?.charAt(0) || 'T'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {selectedTechnician.name || 'Technician'}
                              </div>
                              <div className="text-sm text-gray-600">{selectedTechnician.email}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Work Start Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Start Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.installationDetails.workStartTime.split('.')[0]}
                    onChange={(e) => handleNestedInputChange('installationDetails', 'workStartTime', e.target.value)}
                    className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                {/* Estimated Installation Time */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Installation Time
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { value: 'less_1_hour', label: '< 1 hour', icon: <Timer className="h-4 w-4" /> },
                      { value: '1_2_hours', label: '1-2 hours', icon: <Timer className="h-4 w-4" /> },
                      { value: '3_hours', label: '3 hours', icon: <Timer className="h-4 w-4" /> },
                      { value: 'more_3_hours', label: '> 3 hours', icon: <Timer className="h-4 w-4" /> }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleNestedInputChange('installationDetails', 'estimatedTime', option.value)}
                        className={`p-4 border rounded-lg flex flex-col items-center justify-center gap-2 transition-all ${
                          formData.installationDetails.estimatedTime === option.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {option.icon}
                        <span className="text-sm font-medium">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Delivery/Pickup Method */}
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery/Pickup Method</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                      { 
                        value: 'customer_pickup', 
                        label: 'Customer Pickup', 
                        sublabel: 'Customer collects at workshop',
                        icon: <Home className="h-5 w-5" /> 
                      },
                      { 
                        value: 'courier_delivery', 
                        label: 'Courier Delivery', 
                        sublabel: 'We arrange delivery service',
                        icon: <Truck className="h-5 w-5" /> 
                      },
                      { 
                        value: 'mobile_delivery_install', 
                        label: 'Mobile Service', 
                        sublabel: 'We deliver & install on-site',
                        icon: <CarIcon className="h-5 w-5" /> 
                      }
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleInputChange('deliveryPickupMethod', option.value)}
                        className={`p-4 border rounded-lg text-center transition-all ${
                          formData.deliveryPickupMethod === option.value
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex justify-center mb-2">
                          {option.icon}
                        </div>
                        <div className="font-medium mb-1">{option.label}</div>
                        <div className="text-xs text-gray-600">{option.sublabel}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[4]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[4]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FileSignature className="h-5 w-5 text-blue-600" />
                    Terms & Conditions
                  </h2>
                  <span className="text-sm text-gray-500">Required Fields *</span>
                </div>
                
                {/* Scrollable Terms Container */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="h-96 overflow-y-auto p-4">
                    
                    {/* Dashboard Warning Notice */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-yellow-800 mb-1">NOTICE</h4>
                          <p className="text-sm text-yellow-700">
                            If your vehicle has dashboard warning lights/errors, additional diagnostic charges may apply 
                            for error code reading/clearing.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Personal Items Terms */}
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Personal Items & Valuables</h3>
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
                    
                    {/* Headlight Specific Terms */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Headlight Service Terms & Conditions</h3>
                      <div className="space-y-4 text-xs text-gray-700">
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">1. Scope and Customer Obligations:</h4>
                          <div className="ml-4 space-y-1">
                            <p>1.1. Eagle Lights specialises in automotive lighting, offering headlight installations and customizations.</p>
                            <p>1.2. Accurate vehicle information is crucial, and customers must disclose pre-existing modifications.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">2. Manufacturer's Warranty and Voiding Conditions:</h4>
                          <div className="ml-4 space-y-1">
                            <p>2.1. While Eagle Lights provides a limited warranty for workmanship, manufacturer's warranties vary and are not our responsibility.</p>
                            <p>2.2. Certain actions, like unauthorised modifications, shall void the warranty.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">3. Warranty Period and Refund:</h4>
                          <div className="ml-4 space-y-1">
                            <p>3.1. The warranty period for workmanship is Six Months to One Year depending on the product.</p>
                            <p>3.2. Refunds cannot be given if Eagle Lights has attained the expected standards regardless of whether the client's standards have not been achieved.</p>
                            <p>3.3. If a client requests a refund, Eagle Lights will charge it as a new installation, and installation rates will be applicable.</p>
                            <p>3.4. We do not provide a refund if the vehicle rejects the product installed, and the product testing shows that the product is working properly.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">4. Unauthorised Modifications:</h4>
                          <div className="ml-4">
                            <p>4.1. Unauthorised alterations to installed components, including those not performed by Eagle Lights technicians, will void the warranty and limit liability.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">5. Service Charges and Payments:</h4>
                          <div className="ml-4 space-y-1">
                            <p>5.1. Customers agree to pay for services as outlined in the invoice.</p>
                            <p>5.2. Late payments may incur additional charges.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">6. Risks and Informed Decision:</h4>
                          <div className="ml-4 space-y-1">
                            <p>6.1. Customers acknowledge that customizations and upgrades involve risks, including compatibility and breakage issues.</p>
                            <p>6.2. They make informed decisions to proceed despite these risks.</p>
                            <p>6.3. Customization/Upgrade may cause engine errors. In such events, the customer will be responsible for clearing such errors with Eagle Lights assistance.</p>
                            <p>6.4. Once customization is done, it may be impossible to return the headlight back to the original manufacturer's design.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">7. Customer Liability and Acknowledgment:</h4>
                          <div className="ml-4 space-y-1">
                            <p>7.1. Customers take responsibility for customization choices.</p>
                            <p>7.2. Eagle Lights is not liable for damages arising from customization or upgrades.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">8. Steps for Issue Resolution:</h4>
                          <div className="ml-4">
                            <p>8.1. In case of issues, customers must follow specific steps, including contacting Eagle Lights and providing visual documentation.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">9. Limitation of Liability:</h4>
                          <div className="ml-4 space-y-1">
                            <p>9.1. Eagle Lights is not liable for direct/indirect damages arising from services.</p>
                            <p>9.2. This includes loss of profits, personal injury, or property damage.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">10. Giving Vehicle to Non-Eagle Lights Technician:</h4>
                          <div className="ml-4">
                            <p>10.1. Allowing non-Eagle Lights technicians to perform alterations on the installed headlights may void the warranty and limit liability.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">11. Dispute Resolution:</h4>
                          <div className="ml-4">
                            <p>11.1. Disputes are resolved through negotiation, mediation, and arbitration, with exclusive jurisdiction in Kenya.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">12. Privacy Policy:</h4>
                          <div className="ml-4">
                            <p>12.1. Customer information collected is used solely for service purposes and treated as per Eagle Lights' Privacy Policy.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">13. Acknowledgement of Risks and Acceptance of Modifications:</h4>
                          <div className="ml-4 space-y-1">
                            <p>13.1. Customers acknowledge the inherent risks associated with headlight customization and upgrades.</p>
                            <p>13.2. Once a customer approves modifications and upgrades, they recognize that the vehicle's original manufacturing state cannot be fully restored, and they willingly accept these risks.</p>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-medium text-gray-800 mb-1">14. Non-Liability for Damages Resulting from Customization:</h4>
                          <div className="ml-4 space-y-1">
                            <p>14.1. Eagle Lights shall not be held liable for any damages, losses, or costs resulting from the customization process.</p>
                            <p>14.2. This includes issues like breakages, sweating, compatibility, electrical problems, alignment concerns, AFS compatibility, error lights on the dashboard, or warranty implications.</p>
                          </div>
                        </div>
                        
                      </div>
                    </div>
                    
                  </div>
                </div>
                
                {/* Acceptance Checkboxes */}
                <div className="mt-6 space-y-4">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      id="acceptDiagnosticCharges"
                      checked={formData.acceptDiagnosticCharges}
                      onChange={(e) => handleInputChange('acceptDiagnosticCharges', e.target.checked)}
                      className="mt-1"
                      required
                    />
                    <label htmlFor="acceptDiagnosticCharges" className="text-sm text-gray-700">
                      I understand that dashboard error diagnosis/clearing incurs additional charges as per the service rate card *
                    </label>
                  </div>
                  
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
                      I accept the Terms and Conditions of Eagle Lights Automotive LTD *
                    </label>
                  </div>
                </div>
                
                {/* Signatures */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
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
                        className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
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
                        className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
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
                
                {/* Upload Images - Compact */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Images (Optional)
                  </label>
                  
                  {/* Drag and Drop Area */}
                  <div 
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('file-input')?.click()}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                  >
                    <input
                      id="file-input"
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600 mb-1">Drag & drop files here or click to browse</p>
                    <p className="text-xs text-gray-500">Supports images, PDF, Word documents</p>
                  </div>

                  {/* Selected Files Preview */}
                  {selectedFiles.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files ({selectedFiles.length})</h4>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm text-gray-700 truncate max-w-xs">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(1)} KB • {file.type}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {uploadProgress[file.name] && (
                                <div className="w-24 bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${uploadProgress[file.name]}%` }}
                                  />
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="p-1 text-gray-400 hover:text-red-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <button
                        type="button"
                        onClick={handleUpload}
                        disabled={uploading}
                        className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2 disabled:opacity-50"
                      >
                        {uploading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4" />
                            Upload {selectedFiles.length} file(s)
                          </>
                        )}
                      </button>
                    </div>
                  )}

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
                              {image.startsWith('data:image') || image.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                                <img
                                  src={image}
                                  alt={`Upload ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                                  <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeUploadedImage(index)}
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

                {/* Remarks */}
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Remarks
                  </label>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Any additional notes or observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          
          <div className="flex gap-4">
            <button
              onClick={handleSaveAsDraft}
              className="px-6 py-3 rounded-lg font-medium border border-gray-300 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
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
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5" />
                    {mode === 'edit' ? 'Update Checklist' : 'Create Pre-Checklist'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}