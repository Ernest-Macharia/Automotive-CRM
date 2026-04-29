'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import SignatureCanvas from 'react-signature-canvas';
import {
  ClipboardCheck,
  ArrowLeft,
  Save,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
  User as UserType,
  Loader2,
  Eye,
  ChevronDown,
  ChevronUp,
  FileSignature,
  Sparkles,
  Car as CarIcon,
  Package,
  CheckSquare,
  AlertOctagon,
  Truck,
  Home,
  Mail,
  Phone,
  ClipboardList,
  Thermometer,
  Droplets,
  Zap,
  Wrench as WrenchIcon,
  Check,
  ArrowRight,
  Download,
  RotateCw,
  Shield,
  Gauge,
  Settings,
  Users,
  Award,
  ShieldCheck,
  Star,
  ThumbsUp,
  CircleCheck,
  ExternalLink,
  ChevronRight,
  PaintBucket,
  RefreshCw,
  Edit,
  Lock,
  Unlock,
  Link as LinkIcon,
  ExternalLink as ExternalLinkIcon
} from 'lucide-react';
import Link from 'next/link';
import { postChecklistService } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { userService, User } from '@/services/settings/userService';
import { useToast } from '@/contexts/ToastContext';
import TermsModal from '@/components/pre-checklist/TermsModal';
import DiamondRimsPostChecklistPDF from './DiamondRimsPostChecklistPDF';
import * as XLSX from 'xlsx';
import { preChecklistService } from '@/services/preChecklistService';
import FileUploadSection from '@/components/pre-checklist/FileUploadSection';
import { ChecklistFile } from '@/services/preChecklistService';
import { serviceService, Service } from '@/services/serviceService';
import { format } from 'date-fns';

interface DiamondRimsPostChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
  preChecklistId?: string;
}

const POST_CHECKLIST_DRAFT_KEY = 'diamondRimsPostChecklistDraft';

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

function isCompatiblePostChecklistDraft(
  draft: any,
  opportunityId?: string | null,
  workOrderId?: string | null,
  vehicleId?: string | null,
  preChecklistId?: string | null,
): boolean {
  if (!draft || typeof draft !== 'object') return false;

  const matches = (draftValue: string | undefined, routeValue: string | null | undefined) =>
    !draftValue || !routeValue || draftValue === routeValue;

  return (
    matches(draft.opportunityId, opportunityId) &&
    matches(draft.workOrderId, workOrderId) &&
    matches(draft.vehicleId, vehicleId) &&
    matches(draft.preChecklistId, preChecklistId)
  );
}

export default function DiamondRimsPostChecklistCreatePage({ 
  mode = 'create', 
  checklistId,
  preChecklistId: initialPreChecklistId 
}: DiamondRimsPostChecklistCreatePageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  // Get parameters from URL
  const opportunityId = searchParams.get('opportunityId');
  const workOrderId = searchParams.get('workOrderId');
  const vehicleId = searchParams.get('vehicleId');
  const source = searchParams.get('source');
  const preChecklistId = searchParams.get('preChecklistId') || initialPreChecklistId;

  const [loading, setLoading] = useState(mode === 'create');
  const [submitting, setSubmitting] = useState(false);
  const [workOrder, setWorkOrder] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);
  const [vehicle, setVehicle] = useState<any>(null);
  const [existingChecklist, setExistingChecklist] = useState<any>(null);
  const [preChecklist, setPreChecklist] = useState<any>(null);
  const [autoPopulated, setAutoPopulated] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Edit mode for repopulated details
  const [editMode, setEditMode] = useState<{[key: string]: boolean}>({
    customerDetails: false,
    carDetails: false,
    services: false,
    powderCoating: false,
    tireSpecs: false,
    deliveryInfo: false
  });

  // State for technicians dropdown
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showTechnicianDropdown, setShowTechnicianDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [clientOptions, setClientOptions] = useState<any[]>([]);
  const [loadingClientOptions, setLoadingClientOptions] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState('');
  const [linkingClient, setLinkingClient] = useState(false);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const [showServicesDropdown, setShowServicesDropdown] = useState(false);
  const technicianDropdownRef = useRef<HTMLDivElement>(null);
  const serviceDropdownRef = useRef<HTMLDivElement>(null);
  const draftRestoredRef = useRef(false);

  // POST CHECKLIST FORM STATE
  const [formData, setFormData] = useState({
    checklistType: 'diamond_rims_post',
    opportunityId: opportunityId || '',
    workOrderId: workOrderId || '',
    vehicleId: vehicleId || '',
    preChecklistId: preChecklistId || '',
    files: [] as ChecklistFile[],
    
    // SERVICE COMPLETION DETAILS
    serviceCompletion: {
      date: new Date().toISOString().split('T')[0],
      completedBy: sessionStorage.getItem('userName') || '',
      completionTime: new Date().toISOString().split('T')[1]?.substring(0, 5) || '',
    },
    
    // REPOPULATED FROM OPPORTUNITY/PRE-CHECKLIST
    customerDetails: {
      firstName: '',
      lastName: '',
      mobile: '',
      email: '',
    },
    
    carDetails: {
      carMake: '',
      carModel: '',
      licensePlate: '',
      mileage: '',
      yearOfManufacture: '',
    },
    
    services: {
      actualService: [] as string[],
    },
    
    powderCoating: {
      colourRAL: '',
    },
    
    tireSpecifications: {
      brand: '',
      dot: '',
      treadDepth: '',
    },
    
    deliveryInformation: {
      mode: '',
    },
    
    // QUALITY CHECKS
    qualityChecks: {
      tpmsSensorsFitted: false,
      lockNutsFitted: false,
      nozzleCapsFitted: false,
      centerCapsFitted: false,
      wheelBalanced: false,
      punctureCheck: false,
      rimStraightness: '',
      coatingQuality: '',
      weldingQuality: '',
      diamondCuttingQuality: '',
    },
    
    // TECHNICIAN CONFIRMATION
    // technicianConfirmation: false,
    
    // CLIENT'S SIGNATURE ONLY
    clientSignature: '',
    
    // Terms acceptance
    acceptTerms: false,
    
    // Uploads
    uploadedImages: [] as string[],
    remarks: '',
    agreedAmount: {
      total: 0,
      breakdown: '',
    },
    
    // Status
    approved: false,
    completed: true,
    completionDate: new Date().toISOString()
  });

  const [clientSignature, setClientSignature] = useState(formData.clientSignature);
  const [showClientSignature, setShowClientSignature] = useState(false);
  const clientSigRef = useRef<SignatureCanvas>(null);

  // RAL Colors options
  const ralColors = [
    'Super Glossy Black',
    'Standard Glossy Black',
    'Silver',
    'Gold',
    'Orange',
    'Red',
    'Bronze',
    'Luminous Green',
    'Blue',
    'Graphite Grey',
    'Gun Metal',
    'Gun Metall Light',
    'Fine Flash Silver',
    'Matte Black'
  ];

  // Quality options
  const qualityOptions = [
    'Excellent',
    'Good',
    'Satisfactory',
    'Needs Improvement',
    'Poor'
  ];

  useEffect(() => {
    loadRelatedData();
    fetchTechnicians();
    loadAvailableServices();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode, preChecklistId]);

  useEffect(() => {
    if ((opportunity || preChecklist) && !autoPopulated) {
      autoPopulateFromSource();
    }
  }, [opportunity, preChecklist]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (technicianDropdownRef.current && !technicianDropdownRef.current.contains(event.target as Node)) {
        setShowTechnicianDropdown(false);
        setUserSearch('');
      }

      if (serviceDropdownRef.current && !serviceDropdownRef.current.contains(event.target as Node)) {
        setShowServicesDropdown(false);
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
      const savedDraft = localStorage.getItem(POST_CHECKLIST_DRAFT_KEY);
      if (!savedDraft) {
        draftRestoredRef.current = true;
        return;
      }

      const parsedDraft = JSON.parse(savedDraft);
      if (!isCompatiblePostChecklistDraft(parsedDraft, opportunityId, workOrderId, vehicleId, preChecklistId)) {
        draftRestoredRef.current = true;
        return;
      }

      setFormData(prev => mergeDraftData(prev, parsedDraft));
      draftRestoredRef.current = true;
      showToast('Restored your saved post-checklist draft', 'info');
    } catch (error) {
      console.error('Failed to restore post-checklist draft:', error);
      draftRestoredRef.current = true;
    }
  }, [loading, mode, opportunityId, workOrderId, vehicleId, preChecklistId, showToast]);

  useEffect(() => {
    if (loading || mode === 'edit') {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      try {
        localStorage.setItem(POST_CHECKLIST_DRAFT_KEY, JSON.stringify(formData));
      } catch (error) {
        console.error('Failed to autosave post-checklist draft:', error);
      }
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [formData, loading, mode]);

  const fetchTechnicians = async () => {
    try {
      setLoadingUsers(true);
      const usersData = await userService.getAllUsers();
      // Filter for technicians
      const technicianUsers = usersData.filter(user => {
        if (!user.role) return false;
        if (typeof user.role === 'string') {
          const lowerRole = user.role.toLowerCase();
          return lowerRole === 'technician' || lowerRole.includes('technician') || lowerRole === 'tech';
        } else if (user.role && typeof user.role === 'object') {
          const roleName = user.role.name?.toLowerCase() || '';
          return roleName === 'technician' || roleName.includes('technician');
        }
        return false;
      });
      setUsers(technicianUsers || []);
    } catch (error) {
      console.error('Error fetching technicians:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadAvailableServices = async () => {
    try {
      setLoadingServices(true);
      const services = await serviceService.getAllServices();
      const activeServices = services
        .filter((service) => service.isActive)
        .sort((a, b) => a.name.localeCompare(b.name));
      setAvailableServices(activeServices);
    } catch (error) {
      console.error('Error loading services for post-checklist dropdown:', error);
      showToast('Could not load services for dropdown selection', 'warning');
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
      console.error('Error loading post-checklist clients:', error);
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
      setPreChecklist(null);
      setAutoPopulated(false);
      setFormData(prev => ({
        ...prev,
        opportunityId: '',
        preChecklistId: '',
        vehicleId: '',
      }));
      return;
    }

    try {
      setLinkingClient(true);

      let selectedOpportunity = clientOptions.find((candidate) => {
        const candidateId = typeof candidate === 'object' ? (candidate._id || candidate.id || '') : '';
        return candidateId === nextClientId;
      });

      if (!selectedOpportunity) {
        selectedOpportunity = await opportunityService.getOpportunityById(nextClientId, false);
      }

      setOpportunity(selectedOpportunity);
      setPreChecklist(null);
      setClientOptions(prev => {
        const alreadyExists = prev.some((candidate) => {
          const candidateId = typeof candidate === 'object' ? (candidate._id || candidate.id || '') : '';
          return candidateId === nextClientId;
        });
        if (alreadyExists) return prev;
        return [selectedOpportunity, ...prev].slice(0, 40);
      });

      const opportunityVehicle = selectedOpportunity?.vehicles?.[0] || null;
      const selectedVehicleId = typeof opportunityVehicle === 'object'
        ? (opportunityVehicle?._id || opportunityVehicle?.id || '')
        : '';

      let selectedVehicle = opportunityVehicle;
      if (selectedVehicleId) {
        try {
          selectedVehicle = await vehicleService.getVehicleById(selectedVehicleId);
        } catch (vehicleError) {
          console.error('Error loading selected post-checklist vehicle details:', vehicleError);
        }
      }

      setVehicle(selectedVehicle || null);
      setAutoPopulated(false);
      setFormData(prev => ({
        ...prev,
        opportunityId: nextClientId,
        preChecklistId: '',
        vehicleId: selectedVehicleId || prev.vehicleId,
      }));

      autoPopulateFromSource({
        opportunityData: selectedOpportunity,
        preChecklistData: null,
        vehicleOverride: selectedVehicle,
      });

      showToast('Client details loaded into the post-checklist', 'success');
    } catch (error) {
      console.error('Error selecting post-checklist client:', error);
      showToast('Failed to load selected client details', 'error');
    } finally {
      setLinkingClient(false);
    }
  };

  useEffect(() => {
    if (mode !== 'create' || opportunityId || preChecklistId || workOrderId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      loadClientOptions(clientSearch);
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [mode, opportunityId, preChecklistId, workOrderId, clientSearch, loadClientOptions]);

  useEffect(() => {
    const resolvedClientId =
      formData.opportunityId ||
      (typeof opportunity === 'object' ? (opportunity?._id || opportunity?.id || '') : '');
    if (resolvedClientId) {
      setSelectedClientId(resolvedClientId);
    }
  }, [formData.opportunityId, opportunity]);

  const loadRelatedData = async () => {
    try {
      setLoading(true);
      const [opportunityResult, preChecklistResult, workOrderResult, checklistResult] = await Promise.allSettled([
        opportunityId ? opportunityService.getOpportunityById(opportunityId, false) : Promise.resolve(null),
        preChecklistId ? preChecklistService.getPreChecklistById(preChecklistId) : Promise.resolve(null),
        workOrderId ? workOrderService.getWorkOrderById(workOrderId) : Promise.resolve(null),
        mode === 'edit' && checklistId ? postChecklistService.getPostChecklistById(checklistId) : Promise.resolve(null),
      ]);

      let resolvedOpportunity =
        opportunityResult.status === 'fulfilled' ? opportunityResult.value : null;

      if (opportunityResult.status === 'rejected') {
        console.error('Error loading opportunity:', opportunityResult.reason);
      }

      if (preChecklistResult.status === 'fulfilled' && preChecklistResult.value) {
        const preCheck = preChecklistResult.value;
        setPreChecklist(preCheck);
        setFormData(prev => ({
          ...prev,
          preChecklistId,
        }));
      } else if (preChecklistResult.status === 'rejected') {
        console.error('Error loading pre-checklist:', preChecklistResult.reason);
      }

      if (workOrderResult.status === 'fulfilled' && workOrderResult.value) {
        const wo = workOrderResult.value;
        setWorkOrder(wo);

        let jobCardId = '';
        if (wo?.jobCards && Array.isArray(wo.jobCards) && wo.jobCards.length > 0) {
          if (typeof wo.jobCards[0] === 'object') {
            jobCardId = (wo.jobCards[0] as any)._id || '';
          } else {
            jobCardId = wo.jobCards[0] as string || '';
          }
        }

        if (wo.opportunityId && !resolvedOpportunity) {
          const oppId = typeof wo.opportunityId === 'object' ? wo.opportunityId._id : wo.opportunityId;
          if (oppId) {
            try {
              resolvedOpportunity = await opportunityService.getOpportunityById(oppId, false);
            } catch (error) {
              console.error('Error loading work order opportunity:', error);
            }
          }
        }

        setFormData(prev => ({
          ...prev,
          workOrderId,
          ...(jobCardId && { tempJobCardId: jobCardId })
        }));
      } else if (workOrderResult.status === 'rejected') {
        console.error('Error loading work order:', workOrderResult.reason);
      }

      if (checklistResult.status === 'fulfilled' && checklistResult.value) {
        const checklist = checklistResult.value;
        setExistingChecklist(checklist);

        const serviceCompletion = {
          date: (checklist as any).serviceCompletion?.date || new Date().toISOString().split('T')[0],
          completedBy: (checklist as any).serviceCompletion?.completedBy || sessionStorage.getItem('userName') || '',
          completionTime: (checklist as any).serviceCompletion?.completionTime || '',
        };

        const qualityChecks = (checklist as any).qualityChecks || {
          tpmsSensorsFitted: false,
          lockNutsFitted: false,
          nozzleCapsFitted: false,
          centerCapsFitted: false,
          wheelBalanced: false,
          punctureCheck: false,
          rimStraightness: '',
          coatingQuality: '',
          weldingQuality: '',
          diamondCuttingQuality: '',
        };

        const clientSignature = (checklist as any).clientSignature || (checklist as any).customerSignature || '';
        const acceptTerms = (checklist as any).acceptTerms || false;
        const remarks = (checklist as any).remarks || (checklist as any).notes || '';
        const files = (checklist as any).files || [];
        const agreedAmount = {
          total: Number((checklist as any).agreedAmount?.total) || 0,
          breakdown: (checklist as any).agreedAmount?.breakdown || '',
        };

        setFormData(prev => ({
          ...prev,
          serviceCompletion,
          qualityChecks,
          clientSignature,
          acceptTerms,
          remarks,
          files,
          agreedAmount
        }));

        if (clientSignature) {
          setClientSignature(clientSignature);
        }

        if ((checklist as any).customerDetails) {
          setFormData(prev => ({
            ...prev,
            customerDetails: {
              ...prev.customerDetails,
              ...(checklist as any).customerDetails
            }
          }));
        }

        if ((checklist as any).carDetails || (checklist as any).vehicleDetails) {
          const vehicleInfo = (checklist as any).carDetails || (checklist as any).vehicleDetails || {};
          setFormData(prev => ({
            ...prev,
            carDetails: {
              ...prev.carDetails,
              ...vehicleInfo
            }
          }));
        }

        if ((checklist as any).services) {
          setFormData(prev => ({
            ...prev,
            services: {
              actualService: (checklist as any).services?.actualService || []
            }
          }));
        }

        if ((checklist as any).powderCoating) {
          setFormData(prev => ({
            ...prev,
            powderCoating: {
              ...prev.powderCoating,
              ...(checklist as any).powderCoating
            }
          }));
        }
      } else if (checklistResult.status === 'rejected') {
        console.error('Error loading existing checklist:', checklistResult.reason);
        showToast('Failed to load existing checklist data', 'error');
      }

      if (resolvedOpportunity) {
        setOpportunity(resolvedOpportunity);

        const primaryVehicle = resolvedOpportunity.vehicles?.[0];
        if (primaryVehicle?._id) {
          try {
            const detailedVehicle = await vehicleService.getVehicleById(primaryVehicle._id);
            setVehicle(detailedVehicle);
          } catch (vehError) {
            console.error('Error loading detailed vehicle:', vehError);
            setVehicle(primaryVehicle);
          }
        } else if (vehicleId) {
          try {
            const veh = await vehicleService.getVehicleById(vehicleId);
            setVehicle(veh);
          } catch (vehError) {
            console.error('Error loading vehicle:', vehError);
          }
        }
      }

    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateFromSource = (options?: {
    opportunityData?: any;
    preChecklistData?: any;
    vehicleOverride?: any;
  }) => {
    try {
      const selectedPreChecklist = options?.preChecklistData !== undefined
        ? options.preChecklistData
        : preChecklist;
      const selectedOpportunity = options?.opportunityData ?? opportunity;
      const selectedVehicle = options?.vehicleOverride ?? vehicle;

      // Prioritize pre-checklist data if available, otherwise use opportunity
      const sourceData = selectedPreChecklist || selectedOpportunity;
      
      if (!sourceData) return;

      // Extract vehicle ID
      let extractedVehicleId = '';
      if (selectedPreChecklist?.vehicleId) {
        extractedVehicleId = typeof selectedPreChecklist.vehicleId === 'object' 
          ? selectedPreChecklist.vehicleId._id 
          : selectedPreChecklist.vehicleId;
      } else if (selectedVehicle?._id) {
        extractedVehicleId = selectedVehicle._id;
      } else if (selectedOpportunity?.vehicles?.[0]?._id) {
        extractedVehicleId = selectedOpportunity.vehicles[0]._id;
      }

      // Extract customer information
      let firstName = '';
      let lastName = '';
      let mobile = '';
      let email = '';

      if (selectedPreChecklist?.customerDetails) {
        // From pre-checklist
        firstName = selectedPreChecklist.customerDetails.firstName || '';
        lastName = selectedPreChecklist.customerDetails.lastName || '';
        mobile = selectedPreChecklist.customerDetails.mobile || '';
        email = selectedPreChecklist.customerDetails.email || '';
      } else if (selectedOpportunity?.customer) {
        // From opportunity
        const customerName = selectedOpportunity.customer.name || '';
        const nameParts = customerName.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
        mobile = selectedOpportunity.customer.phone || '';
        email = selectedOpportunity.customer.email || '';
      }

      // Extract vehicle information
      let carMake = '';
      let carModel = '';
      let licensePlate = '';
      let yearOfManufacture = '';
      let mileage = '';

      if (selectedPreChecklist?.carDetails) {
        // From pre-checklist
        carMake = selectedPreChecklist.carDetails.carMake || '';
        carModel = selectedPreChecklist.carDetails.carModel || '';
        licensePlate = selectedPreChecklist.carDetails.licensePlate || '';
        yearOfManufacture = selectedPreChecklist.carDetails.yearOfManufacture || '';
        mileage = selectedPreChecklist.carDetails.mileage || '';
      } else if (selectedVehicle) {
        // From vehicle
        carMake = selectedVehicle.make || selectedVehicle.manufacturer || '';
        carModel = selectedVehicle.model || selectedVehicle.modelName || '';
        
        // Try different license plate fields
        const plateFields = ['registrationNumber', 'regNumber', 'regNo', 'licensePlate', 'plateNumber'];
        for (const field of plateFields) {
          if (selectedVehicle[field]) {
            licensePlate = selectedVehicle[field];
            break;
          }
        }
        
        // Try different year fields
        if (selectedVehicle.year) yearOfManufacture = selectedVehicle.year.toString();
        else if (selectedVehicle.yearOfManufacture) yearOfManufacture = selectedVehicle.yearOfManufacture.toString();
        else if (selectedVehicle.modelYear) yearOfManufacture = selectedVehicle.modelYear.toString();
        
        mileage = selectedVehicle.mileage || selectedVehicle.odometer || '';
      } else if (selectedOpportunity?.vehicles?.[0]) {
        const oppVehicle = selectedOpportunity.vehicles[0];
        carMake = oppVehicle.make || oppVehicle.manufacturer || '';
        carModel = oppVehicle.model || oppVehicle.modelName || '';
        
        const plateFields = ['registrationNumber', 'regNumber', 'regNo', 'licensePlate', 'plateNumber'];
        for (const field of plateFields) {
          if (oppVehicle[field]) {
            licensePlate = oppVehicle[field];
            break;
          }
        }
        
        if (oppVehicle.year) yearOfManufacture = oppVehicle.year.toString();
      }

      // Extract services
      let services: string[] = [];
      if (selectedPreChecklist?.services?.actualService) {
        services = selectedPreChecklist.services.actualService;
      } else if (selectedOpportunity?.services) {
        if (Array.isArray(selectedOpportunity.services)) {
          services = selectedOpportunity.services.map((s: any) => s.name || s);
        }
      }

      // Extract powder coating color
      let powderCoatingColor = '';
      if (selectedPreChecklist?.powderCoating?.colourRAL) {
        powderCoatingColor = selectedPreChecklist.powderCoating.colourRAL;
      }

      // Extract tire brand and DOT
      let tireBrand = '';
      let dotCode = '';
      if (selectedPreChecklist?.tireBrands) {
        const brands = selectedPreChecklist.tireBrands;
        tireBrand = brands.fr || brands.fl || brands.br || brands.bl || '';
      }
      if (selectedPreChecklist?.tireDOT) {
        const dots = selectedPreChecklist.tireDOT;
        dotCode = dots.fr?.code || dots.fl?.code || dots.br?.code || dots.bl?.code || '';
      }

      // Extract delivery mode
      let deliveryMode = '';
      if (selectedPreChecklist?.deliveryMode) {
        deliveryMode = selectedPreChecklist.deliveryMode;
      }

      const agreedTotal = Number(selectedPreChecklist?.agreedAmount?.total)
        || Number(selectedOpportunity?.amount)
        || Number(selectedOpportunity?.productPrice)
        || 0;
      const agreedBreakdown = selectedPreChecklist?.agreedAmount?.breakdown || '';

      setFormData(prev => ({
        ...prev,
        vehicleId: extractedVehicleId || prev.vehicleId, // Set the vehicle ID
        customerDetails: {
          firstName: firstName || prev.customerDetails.firstName,
          lastName: lastName || prev.customerDetails.lastName,
          mobile: mobile || prev.customerDetails.mobile,
          email: email || prev.customerDetails.email,
        },
        carDetails: {
          carMake: carMake || prev.carDetails.carMake,
          carModel: carModel || prev.carDetails.carModel,
          licensePlate: licensePlate || prev.carDetails.licensePlate,
          mileage: mileage || prev.carDetails.mileage,
          yearOfManufacture: yearOfManufacture || prev.carDetails.yearOfManufacture,
        },
        services: {
          actualService: services.length > 0 ? services : prev.services.actualService,
        },
        powderCoating: {
          colourRAL: powderCoatingColor || prev.powderCoating.colourRAL,
        },
        tireSpecifications: {
          brand: tireBrand || prev.tireSpecifications.brand,
          dot: dotCode || prev.tireSpecifications.dot,
          treadDepth: prev.tireSpecifications.treadDepth,
        },
        deliveryInformation: {
          mode: deliveryMode || prev.deliveryInformation.mode,
        },
        agreedAmount: {
          total: agreedTotal || prev.agreedAmount.total,
          breakdown: agreedBreakdown || prev.agreedAmount.breakdown,
        },
        files: selectedPreChecklist?.files ? [...selectedPreChecklist.files] : prev.files
      }));
      
      setAutoPopulated(true);
      
    } catch (error) {
      console.error('Error auto-populating from source:', error);
      showToast('Error loading data from source', 'warning');
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

  const handleServiceToggle = (serviceName: string) => {
    setFormData((prev) => {
      const currentServices = prev.services.actualService || [];
      const serviceExists = currentServices.includes(serviceName);

      return {
        ...prev,
        services: {
          ...prev.services,
          actualService: serviceExists
            ? currentServices.filter((name) => name !== serviceName)
            : [...currentServices, serviceName],
        },
      };
    });
  };

  const filteredServiceOptions = availableServices.filter((service) => {
    const searchTerm = serviceSearch.trim().toLowerCase();
    if (!searchTerm) return true;

    return (
      service.name.toLowerCase().includes(searchTerm) ||
      service.serviceCode.toLowerCase().includes(searchTerm) ||
      service.description.toLowerCase().includes(searchTerm)
    );
  });

  const toggleEditMode = (section: string) => {
    if (section === 'services' && editMode.services) {
      setShowServicesDropdown(false);
      setServiceSearch('');
    }

    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const saveSignature = () => {
    if (clientSigRef.current) {
      const dataUrl = clientSigRef.current.getTrimmedCanvas().toDataURL('image/png');
      setClientSignature(dataUrl);
      handleInputChange('clientSignature', dataUrl);
      setShowClientSignature(false);
      showToast('Client signature saved', 'success');
    }
  };

  const clearSignature = () => {
    if (clientSigRef.current) {
      clientSigRef.current.clear();
      setClientSignature('');
      handleInputChange('clientSignature', '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.serviceCompletion.completedBy) {
        showToast('Please enter who completed the service', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.clientSignature) {
        showToast('Client signature is required', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.acceptTerms) {
        showToast('Please accept the terms and conditions', 'error');
        setSubmitting(false);
        return;
      }

      const customerEmail = formData.customerDetails.email.trim();
      if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        showToast('Enter a valid customer email or leave it blank', 'error');
        setSubmitting(false);
        return;
      }

      // Get jobCard ID from workOrder.jobCards (array of job cards)
      let jobCardId = '';
      
      if (workOrder?.jobCards && Array.isArray(workOrder.jobCards) && workOrder.jobCards.length > 0) {
        // If jobCards is an array of objects with _id
        if (typeof workOrder.jobCards[0] === 'object') {
          jobCardId = (workOrder.jobCards[0] as any)._id || '';
        } else {
          // If jobCards is an array of strings
          jobCardId = workOrder.jobCards[0] as string || '';
        }
      }
      
      // If not in workOrder, try to get from URL params
      const urlJobCardId = searchParams.get('jobCardId');
      if (urlJobCardId) {
        jobCardId = urlJobCardId;
      }

      // Get vehicle ID - PRIORITIZE from formData, then from vehicle object, then from pre-checklist
      let finalVehicleId = '';
      
      // Try from formData
      if (formData.vehicleId) {
        finalVehicleId = formData.vehicleId;
      }
      // Try from vehicle object
      else if (vehicle) {
        finalVehicleId = typeof vehicle === 'object' && vehicle._id ? vehicle._id : vehicleId || '';
      }
      // Try from pre-checklist
      else if (preChecklist?.vehicleId) {
        finalVehicleId = typeof preChecklist.vehicleId === 'object' 
          ? preChecklist.vehicleId._id 
          : preChecklist.vehicleId;
      }
      // Try from opportunity
      else if (opportunity?.vehicles?.[0]?._id) {
        finalVehicleId = opportunity.vehicles[0]._id;
      }

      // Validate required IDs
      if (!finalVehicleId) {
        showToast('Vehicle ID is required. Please ensure vehicle information is loaded.', 'error');
        setSubmitting(false);
        return;
      }

      if (!jobCardId) {
        showToast('Job Card ID is required. Please ensure this post-checklist is linked to a work order with job cards.', 'error');
        setSubmitting(false);
        return;
      }

      if (!formData.opportunityId && !opportunityId) {
        showToast('Opportunity ID is required.', 'error');
        setSubmitting(false);
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        checklistType: 'diamond_rims_post',
        opportunityId: formData.opportunityId || opportunityId,
        vehicleId: finalVehicleId, // Use the validated vehicle ID
        workOrderId: formData.workOrderId || workOrderId || '',
        jobCardId: jobCardId,
        approved: false,
        completed: true,
        completionDate: new Date().toISOString(),
        clientSignature: formData.clientSignature,
        // Make sure these are included
        customerDetails: {
          firstName: formData.customerDetails.firstName,
          lastName: formData.customerDetails.lastName,
          mobile: formData.customerDetails.mobile,
          email: customerEmail,
        },
        carDetails: {
          carMake: formData.carDetails.carMake,
          carModel: formData.carDetails.carModel,
          licensePlate: formData.carDetails.licensePlate,
          mileage: formData.carDetails.mileage,
          yearOfManufacture: formData.carDetails.yearOfManufacture,
        },
        services: {
          actualService: formData.services.actualService,
        },
        agreedAmount: formData.agreedAmount,
        qualityChecks: formData.qualityChecks,
        serviceCompletion: formData.serviceCompletion,
        remarks: formData.remarks,
        files: formData.files
      };

      let result: any;
      const userId = sessionStorage.getItem('userId') || undefined;
      
      if (mode === 'edit' && checklistId) {
        result = await postChecklistService.updatePostChecklist(checklistId, submissionData as any, userId);
        showToast('Post-checklist updated successfully', 'success');
      } else {
        result = await postChecklistService.createPostChecklist(submissionData as any, userId);
        showToast('Post-checklist created successfully', 'success');
        localStorage.removeItem(POST_CHECKLIST_DRAFT_KEY);
      }

      // Update work order with post-checklist ID
      if (workOrderId && result._id) {
        await workOrderService.updateWorkOrder(workOrderId, {
          postChecklistId: result._id,
          postChecklistStatus: 'pending',
          updatedAt: new Date().toISOString()
        });
      }

      showToast('Post-checklist completed successfully', 'success');

      // Redirect based on context
      if (workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (source === 'opportunity' && formData.opportunityId) {
        router.push(`/opportunities/${formData.opportunityId}`);
      } else if (result._id) {
        router.push(`/post-checklist/${result._id}`);
      } else {
        router.push('/postchecklists');
      }

    } catch (error: any) {
      console.error('Error submitting post-checklist:', error);
      showToast(error.message || 'Failed to save post-checklist', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else if (source === 'prechecklist' && preChecklistId) {
      router.push(`/pre-checklist/diamond-rims/${preChecklistId}`);
    } else if (source === 'opportunity' && opportunityId) {
      router.push(`/opportunities/${opportunityId}`);
    } else {
      router.push('/postchecklists');
    }
  };

  const handleRefreshFromSource = () => {
    autoPopulateFromSource();
    showToast('Refreshed data from source', 'info');
  };

  const handleSaveAsDraft = () => {
    try {
      localStorage.setItem(POST_CHECKLIST_DRAFT_KEY, JSON.stringify(formData));
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
        <DiamondRimsPostChecklistPDF 
          formData={formData}
          preChecklist={preChecklist}
          opportunity={opportunity}
          vehicle={vehicle}
          workOrder={workOrder}
        />
      ).toBlob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Diamond_Rims_PostChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
        ['DIAMOND RIMZ LTD - POST-SERVICE COMPLETION', '', '', '', ''],
        ['', '', '', '', ''],
        ['SERVICE COMPLETION', '', '', '', ''],
        ['Date:', formData.serviceCompletion.date, 'Completed By:', formData.serviceCompletion.completedBy, 'Time:', formData.serviceCompletion.completionTime],
        ['', '', '', '', ''],
        ['CUSTOMER DETAILS', '', '', '', ''],
        ['Name:', `${formData.customerDetails.firstName} ${formData.customerDetails.lastName}`, 'Mobile:', formData.customerDetails.mobile, ''],
        ['Email:', formData.customerDetails.email, '', '', ''],
        ['', '', '', '', ''],
        ['VEHICLE DETAILS', '', '', '', ''],
        ['Make:', formData.carDetails.carMake, 'Model:', formData.carDetails.carModel, ''],
        ['License Plate:', formData.carDetails.licensePlate, 'Mileage:', formData.carDetails.mileage, ''],
        ['Year:', formData.carDetails.yearOfManufacture, '', '', ''],
        ['', '', '', '', ''],
        ['SERVICES COMPLETED', '', '', '', ''],
        ['Services:', formData.services.actualService.join(', '), '', '', ''],
        ['', '', '', '', ''],
        ['QUALITY CHECKS', '', '', '', ''],
        ['TPMS Sensors:', formData.qualityChecks.tpmsSensorsFitted ? 'Yes' : 'No', 'Lock Nuts:', formData.qualityChecks.lockNutsFitted ? 'Yes' : 'No', ''],
        ['Nozzle Caps:', formData.qualityChecks.nozzleCapsFitted ? 'Yes' : 'No', 'Center Caps:', formData.qualityChecks.centerCapsFitted ? 'Yes' : 'No', ''],
        ['Wheel Balanced:', formData.qualityChecks.wheelBalanced ? 'Yes' : 'No', 'Puncture Check:', formData.qualityChecks.punctureCheck ? 'Yes' : 'No', ''],
        ['', '', '', '', ''],
        ['ADDITIONAL INFORMATION', '', '', '', ''],
        [formData.remarks, '', '', '', ''],
        ['', '', '', '', ''],
        ['SIGNATURES', '', '', '', ''],
        ['Client Signature:', formData.clientSignature ? '✓ Signed' : 'Not Signed', '', '', ''],
        ['', '', '', '', ''],
        // ['Technician Confirmation:', formData.technicianConfirmation ? '✓ Confirmed' : 'Not Confirmed', '', '', ''],
        ['Terms Accepted:', formData.acceptTerms ? '✓ Yes' : 'No', '', '', '']
      ];
      
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(data);
      
      const colWidths = [
        { wch: 25 },
        { wch: 30 },
        { wch: 25 },
        { wch: 30 },
        { wch: 15 }
      ];
      ws['!cols'] = colWidths;
      
      XLSX.utils.book_append_sheet(wb, ws, 'Post-Checklist');
      
      const filename = `Diamond_Rims_PostChecklist_${formData.carDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, filename);
      
      showToast('Excel file downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error generating Excel:', error);
      showToast('Failed to generate Excel file', 'error');
    }
  };

  const getUserDisplayInfo = (user: User) => {
    return {
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      email: user.email || '',
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading post-checklist form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/30">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-6 shadow-lg">
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
                <CircleCheck className="h-6 w-6" />
                Diamond Rims - Service Completion Confirmation
              </h1>
              <p className="text-purple-100">
                {mode === 'edit' 
                  ? `Editing: Post-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Confirm service completion and capture client signature'
                }
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Created Checklist Button */}
            {mode === 'edit' && existingChecklist?._id && (
              <Link
                href={`/post-checklist/${existingChecklist._id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Eye className="h-5 w-5" />
                View Checklist
              </Link>
            )}
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

      {/* Source Information Banner */}
      {(opportunity || preChecklist) && (
        <div className="max-w-7xl mx-auto px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {preChecklist ? (
                <>
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Data populated from Pre-Checklist: <strong>#{preChecklist._id?.slice(-6)}</strong>
                  </span>
                  <Link
                    href={`/pre-checklist/diamond-rims/${preChecklistId}`}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    View Pre-Checklist
                  </Link>
                </>
              ) : opportunity ? (
                <>
                  <UserType className="h-5 w-5 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    Data populated from Opportunity: <strong>{opportunity.subject || opportunity._id?.slice(-6)}</strong>
                  </span>
                  <Link
                    href={`/opportunities/${opportunityId}`}
                    className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors flex items-center gap-1"
                  >
                    <ExternalLinkIcon className="h-3 w-3" />
                    View Opportunity
                  </Link>
                </>
              ) : null}
            </div>
            <button
              type="button"
              onClick={handleRefreshFromSource}
              className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Data
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="bg-white rounded-2xl shadow-xl border p-6 md:p-8 space-y-8">
            
            {/* Service Completion Details */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Service Completion
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.serviceCompletion.date}
                    onChange={(e) => handleNestedInputChange('serviceCompletion', 'date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                
                <div className="relative" ref={technicianDropdownRef}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completed By
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.serviceCompletion.completedBy}
                      onChange={(e) => handleNestedInputChange('serviceCompletion', 'completedBy', e.target.value)}
                      onFocus={() => setShowTechnicianDropdown(true)}
                      placeholder="Select technician"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pl-10 pr-8"
                    />
                    <UserType className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowTechnicianDropdown(!showTechnicianDropdown)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showTechnicianDropdown ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  
                  {showTechnicianDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      <div className="sticky top-0 bg-white p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            value={userSearch}
                            onChange={(e) => setUserSearch(e.target.value)}
                            placeholder="Search technicians..."
                            className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {loadingUsers ? (
                          <div className="p-4 text-center text-gray-500">
                            <div className="flex items-center justify-center gap-2">
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                              Loading...
                            </div>
                          </div>
                        ) : users.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <p className="text-sm">No technicians found</p>
                          </div>
                        ) : (
                          users
                            .filter(user => {
                              const name = user.name?.toLowerCase() || '';
                              const email = user.email?.toLowerCase() || '';
                              const search = userSearch.toLowerCase();
                              return name.includes(search) || email.includes(search);
                            })
                            .map((user) => {
                              const displayInfo = getUserDisplayInfo(user);
                              return (
                                <button
                                  key={user._id || user.id}
                                  type="button"
                                  onClick={() => {
                                    handleNestedInputChange('serviceCompletion', 'completedBy', displayInfo.name);
                                    setShowTechnicianDropdown(false);
                                    setUserSearch('');
                                  }}
                                  className="w-full px-3 py-3 text-left hover:bg-purple-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                >
                                  <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-100 to-indigo-100 flex items-center justify-center">
                                      <span className="text-sm font-medium text-purple-700">
                                        {displayInfo.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900">
                                      {displayInfo.name}
                                    </p>
                                    <p className="text-xs text-gray-500">{displayInfo.email}</p>
                                  </div>
                                </button>
                              );
                            })
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Completion Time
                  </label>
                  <input
                    type="time"
                    value={formData.serviceCompletion.completionTime}
                    onChange={(e) => handleNestedInputChange('serviceCompletion', 'completionTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {mode === 'create' && !workOrderId && (
              <div className="border-b pb-8">
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
                  Choose a client opportunity to auto-fill customer and vehicle information.
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
                      Client Opportunity
                    </label>
                    <select
                      value={selectedClientId}
                      onChange={(e) => handleClientSelection(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      disabled={loadingClientOptions || linkingClient}
                    >
                      <option value="">Select client</option>
                      {clientOptions.map((candidate, index) => {
                        const id = typeof candidate === 'object' ? (candidate._id || candidate.id || '') : '';
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
              </div>
            )}

            {/* Customer Details */}
            <div className="border-b pb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <UserType className="h-5 w-5 text-purple-600" />
                  Customer Information
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {preChecklist ? 'From Pre-Checklist' : 'From Opportunity'}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => toggleEditMode('customerDetails')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {editMode.customerDetails ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Lock Changes
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit Details
                    </>
                  )}
                </button>
              </div>
              
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!editMode.customerDetails ? 'opacity-80' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.customerDetails.firstName}
                    onChange={(e) => handleNestedInputChange('customerDetails', 'firstName', e.target.value)}
                    disabled={!editMode.customerDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.customerDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.customerDetails.lastName}
                    onChange={(e) => handleNestedInputChange('customerDetails', 'lastName', e.target.value)}
                    disabled={!editMode.customerDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.customerDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile
                  </label>
                  <input
                    type="tel"
                    value={formData.customerDetails.mobile}
                    onChange={(e) => handleNestedInputChange('customerDetails', 'mobile', e.target.value)}
                    disabled={!editMode.customerDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.customerDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.customerDetails.email}
                    onChange={(e) => handleNestedInputChange('customerDetails', 'email', e.target.value)}
                    disabled={!editMode.customerDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.customerDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="border-b pb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Car className="h-5 w-5 text-purple-600" />
                  Vehicle Information
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {preChecklist ? 'From Pre-Checklist' : 'From Opportunity'}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => toggleEditMode('carDetails')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {editMode.carDetails ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Lock Changes
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit Details
                    </>
                  )}
                </button>
              </div>
              
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!editMode.carDetails ? 'opacity-80' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Make
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.carMake}
                    onChange={(e) => handleNestedInputChange('carDetails', 'carMake', e.target.value)}
                    disabled={!editMode.carDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.carDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.carModel}
                    onChange={(e) => handleNestedInputChange('carDetails', 'carModel', e.target.value)}
                    disabled={!editMode.carDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.carDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
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
                    disabled={!editMode.carDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.carDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mileage
                  </label>
                  <input
                    type="text"
                    value={formData.carDetails.mileage}
                    onChange={(e) => handleNestedInputChange('carDetails', 'mileage', e.target.value)}
                    disabled={!editMode.carDetails}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.carDetails ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Services */}
            <div className="border-b pb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <WrenchIcon className="h-5 w-5 text-purple-600" />
                  Services Completed
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    {preChecklist ? 'From Pre-Checklist' : 'From Opportunity'}
                  </span>
                </h2>
                <button
                  type="button"
                  onClick={() => toggleEditMode('services')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {editMode.services ? (
                    <>
                      <Lock className="h-4 w-4" />
                      Lock Changes
                    </>
                  ) : (
                    <>
                      <Edit className="h-4 w-4" />
                      Edit Services
                    </>
                  )}
                </button>
              </div>
              
              <div className={`space-y-4 ${!editMode.services ? 'opacity-80' : ''}`}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-600">
                      Select one or more services from the dropdown.
                    </p>
                    <button
                      type="button"
                      onClick={loadAvailableServices}
                      disabled={loadingServices || !editMode.services}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs border border-purple-200 text-purple-700 rounded hover:bg-purple-50 disabled:opacity-60"
                    >
                      <RefreshCw className={`h-3 w-3 ${loadingServices ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                  <div className="relative" ref={serviceDropdownRef}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!editMode.services) return;
                        setShowServicesDropdown((prev) => !prev);
                      }}
                      className={`w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-sm text-gray-700 flex items-center justify-between ${
                        editMode.services ? 'hover:border-purple-400' : 'cursor-not-allowed'
                      }`}
                    >
                      <span>
                        {formData.services.actualService.length > 0
                          ? `${formData.services.actualService.length} service(s) selected`
                          : 'Select services'}
                      </span>
                      {showServicesDropdown ? (
                        <ChevronUp className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      )}
                    </button>

                    {showServicesDropdown && (
                      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                        <div className="p-3 border-b border-gray-100">
                          <div className="relative">
                            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={serviceSearch}
                              onChange={(event) => setServiceSearch(event.target.value)}
                              placeholder="Search services..."
                              className="w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            />
                            {serviceSearch && (
                              <button
                                type="button"
                                onClick={() => setServiceSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="max-h-64 overflow-y-auto">
                          {loadingServices ? (
                            <div className="px-3 py-4 text-sm text-gray-500 flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading services...
                            </div>
                          ) : filteredServiceOptions.length === 0 ? (
                            <p className="px-3 py-4 text-sm text-gray-500">No matching services found</p>
                          ) : (
                            filteredServiceOptions.map((service) => {
                              const isSelected = formData.services.actualService.includes(service.name);
                              return (
                                <label
                                  key={service.id}
                                  className="flex items-start gap-3 px-3 py-2 border-b border-gray-100 last:border-b-0 hover:bg-purple-50 cursor-pointer"
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={() => handleServiceToggle(service.name)}
                                    className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                                  />
                                  <span className="min-w-0">
                                    <span className="block text-sm font-medium text-gray-800 truncate">
                                      {service.name}
                                    </span>
                                    <span className="block text-xs text-gray-500 truncate">
                                      {service.serviceCode} • {service.type}
                                    </span>
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {formData.services.actualService.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.services.actualService.map((service, index) => (
                      <div
                        key={index}
                        className="px-3 py-2 bg-purple-100 text-purple-800 rounded-lg text-sm font-medium flex items-center gap-2"
                      >
                        {service}
                        {editMode.services && (
                          <button
                            type="button"
                            onClick={() => handleServiceToggle(service)}
                            className="text-purple-700 hover:text-purple-900"
                            aria-label={`Remove ${service}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No services selected</p>
                )}
              </div>
            </div>

            {/* Powder Coating Details (if applicable) */}
            {formData.services.actualService.includes('Powder Coating') && (
              <div className="border-b pb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <PaintBucket className="h-5 w-5 text-purple-600" />
                    Powder Coating Details
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {preChecklist ? 'From Pre-Checklist' : 'From Opportunity'}
                    </span>
                  </h2>
                  <button
                    type="button"
                    onClick={() => toggleEditMode('powderCoating')}
                    className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {editMode.powderCoating ? (
                      <>
                        <Lock className="h-4 w-4" />
                        Lock Changes
                      </>
                    ) : (
                      <>
                        <Edit className="h-4 w-4" />
                        Edit Details
                      </>
                    )}
                  </button>
                </div>
                
                <div className={`${!editMode.powderCoating ? 'opacity-80' : ''}`}>
                  <select
                    value={formData.powderCoating.colourRAL}
                    onChange={(e) => handleNestedInputChange('powderCoating', 'colourRAL', e.target.value)}
                    disabled={!editMode.powderCoating}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                      !editMode.powderCoating ? 'bg-gray-100 border-gray-200' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select Powder Coating Color</option>
                    {ralColors.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* QUALITY CHECKS */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-600" />
                Quality Verification
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="tpmsSensors"
                      checked={formData.qualityChecks.tpmsSensorsFitted}
                      onChange={(e) => handleNestedInputChange('qualityChecks', 'tpmsSensorsFitted', e.target.checked)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="tpmsSensors" className="text-sm text-gray-700">
                      TPMS Sensors properly fitted
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="lockNuts"
                      checked={formData.qualityChecks.lockNutsFitted}
                      onChange={(e) => handleNestedInputChange('qualityChecks', 'lockNutsFitted', e.target.checked)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="lockNuts" className="text-sm text-gray-700">
                      Lock nuts properly fitted
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="nozzleCaps"
                      checked={formData.qualityChecks.nozzleCapsFitted}
                      onChange={(e) => handleNestedInputChange('qualityChecks', 'nozzleCapsFitted', e.target.checked)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="nozzleCaps" className="text-sm text-gray-700">
                      Nozzle caps properly fitted
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="centerCaps"
                      checked={formData.qualityChecks.centerCapsFitted}
                      onChange={(e) => handleNestedInputChange('qualityChecks', 'centerCapsFitted', e.target.checked)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="centerCaps" className="text-sm text-gray-700">
                      Center caps properly fitted
                    </label>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="wheelBalanced"
                      checked={formData.qualityChecks.wheelBalanced}
                      onChange={(e) => handleNestedInputChange('qualityChecks', 'wheelBalanced', e.target.checked)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="wheelBalanced" className="text-sm text-gray-700">
                      Wheels properly balanced
                    </label>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="punctureCheck"
                      checked={formData.qualityChecks.punctureCheck}
                      onChange={(e) => handleNestedInputChange('qualityChecks', 'punctureCheck', e.target.checked)}
                      className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <label htmlFor="punctureCheck" className="text-sm text-gray-700">
                      Puncture check completed
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Quality ratings for specific services */}
              {formData.services.actualService.includes('Rim Straightening') && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rim Straightness Quality
                  </label>
                  <select
                    value={formData.qualityChecks.rimStraightness}
                    onChange={(e) => handleNestedInputChange('qualityChecks', 'rimStraightness', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Quality</option>
                    {qualityOptions.map((quality) => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.services.actualService.includes('Powder Coating') && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coating Quality
                  </label>
                  <select
                    value={formData.qualityChecks.coatingQuality}
                    onChange={(e) => handleNestedInputChange('qualityChecks', 'coatingQuality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Quality</option>
                    {qualityOptions.map((quality) => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.services.actualService.includes('Welding') && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Welding Quality
                  </label>
                  <select
                    value={formData.qualityChecks.weldingQuality}
                    onChange={(e) => handleNestedInputChange('qualityChecks', 'weldingQuality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Quality</option>
                    {qualityOptions.map((quality) => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.services.actualService.includes('Diamond Cutting') && (
                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diamond Cutting Quality
                  </label>
                  <select
                    value={formData.qualityChecks.diamondCuttingQuality}
                    onChange={(e) => handleNestedInputChange('qualityChecks', 'diamondCuttingQuality', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value="">Select Quality</option>
                    {qualityOptions.map((quality) => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* TECHNICIAN CONFIRMATION */}
            {/* <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Award className="h-5 w-5 text-purple-600" />
                Technician Confirmation
              </h2>
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <ThumbsUp className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-4">
                      As the lead technician, I confirm that all services have been completed to Diamond Rimz quality standards, all checks have been performed, and the vehicle/rims are ready for customer collection.
                    </p>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="technicianConfirmation"
                        checked={formData.technicianConfirmation}
                        onChange={(e) => handleInputChange('technicianConfirmation', e.target.checked)}
                        className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        required
                      />
                      <label htmlFor="technicianConfirmation" className="text-sm font-medium text-gray-700">
                        I confirm that all work is complete and meets quality standards *
                      </label>
                    </div>
                    {!formData.technicianConfirmation && (
                      <p className="mt-2 text-sm text-red-600">Technician confirmation is required</p>
                    )}
                  </div>
                </div>
              </div>
            </div> */}

            {/* Additional Information */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-600" />
                Additional Information
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks / Notes
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

            {/* CLIENT'S SIGNATURE */}
            <div className="border-b pb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <FileSignature className="h-5 w-5 text-purple-600" />
                Client Signature
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    Client Signature
                  </label>
                  {clientSignature && (
                    <button
                      type="button"
                      onClick={clearSignature}
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
                          width: 600,
                          height: 150,
                          className: 'w-full h-32 border rounded bg-white'
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={saveSignature}
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
                        <p className="text-sm text-gray-600">Click to capture client signature</p>
                        <p className="text-xs text-gray-500">Client signs here to acknowledge completion</p>
                      </div>
                    )}
                  </div>
                )}
                {!formData.clientSignature && (
                  <p className="mt-1 text-sm text-red-600">Client signature is required</p>
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="border-b pb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-purple-600" />
                  Terms and Conditions
                </h2>
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
                {/* Terms Preview */}
                <button
                  type="button"
                  onClick={() => setShowTermsModal(true)}
                  className="w-full p-4 border border-purple-200 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors group mb-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg">
                        <FileText className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">Diamond Rimz Service Completion Agreement</div>
                        <div className="text-sm text-gray-600">Click to view complete terms</div>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-purple-600" />
                  </div>
                </button>
                
                {/* Terms Acceptance */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                    className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    required
                  />
                  <div className="flex-1">
                    <label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
                      I HAVE READ, UNDERSTOOD, AND ACCEPT THE TERMS AND CONDITIONS *
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      By checking this box, you acknowledge that the services have been completed as requested and you accept the terms of service.
                    </p>
                  </div>
                </div>
                {!formData.acceptTerms && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-red-700">
                      <AlertCircle className="h-4 w-4" />
                      <span>You must accept the terms to complete this checklist</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload */}
            <div className="border-b pb-8">
              <FileUploadSection
                checklistId={checklistId}
                checklistType="post"
                files={formData.files || []}
                onFileUpload={async (file) => {
                  if (checklistId) {
                    const response = await postChecklistService.uploadFile(checklistId, file);
                    if (response.success) {
                      const updatedChecklist = await postChecklistService.getPostChecklistById(checklistId);
                      setFormData(prev => ({
                        ...prev,
                        files: updatedChecklist.files || []
                      }));
                    }
                  } else {
                    const mockFile = {
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
                }}
                onFileDelete={async (fileId) => {
                  if (checklistId) {
                    await postChecklistService.deleteFile(fileId);
                    const updatedChecklist = await postChecklistService.getPostChecklistById(checklistId);
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
                }}
                onFileView={(fileId) => {
                  const file = formData.files?.find(f => f._id === fileId);
                  if (file?.path) {
                    window.open(file.path, '_blank');
                  }
                }}
                onFileDownload={(fileId) => {
                  const file = formData.files?.find(f => f._id === fileId);
                  if (file?.path) {
                    const link = document.createElement('a');
                    link.href = file.path;
                    link.download = file.originalName;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                disabled={!checklistId && formData.files && formData.files.length >= 10}
                maxFiles={10}
                maxSizeMB={50}
              />
            </div>

            {/* Form Actions */}
            <div className="pt-6">
              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                  disabled={submitting}
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
                      <span className="text-xs text-green-600">✓ Saved</span>
                    )}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 via-teal-600 to-emerald-700 text-white font-semibold rounded-xl hover:from-green-700 hover:via-teal-700 hover:to-emerald-800 shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Completing...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        Complete & Submit
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
