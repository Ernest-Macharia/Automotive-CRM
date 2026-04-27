'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
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
  PaintBucket,
  Sun,
  Moon,
  Navigation,
  AlertTriangle as AlertTriangleIcon,
  Droplet,
  Wind,
  Battery,
  Activity
} from 'lucide-react';
import { preChecklistService, InspectionItem, ChecklistFile, CreatePreChecklistDto } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { serviceService, Service } from '@/services/serviceService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import TermsModal from '@/components/pre-checklist/TermsModal';

interface PreChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

type ServiceType = 'pickup_only' | 'workshop_installation' | 'mobile_service';
type DeliveryMethod = 'customer_pickup' | 'courier_delivery' | 'mobile_delivery_install';
const PRE_CHECKLIST_DRAFT_KEY = 'headlightPreChecklistDraft';
const PRE_CHECKLIST_DRAFT_EXCLUDED_FIELDS = ['uploadedImages', 'files', 'clientSignature', 'inspectorSignature'] as const;

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function mergeDraftData<T>(base: T, draft: unknown): T {
  if (Array.isArray(base)) {
    return (Array.isArray(draft) ? draft : base) as T;
  }

  if (!isPlainObject(base) || !isPlainObject(draft)) {
    return (draft ?? base) as T;
  }

  const merged: Record<string, any> = { ...base };

  Object.keys(draft).forEach((key) => {
    const baseValue = (base as Record<string, any>)[key];
    const draftValue = (draft as Record<string, any>)[key];
    merged[key] = mergeDraftData(baseValue, draftValue);
  });

  return merged as T;
}

function isCompatiblePreChecklistDraft(
  draft: any,
  opportunityId?: string | null,
  workOrderId?: string | null,
  vehicleId?: string | null,
): boolean {
  if (!draft || typeof draft !== 'object') return false;

  const matches = (draftValue: string | undefined, routeValue: string | null | undefined) =>
    !draftValue || !routeValue || draftValue === routeValue;

  return (
    matches(draft.opportunityId, opportunityId) &&
    matches(draft.vehicleId, vehicleId) &&
    matches(draft.workOrderId, workOrderId)
  );
}

function normalizeEntityId(value: unknown): string {
  let candidate = '';

  if (typeof value === 'string') {
    candidate = value.trim();
  } else if (value && typeof value === 'object') {
    candidate = String((value as any)._id || (value as any).id || '').trim();
  }

  if (!candidate) return '';
  const invalidTokens = new Set(['undefined', 'null', '[object Object]', 'NaN']);
  return invalidTokens.has(candidate) ? '' : candidate;
}

function hasOpportunityShape(value: unknown): value is Record<string, any> {
  return !!(
    value &&
    typeof value === 'object' &&
    ((value as any).customer || (value as any).subject || (value as any)._id || (value as any).id)
  );
}

function buildPreChecklistDraftPayload<T extends Record<string, any>>(value: T): T {
  const cloned = JSON.parse(JSON.stringify(value));

  for (const field of PRE_CHECKLIST_DRAFT_EXCLUDED_FIELDS) {
    if (!(field in cloned)) continue;
    cloned[field] = field === 'uploadedImages' || field === 'files' ? [] : '';
  }

  return cloned;
}

async function readFileAsDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(String(event.target?.result || ''));
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

async function compressChecklistImage(file: File, maxDimension = 1600, quality = 0.78): Promise<string> {
  const sourceDataUrl = await readFileAsDataUrl(file);

  return await new Promise((resolve) => {
    const image = new window.Image();

    image.onload = () => {
      const longestSide = Math.max(image.width, image.height) || 1;
      const scale = Math.min(1, maxDimension / longestSide);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));

      const context = canvas.getContext('2d');
      if (!context) {
        resolve(sourceDataUrl);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };

    image.onerror = () => resolve(sourceDataUrl);
    image.src = sourceDataUrl;
  });
}

function getFieldIdentifiers(name: string) {
  return {
    id: name.replace(/[^a-zA-Z0-9_-]+/g, '-'),
    name,
  };
}

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
  const normalizedOpportunityId = normalizeEntityId(opportunityId);
  const normalizedWorkOrderId = normalizeEntityId(workOrderId);
  const normalizedVehicleId = normalizeEntityId(vehicleId);

  const [loading, setLoading] = useState(mode === 'create');
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [existingChecklist, setExistingChecklist] = useState<any>(null);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showCustomerEdit, setShowCustomerEdit] = useState(false);
  const [showVehicleEdit, setShowVehicleEdit] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftRestoredRef = useRef(false);

  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 5;

  // Step titles and descriptions
  const stepTitles = [
    'Headlight Inspection',
    'Customer Details', 
    'Vehicle Details',
    'Service Details',
    'Terms & Signatures'
  ];

  const stepDescriptions = [
    'Complete headlight inspection - all items in one form',
    'Enter customer and inspector information',
    'Add vehicle details',
    'Set service type and delivery method',
    'Review terms and get signatures'
  ];

  // Form state - UNIFIED HEADLIGHT INSPECTION FORM (like Diamond Rimz)
  const [formData, setFormData] = useState({
    opportunityId: normalizedOpportunityId || '',
    vehicleId: normalizedVehicleId || '',
    inspectedBy: sessionStorage.getItem('userId') || '',
    inspectorName: '',
    remarks: '',
    tags: [] as string[],
    approved: false,
    pricingSnapshot: {
      currency: 'KES',
      items: [] as Array<{
        name: string;
        itemType: 'service' | 'product';
        quantity: number;
        unitPrice: number;
        total: number;
      }>,
      subtotal: 0,
      total: 0
    },
    
    // Service intake
    serviceIntake: {
      date: new Date().toISOString().split('T')[0],
      customerServiceRep: sessionStorage.getItem('userName') || '',
      inspectorNotes: '',
      backendAccessCode: '',
      priorityLevel: 'normal' as 'normal' | 'urgent' | 'low',
      specialInstructions: ''
    },
    
    // Customer details
    customerDetails: {
      name: '',
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
    },
    
    // Car details
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
    
    // Service details
    serviceType: 'workshop_installation' as ServiceType,
    productServiceNeeded: '',
    productPrice: 0,
    servicePrice: 0,
    additionalInformation: '',
    deliveryPickupMethod: 'customer_pickup' as DeliveryMethod,
    
    // UNIFIED HEADLIGHT INSPECTION - SINGLE FORM LIKE DIAMOND RIMZ
    headlightInspection: {
      // High Beam
      highBeam: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Low Beam
      lowBeam: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Daytime Running Light
      daytimeRunningLight: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Turn Signal
      turnSignal: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Fog Lights
      fogLights: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Parking Bulb
      parkingBulb: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Angel Lights
      angelLights: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Headlight Adjusters
      headlightAdjusters: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Adaptive Front Lights (AFS)
      adaptiveFrontLights: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Dimming Functionality
      dimmingFunctionality: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Headlight Wiring and Connectors
      headlightWiring: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Beam Alignment
      beamAlignment: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Headlight Lens
      headlightLens: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Water Proofing
      waterProofing: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      },
      // Dashboard Warning Lights
      dashboardWarningLights: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        warningCodes: '',
        requiresDiagnostic: false
      },
      // Bumper Condition
      bumperCondition: {
        status: 'pending' as 'ok' | 'fault' | 'n/a' | 'pending',
        remarks: '',
        leftOk: false,
        rightOk: false,
        leftFault: false,
        rightFault: false,
        sideNotes: ''
      }
    },
    
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
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);
  const inspectorSigRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (loading || mode === 'edit' || draftRestoredRef.current) {
      return;
    }

    try {
      const savedDraft = localStorage.getItem(PRE_CHECKLIST_DRAFT_KEY);
      if (!savedDraft) {
        draftRestoredRef.current = true;
        return;
      }

      const parsedDraft = JSON.parse(savedDraft);
      if (!isCompatiblePreChecklistDraft(parsedDraft, normalizedOpportunityId, normalizedWorkOrderId, normalizedVehicleId)) {
        draftRestoredRef.current = true;
        return;
      }

      setFormData((prev) => mergeDraftData(prev, parsedDraft));
      draftRestoredRef.current = true;
      showToast('Restored your saved pre-checklist draft', 'info');
    } catch (error) {
      console.error('Failed to restore headlight pre-checklist draft:', error);
      draftRestoredRef.current = true;
    }
  }, [loading, mode, normalizedOpportunityId, normalizedWorkOrderId, normalizedVehicleId, showToast]);

  useEffect(() => {
    if (loading || mode === 'edit') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(
          PRE_CHECKLIST_DRAFT_KEY,
          JSON.stringify(buildPreChecklistDraftPayload(formData)),
        );
      } catch (error) {
        console.error('Failed to autosave headlight pre-checklist draft:', error);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [formData, loading, mode]);

  // Selected template
  const [selectedTemplate, setSelectedTemplate] = useState('headlight_comprehensive');

  const loadServiceOptions = async () => {
    try {
      setLoadingServices(true);
      const services = await serviceService.getAllServices();
      const activeServices = services
        .filter((service) => service.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
      setAvailableServices(activeServices);
    } catch (error) {
      console.error('Error loading headlight pre-checklist services:', error);
      showToast('Could not load services for dropdown selection', 'warning');
    } finally {
      setLoadingServices(false);
    }
  };

  // Load related data
  useEffect(() => {
    loadRelatedData();
  }, [normalizedOpportunityId, normalizedWorkOrderId, normalizedVehicleId, checklistId, mode]);

  useEffect(() => {
    loadServiceOptions();
  }, []);

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

  // Map checklist to form data - UNIFIED HEADLIGHT FORM
  const mapChecklistToForm = (checklist: any) => {
    // Parse additionalInformation if it exists
    let headlightInspection = {};
    try {
      if (checklist?.additionalInformation) {
        const parsed = JSON.parse(checklist.additionalInformation);
        headlightInspection = parsed.headlightInspection || {};
      }
    } catch (e) {
      // If it's not JSON, use default
      headlightInspection = formData.headlightInspection;
    }

    return {
      opportunityId: toId(checklist?.opportunityId),
      vehicleId: toId(checklist?.vehicleId),
      inspectedBy: toId(checklist?.inspectedBy) || sessionStorage.getItem('userId') || '',
      inspectorName: checklist?.inspectorName || '',
      remarks: checklist?.remarks || '',
      tags: Array.isArray(checklist?.tags) ? checklist.tags : [],
      approved: !!checklist?.approved,
      pricingSnapshot: checklist?.pricingSnapshot
        ? {
            currency: checklist.pricingSnapshot.currency || 'KES',
            items: Array.isArray(checklist.pricingSnapshot.items) ? checklist.pricingSnapshot.items : [],
            subtotal: checklist.pricingSnapshot.subtotal ?? 0,
            total: checklist.pricingSnapshot.total ?? 0
          }
        : {
            currency: 'KES',
            items: [],
            subtotal: 0,
            total: 0
          },
      
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
        vin: checklist?.carDetails?.vin || '',
      },
      
      serviceType: checklist?.serviceType || 'workshop_installation',
      productServiceNeeded: checklist?.productServiceNeeded || '',
      productPrice: checklist?.productPrice || 0,
      servicePrice: checklist?.servicePrice || 0,
      additionalInformation: typeof checklist?.additionalInformation === 'string' && !checklist.additionalInformation.startsWith('{') 
        ? checklist.additionalInformation 
        : '',
      
      deliveryPickupMethod: checklist?.deliveryPickupMethod || 'customer_pickup',
      acceptDiagnosticCharges: !!checklist?.acceptDiagnosticCharges,
      
      headlightInspection: {
        ...formData.headlightInspection,
        ...headlightInspection
      },
      
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
      let resolvedOpportunity: any = null;
      let shouldWarnOpportunityLoad = false;

      // Load existing checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await preChecklistService.getPreChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        const mappedFormData = mapChecklistToForm(checklist);
        setFormData(mappedFormData as any);
        
        if (typeof checklist.opportunityId === 'object') {
          setOpportunity(checklist.opportunityId);
          if (hasOpportunityShape(checklist.opportunityId)) {
            resolvedOpportunity = checklist.opportunityId;
          }
        }
        if (typeof checklist.vehicleId === 'object') {
          setVehicle(checklist.vehicleId);
        }
      }

      // Load opportunity if provided
      if (normalizedOpportunityId) {
        try {
          resolvedOpportunity = await opportunityService.getOpportunityById(normalizedOpportunityId, false);
          setOpportunity(resolvedOpportunity);
          
          if (resolvedOpportunity.vehicles && resolvedOpportunity.vehicles.length > 0) {
            const primaryVehicle = resolvedOpportunity.vehicles[0];
            setVehicle(primaryVehicle);
            
            setFormData(prev => ({
              ...prev,
              opportunityId: normalizedOpportunityId,
              vehicleId: primaryVehicle._id || normalizedVehicleId || ''
            }));
          } else if (normalizedVehicleId) {
            try {
              const veh = await vehicleService.getVehicleById(normalizedVehicleId);
              setVehicle(veh);
              setFormData(prev => ({
                ...prev,
                opportunityId: normalizedOpportunityId,
                vehicleId: normalizedVehicleId
              }));
            } catch (vehError) {
              console.error('Error loading vehicle:', vehError);
            }
          }
        } catch (error) {
          console.error('Error loading opportunity:', error);
          shouldWarnOpportunityLoad = true;
        }
      }

      // Load work order if provided
      if (normalizedWorkOrderId) {
        try {
          const wo = await workOrderService.getWorkOrderById(normalizedWorkOrderId);
          setWorkOrder(wo);

          if (!resolvedOpportunity && wo.opportunityId) {
            if (hasOpportunityShape(wo.opportunityId)) {
              resolvedOpportunity = wo.opportunityId;
            }

            const workOrderOpportunityId = normalizeEntityId(wo.opportunityId);
            if (!resolvedOpportunity && workOrderOpportunityId) {
              try {
                resolvedOpportunity = await opportunityService.getOpportunityById(workOrderOpportunityId, false);
              } catch (error) {
                console.error('Error loading work order opportunity:', error);
                shouldWarnOpportunityLoad = true;
              }
            }
          }
        } catch (error) {
          console.error('Error loading work order:', error);
          showToast('Could not load work order details', 'warning');
        }
      }

      if (resolvedOpportunity) {
        setOpportunity(resolvedOpportunity);

        const primaryVehicle = resolvedOpportunity.vehicles?.[0];
        const resolvedVehicleId = normalizeEntityId(primaryVehicle) || normalizedVehicleId;

        if (normalizeEntityId(primaryVehicle)) {
          try {
            const detailedVehicle = await vehicleService.getVehicleById(normalizeEntityId(primaryVehicle));
            setVehicle(detailedVehicle);
          } catch (vehError) {
            console.error('Error loading detailed vehicle:', vehError);
            setVehicle(primaryVehicle);
          }
        } else if (normalizedVehicleId) {
          try {
            const veh = await vehicleService.getVehicleById(normalizedVehicleId);
            setVehicle(veh);
          } catch (vehError) {
            console.error('Error loading vehicle:', vehError);
          }
        }

        setFormData(prev => ({
          ...prev,
          opportunityId: normalizeEntityId(resolvedOpportunity) || normalizedOpportunityId || prev.opportunityId,
          vehicleId: resolvedVehicleId || prev.vehicleId
        }));
      }

      if (shouldWarnOpportunityLoad && !resolvedOpportunity && (normalizedOpportunityId || normalizedWorkOrderId)) {
        showToast('Could not load opportunity details. You can still continue with draft/manual data.', 'warning');
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

  const handlePricingItemChange = (index: number, field: 'quantity' | 'unitPrice', rawValue: string) => {
    const value = Number(rawValue);
    if (Number.isNaN(value) || value < 0) return;
    setFormData(prev => {
      const snapshot = prev.pricingSnapshot;
      if (!snapshot) return prev;
      const items = Array.isArray(snapshot.items) ? [...snapshot.items] : [];
      if (!items[index]) return prev;
      const nextItem = {
        ...items[index],
        [field]: value
      };
      nextItem.total = Number((nextItem.quantity * nextItem.unitPrice).toFixed(2));
      items[index] = nextItem;
      const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
      return {
        ...prev,
        pricingSnapshot: {
          ...snapshot,
          items,
          subtotal,
          total: subtotal
        }
      };
    });
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

  const handleHeadlightInspectionChange = (component: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      headlightInspection: {
        ...prev.headlightInspection,
        [component]: {
          ...prev.headlightInspection[component as keyof typeof prev.headlightInspection],
          [field]: value
        }
      }
    }));
  };

  const handleHeadlightStatusChange = (component: string, status: 'ok' | 'fault' | 'n/a' | 'pending') => {
    handleHeadlightInspectionChange(component, 'status', status);
    
    // Auto-set side checkboxes based on status
    if (status === 'ok') {
      handleHeadlightInspectionChange(component, 'leftOk', true);
      handleHeadlightInspectionChange(component, 'rightOk', true);
      handleHeadlightInspectionChange(component, 'leftFault', false);
      handleHeadlightInspectionChange(component, 'rightFault', false);
    } else if (status === 'fault') {
      // Don't auto-set fault sides, user will specify
    } else if (status === 'n/a') {
      handleHeadlightInspectionChange(component, 'leftOk', false);
      handleHeadlightInspectionChange(component, 'rightOk', false);
      handleHeadlightInspectionChange(component, 'leftFault', false);
      handleHeadlightInspectionChange(component, 'rightFault', false);
    }
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

  const handleRefreshFromOpportunity = () => {
    if (opportunity) {
      autoPopulateFromOpportunity();
      showToast('Refreshed data from opportunity', 'info');
    }
  };

  const handleTemplateSelect = (template: string) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
    
    if (template === 'headlight_basic') {
      // Create a new inspection object with proper typing
      const resetInspection = { ...formData.headlightInspection };
      
      // Type-safe iteration using type assertion
      (Object.keys(resetInspection) as Array<keyof typeof resetInspection>).forEach(key => {
        if (key !== 'dashboardWarningLights') {
          // For regular components with side fields
          const regularComponent = resetInspection[key];
          if (regularComponent && typeof regularComponent === 'object' && 'leftOk' in regularComponent) {
            resetInspection[key] = {
              ...regularComponent,
              status: 'pending' as const,
              remarks: '',
              leftOk: false,
              rightOk: false,
              leftFault: false,
              rightFault: false,
              sideNotes: ''
            };
          }
        } else {
          // Special handling for dashboardWarningLights
          resetInspection.dashboardWarningLights = {
            status: 'pending' as const,
            remarks: '',
            warningCodes: '',
            requiresDiagnostic: false
          };
        }
      });
      
      setFormData(prev => ({
        ...prev,
        headlightInspection: resetInspection
      }));
    } else if (template === 'headlight_comprehensive') {
      // Keep all items - no changes needed
    }
  };

  const calculateStats = () => {
    const items = Object.values(formData.headlightInspection);
    let total = 0;
    let ok = 0;
    let fault = 0;
    let na = 0;
    let pending = 0;
    
    items.forEach(item => {
      if (item && typeof item === 'object' && 'status' in item) {
        total++;
        const status = item.status;
        if (status === 'ok') ok++;
        else if (status === 'fault') fault++;
        else if (status === 'n/a') na++;
        else pending++;
      }
    });
    
    return { total, ok, fault, na, pending };
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
      localStorage.setItem(
        PRE_CHECKLIST_DRAFT_KEY,
        JSON.stringify(buildPreChecklistDraftPayload(formData)),
      );
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
      link.download = `Headlight_Inspection_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
      link.download = `Headlight_Inspection_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
      const stats = calculateStats();
      
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
        [`Total Items: ${stats.total}`],
        [`OK: ${stats.ok}`],
        [`Faults: ${stats.fault}`],
        [`N/A: ${stats.na}`],
        [`Pending: ${stats.pending}`],
        [''],
        ['INSPECTION DETAILS']
      ];
      
      // Add inspection items
      Object.entries(formData.headlightInspection).forEach(([key, value]: [string, any]) => {
        if (value && typeof value === 'object') {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
          data.push([label, value.status || 'pending', value.remarks || '']);
          
          if (value.sideNotes) {
            data.push([`  ${label} Side Notes:`, value.sideNotes]);
          }
          
          if (key === 'dashboardWarningLights' && value.warningCodes) {
            data.push([`  Warning Codes:`, value.warningCodes]);
          }
        }
      });
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'Headlight Inspection');
      
      const filename = `Headlight_Inspection_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.xlsx`;
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles = Array.from(files);
    const imageFiles = newFiles.filter((file) => file.type.startsWith('image/'));

    if (imageFiles.length !== newFiles.length) {
      showToast('Only image files are allowed in this section', 'warning');
    }

    if (imageFiles.length === 0) {
      e.target.value = '';
      return;
    }

    const remainingSlots = 5 - formData.uploadedImages.length;
    if (remainingSlots <= 0) {
      showToast('A maximum of 5 images is allowed', 'warning');
      e.target.value = '';
      return;
    }

    const acceptedFiles = imageFiles.slice(0, remainingSlots);
    if (acceptedFiles.length < imageFiles.length) {
      showToast('Only the first 5 images can be kept', 'warning');
    }

    const totalSize = acceptedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) {
      showToast('Total file size exceeds 50MB limit', 'error');
      e.target.value = '';
      return;
    }

    try {
      const compressedImages = await Promise.all(
        acceptedFiles.map((file) => compressChecklistImage(file)),
      );

      setFormData((prev) => ({
        ...prev,
        uploadedImages: [...prev.uploadedImages, ...compressedImages]
      }));

      showToast(`${acceptedFiles.length} image(s) added`, 'success');
    } catch (error) {
      console.error('Failed to process checklist images:', error);
      showToast('Failed to process one or more images', 'error');
    }

    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      uploadedImages: prev.uploadedImages.filter((_, i) => i !== index)
    }));
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

  const syncOpportunityFromChecklist = async (targetOpportunityId: string, customerEmail?: string) => {
    if (!targetOpportunityId) {
      return;
    }

    const existingCustomer = opportunity?.customer || {};
    const existingVehicle = opportunity?.vehicles?.[0] || vehicle || {};
    const fullName = `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`.trim();

    await opportunityService.updateOpportunity(targetOpportunityId, {
      customer: {
        name: fullName || existingCustomer.name || 'Client',
        phone: formData.customerDetails.mobile || existingCustomer.phone,
        email: customerEmail || existingCustomer.email,
        companyName: existingCustomer.companyName
      },
      vehicles: [
        {
          make: formData.carDetails.carMake || existingVehicle.make || 'Unknown',
          model: formData.carDetails.carModel || existingVehicle.model || 'Unknown',
          registrationNumber:
            formData.carDetails.licensePlate ||
            existingVehicle.registrationNumber ||
            existingVehicle.licensePlate ||
            '',
          licensePlate:
            formData.carDetails.licensePlate ||
            existingVehicle.licensePlate ||
            existingVehicle.registrationNumber ||
            '',
          year: formData.carDetails.yearOfManufacture || existingVehicle.year,
          color: formData.carDetails.color || existingVehicle.color,
          engineSize: formData.carDetails.engineSize || existingVehicle.engineSize,
          fuelType: formData.carDetails.fuelType || existingVehicle.fuelType,
          mileage: formData.carDetails.mileage || existingVehicle.mileage
        }
      ]
    });
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

      const isValidObjectId = (value: string): boolean => /^[a-fA-F0-9]{24}$/.test(value);
      const normalizeId = (value: unknown): string => {
        let candidate = '';
        if (typeof value === 'string') {
          candidate = value.trim();
        } else if (value && typeof value === 'object') {
          candidate = String((value as any)._id || (value as any).id || '').trim();
        }
        return candidate && isValidObjectId(candidate) ? candidate : '';
      };

      const resolvedOpportunityId =
        normalizeId(formData.opportunityId) ||
        normalizeId(opportunityId) ||
        normalizeId(opportunity);

      if (!resolvedOpportunityId) {
        showToast('Opportunity information is missing. Reload the checklist and try again.', 'error');
        setSubmitting(false);
        return;
      }

      const resolvedVehicleId =
        normalizeId(formData.vehicleId) ||
        normalizeId(vehicle) ||
        normalizeId(existingChecklist?.vehicleId) ||
        normalizeId(opportunity?.vehicles?.[0]);

      const customerEmail = (formData.customerDetails.email || '').trim();
      if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        showToast('Enter a valid customer email or leave it blank', 'error');
        setCurrentStep(2);
        setSubmitting(false);
        return;
      }

      const clientEmail = (formData.clientEmail || '').trim();
      if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
        showToast('Enter a valid client approval email or leave it blank', 'error');
        setCurrentStep(5);
        setSubmitting(false);
        return;
      }
      const sanitizedCustomerEmail = customerEmail || undefined;
      const sanitizedClientEmail = clientEmail || undefined;

      // Convert unified headlight inspection to array format for API
      const inspectionItems = Object.entries(formData.headlightInspection).map(([key, value]: [string, any]) => {
        let itemName = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        
        // Special case for dashboard warning lights
        if (key === 'dashboardWarningLights') {
          return {
            item: itemName,
            status: value.status === 'pending' ? 'n/a' : value.status,
            remarks: value.remarks + (value.warningCodes ? ` | Codes: ${value.warningCodes}` : ''),
            side: 'vehicle'
          };
        }
        
        // For other components with sides
        let sideRemarks = '';
        if (value.leftFault || value.rightFault) {
          const sides = [];
          if (value.leftFault) sides.push('Left');
          if (value.rightFault) sides.push('Right');
          sideRemarks = `Fault on: ${sides.join(', ')}`;
        }
        
        return {
          item: itemName,
          status: value.status === 'pending' ? 'n/a' : value.status,
          remarks: [value.remarks, sideRemarks, value.sideNotes].filter(Boolean).join(' | '),
          side: value.leftFault && value.rightFault ? 'both' : 
                value.leftFault ? 'left' : 
                value.rightFault ? 'right' : 'both'
        };
      });

      // Prepare submission data
      const submissionData: CreatePreChecklistDto = {
        opportunityId: resolvedOpportunityId,
        ...(resolvedVehicleId ? { vehicleId: resolvedVehicleId } : {}),
        inspectionItems: inspectionItems as any,
        remarks: formData.remarks || '',
        approved: false,
        tags: formData.tags,
        pricingSnapshot: formData.pricingSnapshot,
        
        checklistType: 'headlight',
        inspectedBy: formData.inspectedBy,
        inspectorName: formData.inspectorName,
        
        customerDetails: {
          firstName: formData.customerDetails.firstName,
          lastName: formData.customerDetails.lastName,
          mobile: formData.customerDetails.mobile,
          email: sanitizedCustomerEmail,
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
        },
        
        serviceIntake: formData.serviceIntake,
        
        services: {
          actualService: [formData.productServiceNeeded].filter(Boolean)
        },
        
        additionalInformation: JSON.stringify({
          serviceType: formData.serviceType,
          productServiceNeeded: formData.productServiceNeeded,
          productPrice: formData.productPrice,
          servicePrice: formData.servicePrice,
          deliveryPickupMethod: formData.deliveryPickupMethod,
          acceptDiagnosticCharges: formData.acceptDiagnosticCharges,
          headlightInspection: formData.headlightInspection
        }),
        
        acceptTerms: formData.acceptTerms,
        clientSignature: formData.clientSignature,
        inspectorSignature: formData.inspectorSignature,
        clientSigningMethod: formData.clientSigningMethod,
        clientEmail: sanitizedClientEmail,
        
        uploadedImages: formData.uploadedImages,
        files: formData.files
      };

      const toChecklistTimestamp = (checklist: any): number => {
        const candidate = checklist?.updatedAt || checklist?.createdAt || checklist?.dateCreated || '';
        const parsed = Date.parse(String(candidate));
        return Number.isFinite(parsed) ? parsed : 0;
      };

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData as any);
        showToast('Headlight inspection updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        let existingChecklistId =
          normalizeId(existingChecklist?._id) ||
          normalizeId(workOrder?.preChecklistId) ||
          normalizeId(workOrder?.prechecklistId);

        if (!existingChecklistId && (workOrderId || source === 'workflow')) {
          try {
            const checklists = await preChecklistService.getPreChecklistsByOpportunity(resolvedOpportunityId);
            const sortedChecklists = [...(checklists || [])].sort(
              (left: any, right: any) => toChecklistTimestamp(right) - toChecklistTimestamp(left)
            );
            const sameTypeChecklist = sortedChecklists.find(
              (checklist: any) => String(checklist?.checklistType || '').toLowerCase() === 'headlight'
            );
            const fallbackChecklist = sameTypeChecklist || sortedChecklists[0];
            existingChecklistId = normalizeId(fallbackChecklist?._id || fallbackChecklist?.id);
          } catch (lookupError) {
            console.error('Unable to check for existing checklist before create:', lookupError);
          }
        }

        if (existingChecklistId) {
          result = await preChecklistService.updatePreChecklist(existingChecklistId, submissionData as any);
          showToast('Existing headlight inspection updated successfully', 'success');
        } else {
          result = await preChecklistService.createPreChecklist(submissionData as any, userId);
          showToast('Headlight inspection created successfully', 'success');
        }
        localStorage.removeItem(PRE_CHECKLIST_DRAFT_KEY);
      }

      // Link to work order if provided
      if (workOrderId && result?._id) {
        try {
          await workOrderService.updateWorkOrder(workOrderId, {
            preChecklistId: result._id
          });
        } catch (updateError) {
          console.error('Error updating work order:', updateError);
        }
      }

      try {
        await syncOpportunityFromChecklist(resolvedOpportunityId, sanitizedCustomerEmail);
      } catch (syncError) {
        console.error('Error syncing headlight checklist details to opportunity:', syncError);
      }

      // Navigate back
      if (workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (source === 'opportunity' && formData.opportunityId) {
        router.push(`/opportunities/${formData.opportunityId}`);
      } else if (result?._id) {
        router.push(`/pre-checklist/${result._id}`);
      } else {
        router.push('/pre-checklist');
      }

    } catch (error: any) {
      console.error('Error submitting pre-checklist:', error);
      showToast(error.message || 'Failed to save inspection', 'error');
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
      router.push('/pre-checklist');
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

  const getComponentIcon = (component: string) => {
    switch(component) {
      case 'highBeam': return <Sun className="h-5 w-5" />;
      case 'lowBeam': return <Moon className="h-5 w-5" />;
      case 'daytimeRunningLight': return <Activity className="h-5 w-5" />;
      case 'turnSignal': return <Navigation className="h-5 w-5" />;
      case 'fogLights': return <Wind className="h-5 w-5" />;
      case 'parkingBulb': return <Circle className="h-5 w-5" />;
      case 'angelLights': return <Sparkles className="h-5 w-5" />;
      case 'headlightAdjusters': return <Settings className="h-5 w-5" />;
      case 'adaptiveFrontLights': return <Activity className="h-5 w-5" />;
      case 'dimmingFunctionality': return <Activity className="h-5 w-5" />;
      case 'headlightWiring': return <Zap className="h-5 w-5" />;
      case 'beamAlignment': return <Gauge className="h-5 w-5" />;
      case 'headlightLens': return <Eye className="h-5 w-5" />;
      case 'waterProofing': return <Droplet className="h-5 w-5" />;
      case 'dashboardWarningLights': return <AlertTriangleIcon className="h-5 w-5" />;
      case 'bumperCondition': return <Car className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
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
          <p className="text-gray-600">Loading headlight inspection form...</p>
        </div>
      </div>
    );
  }

  const stats = calculateStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30">
      {/* Header - Matching Diamond Rimz style */}
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
                <Lightbulb className="h-6 w-6" />
                {mode === 'edit' ? 'Edit Headlight Inspection' : 'Headlight Pre-Service Inspection'}
              </h1>
              <p className="text-blue-100">
                {mode === 'edit' 
                  ? `Editing: Inspection #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Complete headlight inspection in one unified form'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-4 text-sm bg-white/10 px-4 py-2 rounded-lg">
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
            {/* Step 1: Headlight Inspection - UNIFIED FORM LIKE DIAMOND RIMZ */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Lightbulb className="h-6 w-6 text-blue-600" />
                      HEADLIGHT INSPECTION
                    </h2>
                    <p className="text-gray-600 mt-1">
                      Complete all headlight inspection items in this unified form
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplateSelector(!showTemplateSelector)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <Settings className="h-4 w-4" />
                      Templates
                    </button>
                  </div>
                </div>
                
                {showTemplateSelector && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-blue-800">Select Template</h3>
                      <button
                        type="button"
                        onClick={() => setShowTemplateSelector(false)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
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
                        <p className="text-xs text-gray-600 mt-1">Essential headlight components</p>
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
                        <p className="text-xs text-gray-600 mt-1">Detailed headlight inspection</p>
                        <div className="mt-2 text-xs text-blue-600">16 items</div>
                      </button>
                    </div>
                  </div>
                )}
                
                {/* UNIFIED HEADLIGHT INSPECTION FORM - ALL IN ONE PLACE LIKE DIAMOND RIMZ */}
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <ClipboardCheck className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Headlight System Inspection</h3>
                          <p className="text-xs text-gray-600">Mark each component as OK, Fault, or N/A. Specify side for faults.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> OK
                        </span>
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" /> Fault
                        </span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs flex items-center gap-1">
                          <FileText className="h-3 w-3" /> N/A
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Inspection Items Grid - UNIFIED VIEW */}
                  <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
                    {/* High Beam */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('highBeam')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">High Beam</span>
                              <span className="ml-3 text-xs text-gray-500">Headlights - Main beam</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.highBeam.status)}`}>
                                {getStatusIcon(formData.headlightInspection.highBeam.status)}
                                <span className="capitalize">{formData.headlightInspection.highBeam.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('highBeam', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.highBeam.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.highBeam.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.highBeam.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.highBeam.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('highBeam', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.highBeam.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.highBeam.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('highBeam', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.highBeam.remarks')}
                              value={formData.headlightInspection.highBeam.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('highBeam', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Low Beam */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('lowBeam')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Low Beam</span>
                              <span className="ml-3 text-xs text-gray-500">Dipped headlights</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.lowBeam.status)}`}>
                                {getStatusIcon(formData.headlightInspection.lowBeam.status)}
                                <span className="capitalize">{formData.headlightInspection.lowBeam.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('lowBeam', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.lowBeam.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.lowBeam.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.lowBeam.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.lowBeam.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('lowBeam', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.lowBeam.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.lowBeam.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('lowBeam', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.lowBeam.remarks')}
                              value={formData.headlightInspection.lowBeam.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('lowBeam', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Daytime Running Light */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('daytimeRunningLight')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Daytime Running Light</span>
                              <span className="ml-3 text-xs text-gray-500">DRL</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.daytimeRunningLight.status)}`}>
                                {getStatusIcon(formData.headlightInspection.daytimeRunningLight.status)}
                                <span className="capitalize">{formData.headlightInspection.daytimeRunningLight.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('daytimeRunningLight', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.daytimeRunningLight.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.daytimeRunningLight.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.daytimeRunningLight.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.daytimeRunningLight.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('daytimeRunningLight', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.daytimeRunningLight.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.daytimeRunningLight.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('daytimeRunningLight', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.daytimeRunningLight.remarks')}
                              value={formData.headlightInspection.daytimeRunningLight.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('daytimeRunningLight', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Turn Signal */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('turnSignal')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Turn Signal</span>
                              <span className="ml-3 text-xs text-gray-500">Indicators</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.turnSignal.status)}`}>
                                {getStatusIcon(formData.headlightInspection.turnSignal.status)}
                                <span className="capitalize">{formData.headlightInspection.turnSignal.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('turnSignal', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.turnSignal.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.turnSignal.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.turnSignal.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.turnSignal.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('turnSignal', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.turnSignal.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.turnSignal.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('turnSignal', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.turnSignal.remarks')}
                              value={formData.headlightInspection.turnSignal.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('turnSignal', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Fog Lights */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('fogLights')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Fog Lights</span>
                              <span className="ml-3 text-xs text-gray-500">Front fog lamps</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.fogLights.status)}`}>
                                {getStatusIcon(formData.headlightInspection.fogLights.status)}
                                <span className="capitalize">{formData.headlightInspection.fogLights.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('fogLights', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.fogLights.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.fogLights.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.fogLights.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.fogLights.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('fogLights', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.fogLights.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.fogLights.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('fogLights', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.fogLights.remarks')}
                              value={formData.headlightInspection.fogLights.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('fogLights', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Parking Bulb */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('parkingBulb')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Parking Bulb</span>
                              <span className="ml-3 text-xs text-gray-500">Position lights</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.parkingBulb.status)}`}>
                                {getStatusIcon(formData.headlightInspection.parkingBulb.status)}
                                <span className="capitalize">{formData.headlightInspection.parkingBulb.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('parkingBulb', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.parkingBulb.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.parkingBulb.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.parkingBulb.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.parkingBulb.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('parkingBulb', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.parkingBulb.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.parkingBulb.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('parkingBulb', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.parkingBulb.remarks')}
                              value={formData.headlightInspection.parkingBulb.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('parkingBulb', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Angel Lights */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('angelLights')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Angel Lights</span>
                              <span className="ml-3 text-xs text-gray-500">Halos / Corona rings</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.angelLights.status)}`}>
                                {getStatusIcon(formData.headlightInspection.angelLights.status)}
                                <span className="capitalize">{formData.headlightInspection.angelLights.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('angelLights', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.angelLights.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.angelLights.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.angelLights.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.angelLights.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('angelLights', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.angelLights.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.angelLights.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('angelLights', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.angelLights.remarks')}
                              value={formData.headlightInspection.angelLights.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('angelLights', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Headlight Adjusters */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('headlightAdjusters')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Headlight Adjusters</span>
                              <span className="ml-3 text-xs text-gray-500">Vertical/horizontal aim</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.headlightAdjusters.status)}`}>
                                {getStatusIcon(formData.headlightInspection.headlightAdjusters.status)}
                                <span className="capitalize">{formData.headlightInspection.headlightAdjusters.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('headlightAdjusters', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.headlightAdjusters.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.headlightAdjusters.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.headlightAdjusters.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.headlightAdjusters.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('headlightAdjusters', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.headlightAdjusters.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.headlightAdjusters.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('headlightAdjusters', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.headlightAdjusters.remarks')}
                              value={formData.headlightInspection.headlightAdjusters.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('headlightAdjusters', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Adaptive Front Lights (AFS) */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('adaptiveFrontLights')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Adaptive Front Lights (AFS)</span>
                              <span className="ml-3 text-xs text-gray-500">Cornering / swiveling</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.adaptiveFrontLights.status)}`}>
                                {getStatusIcon(formData.headlightInspection.adaptiveFrontLights.status)}
                                <span className="capitalize">{formData.headlightInspection.adaptiveFrontLights.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('adaptiveFrontLights', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.adaptiveFrontLights.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.adaptiveFrontLights.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.adaptiveFrontLights.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.adaptiveFrontLights.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('adaptiveFrontLights', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.adaptiveFrontLights.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.adaptiveFrontLights.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('adaptiveFrontLights', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.adaptiveFrontLights.remarks')}
                              value={formData.headlightInspection.adaptiveFrontLights.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('adaptiveFrontLights', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dimming Functionality */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('dimmingFunctionality')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Dimming Functionality</span>
                              <span className="ml-3 text-xs text-gray-500">Auto high beam assist</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.dimmingFunctionality.status)}`}>
                                {getStatusIcon(formData.headlightInspection.dimmingFunctionality.status)}
                                <span className="capitalize">{formData.headlightInspection.dimmingFunctionality.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('dimmingFunctionality', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.dimmingFunctionality.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.dimmingFunctionality.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.dimmingFunctionality.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.dimmingFunctionality.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('dimmingFunctionality', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.dimmingFunctionality.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.dimmingFunctionality.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('dimmingFunctionality', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.dimmingFunctionality.remarks')}
                              value={formData.headlightInspection.dimmingFunctionality.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('dimmingFunctionality', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Headlight Wiring and Connectors */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('headlightWiring')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Headlight Wiring & Connectors</span>
                              <span className="ml-3 text-xs text-gray-500">Harness, plugs, sockets</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.headlightWiring.status)}`}>
                                {getStatusIcon(formData.headlightInspection.headlightWiring.status)}
                                <span className="capitalize">{formData.headlightInspection.headlightWiring.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('headlightWiring', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.headlightWiring.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.headlightWiring.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.headlightWiring.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.headlightWiring.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('headlightWiring', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.headlightWiring.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.headlightWiring.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('headlightWiring', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.headlightWiring.remarks')}
                              value={formData.headlightInspection.headlightWiring.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('headlightWiring', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Beam Alignment */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('beamAlignment')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Beam Alignment</span>
                              <span className="ml-3 text-xs text-gray-500">Headlight aim</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.beamAlignment.status)}`}>
                                {getStatusIcon(formData.headlightInspection.beamAlignment.status)}
                                <span className="capitalize">{formData.headlightInspection.beamAlignment.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('beamAlignment', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.beamAlignment.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.beamAlignment.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.beamAlignment.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.beamAlignment.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('beamAlignment', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.beamAlignment.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.beamAlignment.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('beamAlignment', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.beamAlignment.remarks')}
                              value={formData.headlightInspection.beamAlignment.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('beamAlignment', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Headlight Lens */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('headlightLens')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Headlight Lens</span>
                              <span className="ml-3 text-xs text-gray-500">Scratches, cracks, haze</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.headlightLens.status)}`}>
                                {getStatusIcon(formData.headlightInspection.headlightLens.status)}
                                <span className="capitalize">{formData.headlightInspection.headlightLens.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('headlightLens', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.headlightLens.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.headlightLens.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.headlightLens.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.headlightLens.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('headlightLens', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.headlightLens.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.headlightLens.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('headlightLens', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.headlightLens.remarks')}
                              value={formData.headlightInspection.headlightLens.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('headlightLens', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Water Proofing */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('waterProofing')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Water Proofing</span>
                              <span className="ml-3 text-xs text-gray-500">Seals, moisture ingress</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.waterProofing.status)}`}>
                                {getStatusIcon(formData.headlightInspection.waterProofing.status)}
                                <span className="capitalize">{formData.headlightInspection.waterProofing.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('waterProofing', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.waterProofing.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.waterProofing.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.waterProofing.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.waterProofing.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('waterProofing', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.waterProofing.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.waterProofing.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('waterProofing', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.waterProofing.remarks')}
                              value={formData.headlightInspection.waterProofing.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('waterProofing', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Dashboard Warning Lights */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('dashboardWarningLights')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Dashboard Warning Lights</span>
                              <span className="ml-3 text-xs text-gray-500">Headlight system warnings</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.dashboardWarningLights.status)}`}>
                                {getStatusIcon(formData.headlightInspection.dashboardWarningLights.status)}
                                <span className="capitalize">{formData.headlightInspection.dashboardWarningLights.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('dashboardWarningLights', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.dashboardWarningLights.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Warning Codes - Only show if status is fault */}
                          {formData.headlightInspection.dashboardWarningLights.status === 'fault' && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Warning Codes / Messages
                              </label>
                              <input
                                {...getFieldIdentifiers('headlightInspection.dashboardWarningLights.warningCodes')}
                                type="text"
                                value={formData.headlightInspection.dashboardWarningLights.warningCodes}
                                onChange={(e) => handleHeadlightInspectionChange('dashboardWarningLights', 'warningCodes', e.target.value)}
                                placeholder="e.g., Headlight System Fault, AFS Malfunction"
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <label className="flex items-center gap-2 mt-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.dashboardWarningLights.requiresDiagnostic')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.dashboardWarningLights.requiresDiagnostic}
                                  onChange={(e) => handleHeadlightInspectionChange('dashboardWarningLights', 'requiresDiagnostic', e.target.checked)}
                                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span className="text-sm">Requires diagnostic scan</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.dashboardWarningLights.remarks')}
                              value={formData.headlightInspection.dashboardWarningLights.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('dashboardWarningLights', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Bumper Condition */}
                    <div className="p-5 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg flex-shrink-0">
                          {getComponentIcon('bumperCondition')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <span className="font-semibold text-gray-900">Bumper Condition</span>
                              <span className="ml-3 text-xs text-gray-500">Front/rear bumper near headlights</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(formData.headlightInspection.bumperCondition.status)}`}>
                                {getStatusIcon(formData.headlightInspection.bumperCondition.status)}
                                <span className="capitalize">{formData.headlightInspection.bumperCondition.status}</span>
                              </span>
                            </div>
                          </div>
                          
                          {/* Status Buttons */}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {['ok', 'fault', 'n/a'].map((status) => (
                              <button
                                key={status}
                                type="button"
                                onClick={() => handleHeadlightStatusChange('bumperCondition', status as any)}
                                className={`px-4 py-1.5 text-xs rounded-lg border transition-all ${
                                  formData.headlightInspection.bumperCondition.status === status
                                    ? status === 'ok' ? 'bg-green-100 border-green-300 text-green-800 font-medium'
                                    : status === 'fault' ? 'bg-red-100 border-red-300 text-red-800 font-medium'
                                    : 'bg-gray-100 border-gray-300 text-gray-800 font-medium'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                }`}
                              >
                                {status.toUpperCase()}
                              </button>
                            ))}
                          </div>
                          
                          {/* Side Selection - Only show if status is fault */}
                          {formData.headlightInspection.bumperCondition.status === 'fault' && (
                            <div className="grid grid-cols-2 gap-4 mb-3 p-3 bg-gray-50 rounded-lg">
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.bumperCondition.leftFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.bumperCondition.leftFault}
                                  onChange={(e) => handleHeadlightInspectionChange('bumperCondition', 'leftFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Left Side Fault</span>
                              </label>
                              <label className="flex items-center gap-2">
                                <input
                                  {...getFieldIdentifiers('headlightInspection.bumperCondition.rightFault')}
                                  type="checkbox"
                                  checked={formData.headlightInspection.bumperCondition.rightFault}
                                  onChange={(e) => handleHeadlightInspectionChange('bumperCondition', 'rightFault', e.target.checked)}
                                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                                />
                                <span className="text-sm">Right Side Fault</span>
                              </label>
                            </div>
                          )}
                          
                          {/* Remarks */}
                          <div>
                            <textarea
                              {...getFieldIdentifiers('headlightInspection.bumperCondition.remarks')}
                              value={formData.headlightInspection.bumperCondition.remarks}
                              onChange={(e) => handleHeadlightInspectionChange('bumperCondition', 'remarks', e.target.value)}
                              placeholder="Add remarks or observations..."
                              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              rows={1}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
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
                          <label htmlFor="customerDetails-firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                          <input
                            {...getFieldIdentifiers('customerDetails.firstName')}
                            type="text"
                            value={formData.customerDetails.firstName}
                            onChange={(e) => handleCustomerDetailChange('firstName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="customerDetails-lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                          <input
                            {...getFieldIdentifiers('customerDetails.lastName')}
                            type="text"
                            value={formData.customerDetails.lastName}
                            onChange={(e) => handleCustomerDetailChange('lastName', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="customerDetails-mobile" className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                          <input
                            {...getFieldIdentifiers('customerDetails.mobile')}
                            type="tel"
                            value={formData.customerDetails.mobile}
                            onChange={(e) => handleCustomerDetailChange('mobile', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="customerDetails-email" className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                          <input
                            {...getFieldIdentifiers('customerDetails.email')}
                            type="email"
                            value={formData.customerDetails.email}
                            onChange={(e) => handleCustomerDetailChange('email', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                      </div>
                      <div>
                        <label htmlFor="inspectorName" className="block text-sm font-medium text-gray-700 mb-1">Inspector Name *</label>
                        <input
                          {...getFieldIdentifiers('inspectorName')}
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
                        <div>
                          <p className="text-xs text-gray-500">Color</p>
                          <p className="font-medium">{formData.carDetails.color || 'Not specified'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Mileage</p>
                          <p className="font-medium">{formData.carDetails.mileage || 'Not specified'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="carDetails-licensePlate" className="block text-sm font-medium text-gray-700 mb-1">Registration *</label>
                          <input
                            {...getFieldIdentifiers('carDetails.licensePlate')}
                            type="text"
                            value={formData.carDetails.licensePlate}
                            onChange={(e) => handleCarDetailChange('licensePlate', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="carDetails-carMake" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                          <input
                            {...getFieldIdentifiers('carDetails.carMake')}
                            type="text"
                            value={formData.carDetails.carMake}
                            onChange={(e) => handleCarDetailChange('carMake', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label htmlFor="carDetails-carModel" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                          <input
                            {...getFieldIdentifiers('carDetails.carModel')}
                            type="text"
                            value={formData.carDetails.carModel}
                            onChange={(e) => handleCarDetailChange('carModel', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label htmlFor="carDetails-yearOfManufacture" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                          <input
                            {...getFieldIdentifiers('carDetails.yearOfManufacture')}
                            type="text"
                            value={formData.carDetails.yearOfManufacture}
                            onChange={(e) => handleCarDetailChange('yearOfManufacture', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label htmlFor="carDetails-color" className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                          <input
                            {...getFieldIdentifiers('carDetails.color')}
                            type="text"
                            value={formData.carDetails.color}
                            onChange={(e) => handleCarDetailChange('color', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label htmlFor="carDetails-mileage" className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
                          <input
                            {...getFieldIdentifiers('carDetails.mileage')}
                            type="text"
                            value={formData.carDetails.mileage}
                            onChange={(e) => handleCarDetailChange('mileage', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Service Details - Removed technician/time assignment */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[3]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[3]}</p>
                
                <div className="space-y-6">
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
                  
                  {/* Service Details */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <ClipboardList className="h-5 w-5 text-blue-600" />
                      Service Details
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="productServiceNeeded" className="block text-sm font-medium text-gray-700 mb-1">Service Description</label>
                        <div className="space-y-2">
                          <select
                            {...getFieldIdentifiers('productServiceNeeded')}
                            value={formData.productServiceNeeded}
                            onChange={(e) => handleInputChange('productServiceNeeded', e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          >
                            <option value="">
                              {loadingServices ? 'Loading services...' : 'Select service from dropdown'}
                            </option>
                            {formData.productServiceNeeded &&
                              !availableServices.some(
                                (service) =>
                                  service.name.toLowerCase() === formData.productServiceNeeded.toLowerCase()
                              ) && (
                                <option value={formData.productServiceNeeded}>
                                  {formData.productServiceNeeded} (Current Value)
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
                              Choose the required service from the checklist dropdown.
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="productPrice" className="block text-sm font-medium text-gray-700 mb-1">Product Price (KES)</label>
                          <input
                            {...getFieldIdentifiers('productPrice')}
                            type="number"
                            value={formData.productPrice}
                            onChange={(e) => handleInputChange('productPrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label htmlFor="servicePrice" className="block text-sm font-medium text-gray-700 mb-1">Service Price (KES)</label>
                          <input
                            {...getFieldIdentifiers('servicePrice')}
                            type="number"
                            value={formData.servicePrice}
                            onChange={(e) => handleInputChange('servicePrice', parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Delivery/Pickup Method */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-blue-600" />
                      Delivery / Pickup Method
                    </h3>
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
                  
                  {/* Additional Information */}
                  <div className="bg-white rounded-lg border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="h-5 w-5 text-blue-600" />
                      Additional Information
                    </h3>
                    <textarea
                      {...getFieldIdentifiers('additionalInformation')}
                      value={formData.additionalInformation}
                      onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      rows={3}
                      placeholder="Any special instructions, notes, or customer requests..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Terms & Signatures */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[4]}</h2>
                <p className="text-gray-600 mb-6">{stepDescriptions[4]}</p>
                
                {/* Inspection Images */}
                <div className="mb-8">
                  <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Camera className="h-5 w-5 text-blue-600" />
                        Inspection Images
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Optional images for the headlight intake record.
                      </p>
                    </div>
                    <span className="text-sm font-medium text-gray-600">
                      {formData.uploadedImages.length}/5 images
                    </span>
                  </div>

                  <input
                    {...getFieldIdentifiers('uploadedImages')}
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={formData.uploadedImages.length >= 5}
                    className={`w-full rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
                      formData.uploadedImages.length >= 5
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400'
                        : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50/40'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-blue-100 p-3">
                        <Upload className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {formData.uploadedImages.length >= 5
                            ? 'Maximum of 5 images reached'
                            : 'Click to upload inspection images'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Images only. This section is optional.
                        </p>
                      </div>
                    </div>
                  </button>

                  {formData.uploadedImages.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">
                        Uploaded Images ({formData.uploadedImages.length})
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {formData.uploadedImages.map((image, index) => (
                          <div key={`${index}-${image.slice(0, 24)}`} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="aspect-[4/3] bg-gray-100">
                              <img
                                src={image}
                                alt={`Inspection image ${index + 1}`}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex items-center justify-between px-4 py-3">
                              <span className="text-sm text-gray-600">Image {index + 1}</span>
                              <button
                                type="button"
                                onClick={() => removeImage(index)}
                                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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
                
                {/* Signatures Section */}
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
                              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Save Signature
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => setShowInspectorSignature(true)}
                          className="cursor-pointer group"
                        >
                          {formData.inspectorSignature ? (
                            <div className="flex items-center justify-between">
                              <img src={formData.inspectorSignature} alt="Inspector Signature" className="h-16 object-contain" />
                              <span className="text-sm text-purple-600 group-hover:text-purple-800 flex items-center gap-1">
                                <FileSignature className="h-4 w-4" />
                                Change
                              </span>
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors">
                              <FileSignature className="h-10 w-10 text-gray-400 group-hover:text-purple-500 mb-2" />
                              <p className="text-sm font-medium text-gray-700 group-hover:text-purple-700">Click to sign as inspector</p>
                              <p className="text-xs text-gray-500 mt-1">Digital signature required</p>
                            </div>
                          )}
                        </div>
                      )}
                  </div>
                </div>

                {mode === 'edit' && (
                  <div className="bg-white rounded-lg p-5 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg">
                          <CreditCard className="h-5 w-5 text-amber-700" />
                        </div>
                        <div>
                          <h4 className="font-semibold">Pricing Snapshot</h4>
                          <p className="text-xs text-gray-500">Edit prices captured at opportunity creation</p>
                        </div>
                      </div>
                      <span className="text-xs font-medium text-gray-600">
                        {formData.pricingSnapshot?.currency || 'KES'}
                      </span>
                    </div>

                    {formData.pricingSnapshot?.items?.length ? (
                      <div className="space-y-3">
                        {formData.pricingSnapshot.items.map((item, index) => (
                          <div key={`${item.name}-${index}`} className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                            <div className="md:col-span-2">
                              <p className="text-sm font-medium text-gray-800">{item.name}</p>
                              <p className="text-xs text-gray-500 capitalize">{item.itemType}</p>
                            </div>
                            <div>
                              <label htmlFor={`pricingSnapshot-items-${index}-quantity`} className="block text-xs text-gray-500 mb-1">Qty</label>
                              <input
                                id={`pricingSnapshot-items-${index}-quantity`}
                                name={`pricingSnapshot.items.${index}.quantity`}
                                type="number"
                                min={0}
                                step="1"
                                value={item.quantity}
                                onChange={(e) => handlePricingItemChange(index, 'quantity', e.target.value)}
                                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label htmlFor={`pricingSnapshot-items-${index}-unitPrice`} className="block text-xs text-gray-500 mb-1">Unit Price</label>
                              <input
                                id={`pricingSnapshot-items-${index}-unitPrice`}
                                name={`pricingSnapshot.items.${index}.unitPrice`}
                                type="number"
                                min={0}
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => handlePricingItemChange(index, 'unitPrice', e.target.value)}
                                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500 mb-1">Total</p>
                              <p className="text-sm font-semibold text-gray-900">
                                {item.total?.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div className="pt-2 border-t border-gray-200 flex justify-end">
                          <div className="text-sm font-semibold text-gray-900">
                            Total: {formData.pricingSnapshot.total?.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No pricing snapshot found for this checklist.</p>
                    )}
                  </div>
                )}

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
                                {...getFieldIdentifiers('customerDetails.emailForApproval')}
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
                  <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">Additional Remarks</label>
                  <textarea
                    {...getFieldIdentifiers('remarks')}
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
                        {mode === 'edit' ? 'Update Inspection' : 'Create Inspection'}
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
        mode="headlight"
      />
    </div>
  );
}
