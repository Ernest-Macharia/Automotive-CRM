'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  Users,
  Mail as MailIcon,
  GripVertical
} from 'lucide-react';
import { CreatePreChecklistDto, PreChecklist, preChecklistService } from '@/services/preChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { serviceService, Service, SERVICE_TYPES } from '@/services/serviceService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { ChecklistFile } from '@/services/preChecklistService';
import TermsModal from '@/components/pre-checklist/TermsModal';

interface DiamondRimsPreChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
}

interface ServiceMustKnow {
  id: string;
  serviceId: string;
  serviceName: string;
  description: string;
  isAcknowledged: boolean;
  required: boolean;
  riskLevel: 'high' | 'medium' | 'low';
}

interface ServiceRisk {
  id: string;
  serviceId: string;
  serviceName: string;
  description: string;
  isAcknowledged: boolean;
  required: boolean;
  riskLevel: 'high' | 'medium' | 'low';
}

type SuitabilityFieldKey = 'skimming' | 'powderCoating' | 'straightening' | 'welding' | 'diamondCutting';

interface SuitabilityFieldConfig {
  key: SuitabilityFieldKey;
  label: string;
  keywords: string[];
}

type ServiceDisclosureSource = Pick<
  Service,
  'id' | 'name' | 'description' | 'internalNotes' | 'serviceNotes'
>;

const PRE_CHECKLIST_DRAFT_KEY = 'diamondRimsPreChecklistDraft';
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

function normalizeServiceLabel(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
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
  const initialClientSearch = searchParams.get('clientSearch') || '';
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [draftSaved, setDraftSaved] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showCustomerServiceDropdown, setShowCustomerServiceDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const customerServiceDropdownRef = useRef<HTMLDivElement>(null);
  const [showCustomerEdit, setShowCustomerEdit] = useState(mode === 'create');
  const [showVehicleEdit, setShowVehicleEdit] = useState(mode === 'create');
  const [showConditionDropdown, setShowConditionDropdown] = useState(false);
  const [conditionSearch, setConditionSearch] = useState('');
  const [clientSearch, setClientSearch] = useState(initialClientSearch);
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [loadingClientOptions, setLoadingClientOptions] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [linkingClient, setLinkingClient] = useState(false);
  const conditionDropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftRestoredRef = useRef(false);

  // Add state for fetched services
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServiceDropdown, setShowServiceDropdown] = useState(false);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const [showMustKnowDropdown, setShowMustKnowDropdown] = useState(false);
  const mustKnowDropdownRef = useRef<HTMLDivElement>(null);
  const [draggedServiceName, setDraggedServiceName] = useState<string | null>(null);
  const [dragOverServiceIndex, setDragOverServiceIndex] = useState<number | null>(null);

  // Add state for service must-knows and risks
  const [serviceMustKnows, setServiceMustKnows] = useState<ServiceMustKnow[]>([]);
  const [serviceRisks, setServiceRisks] = useState<ServiceRisk[]>([]);

  // DIAMOND RIMS FORM STATE
  const [formData, setFormData] = useState({
    checklistType: 'diamond_rims',
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
    agreedAmount: {
      total: 0,
      breakdown: ''
    },
    
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

    files: [] as ChecklistFile[],
    
    // Optional inspection images
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

  const suitabilityFields: SuitabilityFieldConfig[] = [
    {
      key: 'skimming',
      label: 'Suitable For Skimming',
      keywords: ['skim', 'skimming', 'brake disc', 'disc']
    },
    {
      key: 'powderCoating',
      label: 'Suitable For Powder Coating',
      keywords: ['powder', 'coating', 'paint']
    },
    {
      key: 'straightening',
      label: 'Suitable For Straightening',
      keywords: ['straight', 'straightening', 'bend']
    },
    {
      key: 'welding',
      label: 'Suitable For Welding',
      keywords: ['weld', 'crack repair']
    },
    {
      key: 'diamondCutting',
      label: 'Suitable For Diamond Cutting',
      keywords: ['diamond', 'cut']
    }
  ];

  const tireDotPositions = [
    { key: 'fr', label: 'FR (Front Right)' },
    { key: 'fl', label: 'FL (Front Left)' },
    { key: 'br', label: 'BR (Back Right)' },
    { key: 'bl', label: 'BL (Back Left)' },
    { key: 'spare', label: 'Spare' }
  ] as const;

  // Delivery mode options
  const deliveryModeOptions = [
    { id: 'customer_pickup', label: 'Customer Pickup', icon: <Home className="h-5 w-5" /> },
    { id: 'courier_delivery', label: 'Courier Delivery', icon: <Truck className="h-5 w-5" /> },
    { id: 'mobile_delivery_install', label: 'Mobile Service', icon: <CarIcon className="h-5 w-5" /> }
  ];

  // RAL Colors options
  const ralColors = [
    'Super Glossy Black',
    'Standard Glossy Black',
    'Silver',
    'Gold',
    'Orange',
    'Red',
    'Broze',
    'Luminous Green',
    'Blue',
    'Graphite Grey',
    'Gun Metal',
    'Gun Metall Light',
    'Fine Flash Silver',
    'Matte Black'
  ];

  // Required field indicator component
  const RequiredField = () => null;

  // Function to get appropriate icon for service
  const getServiceIcon = (serviceName: string) => {
    const lowerName = serviceName.toLowerCase();
    
    if (lowerName.includes('brake') || lowerName.includes('disc') || lowerName.includes('skimming')) {
      return <RotateCw className="h-4 w-4" />;
    } else if (lowerName.includes('diamond') || lowerName.includes('cutting')) {
      return <Sparkles className="h-4 w-4" />;
    } else if (lowerName.includes('powder') || lowerName.includes('coating')) {
      return <PaintBucket className="h-4 w-4" />;
    } else if (lowerName.includes('inspection') || lowerName.includes('inspect')) {
      return <Eye className="h-4 w-4" />;
    } else if (lowerName.includes('straightening') || lowerName.includes('straight')) {
      return <Hammer className="h-4 w-4" />;
    } else if (lowerName.includes('weld')) {
      return <Zap className="h-4 w-4" />;
    } else if (lowerName.includes('balance')) {
      return <Gauge className="h-4 w-4" />;
    } else if (lowerName.includes('tire') || lowerName.includes('tyre')) {
      return <Package className="h-4 w-4" />;
    } else {
      return <Settings className="h-4 w-4" />;
    }
  };

  // Helper function to determine risk level from note content
  const determineRiskLevel = (note: string, serviceName: string): 'high' | 'medium' | 'low' => {
    const lowerNote = note.toLowerCase();
    const lowerService = serviceName.toLowerCase();
    
    // High risk indicators
    const highRiskKeywords = [
      'crack', 'weld', 'structural', 'safety', 'thin', 'failure', 
      'break', 'risk', 'danger', 'unsafe', 'warning', 'critical',
      'must', 'required', 'essential', 'imperative', 'obligatory',
      'death', 'injury', 'accident', 'catastrophic', 'severe'
    ];
    
    // Medium risk indicators
    const mediumRiskKeywords = [
      'warp', 'bend', 'distortion', 'damage', 'compromise', 
      'affect', 'impact', 'caution', 'attention', 'important',
      'should', 'recommend', 'suggest', 'advise', 'potential',
      'moderate', 'noticeable', 'significant'
    ];
    
    // Low risk indicators
    const lowRiskKeywords = [
      'aesthetic', 'color', 'appearance', 'finish', 'look',
      'optional', 'preference', 'choice', 'may', 'could',
      'consider', 'option', 'minor', 'slight', 'cosmetic'
    ];
    
    if (highRiskKeywords.some(keyword => lowerNote.includes(keyword) || lowerService.includes(keyword))) {
      return 'high';
    } else if (mediumRiskKeywords.some(keyword => lowerNote.includes(keyword) || lowerService.includes(keyword))) {
      return 'medium';
    } else {
      return 'low';
    }
  };

  // Generate must-knows from selected services using internal notes and service notes
  const generateServiceMustKnowsFromServices = useCallback((services: ServiceDisclosureSource[]) => {
    const mustKnows: ServiceMustKnow[] = [];
    
    // First, add general must-knows that always apply
    const generalMustKnows = [
      {
        id: 'general_process_explained',
        serviceId: 'general',
        serviceName: 'General',
        description: 'Entire process explained to the customer',
        required: true,
        riskLevel: 'medium' as const
      },
      {
        id: 'general_client_risk_acceptance',
        serviceId: 'general',
        serviceName: 'General',
        description: 'Tyres, caps, locknuts, sensors, and other items are accepted at the client\'s own risk',
        required: true,
        riskLevel: 'high' as const
      },
      {
        id: 'general_personal_belongings',
        serviceId: 'general',
        serviceName: 'General',
        description: 'Personal belongings left in or with the vehicle/rims are the client\'s responsibility',
        required: true,
        riskLevel: 'medium' as const
      },
      {
        id: 'general_timeline_estimates',
        serviceId: 'general',
        serviceName: 'General',
        description: 'Completion timelines are estimates only',
        required: true,
        riskLevel: 'low' as const
      },
      {
        id: 'general_full_payment_required',
        serviceId: 'general',
        serviceName: 'General',
        description: 'Diamond Rimz will not release any item until full payment is received',
        required: true,
        riskLevel: 'medium' as const
      },
      {
        id: 'general_storage_fees',
        serviceId: 'general',
        serviceName: 'General',
        description: 'Uncollected rims/parts after 5 days will attract a storage fee of KES 500 per day per part',
        required: true,
        riskLevel: 'medium' as const
      },
      {
        id: 'general_storage_risk',
        serviceId: 'general',
        serviceName: 'General',
        description: 'Rims not collected within 12 hours of completion notification are stored at the client\'s risk',
        required: true,
        riskLevel: 'medium' as const
      }
    ];
    
    generalMustKnows.forEach(mustKnow => {
      mustKnows.push({
        ...mustKnow,
        isAcknowledged: false
      });
    });
    
    // Now add service-specific must-knows
    services.forEach(service => {
      const notesFromInternal = (service.internalNotes || '')
        .split('\n')
        .map(note => note.trim())
        .filter(Boolean);
      const notesFromArray = Array.isArray(service.serviceNotes)
        ? service.serviceNotes.map(note => note.trim()).filter(Boolean)
        : [];
      const dedupedNotes = Array.from(new Set([...notesFromInternal, ...notesFromArray]));
      const notes = dedupedNotes.length
        ? dedupedNotes
        : [
            `Service-specific process, quality limits, and risks for ${service.name} have been explained to the client.`
          ];

      notes.forEach((note, index) => {
        const cleanNote = note.replace(/^\d+[\.\)]\s*/, '').trim();
        if (!cleanNote) {
          return;
        }

        const riskLevel = determineRiskLevel(cleanNote, service.name);
        mustKnows.push({
          id: `${service.id}_mustknow_${index}`,
          serviceId: service.id,
          serviceName: service.name,
          description: cleanNote,
          isAcknowledged: false,
          required: true,
          riskLevel
        });
      });
    });
    
    return mustKnows;
  }, []);

  // Generate risks from service descriptions (optional)
  const generateServiceRisksFromServices = useCallback((services: Service[]) => {
    const risks: ServiceRisk[] = [];
    
    services.forEach(service => {
      // Extract risks from description
      if (service.description) {
        const riskNote = `Service involves ${service.name}. Standard precautions apply.`;
        risks.push({
          id: `${service.id}_risk_general`,
          serviceId: service.id,
          serviceName: service.name,
          description: riskNote,
          isAcknowledged: false,
          required: true,
          riskLevel: determineRiskLevel(riskNote, service.name)
        });
      }
    });
    
    return risks;
  }, []);

  const resolveSelectedServiceSources = useCallback((selectedServiceNames: string[]): ServiceDisclosureSource[] => {
    if (!selectedServiceNames.length) {
      return [];
    }

    const usedServiceIds = new Set<string>();

    return selectedServiceNames.map((serviceName, index) => {
      const normalizedSelected = normalizeServiceLabel(serviceName);
      const matchedService = availableServices.find((service) => {
        if (usedServiceIds.has(service.id)) {
          return false;
        }

        const normalizedServiceName = normalizeServiceLabel(service.name);
        return (
          normalizedServiceName === normalizedSelected ||
          normalizedServiceName.includes(normalizedSelected) ||
          normalizedSelected.includes(normalizedServiceName)
        );
      });

      if (matchedService) {
        usedServiceIds.add(matchedService.id);
        return {
          id: matchedService.id,
          name: matchedService.name,
          description: matchedService.description,
          internalNotes: matchedService.internalNotes,
          serviceNotes: matchedService.serviceNotes
        };
      }

      return {
        id: `custom-service-${index}-${normalizedSelected || 'manual'}`,
        name: serviceName,
        description: '',
        internalNotes: '',
        serviceNotes: []
      };
    });
  }, [availableServices]);

  // Fetch services on component mount
  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoadingServices(true);
      
      // Try to fetch services using existing endpoints
      let services: Service[] = [];
      
      try {
        // Try to get all active services
        services = await serviceService.getActiveServices();
        
        // Filter for Diamond Rims related services
        const diamondRimsServices = services.filter(service => {
          const searchText = `${service.name} ${service.description || ''} ${service.serviceCode || ''}`.toLowerCase();
          
          const diamondRimsKeywords = [
            'brake', 'disc', 'skimming', 'diamond', 'cutting',
            'powder', 'coating', 'rim', 'inspection', 'straightening',
            'welding', 'wheel', 'balancing', 'tire', 'tyre',
            'alignment', 'refurbish', 'restoration'
          ];
          
          return diamondRimsKeywords.some(keyword => searchText.includes(keyword));
        });
        
        if (diamondRimsServices.length > 0) {
          services = diamondRimsServices;
        } else {
          // Otherwise use installation and repair type services
          services = services.filter(service => 
            service.type === 'installation' || 
            service.type === 'repair' ||
            service.tags?.some(tag => 
              tag.toLowerCase().includes('wheel') || 
              tag.toLowerCase().includes('rim')
            )
          );
          
          // If still no services, take first 15 active services
          if (services.length === 0) {
            services = services.slice(0, 15);
          }
        }
        
      } catch (error) {
        console.error('Error fetching services:', error);
      }
      
      setAvailableServices(services);
      
      // Generate must-knows from all available services (for when they're selected)
      const mustKnows = generateServiceMustKnowsFromServices(services);
      setServiceMustKnows(mustKnows);
      
      // Generate risks from service descriptions
      const risks = generateServiceRisksFromServices(services);
      setServiceRisks(risks);
      
    } catch (error) {
      console.error('Error loading services:', error);
      showToast('Could not load services. Using default options.', 'warning');
    } finally {
      setLoadingServices(false);
    }
  };

  const getClientOptionLabel = (candidate: any) => {
    const customerName = candidate?.customer?.name?.trim() || 'Unnamed Client';
    const subject = candidate?.subject?.trim();
    const firstVehicle = candidate?.vehicles?.[0];
    const licensePlate =
      firstVehicle?.registrationNumber ||
      firstVehicle?.regNumber ||
      firstVehicle?.regNo ||
      firstVehicle?.licensePlate ||
      firstVehicle?.plateNumber ||
      '';

    const subjectSegment = subject ? ` | ${subject}` : '';
    const plateSegment = licensePlate ? ` | ${licensePlate}` : '';
    return `${customerName}${subjectSegment}${plateSegment}`;
  };

  const loadClientOptions = useCallback(async (searchTerm = '') => {
    try {
      setLoadingClientOptions(true);
      const response = await opportunityService.getAllOpportunities({
        page: 1,
        limit: 40,
        sort: 'updatedAt:desc',
        search: searchTerm.trim() || undefined,
      });

      const options = Array.isArray(response?.data) ? response.data : [];
      setClientOptions(options);
    } catch (error) {
      console.error('Error loading clients for checklist selection:', error);
      showToast('Failed to load clients. Try searching again.', 'warning');
    } finally {
      setLoadingClientOptions(false);
    }
  }, [showToast]);

  const handleClientSelection = async (nextClientId: string) => {
    setSelectedClientId(nextClientId);

    if (!nextClientId) {
      setOpportunity(null);
      setVehicle(null);
      setAutoPopulated(false);
      setFormData(prev => ({
        ...prev,
        opportunityId: '',
        vehicleId: ''
      }));
      return;
    }

    try {
      setLinkingClient(true);

      let selectedOpportunity = clientOptions.find(
        (candidate) => normalizeEntityId(candidate) === nextClientId
      );

      if (!selectedOpportunity || !hasOpportunityShape(selectedOpportunity)) {
        selectedOpportunity = await opportunityService.getOpportunityById(nextClientId, false);
      }

      setOpportunity(selectedOpportunity);
      setClientOptions(prev => {
        const alreadyExists = prev.some((candidate) => normalizeEntityId(candidate) === nextClientId);
        if (alreadyExists) return prev;
        return [selectedOpportunity, ...prev].slice(0, 40);
      });

      const opportunityVehicle = selectedOpportunity?.vehicles?.[0] || null;
      const selectedVehicleId = normalizeEntityId(opportunityVehicle);
      let selectedVehicle = opportunityVehicle;

      if (selectedVehicleId) {
        try {
          selectedVehicle = await vehicleService.getVehicleById(selectedVehicleId);
        } catch (vehicleError) {
          console.error('Error loading selected client vehicle details:', vehicleError);
        }
      }

      setVehicle(selectedVehicle || null);
      setAutoPopulated(false);
      setFormData(prev => ({
        ...prev,
        opportunityId: nextClientId,
        vehicleId: selectedVehicleId || '',
      }));

      autoPopulateFromOpportunity(selectedOpportunity, {
        force: true,
        vehicleOverride: selectedVehicle,
      });
      setShowCustomerEdit(false);
      setShowVehicleEdit(false);
      showToast('Client details loaded into the checklist', 'success');
    } catch (error) {
      console.error('Error selecting checklist client:', error);
      showToast('Failed to load selected client details', 'error');
    } finally {
      setLinkingClient(false);
    }
  };

  // Update must-knows when selected services change
  useEffect(() => {
    const updateMustKnowsForSelectedServices = () => {
      const selectedServiceNames = formData.services.actualService;
      const selectedServices = resolveSelectedServiceSources(selectedServiceNames);
      const selectedMustKnows = generateServiceMustKnowsFromServices(selectedServices);
      
      // Merge with existing acknowledgments (preserve checked state for existing items)
      setServiceMustKnows(prev => {
        const updated = [...selectedMustKnows];
        
        // For any must-knows that already existed, preserve their acknowledgment state
        prev.forEach(oldMustKnow => {
          const existingIndex = updated.findIndex(m => m.id === oldMustKnow.id);
          if (existingIndex !== -1) {
            updated[existingIndex] = {
              ...updated[existingIndex],
              isAcknowledged: oldMustKnow.isAcknowledged
            };
          }
        });
        
        return updated;
      });
    };
    
    updateMustKnowsForSelectedServices();
  }, [formData.services.actualService, generateServiceMustKnowsFromServices, resolveSelectedServiceSources]);

  useEffect(() => {
    loadRelatedData();
  }, [normalizedOpportunityId, normalizedWorkOrderId, normalizedVehicleId, checklistId, mode]);

  useEffect(() => {
    if (opportunity && !autoPopulated) {
      autoPopulateFromOpportunity();
    }
  }, [opportunity]);

  useEffect(() => {
    if (mode !== 'create' || normalizedOpportunityId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadClientOptions(clientSearch);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [mode, normalizedOpportunityId, clientSearch, loadClientOptions]);

  useEffect(() => {
    const resolvedClientId = normalizeEntityId(opportunity) || normalizeEntityId(formData.opportunityId);
    if (resolvedClientId) {
      setSelectedClientId(resolvedClientId);
    }
  }, [opportunity, formData.opportunityId]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerServiceDropdownRef.current && !customerServiceDropdownRef.current.contains(event.target as Node)) {
        setShowCustomerServiceDropdown(false);
        setUserSearch('');
      }
      if (conditionDropdownRef.current && !conditionDropdownRef.current.contains(event.target as Node)) {
        setShowConditionDropdown(false);
      }
      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServiceDropdown(false);
      }
      if (mustKnowDropdownRef.current && !mustKnowDropdownRef.current.contains(event.target as Node)) {
        setShowMustKnowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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

      setFormData(prev => mergeDraftData(prev, parsedDraft));
      draftRestoredRef.current = true;
      showToast('Restored your saved pre-checklist draft', 'info');
    } catch (error) {
      console.error('Failed to restore pre-checklist draft:', error);
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
        console.error('Failed to autosave pre-checklist draft:', error);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [formData, loading, mode]);

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
    return {
      checklistType: checklist?.checklistType || 'diamond_rims',
      opportunityId: toId(checklist?.opportunityId),
      vehicleId: toId(checklist?.vehicleId),
      inspectedBy: typeof checklist?.inspectedBy === 'object' && checklist?.inspectedBy !== null
        ? (checklist.inspectedBy as any)._id 
        : (typeof checklist?.inspectedBy === 'string' ? checklist.inspectedBy : sessionStorage.getItem('userId') || ''),
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
      agreedAmount: {
        total: checklist?.agreedAmount?.total ?? 0,
        breakdown: checklist?.agreedAmount?.breakdown || ''
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
      files: Array.isArray(checklist?.files) ? checklist.files : [],
      uploadedImages: Array.isArray(checklist?.uploadedImages) ? checklist.uploadedImages : [],
      clientSigningMethod: checklist?.clientSigningMethod || '',
      clientEmail: checklist?.clientEmail || ''
    };
  };

  const loadRelatedData = async () => {
    try {
      setLoading(true);
      const [checklistResult, opportunityResult, workOrderResult] = await Promise.allSettled([
        mode === 'edit' && checklistId ? preChecklistService.getPreChecklistById(checklistId) : Promise.resolve(null),
        normalizedOpportunityId ? opportunityService.getOpportunityById(normalizedOpportunityId, false) : Promise.resolve(null),
        normalizedWorkOrderId ? workOrderService.getWorkOrderById(normalizedWorkOrderId) : Promise.resolve(null),
      ]);

      let resolvedOpportunity: any =
        opportunityResult.status === 'fulfilled' ? opportunityResult.value : null;
      let shouldWarnOpportunityLoad = false;

      if (checklistResult.status === 'fulfilled' && checklistResult.value) {
        const checklist = checklistResult.value;
        setExistingChecklist(checklist);

        if (checklist?.checklistType === 'diamond_rims') {
          setFormData(mapChecklistToForm(checklist));
        }

        if (typeof checklist.opportunityId === 'object') {
          setOpportunity(checklist.opportunityId);
          if (!resolvedOpportunity && hasOpportunityShape(checklist.opportunityId)) {
            resolvedOpportunity = checklist.opportunityId;
          }
        }
        if (typeof checklist.vehicleId === 'object') {
          setVehicle(checklist.vehicleId);
        }
      } else if (checklistResult.status === 'rejected') {
        console.error('Error loading existing pre-checklist:', checklistResult.reason);
      }

      if (opportunityResult.status === 'rejected') {
        console.error('Error loading opportunity:', opportunityResult.reason);
        shouldWarnOpportunityLoad = true;
      }

      if (workOrderResult.status === 'fulfilled' && workOrderResult.value) {
        const wo = workOrderResult.value;
        setWorkOrder(wo);

        if (wo.opportunityId && !resolvedOpportunity) {
          if (hasOpportunityShape(wo.opportunityId)) {
            resolvedOpportunity = wo.opportunityId;
          }

          const oppId = normalizeEntityId(wo.opportunityId);
          if (!resolvedOpportunity && oppId) {
            try {
              resolvedOpportunity = await opportunityService.getOpportunityById(oppId, false);
            } catch (error) {
              console.error('Error loading work order opportunity:', error);
              shouldWarnOpportunityLoad = true;
            }
          }
        }
      } else if (workOrderResult.status === 'rejected') {
        console.error('Error loading work order:', workOrderResult.reason);
        showToast('Could not load work order details', 'warning');
      }

      if (shouldWarnOpportunityLoad && !resolvedOpportunity && (normalizedOpportunityId || normalizedWorkOrderId)) {
        showToast('Could not load opportunity details. You can still continue with draft/manual data.', 'warning');
      }

      if (resolvedOpportunity) {
        setOpportunity(resolvedOpportunity);

        const primaryVehicle = resolvedOpportunity.vehicles?.[0];
        const resolvedVehicleId = primaryVehicle?._id || normalizedVehicleId || '';

        if (primaryVehicle?._id) {
          try {
            const detailedVehicle = await vehicleService.getVehicleById(primaryVehicle._id);
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
          vehicleId: resolvedVehicleId || prev.vehicleId,
        }));
      }

    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateFromOpportunity = (
    sourceOpportunity: any = opportunity,
    options?: { force?: boolean; vehicleOverride?: any }
  ) => {
    if (!sourceOpportunity) return;
    if (autoPopulated && !options?.force) return;

    try {
      
      // Extract customer information
      const customerName = sourceOpportunity.customer?.name || '';
      const [firstName, ...lastNameParts] = customerName.split(' ');
      const lastName = lastNameParts.join(' ') || '';

      // Use the detailed vehicle data if available, otherwise use opportunity vehicle
      const vehicleData = options?.vehicleOverride || vehicle || sourceOpportunity.vehicles?.[0] || {};
      
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
          email: sourceOpportunity.customer?.email || '',
          mobile: sourceOpportunity.customer?.phone || '',
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
        additionalInformation: prev.additionalInformation || sourceOpportunity.notes || '',
        inspectorName: prev.inspectorName || loggedInUserName,
        serviceIntake: {
          ...prev.serviceIntake,
          customerServiceRep: loggedInUserName || ''
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
    
    // Validate file sizes
    const totalSize = acceptedFiles.reduce((acc, file) => acc + file.size, 0);
    if (totalSize > 50 * 1024 * 1024) { // 50MB
      showToast('Total file size exceeds 50MB limit', 'error');
      e.target.value = '';
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...acceptedFiles]);

    try {
      const compressedImages = await Promise.all(
        acceptedFiles.map((file) => compressChecklistImage(file)),
      );

      setFormData(prev => ({
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
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
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

  // Function to get signature with consistent padding
  const getPaddedSignatureCanvas = useCallback((sigRef: React.RefObject<SignatureCanvas>) => {
    if (!sigRef.current) return null;
    
    // Check if signature is empty
    if (sigRef.current.isEmpty()) {
      return null;
    }
    
    try {
      // Get the trimmed canvas (removes empty space)
      const trimmedCanvas = sigRef.current.getTrimmedCanvas();
      
      // If trimmed canvas has no width/height, return null
      if (trimmedCanvas.width === 0 || trimmedCanvas.height === 0) {
        return null;
      }
      
      // Create a new canvas with padding
      const padding = 20;
      const paddedCanvas = document.createElement('canvas');
      paddedCanvas.width = trimmedCanvas.width + (padding * 2);
      paddedCanvas.height = trimmedCanvas.height + (padding * 2);
      
      const ctx = paddedCanvas.getContext('2d');
      if (!ctx) return null;
      
      // Fill with white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, paddedCanvas.width, paddedCanvas.height);
      
      // Draw the trimmed signature centered with padding
      ctx.drawImage(trimmedCanvas, padding, padding);
      
      return paddedCanvas;
    } catch (error) {
      console.error('Error creating padded signature:', error);
      return null;
    }
  }, []);

  const saveSignature = async (type: 'client' | 'inspector') => {
    try {
      let dataUrl = '';
      
      if (type === 'client' && clientSigRef.current) {
        // Check if signature is empty
        if (clientSigRef.current.isEmpty()) {
          showToast('Please provide a signature before saving', 'error');
          return;
        }
        
        // Use padded canvas for consistent appearance
        const paddedCanvas = getPaddedSignatureCanvas(clientSigRef);
        if (paddedCanvas) {
          dataUrl = paddedCanvas.toDataURL('image/png');
          setClientSignature(dataUrl);
        } else {
          showToast('Failed to process signature', 'error');
          return;
        }
      } else if (type === 'inspector' && inspectorSigRef.current) {
        // Check if signature is empty
        if (inspectorSigRef.current.isEmpty()) {
          showToast('Please provide a signature before saving', 'error');
          return;
        }
        
        // Use padded canvas for consistent appearance
        const paddedCanvas = getPaddedSignatureCanvas(inspectorSigRef);
        if (paddedCanvas) {
          dataUrl = paddedCanvas.toDataURL('image/png');
          setInspectorSignature(dataUrl);
        } else {
          showToast('Failed to process signature', 'error');
          return;
        }
      }
      
      if (!dataUrl) {
        showToast('No signature detected', 'error');
        return;
      }
      
      // If we have a checklist ID (edit mode), use the API endpoint
      if (checklistId) {
        const signatureData = {
          name: type === 'client' 
            ? `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`.trim() || 'Client'
            : formData.inspectorName || sessionStorage.getItem('userName') || 'Inspector',
          signatureData: dataUrl,
          role: type === 'client' ? 'Vehicle Owner' : 'Inspector',
          signedAt: new Date().toISOString()
        };
        
        // Save signature to backend
        await preChecklistService.signPreChecklist(checklistId, signatureData);
        
        showToast(`${type === 'client' ? 'Client' : 'Inspector'} signature saved successfully`, 'success');
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
        // Clear the signature canvas after saving
        if (clientSigRef.current) {
          clientSigRef.current.clear();
        }
      } else {
        setShowInspectorSignature(false);
        // Clear the signature canvas after saving
        if (inspectorSigRef.current) {
          inspectorSigRef.current.clear();
        }
      }
      
    } catch (error: any) {
      console.error(`Error saving ${type} signature:`, error);
      showToast(error.message || `Failed to save ${type} signature. Please try again.`, 'error');
    }
  };

  // Also update the clearSignature function to properly clear
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

  const canvasProps = useMemo(() => ({
    width: 600,
    height: 150,
    className: 'w-full h-32 rounded-lg',
    style: { 
      width: '100%', 
      height: '128px',
      touchAction: 'none', // Prevents scrolling while drawing on touch devices
      cursor: 'crosshair'
    }
  }), []);

  // Memoize the signature pad props to prevent re-renders
  const signaturePadProps = useMemo(() => ({
    penColor: 'black',
    canvasProps,
    velocityFilterWeight: 0.7, // Reduces lag by filtering velocity
    minWidth: 0.5, // Minimum width of line
    maxWidth: 2.5, // Maximum width of line
    throttle: 16, // Throttle render updates (16ms = ~60fps)
    clearOnResize: false, // Don't clear on resize
  }), [canvasProps]);

  const syncOpportunityFromChecklist = async (targetOpportunityId: string, customerEmail?: string) => {
    if (!targetOpportunityId) {
      return;
    }

    const existingCustomer = opportunity?.customer || {};
    const existingPrimaryVehicle = opportunity?.vehicles?.[0] || vehicle || {};
    const fullName = `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`.trim();

    const customerPayload = {
      name: fullName || existingCustomer.name || 'Client',
      phone: formData.customerDetails.mobile || existingCustomer.phone,
      email: customerEmail || existingCustomer.email,
      companyName: existingCustomer.companyName
    };

    const primaryVehiclePayload = {
      make: formData.carDetails.carMake || existingPrimaryVehicle.make || 'Unknown',
      model: formData.carDetails.carModel || existingPrimaryVehicle.model || 'Unknown',
      registrationNumber:
        formData.carDetails.licensePlate ||
        existingPrimaryVehicle.registrationNumber ||
        existingPrimaryVehicle.licensePlate ||
        '',
      licensePlate:
        formData.carDetails.licensePlate ||
        existingPrimaryVehicle.licensePlate ||
        existingPrimaryVehicle.registrationNumber ||
        '',
      year: formData.carDetails.yearOfManufacture || existingPrimaryVehicle.year,
      color: formData.carDetails.color || existingPrimaryVehicle.color,
      engineSize: formData.carDetails.engineSize || existingPrimaryVehicle.engineSize,
      fuelType: formData.carDetails.fuelType || existingPrimaryVehicle.fuelType,
      mileage: formData.carDetails.mileage || existingPrimaryVehicle.mileage,
      vin: existingPrimaryVehicle.vin,
      transmission: existingPrimaryVehicle.transmission,
      chassisNumber: existingPrimaryVehicle.chassisNumber,
      bodyType: existingPrimaryVehicle.bodyType
    };

    const selectedServices = formData.services.actualService.filter(Boolean);
    const serviceNotes = selectedServices.length > 0
      ? `Selected services: ${selectedServices.join(', ')}`
      : '';

    await opportunityService.updateOpportunity(targetOpportunityId, {
      customer: customerPayload,
      vehicles: [primaryVehiclePayload],
      notes: serviceNotes || opportunity?.notes
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Check if all required must-knows are acknowledged
      const requiredMustKnows = serviceMustKnows.filter(m => m.required);
      const allMustKnowsAcknowledged = requiredMustKnows.every(m => m.isAcknowledged);

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
        setSubmitting(false);
        return;
      }

      const clientEmail = (formData.clientEmail || '').trim();
      if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail)) {
        showToast('Enter a valid client approval email or leave it blank', 'error');
        setSubmitting(false);
        return;
      }
      const sanitizedCustomerEmail = customerEmail || undefined;
      const sanitizedClientEmail = clientEmail || undefined;

      // Create submission data with proper structure matching backend DTO
      const submissionData: CreatePreChecklistDto = {
        checklistType: 'diamond_rims',
        opportunityId: resolvedOpportunityId,
        ...(resolvedVehicleId ? { vehicleId: resolvedVehicleId } : {}),
        inspectedBy: sessionStorage.getItem('userId') || formData.inspectedBy,
        inspectorName: formData.inspectorName,
        remarks: formData.remarks,
        tags: formData.tags,
        pricingSnapshot: formData.pricingSnapshot,
        agreedAmount: formData.agreedAmount,
        approved: false,
        
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
          email: sanitizedCustomerEmail,
          name: `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`.trim()
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
        tireDOT: {
          fr: { code: formData.tireDOT.fr.code },
          fl: { code: formData.tireDOT.fl.code },
          br: { code: formData.tireDOT.br.code },
          bl: { code: formData.tireDOT.bl.code },
          spare: { code: formData.tireDOT.spare.code }
        },
        suitability: formData.suitability,
        declaredValuable: formData.declaredValuable,
        additionalInformation: formData.additionalInformation,
        mustKnowAccepted: allMustKnowsAcknowledged,
        
        clientUpdate: formData.clientUpdate,
        
        acceptTerms: formData.acceptTerms,
        clientSignature: formData.clientSignature,
        inspectorSignature: formData.inspectorSignature,
        uploadedImages: formData.uploadedImages,
        clientSigningMethod: formData.clientSigningMethod,
        clientEmail: sanitizedClientEmail,
        
        files: formData.files || []
      };

      let result: PreChecklist;
      const userId = sessionStorage.getItem('userId') || undefined;
      
      if (mode === 'edit' && checklistId) {
        result = await preChecklistService.updatePreChecklist(checklistId, submissionData as any);
        showToast('Diamond Rims pre-checklist updated successfully', 'success');
      } else {
        result = await preChecklistService.createPreChecklist(submissionData, userId);
        showToast('Diamond Rims pre-checklist created successfully', 'success');
        localStorage.removeItem(PRE_CHECKLIST_DRAFT_KEY);
      }

      if (workOrderId && result._id) {
        await workOrderService.updateWorkOrder(workOrderId, {
          preChecklistId: result._id,
          preChecklistStatus: 'pending'
        });
        showToast('Pre-checklist created and linked to work order', 'success');
      }

      try {
        await syncOpportunityFromChecklist(resolvedOpportunityId, sanitizedCustomerEmail);
      } catch (syncError) {
        console.error('Error syncing checklist details to opportunity:', syncError);
      }

      if (workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (source === 'opportunity' && formData.opportunityId) {
        router.push(`/opportunities/${formData.opportunityId}`);
      } else if (result._id) {
        router.push(`/pre-checklist/${result._id}`);
      } else {
        router.push('/pre-checklist');
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
      router.push('/pre-checklist');
    }
  };

  const handleRefreshFromOpportunity = () => {
    if (opportunity) {
      autoPopulateFromOpportunity(opportunity, { force: true, vehicleOverride: vehicle });
      showToast('Refreshed data from opportunity', 'info');
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
        ['CLIENT CHARGE', '', '', '', '', '', ''],
        ['Amount Charged (KES):', formData.agreedAmount.total, '', '', '', '', ''],
        ['Breakdown:', formData.agreedAmount.breakdown, '', '', '', '', ''],
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

  // Add missing function for condition selection
  const handleConditionSelect = (conditionId: string, checked: boolean) => {
    const conditionLabel = conditionOptions.find(c => c.id === conditionId)?.label || conditionId;
    handleMultiSelectChange('preServiceInspection', 'condition', conditionLabel, checked);
  };

  // Add missing function for multi-select change
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

  // Handle service selection
  const handleServiceSelect = (serviceName: string, checked: boolean) => {
    if (checked) {
      // Add service to the actualService array
      setFormData(prev => ({
        ...prev,
        services: {
          ...prev.services,
          actualService: prev.services.actualService.includes(serviceName)
            ? prev.services.actualService
            : [...prev.services.actualService, serviceName]
        }
      }));
    } else {
      // Remove service from the actualService array
      setFormData(prev => ({
        ...prev,
        services: {
          ...prev.services,
          actualService: prev.services.actualService.filter(name => name !== serviceName)
        }
      }));
    }
  };

  const reorderSelectedServices = (fromIndex: number, toIndex: number) => {
    setFormData((prev) => {
      const current = [...prev.services.actualService];
      if (fromIndex < 0 || toIndex < 0 || fromIndex >= current.length || toIndex >= current.length) {
        return prev;
      }

      const [moved] = current.splice(fromIndex, 1);
      current.splice(toIndex, 0, moved);

      return {
        ...prev,
        services: {
          ...prev.services,
          actualService: current
        }
      };
    });
  };

  const moveServiceToTemplateStack = (serviceName: string, targetIndex?: number) => {
    setFormData((prev) => {
      const current = [...prev.services.actualService];
      const existingIndex = current.findIndex((name) => name === serviceName);

      if (existingIndex === -1) {
        if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex <= current.length) {
          current.splice(targetIndex, 0, serviceName);
        } else {
          current.push(serviceName);
        }
      } else if (typeof targetIndex === 'number' && targetIndex >= 0 && targetIndex < current.length) {
        const [moved] = current.splice(existingIndex, 1);
        current.splice(targetIndex, 0, moved);
      }

      return {
        ...prev,
        services: {
          ...prev.services,
          actualService: current
        }
      };
    });
  };

  // Handle must-know acknowledgment
  const handleMustKnowAcknowledgment = (mustKnowId: string, acknowledged: boolean) => {
    setServiceMustKnows(prev =>
      prev.map(mustKnow =>
        mustKnow.id === mustKnowId
          ? { ...mustKnow, isAcknowledged: acknowledged }
          : mustKnow
      )
    );
  };

  const handleSelectAllMustKnows = () => {
    setServiceMustKnows((prev) =>
      prev.map((mustKnow) => ({
        ...mustKnow,
        isAcknowledged: true,
      }))
    );
  };

  const handleClearMustKnows = () => {
    setServiceMustKnows((prev) =>
      prev.map((mustKnow) => ({
        ...mustKnow,
        isAcknowledged: false,
      }))
    );
  };

  // Handle risk acknowledgment
  const handleRiskAcknowledgment = (riskId: string, acknowledged: boolean) => {
    setServiceRisks(prev =>
      prev.map(risk =>
        risk.id === riskId
          ? { ...risk, isAcknowledged: acknowledged }
          : risk
      )
    );
  };

  // Check if all required must-knows are acknowledged
  const allMustKnowsAcknowledged = () => {
    return serviceMustKnows
      .filter(mustKnow => mustKnow.required)
      .every(mustKnow => mustKnow.isAcknowledged);
  };

  // Check if all required risks are acknowledged for selected services
  const allRequiredRisksAcknowledged = () => {
    const selectedServiceIds = resolveSelectedServiceSources(formData.services.actualService)
      .map(service => service.id);
    
    // Include general risks and risks for selected services
    const relevantRisks = serviceRisks.filter(risk => 
      risk.serviceId === 'general' || selectedServiceIds.includes(risk.serviceId)
    );
    
    return relevantRisks
      .filter(risk => risk.required)
      .every(risk => risk.isAcknowledged);
  };

  // Update form data when must-knows or risks change
  useEffect(() => {
    // Update clientUpdate.mustKnows based on serviceMustKnows
    const mustKnowsState = {
      processExplained: serviceMustKnows.find(m => m.id === 'general_process_explained')?.isAcknowledged || false,
      clientRiskAcceptance: serviceMustKnows.find(m => m.id === 'general_client_risk_acceptance')?.isAcknowledged || false,
      personalBelongings: serviceMustKnows.find(m => m.id === 'general_personal_belongings')?.isAcknowledged || false,
      timelineEstimates: serviceMustKnows.find(m => m.id === 'general_timeline_estimates')?.isAcknowledged || false,
      fullPaymentRequired: serviceMustKnows.find(m => m.id === 'general_full_payment_required')?.isAcknowledged || false,
      storageFees: serviceMustKnows.find(m => m.id === 'general_storage_fees')?.isAcknowledged || false,
      storageRisk: serviceMustKnows.find(m => m.id === 'general_storage_risk')?.isAcknowledged || false
    };

    // Update clientUpdate.associatedRisks based on serviceRisks
    const selectedServiceNames = formData.services.actualService;
    const hasBrakeService = selectedServiceNames.some(name => 
      name.toLowerCase().includes('brake') || name.toLowerCase().includes('skimming')
    );
    const hasPowderService = selectedServiceNames.some(name => 
      name.toLowerCase().includes('powder') || name.toLowerCase().includes('coating')
    );
    const hasStraighteningService = selectedServiceNames.some(name => 
      name.toLowerCase().includes('straightening') || name.toLowerCase().includes('straight')
    );
    const hasWeldingService = selectedServiceNames.some(name => 
      name.toLowerCase().includes('weld')
    );
    const hasDiamondService = selectedServiceNames.some(name => 
      name.toLowerCase().includes('diamond') || name.toLowerCase().includes('cutting')
    );

    // Check if risks for each service are acknowledged
    const associatedRisksState = {
      brakeDiscSkimming: hasBrakeService 
        ? serviceRisks
            .filter(r => r.serviceName.toLowerCase().includes('brake') || r.serviceName.toLowerCase().includes('skimming'))
            .every(r => r.isAcknowledged)
        : false,
      powderCoating: hasPowderService
        ? serviceRisks
            .filter(r => r.serviceName.toLowerCase().includes('powder') || r.serviceName.toLowerCase().includes('coating'))
            .every(r => r.isAcknowledged)
        : false,
      straightening: hasStraighteningService
        ? serviceRisks
            .filter(r => r.serviceName.toLowerCase().includes('straightening') || r.serviceName.toLowerCase().includes('straight'))
            .every(r => r.isAcknowledged)
        : false,
      welding: hasWeldingService
        ? serviceRisks
            .filter(r => r.serviceName.toLowerCase().includes('weld'))
            .every(r => r.isAcknowledged)
        : false,
      diamondCutting: hasDiamondService
        ? serviceRisks
            .filter(r => r.serviceName.toLowerCase().includes('diamond') || r.serviceName.toLowerCase().includes('cutting'))
            .every(r => r.isAcknowledged)
        : false,
      general: serviceRisks
        .filter(r => r.serviceId === 'general')
        .every(r => r.isAcknowledged)
    };

    setFormData(prev => ({
      ...prev,
      clientUpdate: {
        associatedRisks: associatedRisksState,
        mustKnows: mustKnowsState
      },
      mustKnowAccepted: allMustKnowsAcknowledged()
    }));
  }, [serviceMustKnows, serviceRisks, formData.services.actualService]);

  const getApplicableSuitabilityFields = (selectedServices: string[]) => {
    if (selectedServices.length === 0) {
      return [] as SuitabilityFieldConfig[];
    }

    const selectedText = selectedServices.map(service => service.toLowerCase());
    return suitabilityFields.filter((field) =>
      selectedText.some((serviceText) =>
        field.keywords.some((keyword) => serviceText.includes(keyword))
      )
    );
  };

  const applicableSuitabilityFields = getApplicableSuitabilityFields(formData.services.actualService);

  useEffect(() => {
    if (formData.services.actualService.length === 0) {
      return;
    }

    const activeFieldKeys = new Set(applicableSuitabilityFields.map((field) => field.key));

    setFormData((prev) => {
      const nextSuitability = { ...prev.suitability };
      let changed = false;

      suitabilityFields.forEach((field) => {
        if (activeFieldKeys.has(field.key)) {
          if (!nextSuitability[field.key]) {
            nextSuitability[field.key] = 'yes';
            changed = true;
          }
          return;
        }

        if (nextSuitability[field.key]) {
          nextSuitability[field.key] = '';
          changed = true;
        }
      });

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        suitability: nextSuitability
      };
    });
  }, [formData.services.actualService, applicableSuitabilityFields]);

  const filteredConditionOptions = conditionOptions.filter((condition) => {
    if (!conditionSearch.trim()) {
      return true;
    }

    return condition.label.toLowerCase().includes(conditionSearch.trim().toLowerCase());
  });

  // Filter services based on search
  const filteredServices = availableServices.filter(service => {
    if (!serviceSearch.trim()) return true;
    
    const searchLower = serviceSearch.toLowerCase();
    return (
      service.name.toLowerCase().includes(searchLower) ||
      service.description?.toLowerCase().includes(searchLower) ||
      service.serviceCode?.toLowerCase().includes(searchLower) ||
      service.tags?.some(tag => tag.toLowerCase().includes(searchLower))
    );
  });

  const dropdownServices = serviceSearch.trim()
    ? filteredServices
    : filteredServices.slice(0, 20);

  // Get risks for selected services
  const getSelectedServiceRisks = () => {
    const selectedServiceIds = resolveSelectedServiceSources(formData.services.actualService)
      .map(service => service.id);
    
    return serviceRisks.filter(risk => 
      risk.serviceId === 'general' || selectedServiceIds.includes(risk.serviceId)
    );
  };

  const acknowledgedMustKnowCount = serviceMustKnows.filter((mustKnow) => mustKnow.isAcknowledged).length;
  const allMustKnowsSelected = serviceMustKnows.length > 0 && acknowledgedMustKnowCount === serviceMustKnows.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50/30 via-white to-teal-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading pre-checklist form...</p>
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
        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
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
                          if (!formData.serviceIntake.customerServiceRep.trim()) {
                            const loggedInUser = sessionStorage.getItem('userName') || '';
                            if (loggedInUser) {
                              handleNestedInputChange('serviceIntake', 'customerServiceRep', loggedInUser);
                            }
                          }
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Actual Service <RequiredField />
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Select the services required. Must-know notes will appear automatically.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={loadServices}
                      className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1 px-3 py-1 border border-purple-200 rounded-lg hover:bg-purple-50"
                      disabled={loadingServices}
                    >
                      {loadingServices ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <RotateCw className="h-3 w-3" />
                          Refresh
                        </>
                      )}
                    </button>
                  </div>
                </div>
                
                {/* Service Search */}
                <div className="relative mb-4" ref={serviceDropdownRef}>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={serviceSearch}
                      onChange={(e) => {
                        setServiceSearch(e.target.value);
                        setShowServiceDropdown(true);
                      }}
                      onFocus={() => setShowServiceDropdown(true)}
                      placeholder="Search services by name, code, or description..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    {serviceSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setServiceSearch('');
                          setShowServiceDropdown(true);
                        }}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {showServiceDropdown && !loadingServices && availableServices.length > 0 && (
                    <div className="absolute z-30 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      <div className="px-3 py-2 text-xs text-gray-600 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <span>
                          Showing {dropdownServices.length} of {filteredServices.length} service
                          {filteredServices.length !== 1 ? 's' : ''}
                          {serviceSearch && ` for "${serviceSearch}"`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowServiceDropdown(false)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          Close
                        </button>
                      </div>

                      <div className="max-h-72 overflow-y-auto">
                        {dropdownServices.length === 0 ? (
                          <p className="p-3 text-sm text-gray-500">No matching services found</p>
                        ) : (
                          dropdownServices.map((service) => {
                            const isSelected = formData.services.actualService.includes(service.name);
                            return (
                              <button
                                key={service.id}
                                type="button"
                                draggable
                                onDragStart={(event) => {
                                  setDraggedServiceName(service.name);
                                  event.dataTransfer.setData('text/plain', service.name);
                                  event.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => {
                                  setDraggedServiceName(null);
                                  setDragOverServiceIndex(null);
                                }}
                                onClick={() => handleServiceSelect(service.name, !isSelected)}
                                className={`w-full px-3 py-3 text-left border-b border-gray-100 last:border-b-0 hover:bg-purple-50 transition-colors ${
                                  isSelected ? 'bg-purple-50' : ''
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <div className={`h-4 w-4 rounded border flex items-center justify-center ${
                                      isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'
                                    }`}>
                                      {isSelected && <Check className="h-3 w-3" />}
                                    </div>
                                    {getServiceIcon(service.name)}
                                    <span className="text-sm font-medium text-gray-800 truncate">{service.name}</span>
                                  </div>
                                  <span className="text-xs px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 flex-shrink-0">
                                    {service.type}
                                  </span>
                                </div>
                                <div className="mt-1 text-xs text-gray-500 flex items-center justify-between">
                                  <span>{service.serviceCode || 'No Code'}</span>
                                  {service.isActive ? (
                                    <span className="text-green-600 flex items-center gap-1">
                                      <Circle className="h-2 w-2 fill-current" />
                                      Active
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">Inactive</span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {loadingServices ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-purple-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">Loading available services...</p>
                  </div>
                ) : availableServices.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                    <Settings className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-600 mb-2">No services available</p>
                    <button
                      type="button"
                      onClick={loadServices}
                      className="text-sm text-purple-600 hover:text-purple-800"
                    >
                      Try loading again
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">
                          {filteredServices.length} service{filteredServices.length !== 1 ? 's' : ''} found
                          {serviceSearch && ` matching "${serviceSearch}"`} - use the dropdown to select
                        </span>
                        {formData.services.actualService.length > 0 && (
                          <span className="text-sm text-purple-600">
                            {formData.services.actualService.length} selected
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Main Template Stack */}
                    <div
                      className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg"
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                      }}
                      onDrop={(event) => {
                        event.preventDefault();
                        const droppedServiceName = event.dataTransfer.getData('text/plain') || draggedServiceName || '';
                        if (!droppedServiceName) return;

                        const currentIndex = formData.services.actualService.findIndex((name) => name === droppedServiceName);
                        if (currentIndex === -1) {
                          moveServiceToTemplateStack(droppedServiceName);
                        } else if (currentIndex !== formData.services.actualService.length - 1) {
                          reorderSelectedServices(currentIndex, formData.services.actualService.length - 1);
                        }

                        setDraggedServiceName(null);
                        setDragOverServiceIndex(null);
                      }}
                    >
                      <h4 className="text-sm font-medium text-purple-800 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        Main Form Template Stack ({formData.services.actualService.length})
                      </h4>
                      <p className="text-xs text-purple-700 mb-3">
                        Drag services from the dropdown into this template stack. Drag inside the stack to reorder.
                      </p>

                      {formData.services.actualService.length === 0 ? (
                        <div className="border-2 border-dashed border-purple-300 rounded-lg bg-white/70 p-4 text-sm text-purple-700">
                          Drop services here to build the checklist template
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {formData.services.actualService.map((serviceName, index) => {
                            const service = availableServices.find(s => s.name === serviceName);
                            const isDropTarget = dragOverServiceIndex === index;
                            return (
                              <div
                                key={`${serviceName}-${index}`}
                                draggable
                                onDragStart={(event) => {
                                  setDraggedServiceName(serviceName);
                                  event.dataTransfer.setData('text/plain', serviceName);
                                  event.dataTransfer.effectAllowed = 'move';
                                }}
                                onDragEnd={() => {
                                  setDraggedServiceName(null);
                                  setDragOverServiceIndex(null);
                                }}
                                onDragOver={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  setDragOverServiceIndex(index);
                                  event.dataTransfer.dropEffect = 'move';
                                }}
                                onDrop={(event) => {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  const droppedServiceName = event.dataTransfer.getData('text/plain') || draggedServiceName || '';
                                  if (!droppedServiceName) return;

                                  const fromIndex = formData.services.actualService.findIndex((name) => name === droppedServiceName);
                                  if (fromIndex === -1) {
                                    moveServiceToTemplateStack(droppedServiceName, index);
                                  } else if (fromIndex !== index) {
                                    reorderSelectedServices(fromIndex, index);
                                  }

                                  setDraggedServiceName(null);
                                  setDragOverServiceIndex(null);
                                }}
                                className={`flex items-center gap-3 px-3 py-2 bg-white border rounded-lg ${
                                  isDropTarget ? 'border-purple-500 shadow-sm' : 'border-purple-300'
                                }`}
                              >
                                <GripVertical className="h-4 w-4 text-purple-400 flex-shrink-0" />
                                {service ? getServiceIcon(service.name) : <Settings className="h-4 w-4 text-gray-400" />}
                                <span className={`text-sm font-medium ${service ? 'text-purple-700' : 'text-gray-700'}`}>
                                  {serviceName}
                                </span>
                                {service?.internalNotes && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded ml-auto">
                                    Has Notes
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleServiceSelect(serviceName, false)}
                                  className="text-red-500 hover:text-red-700 ml-1"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
                
                {/* Validation Error */}
                {formData.services.actualService.length === 0 && !loadingServices && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                      <p className="text-sm text-red-700">Please select at least one service</p>
                    </div>
                  </div>
                )}
                
                {/* Add Custom Service Button */}
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      const customService = prompt('Enter custom service name:');
                      if (customService && customService.trim()) {
                        handleServiceSelect(customService.trim(), true);
                        showToast('Custom service added', 'success');
                      }
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-dashed border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Custom Service
                  </button>
                  <p className="text-xs text-gray-500 mt-2">
                    Add a custom service if it's not available in the list above
                  </p>
                </div>
              </div>
            </div>

            {formData.services.actualService.some((service) =>
              service.toLowerCase().includes('powder')
            ) && (
              <div className="mb-8">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Powder Coating Color
                </label>
                <select
                  value={formData.powderCoating.colourRAL}
                  onChange={(e) => handleNestedInputChange('powderCoating', 'colourRAL', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="">Select powder coating color</option>
                  {ralColors.map((color) => (
                    <option key={color} value={color}>
                      {color}
                    </option>
                  ))}
                </select>
              </div>
            )}

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

            {mode === 'create' && !normalizedOpportunityId && (
              <div className="mb-8 border-t pt-8">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-purple-600" />
                    Select Client
                  </h2>
                  <button
                    type="button"
                    onClick={() => loadClientOptions(clientSearch)}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    disabled={loadingClientOptions}
                  >
                    {loadingClientOptions ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCw className="h-4 w-4" />
                    )}
                    Refresh Clients
                  </button>
                </div>

                <p className="text-sm text-gray-600 mb-4">
                  Create checklist first, then choose a client. Customer details will auto-fill from the selected client record.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Client
                    </label>
                    <input
                      type="text"
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      placeholder="Search by client name, subject, or plate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Client Opportunity <RequiredField />
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleClientSelection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={loadingClientOptions || linkingClient}
                      required
                    >
                      <option value="">Select client</option>
                      {clientOptions.map((candidate, index) => {
                        const id = normalizeEntityId(candidate);
                        if (!id) return null;

                        return (
                          <option key={`${id}-${index}`} value={id}>
                            {getClientOptionLabel(candidate)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {linkingClient && (
                  <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-2 text-sm text-blue-700">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading client details...
                  </div>
                )}

                {!loadingClientOptions && clientOptions.length === 0 && (
                  <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700">
                    No clients found. Try a different search term.
                  </div>
                )}
              </div>
            )}

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
              <div className="mb-8" ref={conditionDropdownRef}>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  Condition <RequiredField />
                </label>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowConditionDropdown((prev) => !prev)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left flex items-center justify-between hover:border-purple-400 transition-colors"
                  >
                    <span className={formData.preServiceInspection.condition.length > 0 ? 'text-gray-800' : 'text-gray-500'}>
                      {formData.preServiceInspection.condition.length > 0
                        ? `${formData.preServiceInspection.condition.length} condition(s) selected`
                        : 'Search and select condition records'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${showConditionDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showConditionDropdown && (
                    <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg">
                      <div className="p-3 border-b border-gray-200">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={conditionSearch}
                            onChange={(e) => setConditionSearch(e.target.value)}
                            placeholder="Search condition..."
                            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                          />
                          {conditionSearch && (
                            <button
                              type="button"
                              onClick={() => setConditionSearch('')}
                              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="max-h-64 overflow-y-auto p-2">
                        {filteredConditionOptions.length === 0 ? (
                          <p className="p-3 text-sm text-gray-500">No condition matches your search.</p>
                        ) : (
                          filteredConditionOptions.map((condition) => {
                            const severityColor = {
                              high: 'bg-red-100 text-red-800',
                              medium: 'bg-yellow-100 text-yellow-800',
                              low: 'bg-blue-100 text-blue-800',
                              none: 'bg-gray-100 text-gray-800'
                            }[condition.severity];

                            const checked = formData.preServiceInspection.condition.includes(condition.label);
                            return (
                              <label
                                key={condition.id}
                                htmlFor={`condition-${condition.id}`}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 cursor-pointer"
                              >
                                <input
                                  id={`condition-${condition.id}`}
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => handleConditionSelect(condition.id, e.target.checked)}
                                  className="h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                />
                                <span className="flex-1 text-sm text-gray-700">{condition.label}</span>
                                <span className={`text-xs px-2 py-1 rounded ${severityColor}`}>
                                  {condition.severity}
                                </span>
                              </label>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {formData.preServiceInspection.condition.length === 0 ? (
                  <p className="mt-2 text-sm text-red-600">Please select at least one condition</p>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.preServiceInspection.condition.map((conditionLabel) => (
                      <span
                        key={conditionLabel}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                      >
                        {conditionLabel}
                      </span>
                    ))}
                  </div>
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
                
                <p className="text-sm text-blue-700">
                  Inspection notes are now captured directly from selected conditions and service must-knows.
                </p>
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
                        Tire Quantity
                      </label>
                      <input
                        type="number"
                        value={formData.tiresDetails.quantity}
                        onChange={(e) => handleNestedInputChange('tiresDetails', 'quantity', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        min="0"
                        max="8"
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
                  
                </div>
                
                {/* Wheel Nuts, Nozzle Caps, Lock Nuts */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Wheel Nuts
                    </label>
                    <input
                      type="number"
                      value={formData.wheelNutsTotal}
                      onChange={(e) => handleInputChange('wheelNutsTotal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Nozzle Caps
                    </label>
                    <input
                      type="number"
                      value={formData.nozzleCapsTotal}
                      onChange={(e) => handleInputChange('nozzleCapsTotal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Number of Lock Nuts
                    </label>
                    <input
                      type="number"
                      value={formData.lockNutsTotal}
                      onChange={(e) => handleInputChange('lockNutsTotal', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      min="0"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nozzle Caps Type
                  </label>
                  <input
                    type="text"
                    value={formData.nozzleCapsType}
                    onChange={(e) => handleInputChange('nozzleCapsType', e.target.value)}
                    placeholder="e.g., Metal, Plastic, Rubber"
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
              
              {/* Tire DOT Section - Simplified */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-2">Tire DOT Numbers</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter DOT code only for each tire position.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tireDotPositions.map((position) => (
                    <div key={position.key} className="p-4 border border-gray-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">{position.label}</label>
                      <input
                        type="text"
                        value={formData.tireDOT[position.key].code || ''}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            tireDOT: {
                              ...prev.tireDOT,
                              [position.key]: {
                                ...prev.tireDOT[position.key],
                                code: e.target.value
                              }
                            }
                          }))
                        }
                        placeholder="DOT code"
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Suitability Section */}
              <div className="mt-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">SUITABILITY ASSESSMENT</h3>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                  {applicableSuitabilityFields.length === 0 ? (
                    <p className="text-sm text-gray-600">
                      Select actual services first. Matching suitability checks will auto-appear here.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {applicableSuitabilityFields.map((field) => (
                        <div key={field.key}>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {field.label}
                          </label>
                          <select
                            value={formData.suitability[field.key]}
                            onChange={(e) => handleNestedInputChange('suitability', field.key, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          >
                            <option value="">Select</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="maybe">Maybe</option>
                            <option value="not-applicable">Not Applicable</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                  
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
              
              {/* Service-specific Risks with individual checkboxes */}
              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">ASSOCIATED RISKS</h3>
                <p className="text-sm text-gray-600 mb-4">
                  The client has been explained to the following inherent risks related with the services.
                </p>
                
                <div className="space-y-4">
                  {getSelectedServiceRisks().map((risk) => (
                    <div
                      key={risk.id}
                      className="p-4 border rounded-lg bg-gray-50 border-gray-200"
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id={`risk-${risk.id}`}
                          checked={risk.isAcknowledged}
                          onChange={(e) => handleRiskAcknowledgment(risk.id, e.target.checked)}
                          className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          required={risk.required}
                        />
                        <div className="flex-1">
                          <div className="mb-1">
                            <label htmlFor={`risk-${risk.id}`} className="text-sm font-medium text-gray-700">
                              {risk.description}
                              {risk.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                          </div>
                          <p className="text-xs text-gray-500">
                            Applies to: {risk.serviceName}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Summary for risks */}
                  {formData.services.actualService.length > 0 && (
                    <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">
                          <span className="text-gray-600">Risks acknowledged: </span>
                          <span className="font-medium">
                            {getSelectedServiceRisks().filter(r => r.isAcknowledged).length} of {getSelectedServiceRisks().length}
                          </span>
                        </div>
                        {!allRequiredRisksAcknowledged() && (
                          <div className="text-xs text-red-600">
                            All required risks must be acknowledged
                          </div>
                        )}
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
                    
                    {/* Must Know Selection */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-900">Must Know</h5>
                        {formData.services.actualService.length > 0 && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {formData.services.actualService.length} selected service(s)
                          </span>
                        )}
                      </div>

                      {serviceMustKnows.length === 0 ? (
                        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
                          <ClipboardCheck className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No must-know items to display</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="relative" ref={mustKnowDropdownRef}>
                            <button
                              type="button"
                              onClick={() => setShowMustKnowDropdown((prev) => !prev)}
                              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-purple-300"
                            >
                              <span className="text-sm text-gray-700">
                                {acknowledgedMustKnowCount === 0
                                  ? 'Select must-know items'
                                  : `${acknowledgedMustKnowCount} item(s) selected`}
                              </span>
                              <ChevronDown
                                className={`h-4 w-4 text-gray-500 transition-transform ${
                                  showMustKnowDropdown ? 'rotate-180' : ''
                                }`}
                              />
                            </button>

                            {showMustKnowDropdown && (
                              <div className="absolute z-40 mt-2 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                                <div className="flex items-center justify-between gap-2 border-b border-gray-100 p-2">
                                  <button
                                    type="button"
                                    onClick={handleSelectAllMustKnows}
                                    className="text-xs font-medium text-purple-700 hover:text-purple-900"
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleClearMustKnows}
                                    className="text-xs font-medium text-gray-600 hover:text-gray-800"
                                  >
                                    Clear
                                  </button>
                                </div>
                                <div className="max-h-72 overflow-y-auto p-2 space-y-1">
                                  {serviceMustKnows.map((mustKnow) => (
                                    <label
                                      key={mustKnow.id}
                                      htmlFor={`mustknow-${mustKnow.id}`}
                                      className="flex items-start gap-3 p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                                    >
                                      <input
                                        type="checkbox"
                                        id={`mustknow-${mustKnow.id}`}
                                        checked={mustKnow.isAcknowledged}
                                        onChange={(e) => handleMustKnowAcknowledgment(mustKnow.id, e.target.checked)}
                                        className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                        required={mustKnow.required}
                                      />
                                      <div className="flex-1">
                                        <p className="text-sm text-gray-700">
                                          {mustKnow.description}
                                          {mustKnow.required && <span className="text-red-500 ml-1">*</span>}
                                        </p>
                                        {mustKnow.serviceName !== 'General' && (
                                          <p className="text-xs text-gray-500 mt-0.5">
                                            Applies to: {mustKnow.serviceName}
                                          </p>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="pt-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">Must-knows acknowledged:</span>
                              <span className="font-medium">
                                {acknowledgedMustKnowCount} of {serviceMustKnows.length}
                              </span>
                            </div>
                            {!allMustKnowsAcknowledged() && (
                              <div className="text-xs text-red-600 mt-1">
                                All required must-knows must be acknowledged
                              </div>
                            )}
                            {allMustKnowsSelected && (
                              <div className="text-xs text-green-600 mt-1">
                                All must-know items selected
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <h5 className="font-medium text-gray-900 mb-3">Client Charge Details</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount Charged (KES)
                          </label>
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={formData.agreedAmount.total}
                            onChange={(e) => handleNestedInputChange('agreedAmount', 'total', parseFloat(e.target.value) || 0)}
                            placeholder="0.00"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Total (Formatted)
                          </label>
                          <div className="px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm font-medium text-gray-700">
                            KES {Number(formData.agreedAmount.total || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Breakdown
                        </label>
                        <textarea
                          value={formData.agreedAmount.breakdown}
                          onChange={(e) => handleNestedInputChange('agreedAmount', 'breakdown', e.target.value)}
                          placeholder="Example: Diamond cutting KES 8,000; Straightening KES 4,000; TPMS service KES 1,500"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                          rows={3}
                        />
                      </div>
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
                  </div>
                </div>
              </div>
            </div>

            {/* Inspection Images */}
            <div className="mb-8 border-t pt-8">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Camera className="h-5 w-5 text-purple-600" />
                    Inspection Images
                    <span className="ml-2 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">Optional</span>
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Add up to 5 images for the rim intake record.
                  </p>
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {formData.uploadedImages.length}/5 images
                </span>
              </div>

              <input
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
                    : 'border-gray-300 hover:border-purple-400 hover:bg-purple-50/40'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-full bg-purple-100 p-3">
                    <Upload className="h-6 w-6 text-purple-600" />
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
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Uploaded Images ({formData.uploadedImages.length})
                  </h3>
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

            {/* Signatures */}
            <div className="mb-8 border-t pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-600" />
                Signatures
              </h2>
              
              {/* Signatures Section - Inspector first, then Client */}
              <div className="mt-8 space-y-6">
                {/* Inspector Signature Section */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <UserCheck className="h-5 w-5 text-purple-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Inspector Signature</h3>
                        <p className="text-xs text-gray-500">Required before client approval</p>
                      </div>
                    </div>
                    {formData.inspectorSignature && (
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Signed
                        </span>
                        <button
                          type="button"
                          onClick={() => clearSignature('inspector')}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Inspector Signature Canvas */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    {showInspectorSignature ? (
                      <div className="space-y-4">
                        <div className="border border-gray-300 rounded-lg bg-white">
                          <SignatureCanvas
                            ref={inspectorSigRef}
                            penColor="black"
                            canvasProps={{
                              width: 600,
                              height: 150,
                              className: 'w-full h-32 rounded-lg',
                              style: { 
                                width: '100%', 
                                height: '128px',
                                touchAction: 'none',
                                cursor: 'crosshair'
                              }
                            }}
                            velocityFilterWeight={0.7}
                            minWidth={0.5}
                            maxWidth={2.5}
                            throttle={16}
                            clearOnResize={false}
                          />
                        </div>
                        <div className="flex justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => setShowInspectorSignature(false)}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
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
                            <img 
                              src={formData.inspectorSignature} 
                              alt="Inspector Signature" 
                              className="h-16 object-contain"
                            />
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
                          <h3 className="font-semibold text-gray-900">Pricing Snapshot</h3>
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
                              <label className="block text-xs text-gray-500 mb-1">Qty</label>
                              <input
                                type="number"
                                min={0}
                                step="1"
                                value={item.quantity}
                                onChange={(e) => handlePricingItemChange(index, 'quantity', e.target.value)}
                                className="w-full px-2.5 py-2 border border-gray-300 rounded-lg text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Unit Price</label>
                              <input
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

                {/* Client Signature Section */}
                <div className="bg-gray-50 rounded-lg p-5 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <UserType className="h-5 w-5 text-blue-700" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Client Approval</h3>
                        <p className="text-xs text-gray-500">
                          {formData.inspectorSignature 
                            ? 'Ready for client signature' 
                            : 'Awaiting inspector signature first'}
                        </p>
                      </div>
                    </div>
                    {formData.clientSignature && (
                      <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Approved
                        </span>
                        <button
                          type="button"
                          onClick={() => clearSignature('client')}
                          className="text-xs text-red-600 hover:text-red-800 px-2 py-1 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Signing Method Selection */}
                  <div className="mb-5">
                    <div className="flex gap-4 p-1 bg-gray-100 rounded-lg inline-flex">
                      <button
                        type="button"
                        onClick={() => handleInputChange('clientSigningMethod', 'present')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.clientSigningMethod === 'present'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Client Present
                      </button>
                      <button
                        type="button"
                        onClick={() => handleInputChange('clientSigningMethod', 'absent')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          formData.clientSigningMethod === 'absent'
                            ? 'bg-white text-blue-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                      >
                        Client Absent
                      </button>
                    </div>
                  </div>

                  {/* Client Present - Direct Signature */}
                  {formData.clientSigningMethod === 'present' && (
                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                      {showClientSignature ? (
                        <div className="space-y-4">
                          <div className="border border-gray-300 rounded-lg bg-white">
                            <SignatureCanvas
                              ref={clientSigRef}
                              penColor="black"
                              canvasProps={{
                                width: 600,
                                height: 150,
                                className: 'w-full h-32 rounded-lg',
                                style: { 
                                  width: '100%', 
                                  height: '128px',
                                  touchAction: 'none',
                                  cursor: 'crosshair'
                                }
                              }}
                              velocityFilterWeight={0.7}
                              minWidth={0.5}
                              maxWidth={2.5}
                              throttle={16}
                              clearOnResize={false}
                            />
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              type="button"
                              onClick={() => setShowClientSignature(false)}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => saveSignature('client')}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-2"
                            >
                              <CheckCircle className="h-4 w-4" />
                              Save Signature
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onClick={() => formData.inspectorSignature ? setShowClientSignature(true) : null}
                          className={`cursor-pointer group ${!formData.inspectorSignature && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {formData.clientSignature ? (
                            <div className="flex items-center justify-between">
                              <img 
                                src={formData.clientSignature} 
                                alt="Client Signature" 
                                className="h-16 object-contain"
                              />
                              <span className="text-sm text-blue-600 group-hover:text-blue-800 flex items-center gap-1">
                                <FileSignature className="h-4 w-4" />
                                Change
                              </span>
                            </div>
                          ) : (
                            <div className={`flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg transition-colors ${
                              formData.inspectorSignature
                                ? 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                                : 'border-gray-200 bg-gray-50'
                            }`}>
                              <FileSignature className={`h-10 w-10 mb-2 ${
                                formData.inspectorSignature ? 'text-gray-400 group-hover:text-blue-500' : 'text-gray-300'
                              }`} />
                              <p className={`text-sm font-medium ${
                                formData.inspectorSignature ? 'text-gray-700 group-hover:text-blue-700' : 'text-gray-400'
                              }`}>
                                {formData.inspectorSignature ? 'Click to capture client signature' : 'Waiting for inspector signature'}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">
                                {formData.inspectorSignature ? 'Client signs here' : 'Inspector must sign first'}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Client Absent - Email for Approval */}
                  {formData.clientSigningMethod === 'absent' && (
                    <div className="bg-white rounded-lg border border-blue-200 p-5">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-blue-100 rounded-full">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">Send for Remote Approval</h4>
                          <p className="text-sm text-gray-600 mb-4">
                            Client will receive an email with a secure link to review and sign
                          </p>
                          
                          <div className="flex gap-3">
                            <input
                              type="email"
                              value={formData.clientEmail}
                              onChange={(e) => handleInputChange('clientEmail', e.target.value)}
                              placeholder="client@company.com"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              disabled={!formData.inspectorSignature}
                            />
                            <button
                              type="button"
                              onClick={sendForClientApproval}
                              disabled={!formData.inspectorSignature || !formData.clientEmail}
                              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                              <Mail className="h-4 w-4" />
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
        mode="diamond-rims"
        selectedServices={formData.services.actualService}
      />
    </div>
  );
}
