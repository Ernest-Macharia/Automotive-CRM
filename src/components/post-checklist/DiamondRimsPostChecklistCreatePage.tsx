'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PDFDownloadLink, pdf } from '@react-pdf/renderer';
import SignatureCanvas from 'react-signature-canvas';
import {
  ClipboardCheck,
  ArrowLeft,
  Save,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Car,
  User as UserType,
  Upload,
  Loader2,
  AlertTriangle,
  Info,
  Eye,
  ChevronDown,
  ChevronUp,
  Clock,
  FileSignature,
  Sparkles,
  Car as CarIcon,
  Package,
  CheckSquare,
  AlertOctagon,
  Camera,
  CreditCard,
  Truck,
  Home,
  Mail,
  Phone,
  FileCheck,
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
  ThermometerSnowflake,
  Settings,
  Users,
  Award,
  ShieldCheck,
  Star,
  ThumbsUp,
  Battery,
  Radio,
  Palette,
  Hammer,
  Layers,
  PackageOpen,
  CircleCheck,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { postChecklistService } from '@/services/postChecklistService';
import { workOrderService } from '@/services/workOrderService';
import { opportunityService } from '@/services/opportunityService';
import { vehicleService } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import TermsModal from '@/components/pre-checklist/TermsModal';
import DiamondRimsPostChecklistPDF from './DiamondRimsPostChecklistPDF';
import * as XLSX from 'xlsx';
import { preChecklistService } from '@/services/preChecklistService';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';

interface DiamondRimsPostChecklistCreatePageProps {
  mode?: 'create' | 'edit';
  checklistId?: string;
  preChecklistId?: string;
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [draftSaved, setDraftSaved] = useState(false);

  const [showTermsModal, setShowTermsModal] = useState(false);
  // Step-by-step wizard state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const stepTitles = [
    'Service & Final Checks',
    'Tire & Wheel Details',
    'Quality Assurance',
    'Signatures & Uploads'
  ];
  
  const stepDescriptions = [
    'Verify completed services and perform final inspections',
    'Record tire specifications and wheel conditions',
    'Confirm quality standards and operational checks',
    'Sign off and upload completion documentation'
  ];

  // POST CHECKLIST FORM STATE
  const [formData, setFormData] = useState({
    checklistType: 'diamond_rims_post',
    opportunityId: opportunityId || '',
    workOrderId: workOrderId || '',
    vehicleId: vehicleId || '',
    preChecklistId: preChecklistId || '',
    
    // Basic Information
    date: new Date().toISOString().split('T')[0],
    inspectedBy: sessionStorage.getItem('userId') || '',
    inspectorName: sessionStorage.getItem('userName') || '',
    
    // Contact Information
    contactDetails: {
      mobile: '',
      email: '',
    },
    
    // Vehicle Information
    vehicleDetails: {
      licensePlate: '',
    },
    
    // SERVICES (completed)
    services: {
      actualService: [] as string[],
    },
    
    // FINAL CHECKS
    finalChecks: {
      tpmsSensorsFitted: false,
      lockNuts: false,
      numberOfLockNuts: 0,
      nozzleCaps: false,
      centerCaps: false,
      tires: false,
      tireCondition: '',
      wheelBalanced: false,
      checkedForPuncture: false,
    },
    
    // Tire Specifications
    tireSpecifications: {
      brand: '',
      inflationPSI: '',
      dot: '',
    },
    
    // Additional Information
    additionalInformation: '',
    
    // Quality Assurance
    qualityAssurance: {
      leadTechnicianConfirmation: false,
      operationsCounterCheck: false,
    },
    
    // Terms acceptance
    acceptTerms: false,
    signature: '',
    
    // Uploads
    uploadedImages: [] as string[]
  });

  const [signature, setSignature] = useState(formData.signature);
  const [showSignature, setShowSignature] = useState(false);
  const signatureRef = useRef<SignatureCanvas>(null);

  // Service options for Post Checklist
  const serviceOptions = [
    { id: 'balancing', label: 'Balancing', icon: <Gauge className="h-4 w-4" /> },
    { id: 'diamond_cutting', label: 'Diamond Cutting', icon: <Sparkles className="h-4 w-4" /> },
    { id: 'powder_coating', label: 'Powder Coating', icon: <Palette className="h-4 w-4" /> },
    { id: 'rim_inspection', label: 'Rim Inspection', icon: <Eye className="h-4 w-4" /> },
    { id: 'rim_straightening', label: 'Rim Straightening', icon: <Hammer className="h-4 w-4" /> },
    { id: 'skimming', label: 'Skimming', icon: <RotateCw className="h-4 w-4" /> },
    { id: 'welding', label: 'Welding', icon: <Zap className="h-4 w-4" /> }
  ];

  // Tire Condition options
  const tireConditionOptions = [
    'Excellent',
    'Good',
    'Fair',
    'Poor',
    'Replace Immediately'
  ];

  // PSI options
  const psiOptions = [
    '28-32 PSI',
    '33-36 PSI',
    '37-40 PSI',
    '41-45 PSI',
    'Custom'
  ];

  useEffect(() => {
    loadRelatedData();
  }, [opportunityId, workOrderId, vehicleId, checklistId, mode, preChecklistId]);

  useEffect(() => {
    if ((opportunity || preChecklist) && !autoPopulated) {
      autoPopulateFromPreChecklist();
    }
  }, [opportunity, preChecklist]);

  const loadRelatedData = async () => {
    try {
      setLoading(true);

      // Load existing post checklist if in edit mode
      if (mode === 'edit' && checklistId) {
        const checklist = await postChecklistService.getPostChecklistById(checklistId);
        setExistingChecklist(checklist);
        
        setFormData({
          ...checklist,
          checklistType: 'diamond_rims_post'
        });
        
        if (typeof checklist.opportunityId === 'object') {
          setOpportunity(checklist.opportunityId);
        }
        if (typeof checklist.vehicleId === 'object') {
          setVehicle(checklist.vehicleId);
        }
        if (checklist.preChecklistId) {
          try {
            const preCheck = await preChecklistService.getPreChecklistById(
              typeof checklist.preChecklistId === 'object' 
                ? checklist.preChecklistId._id 
                : checklist.preChecklistId
            );
            setPreChecklist(preCheck);
          } catch (error) {
            console.error('Error loading pre-checklist:', error);
          }
        }
      }

      // Load pre-checklist if provided
      if (preChecklistId) {
        try {
          const preCheck = await preChecklistService.getPreChecklistById(preChecklistId);
          setPreChecklist(preCheck);
          
          if (preCheck.opportunityId) {
            const oppId = typeof preCheck.opportunityId === 'object' ? preCheck.opportunityId._id : preCheck.opportunityId;
            const opp = await opportunityService.getOpportunityById(oppId);
            setOpportunity(opp);
          }
          
          if (preCheck.vehicleId) {
            const vehId = typeof preCheck.vehicleId === 'object' ? preCheck.vehicleId._id : preCheck.vehicleId;
            const veh = await vehicleService.getVehicleById(vehId);
            setVehicle(veh);
          }
          
          setFormData(prev => ({
            ...prev,
            opportunityId: preCheck.opportunityId || prev.opportunityId,
            vehicleId: preCheck.vehicleId || prev.vehicleId,
            preChecklistId
          }));
        } catch (error) {
          console.error('Error loading pre-checklist:', error);
        }
      }

      // Load opportunity if provided
      if (opportunityId && !opportunity) {
        try {
          const opp = await opportunityService.getOpportunityById(opportunityId);
          setOpportunity(opp);
          
          if (opp.vehicles && opp.vehicles.length > 0) {
            const primaryVehicle = opp.vehicles[0];
            setVehicle(primaryVehicle);
          }
        } catch (error) {
          console.error('Error loading opportunity:', error);
        }
      }

      // Load work order if ID provided
      if (workOrderId) {
        try {
          const wo = await workOrderService.getWorkOrderById(workOrderId);
          setWorkOrder(wo);
          
          if (wo.opportunityId && !opportunity) {
            const oppId = typeof wo.opportunityId === 'object' ? wo.opportunityId._id : wo.opportunityId;
            const opp = await opportunityService.getOpportunityById(oppId);
            setOpportunity(opp);
          }
        } catch (error) {
          console.error('Error loading work order:', error);
        }
      }

    } catch (error) {
      console.error('Error loading related data:', error);
      showToast('Failed to load related information', 'error');
    } finally {
      setLoading(false);
    }
  };

  const autoPopulateFromPreChecklist = () => {
    if (!preChecklist && !opportunity) return;
    
    try {
      console.log('Auto-populating from pre-checklist:', preChecklist);
      
      // Use pre-checklist data first, fall back to opportunity
      const sourceData = preChecklist || opportunity;
      
      // Extract contact details from pre-checklist
      const contactDetails = preChecklist?.customerDetails || opportunity?.customer || {};
      
      // Extract vehicle details
      const vehicleDetails = preChecklist?.carDetails || vehicle || {};
      
      // Extract services from pre-checklist
      const services = preChecklist?.services || { actualService: [] };
      
      setFormData(prev => ({
        ...prev,
        contactDetails: {
          mobile: contactDetails.mobile || contactDetails.phone || '',
          email: contactDetails.email || '',
        },
        vehicleDetails: {
          licensePlate: vehicleDetails.licensePlate || vehicleDetails.regNo || '',
        },
        services: {
          actualService: services.actualService || [],
        }
      }));
      
      setAutoPopulated(true);
      
    } catch (error) {
      console.error('Error auto-populating from pre-checklist:', error);
      showToast('Error loading data from pre-checklist', 'warning');
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
    const serviceLabel = serviceOptions.find(s => s.id === serviceId)?.label || serviceId;
    handleMultiSelectChange('services', 'actualService', serviceLabel, checked);
  };

  const clearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setSignature('');
      handleInputChange('signature', '');
    }
  };

  const saveSignature = () => {
    if (signatureRef.current) {
      const dataUrl = signatureRef.current.getTrimmedCanvas().toDataURL('image/png');
      setSignature(dataUrl);
      handleInputChange('signature', dataUrl);
      setShowSignature(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);

      // Validate required fields
      if (!formData.contactDetails.mobile) {
        showToast('Mobile number is required', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }
      
      if (!formData.contactDetails.email) {
        showToast('Email is required', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }
      
      if (!formData.vehicleDetails.licensePlate) {
        showToast('License plate is required', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }
      
      if (formData.services.actualService.length === 0) {
        showToast('Please select at least one service', 'error');
        setCurrentStep(1);
        setSubmitting(false);
        return;
      }
      
      if (!formData.finalChecks.tireCondition) {
        showToast('Tire condition is required', 'error');
        setCurrentStep(2);
        setSubmitting(false);
        return;
      }
      
      if (!formData.qualityAssurance.leadTechnicianConfirmation) {
        showToast('Lead technician confirmation is required', 'error');
        setCurrentStep(3);
        setSubmitting(false);
        return;
      }
      
      if (!formData.qualityAssurance.operationsCounterCheck) {
        showToast('Operations counter check is required', 'error');
        setCurrentStep(3);
        setSubmitting(false);
        return;
      }
      
      if (!formData.acceptTerms) {
        showToast('Please accept the terms and conditions', 'error');
        setCurrentStep(4);
        setSubmitting(false);
        return;
      }
      
      if (!formData.signature) {
        showToast('Signature is required', 'error');
        setCurrentStep(4);
        setSubmitting(false);
        return;
      }

      // Prepare submission data
      const submissionData = {
        ...formData,
        completed: true,
        completionDate: new Date().toISOString()
      };

      console.log('Submitting diamond rims post-checklist:', submissionData);

      let result;
      
      if (mode === 'edit' && checklistId) {
        result = await postChecklistService.updatePostChecklist(checklistId, submissionData);
        showToast('Diamond Rims post-checklist updated successfully', 'success');
      } else {
        const userId = sessionStorage.getItem('userId') || undefined;
        result = await postChecklistService.createPostChecklist(submissionData, userId);

        // Client signs on the form, so we auto-approve immediately (no manual approval step)
        try {
          await postChecklistService.updatePostChecklist(result._id, {
            status: 'approved',
            approvedBy: userId,
            approvedAt: new Date().toISOString(),
            autoApproved: true
          });
        } catch (autoApproveErr) {
          console.warn('Post-checklist auto-approval failed:', autoApproveErr);
        }

        // Mark stage completed and transition (invoice should be auto-generated after post-checklist approval)
        if (opportunityId) {
          try {
            await lifecycleIntegrationService.markStageAsCompleted(opportunityId, 'postchecklist', {
              documentId: result._id,
              completedBy: userId,
              notes: 'Auto-approved (client signed on form)'
            });
            await lifecycleIntegrationService.transitionToNextStage(opportunityId);
          } catch (workflowErr) {
            console.warn('Workflow transition after post-checklist failed:', workflowErr);
          }
        }
        showToast('Diamond Rims post-checklist created successfully', 'success');
        
        // Update work order with post-checklist ID if needed
        if (workOrderId && result._id) {
          try {
            await workOrderService.updateWorkOrder(workOrderId, {
              postChecklistId: result._id,
              postChecklistStatus: 'completed',
              updatedAt: new Date().toISOString()
            });
          } catch (updateError) {
            console.error('Error updating work order:', updateError);
          }
        }
        
        // Update pre-checklist status
        if (preChecklistId && result._id) {
          try {
            await preChecklistService.updatePreChecklist(preChecklistId, {
              postChecklistId: result._id,
              postChecklistCompleted: true
            });
          } catch (preUpdateError) {
            console.error('Error updating pre-checklist:', preUpdateError);
          }
        }
      }

      // Navigate based on source
      if (source === 'workflow' && workOrderId) {
        router.push(`/orders/work-orders/${workOrderId}`);
      } else if (source === 'prechecklist' && preChecklistId) {
        router.push(`/pre-checklist/diamond-rims/${preChecklistId}`);
      } else if (result._id) {
        router.push(`/post-checklist/diamond-rims/${result._id}`);
      } else {
        router.push('/postchecklists/diamond-rims');
      }

    } catch (error: any) {
      console.error('Error submitting post-checklist:', error);
      showToast(error.message || 'Failed to save post-checklist', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (source === 'workflow' && workOrderId) {
      router.push(`/orders/work-orders/${workOrderId}`);
    } else if (source === 'prechecklist' && preChecklistId) {
      router.push(`/pre-checklist/diamond-rims/${preChecklistId}`);
    } else {
      router.push('/postchecklists');
    }
  };

  const handleRefreshFromPreChecklist = () => {
    if (preChecklist) {
      autoPopulateFromPreChecklist();
      showToast('Refreshed data from pre-checklist', 'info');
    }
  };

  const handleSaveAsDraft = () => {
    try {
      localStorage.setItem('diamondRimsPostChecklistDraft', JSON.stringify(formData));
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
      link.download = `Diamond_Rims_PostChecklist_${formData.vehicleDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.pdf`;
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
        ['POST-SERVICE CHECKLIST', '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['BASIC INFORMATION', '', '', '', '', '', ''],
        ['Date:', formData.date, '', 'Inspector:', formData.inspectorName, '', ''],
        ['', '', '', '', '', '', ''],
        ['CONTACT INFORMATION', '', '', '', '', '', ''],
        ['Mobile:', formData.contactDetails.mobile, '', 'Email:', formData.contactDetails.email, '', ''],
        ['', '', '', '', '', '', ''],
        ['VEHICLE INFORMATION', '', '', '', '', '', ''],
        ['License Plate:', formData.vehicleDetails.licensePlate, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['SERVICES COMPLETED', '', '', '', '', '', ''],
        ['Actual Service:', formData.services.actualService.join(', '), '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['FINAL CHECKS', '', '', '', '', '', ''],
        ['TPMS Sensors Fitted:', formData.finalChecks.tpmsSensorsFitted ? 'Yes' : 'No', '', '', '', '', ''],
        ['Lock Nuts:', formData.finalChecks.lockNuts ? 'Yes' : 'No', '', 'Number of Lock Nuts:', formData.finalChecks.numberOfLockNuts, '', ''],
        ['Nozzle Caps:', formData.finalChecks.nozzleCaps ? 'Yes' : 'No', '', 'Center Caps:', formData.finalChecks.centerCaps ? 'Yes' : 'No', '', ''],
        ['Tires:', formData.finalChecks.tires ? 'Yes' : 'No', '', 'Tire Condition:', formData.finalChecks.tireCondition, '', ''],
        ['Wheel Balanced:', formData.finalChecks.wheelBalanced ? 'Yes' : 'No', '', 'Checked For Puncture:', formData.finalChecks.checkedForPuncture ? 'Yes' : 'No', '', ''],
        ['', '', '', '', '', '', ''],
        ['TIRE SPECIFICATIONS', '', '', '', '', '', ''],
        ['Tire Brand:', formData.tireSpecifications.brand, '', 'Inflation PSI:', formData.tireSpecifications.inflationPSI, '', ''],
        ['Tire DOT:', formData.tireSpecifications.dot, '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['QUALITY ASSURANCE', '', '', '', '', '', ''],
        ['Lead Technician Confirmation:', formData.qualityAssurance.leadTechnicianConfirmation ? 'Yes' : 'No', '', 'Operations Counter Check:', formData.qualityAssurance.operationsCounterCheck ? 'Yes' : 'No', '', ''],
        ['', '', '', '', '', '', ''],
        ['ADDITIONAL INFORMATION', '', '', '', '', '', ''],
        [formData.additionalInformation, '', '', '', '', '', ''],
        ['', '', '', '', '', '', ''],
        ['TERMS ACCEPTANCE', '', '', '', '', '', ''],
        ['Terms Accepted:', formData.acceptTerms ? 'YES' : 'NO', '', 'Signature:', formData.signature ? 'SIGNED' : 'NOT SIGNED', '', ''],
        ['Uploaded Images:', formData.uploadedImages?.length || 0, 'image(s)', '', '', '', '']
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
      
      XLSX.utils.book_append_sheet(wb, ws, 'Diamond Rimz Post-Checklist');
      
      const filename = `Diamond_Rimz_PostChecklist_${formData.vehicleDetails.licensePlate || 'NEW'}_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        {[1, 2, 3, 4].map((stepNumber) => (
          <div key={stepNumber} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
              currentStep === stepNumber 
                ? 'bg-purple-600 border-purple-600 text-white scale-110 shadow-lg' 
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
            {stepNumber < 4 && (
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50/30 via-white to-indigo-50/30 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Diamond Rims post-checklist form...</p>
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
                {mode === 'edit' ? 'Edit Diamond Rims Post-Checklist' : 'Diamond Rims Post-Service Checklist'}
              </h1>
              <p className="text-purple-100">
                {mode === 'edit' 
                  ? `Editing: Post-Checklist #${existingChecklist?._id?.slice(-6) || ''}`
                  : 'Quality Assurance & Completion Verification'
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
                {/* Basic Information */}
                <div className="mb-8">
                  <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5 text-purple-600" />
                    Basic Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        DATE
                      </label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        INSPECTOR NAME
                      </label>
                      <input
                        type="text"
                        value={formData.inspectorName}
                        onChange={(e) => handleInputChange('inspectorName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">CONTACT INFORMATION</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mobile *Required
                      </label>
                      <input
                        type="tel"
                        value={formData.contactDetails.mobile}
                        onChange={(e) => handleNestedInputChange('contactDetails', 'mobile', e.target.value)}
                        placeholder="+254 712 345 678"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                      {!formData.contactDetails.mobile && (
                        <p className="mt-1 text-sm text-red-600">Mobile number is required</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email *Required
                      </label>
                      <input
                        type="email"
                        value={formData.contactDetails.email}
                        onChange={(e) => handleNestedInputChange('contactDetails', 'email', e.target.value)}
                        placeholder="customer@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      />
                      {!formData.contactDetails.email && (
                        <p className="mt-1 text-sm text-red-600">Email is required</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Vehicle Information */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">VEHICLE INFORMATION</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      License Plate *Required
                    </label>
                    <input
                      type="text"
                      value={formData.vehicleDetails.licensePlate}
                      onChange={(e) => handleNestedInputChange('vehicleDetails', 'licensePlate', e.target.value)}
                      placeholder="KAA 123A"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      required
                    />
                    {!formData.vehicleDetails.licensePlate && (
                      <p className="mt-1 text-sm text-red-600">License plate is required</p>
                    )}
                  </div>
                </div>

                {/* Services Completed */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">SERVICES COMPLETED</h3>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Service *Required
                  </label>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {serviceOptions.map((service) => (
                      <div key={service.id} className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors">
                        <input
                          type="checkbox"
                          id={`post-service-${service.id}`}
                          checked={formData.services.actualService.includes(service.label)}
                          onChange={(e) => handleServiceSelect(service.id, e.target.checked)}
                          className="h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label
                          htmlFor={`post-service-${service.id}`}
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
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{stepTitles[1]}</h2>
              <p className="text-gray-600 mb-6">{stepDescriptions[1]}</p>
              
              <div className="bg-white rounded-2xl shadow-xl border p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <CarIcon className="h-5 w-5 text-purple-600" />
                  Final Checks & Tire Details
                </h2>
                
                {/* FINAL CHECKS */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">FINAL CHECKS</h3>
                  
                  <div className="space-y-6">
                    {/* TPMS Sensors */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        TPMS Sensors Fitted *Required
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="tpmsSensors"
                            checked={formData.finalChecks.tpmsSensorsFitted === true}
                            onChange={() => handleNestedInputChange('finalChecks', 'tpmsSensorsFitted', true)}
                            className="text-purple-600"
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="tpmsSensors"
                            checked={formData.finalChecks.tpmsSensorsFitted === false}
                            onChange={() => handleNestedInputChange('finalChecks', 'tpmsSensorsFitted', false)}
                            className="text-purple-600"
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Lock Nuts */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lock Nuts *Required
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="lockNuts"
                            checked={formData.finalChecks.lockNuts === true}
                            onChange={() => handleNestedInputChange('finalChecks', 'lockNuts', true)}
                            className="text-purple-600"
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="lockNuts"
                            checked={formData.finalChecks.lockNuts === false}
                            onChange={() => handleNestedInputChange('finalChecks', 'lockNuts', false)}
                            className="text-purple-600"
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                      
                      {formData.finalChecks.lockNuts && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Number of Lock Nuts
                          </label>
                          <input
                            type="number"
                            value={formData.finalChecks.numberOfLockNuts}
                            onChange={(e) => handleNestedInputChange('finalChecks', 'numberOfLockNuts', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            min="0"
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Nozzle Caps */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nozzle Caps *Required
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="nozzleCaps"
                            checked={formData.finalChecks.nozzleCaps === true}
                            onChange={() => handleNestedInputChange('finalChecks', 'nozzleCaps', true)}
                            className="text-purple-600"
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="nozzleCaps"
                            checked={formData.finalChecks.nozzleCaps === false}
                            onChange={() => handleNestedInputChange('finalChecks', 'nozzleCaps', false)}
                            className="text-purple-600"
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Center Caps */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Center Caps *Required
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="centerCaps"
                            checked={formData.finalChecks.centerCaps === true}
                            onChange={() => handleNestedInputChange('finalChecks', 'centerCaps', true)}
                            className="text-purple-600"
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="centerCaps"
                            checked={formData.finalChecks.centerCaps === false}
                            onChange={() => handleNestedInputChange('finalChecks', 'centerCaps', false)}
                            className="text-purple-600"
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Tires */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tires *Required
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="tires"
                            checked={formData.finalChecks.tires === true}
                            onChange={() => handleNestedInputChange('finalChecks', 'tires', true)}
                            className="text-purple-600"
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="tires"
                            checked={formData.finalChecks.tires === false}
                            onChange={() => handleNestedInputChange('finalChecks', 'tires', false)}
                            className="text-purple-600"
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Tire Condition */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tire Condition *Required
                      </label>
                      <select
                        value={formData.finalChecks.tireCondition}
                        onChange={(e) => handleNestedInputChange('finalChecks', 'tireCondition', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                        required
                      >
                        <option value="">Select Condition</option>
                        {tireConditionOptions.map((condition) => (
                          <option key={condition} value={condition}>{condition}</option>
                        ))}
                      </select>
                      {!formData.finalChecks.tireCondition && (
                        <p className="mt-1 text-sm text-red-600">Tire condition is required</p>
                      )}
                    </div>
                    
                    {/* Wheel Balanced */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Wheel Balanced *Required
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="wheelBalanced"
                            value="yes"
                            checked={formData.finalChecks.wheelBalanced === true}
                            onChange={() => handleNestedInputChange('finalChecks', 'wheelBalanced', true)}
                            className="text-purple-600"
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="wheelBalanced"
                            value="no"
                            checked={formData.finalChecks.wheelBalanced === false}
                            onChange={() => handleNestedInputChange('finalChecks', 'wheelBalanced', false)}
                            className="text-purple-600"
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                    
                    {/* Checked For Puncture */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Checked For Puncture *Required
                      </label>
                      <div className="flex gap-6">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="checkedForPuncture"
                            value="yes"
                            checked={formData.finalChecks.checkedForPuncture === true}
                            onChange={() => handleNestedInputChange('finalChecks', 'checkedForPuncture', true)}
                            className="text-purple-600"
                            required
                          />
                          <span>Yes</span>
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="checkedForPuncture"
                            value="no"
                            checked={formData.finalChecks.checkedForPuncture === false}
                            onChange={() => handleNestedInputChange('finalChecks', 'checkedForPuncture', false)}
                            className="text-purple-600"
                            required
                          />
                          <span>No</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* TIRE SPECIFICATIONS */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">TIRE SPECIFICATIONS</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tire Brand
                      </label>
                      <input
                        type="text"
                        value={formData.tireSpecifications.brand}
                        onChange={(e) => handleNestedInputChange('tireSpecifications', 'brand', e.target.value)}
                        placeholder="e.g., Michelin, Bridgestone"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Inflation PSI
                      </label>
                      <select
                        value={formData.tireSpecifications.inflationPSI}
                        onChange={(e) => handleNestedInputChange('tireSpecifications', 'inflationPSI', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                      >
                        <option value="">Select PSI Range</option>
                        {psiOptions.map((psi) => (
                          <option key={psi} value={psi}>{psi}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tire DOT
                    </label>
                    <input
                      type="text"
                      value={formData.tireSpecifications.dot}
                      onChange={(e) => handleNestedInputChange('tireSpecifications', 'dot', e.target.value)}
                      placeholder="e.g., DOT XXXX"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Information
                  </label>
                  <textarea
                    value={formData.additionalInformation}
                    onChange={(e) => handleInputChange('additionalInformation', e.target.value)}
                    placeholder="Any additional notes or observations..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    rows={3}
                  />
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
                  <ShieldCheck className="h-5 w-5 text-purple-600" />
                  Quality Assurance
                </h2>
                
                <div className="space-y-8">
                  {/* Lead Technician Confirmation */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <Award className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Lead Technician Confirmation</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Confirm that all services have been completed to Diamond Rimz quality standards
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="leadTechnicianConfirmation"
                        checked={formData.qualityAssurance.leadTechnicianConfirmation}
                        onChange={(e) => handleNestedInputChange('qualityAssurance', 'leadTechnicianConfirmation', e.target.checked)}
                        className="h-5 w-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        required
                      />
                      <label htmlFor="leadTechnicianConfirmation" className="text-sm text-gray-700">
                        I confirm that all services have been completed as per Diamond Rimz quality standards and specifications *
                      </label>
                    </div>
                    {!formData.qualityAssurance.leadTechnicianConfirmation && (
                      <p className="mt-2 text-sm text-red-600">Lead technician confirmation is required</p>
                    )}
                  </div>
                  
                  {/* Operations Counter Check */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Operations Counter Check</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Final verification by operations team before customer handover
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="operationsCounterCheck"
                        checked={formData.qualityAssurance.operationsCounterCheck}
                        onChange={(e) => handleNestedInputChange('qualityAssurance', 'operationsCounterCheck', e.target.checked)}
                        className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        required
                      />
                      <label htmlFor="operationsCounterCheck" className="text-sm text-gray-700">
                        I confirm that all operations checks have been completed and the vehicle is ready for customer collection *
                      </label>
                    </div>
                    {!formData.qualityAssurance.operationsCounterCheck && (
                      <p className="mt-2 text-sm text-red-600">Operations counter check is required</p>
                    )}
                  </div>
                  
                  {/* Summary Section */}
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Quality Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Services Completed</h4>
                        <div className="space-y-1">
                          {formData.services.actualService.length > 0 ? (
                            formData.services.actualService.map((service, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <Check className="h-4 w-4 text-green-500" />
                                <span className="text-sm text-gray-600">{service}</span>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">No services selected</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Critical Checks</h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Wheel Balanced</span>
                            <span className={`text-sm font-medium ${formData.finalChecks.wheelBalanced ? 'text-green-600' : 'text-red-600'}`}>
                              {formData.finalChecks.wheelBalanced ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Puncture Check</span>
                            <span className={`text-sm font-medium ${formData.finalChecks.checkedForPuncture ? 'text-green-600' : 'text-red-600'}`}>
                              {formData.finalChecks.checkedForPuncture ? '✓ Yes' : '✗ No'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Tire Condition</span>
                            <span className={`text-sm font-medium ${
                              ['Excellent', 'Good'].includes(formData.finalChecks.tireCondition) ? 'text-green-600' : 
                              formData.finalChecks.tireCondition === 'Fair' ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {formData.finalChecks.tireCondition || 'Not set'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
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
                  <FileSignature className="h-5 w-5 text-purple-600" />
                  Signatures & Documentation
                </h2>
                
                {/* Terms and Conditions */}
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
                            id="acceptTerms"
                            checked={formData.acceptTerms}
                            onChange={(e) => handleInputChange('acceptTerms', e.target.checked)}
                            className="mt-1 h-5 w-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            required
                        />
                        <div className="flex-1">
                            <label htmlFor="acceptTerms" className="text-sm font-medium text-gray-700">
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
                
                {/* Signature */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      SIGNATURE (FOR AND ON BEHALF OF DIAMOND RIMZ) *Required
                    </label>
                    {signature && (
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {showSignature ? (
                    <div className="space-y-3">
                      <div className="border border-gray-300 rounded-lg bg-white p-2">
                        <SignatureCanvas
                          ref={signatureRef}
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
                          onClick={saveSignature}
                          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                        >
                          Save Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowSignature(false)}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowSignature(true)}
                      className="h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    >
                      {signature ? (
                        <div className="text-center p-2">
                          <img 
                            src={signature} 
                            alt="Signature" 
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
                  {!formData.signature && (
                    <p className="mt-2 text-sm text-red-600">Signature is required</p>
                  )}
                </div>
                
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    IMAGE UPLOAD (Optional)
                  </label>
                  
                  <div 
                    className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-colors"
                    onClick={() => document.getElementById('post-checklist-file-input')?.click()}
                  >
                    <input
                      id="post-checklist-file-input"
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
                    <p className="text-sm text-gray-600 mb-1">Click to upload completion photos</p>
                    <p className="text-xs text-gray-500">Upload final images of completed work</p>
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
                                alt={`Completion Image ${index + 1}`}
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
                      <CircleCheck className="h-5 w-5" />
                      {mode === 'edit' ? 'Update Post-Checklist' : 'Complete & Submit'}
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