'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Wrench, ArrowLeft, Calendar, User as UserType, Car, Clock,
  Edit, Printer, Download, CheckCircle, XCircle,
  Play, Pause, AlertTriangle, DollarSign, Package,
  FileText, RefreshCw, MapPin, Phone, Mail,
  PlusCircle, UserPlus, Clock4, CreditCard, Settings,
  CheckSquare, Save, Loader2, ChevronRight, ArrowRight,
  Briefcase, Zap, Target, Rocket, Shield, ChevronDown,
  Eye, EyeOff, Lock, Unlock, Bell, Star,
  Upload, Trash2, Copy, Share2, MoreVertical, Plus,
  X, FilePlus, FileCheck, FileX, Search
} from 'lucide-react';
import { jobCardService, JobCard } from '@/services/jobCardService';
import { opportunityService, Opportunity } from '@/services/opportunityService';
import { userService, User } from '@/services/settings/userService';
import { vehicleService, Vehicle } from '@/services/vehicleService';
import { useToast } from '@/contexts/ToastContext';
import { format } from 'date-fns';
import { lifecycleIntegrationService } from '@/services/lifecycleIntegrationService';

interface JobCardDetailProps {
  jobCardId: string;
}

interface Part {
  partId: string;
  partNumber: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalCost: number;
  description?: string;
}

export default function JobCardDetail({ jobCardId }: JobCardDetailProps) {
  const router = useRouter();
  const { showToast } = useToast();
  
  const [jobCard, setJobCard] = useState<JobCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [showCompleteDetails, setShowCompleteDetails] = useState(false);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [parts, setParts] = useState<any[]>([]);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [vehicleDetails, setVehicleDetails] = useState<Vehicle | null>(null);
  
  // Complete Details Form State
  const [completeForm, setCompleteForm] = useState({
    assignedTo: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: '',
    completedDate: '',
    estimatedHours: 2,
    actualHours: 0,
    laborCost: 0,
    partsCost: 0,
    totalCost: 0,
    status: 'pending' as 'pending' | 'in_progress' | 'completed' | 'cancelled',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: [] as string[],
    newNote: '',
    partsUsed: [] as Part[]
  });

  useEffect(() => {
    fetchJobCard();
    fetchDropdownData();
  }, [jobCardId]);

  const fetchJobCard = async () => {
    try {
      setLoading(true);
      const data = await jobCardService.getJobCardById(jobCardId);
      setJobCard(data);
      
      // Initialize complete form with existing data
      if (data) {
        setCompleteForm(prev => ({
          ...prev,
          assignedTo: typeof data.assignedTo === 'object' ? data.assignedTo._id || data.assignedTo.id || '' : data.assignedTo || '',
          startDate: data.startDate ? format(new Date(data.startDate), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          endDate: data.endDate ? format(new Date(data.endDate), 'yyyy-MM-dd') : '',
          completedDate: data.completedDate ? format(new Date(data.completedDate), 'yyyy-MM-dd') : '',
          estimatedHours: data.estimatedHours || 2,
          actualHours: data.actualHours || 0,
          laborCost: data.laborCost || 0,
          partsCost: data.partsCost || 0,
          totalCost: data.totalCost || 0,
          status: data.status || 'pending',
          priority: data.priority || 'medium',
          notes: data.notes || [],
          partsUsed: data.partsUsed || []
        }));
        
        // Fetch opportunity and vehicle details
        if (data.opportunityId) {
          const oppId = typeof data.opportunityId === 'object' 
            ? data.opportunityId._id 
            : data.opportunityId;
          
          if (oppId) {
            try {
              const opp = await opportunityService.getOpportunityById(oppId);
              setSelectedOpportunity(opp);
              
              // Fetch vehicle details
              if (opp.vehicles?.[0]?._id) {
                const vehicle = await vehicleService.getVehicleById(opp.vehicles[0]._id);
                setVehicleDetails(vehicle);
              }
            } catch (error) {
              console.error('Error fetching opportunity details:', error);
            }
          }
        }
        
        // Auto-show complete details if job card is missing essential info
        const isMissingEssentialInfo = !data.assignedTo || !data.startDate || data.status === 'pending';
        if (isMissingEssentialInfo && data.status !== 'completed' && data.status !== 'cancelled') {
          setShowCompleteDetails(true);
        }
      }
    } catch (error) {
      console.error('Error fetching job card:', error);
      showToast('Failed to load job card details', 'error');
      router.push('/job-cards');
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      // Fetch technicians
      const users = await userService.getAllUsers();
      const technicianUsers = users.filter(user => 
        userService.getUserRoleName(user) === 'technician' && user.active
      );
      setTechnicians(technicianUsers);
      
      // Fetch parts (mock data - replace with actual API)
      setParts([
        { _id: '1', partNumber: 'BRK-001', name: 'Brake Pads', description: 'Premium Ceramic Brake Pads', unitPrice: 45.99, category: 'Brakes', stock: 42 },
        { _id: '2', partNumber: 'OIL-002', name: 'Engine Oil 5W-30', description: 'Full Synthetic Motor Oil', unitPrice: 32.50, category: 'Fluids', stock: 150 },
        { _id: '3', partNumber: 'FIL-003', name: 'Oil Filter', description: 'Premium Oil Filter', unitPrice: 12.75, category: 'Filters', stock: 89 },
        { _id: '4', partNumber: 'SPK-004', name: 'Spark Plugs', description: 'Iridium Spark Plugs (Set of 4)', unitPrice: 8.99, category: 'Ignition', stock: 56 },
        { _id: '5', partNumber: 'BAT-005', name: 'Car Battery', description: '12V 60Ah Maintenance-Free', unitPrice: 120.00, category: 'Electrical', stock: 24 },
      ]);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      showToast('Failed to load dropdown data', 'error');
    }
  };

  const handleStatusUpdate = async (status: string) => {
    const validStatuses = ['pending', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      showToast('Invalid status', 'error');
      return;
    }
    
    try {
      setUpdating(true);
      await jobCardService.updateJobCard(jobCardId, { 
        status: status as any,
        // If marking as completed, set completed date
        ...(status === 'completed' && { 
          completedDate: new Date().toISOString(),
          actualHours: completeForm.actualHours || jobCard?.estimatedHours || 2
        })
      });
      showToast(`Job card marked as ${status.replace('_', ' ')}`, 'success');
      fetchJobCard();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCompleteDetails = async () => {
    try {
      setUpdating(true);
      
      // Calculate totals
      const partsCost = completeForm.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0);
      const totalCost = partsCost + (completeForm.laborCost || 0);

      const updateData = {
        assignedTo: completeForm.assignedTo,
        startDate: completeForm.startDate ? new Date(completeForm.startDate).toISOString() : undefined,
        endDate: completeForm.endDate ? new Date(completeForm.endDate).toISOString() : undefined,
        completedDate: completeForm.completedDate ? new Date(completeForm.completedDate).toISOString() : undefined,
        estimatedHours: completeForm.estimatedHours,
        actualHours: completeForm.actualHours,
        laborCost: completeForm.laborCost,
        partsCost: partsCost,
        totalCost: totalCost,
        status: completeForm.status,
        priority: completeForm.priority,
        notes: completeForm.notes,
        partsUsed: completeForm.partsUsed,
        // Add vehicleId if needed by backend
        vehicleId: jobCard?.vehicleId || (typeof jobCard?.vehicleId === 'string' ? jobCard.vehicleId : undefined)
      };
      
      console.log('📤 Sending update data:', updateData); // Debug log
      
      // Update the job card
      await jobCardService.updateJobCard(jobCardId, updateData);
      
      // Show success toast
      showToast('Job card completed successfully! ✅', 'success');
      
      // If this job card is linked to a work order/opportunity, update lifecycle
      if (jobCard?.opportunityId) {
        // Get the opportunity ID
        const opportunityId = typeof jobCard.opportunityId === 'object' 
          ? jobCard.opportunityId._id || jobCard.opportunityId.id 
          : jobCard.opportunityId;
        
        if (opportunityId) {
          try {
            // Mark the jobcard stage as completed in the lifecycle
            await lifecycleIntegrationService.markStageAsCompleted(opportunityId, 'jobcard', {
              documentId: jobCardId,
              notes: 'Job card completed via details form'
            });
            
            // Show additional success message
            showToast('Workflow stage updated successfully!', 'success');
            
            // Give a small delay for the toast to be visible
            setTimeout(() => {
              // Redirect back to work order details page
              // You might need to adjust this URL based on your routing structure
              router.push(`/orders/work-orders?opportunity=${opportunityId}`);
              // OR if you have a specific work order ID:
              // router.push(`/orders/work-orders/${workOrderId}`);
            }, 1500);
            
          } catch (lifecycleError) {
            console.error('⚠️ Error updating lifecycle stage:', lifecycleError);
            // Don't fail the whole operation if lifecycle update fails
            showToast('Job card saved but workflow update may need attention', 'warning');
            
            // Still redirect after a delay
            setTimeout(() => {
              router.push(`/orders/work-orders?opportunity=${opportunityId}`);
            }, 1500);
          }
        } else {
          // If no opportunity ID, just close the modal
          setShowCompleteDetails(false);
          fetchJobCard();
        }
      } else {
        // If not linked to work order, just close the modal and refresh
        setShowCompleteDetails(false);
        fetchJobCard();
      }
      
    } catch (error: any) {
      console.error('Error updating job card details:', error);
      showToast(error.message || 'Failed to update job card', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleAddNote = () => {
    if (completeForm.newNote.trim()) {
      setCompleteForm(prev => ({
        ...prev,
        notes: [...prev.notes, `${format(new Date(), 'HH:mm')}: ${prev.newNote.trim()}`],
        newNote: ''
      }));
    }
  };

  const handleRemoveNote = (index: number) => {
    setCompleteForm(prev => ({
      ...prev,
      notes: prev.notes.filter((_, i) => i !== index)
    }));
  };

  const handleAddPart = () => {
    setCompleteForm(prev => ({
      ...prev,
      partsUsed: [
        ...prev.partsUsed,
        {
          partId: '',
          partNumber: '',
          name: '',
          quantity: 1,
          unitPrice: 0,
          totalCost: 0
        }
      ]
    }));
  };

  const handleRemovePart = (index: number) => {
    setCompleteForm(prev => ({
      ...prev,
      partsUsed: prev.partsUsed.filter((_, i) => i !== index)
    }));
  };

  const handlePartChange = (index: number, field: string, value: string | number) => {
    setCompleteForm(prev => {
      const partsUsed = [...prev.partsUsed];
      
      if (partsUsed[index]) {
        const updatedPart = {
          ...partsUsed[index],
          [field]: typeof value === 'string' && !['name', 'partNumber', 'description', 'partId'].includes(field)
            ? parseFloat(value) || 0
            : value
        };
        
        // Recalculate line total
        if (field === 'quantity' || field === 'unitPrice') {
          updatedPart.totalCost = updatedPart.quantity * updatedPart.unitPrice;
        }
        
        partsUsed[index] = updatedPart;
      }
      
      return {
        ...prev,
        partsUsed
      };
    });
  };

  const handleSelectPart = (index: number, partId: string) => {
    const selectedPart = parts.find(p => p._id === partId);
    if (selectedPart) {
      handlePartChange(index, 'partId', selectedPart._id);
      handlePartChange(index, 'partNumber', selectedPart.partNumber);
      handlePartChange(index, 'name', selectedPart.name);
      handlePartChange(index, 'description', selectedPart.description || '');
      handlePartChange(index, 'unitPrice', selectedPart.unitPrice);
    }
  };

  const handleCompleteFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let newValue: any = value;
    
    if (type === 'number') {
      newValue = value ? parseFloat(value) : 0;
    }
    
    setCompleteForm(prev => ({ ...prev, [name]: newValue }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Not set';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch {
      return 'Invalid date';
    }
  };

  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return 'N/A';
    if (hours < 1) return `${Math.round(hours * 60)} mins`;
    if (hours < 24) return `${hours.toFixed(1)} hours`;
    return `${(hours / 24).toFixed(1)} days`;
  };

  // Check if job card needs completion
  const needsCompletion = () => {
    if (!jobCard) return false;
    
    // Check if essential fields are missing
    const missingEssentialInfo = !jobCard.assignedTo || !jobCard.startDate || jobCard.status === 'pending';
    
    // Check if it's from workflow (has opportunityId and is in pending/in_progress)
    const isFromWorkflow = jobCard.opportunityId && 
                         (jobCard.status === 'pending' || jobCard.status === 'in_progress');
    
    return missingEssentialInfo && isFromWorkflow;
  };

  // Helper functions to get technician info
  const getTechnicianName = () => {
    if (!jobCard?.assignedTo) return 'Unassigned';
    if (typeof jobCard.assignedTo === 'string') return 'Loading...';
    
    // Use the name property from UserRef (not firstName/lastName)
    const userRef = jobCard.assignedTo;
    return userRef.name || userRef.email || 'Technician';
  };

  const getTechnicianEmail = () => {
    if (!jobCard?.assignedTo || typeof jobCard.assignedTo === 'string') return '';
    return jobCard.assignedTo.email || '';
  };

  const getTechnicianRole = () => {
    if (!jobCard?.assignedTo || typeof jobCard.assignedTo === 'string') return 'Technician';
    return jobCard.assignedTo.role || 'Technician';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'high': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const priorityOptions = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'high', label: 'High', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800 border-red-200' },
  ];

  const statusOptions = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
  ];

  // Calculate totals for display
  const calculateTotals = () => {
    const partsTotal = jobCard?.partsUsed?.reduce((sum, part: any) => sum + (part.totalCost || 0), 0) || 0;
    const laborCost = jobCard?.laborCost || 0;
    const totalCost = partsTotal + laborCost;
    
    return { partsTotal, laborCost, totalCost };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!jobCard) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50">
      {/* Header – Blue to Purple Gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-6 shadow-xl">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/job-cards')}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <Wrench className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{jobCard.jobTitle || 'Untitled Job'}</h1>
                <p className="text-blue-100 text-sm">Job Card #{jobCard.jobNumber || 'N/A'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-blue-200 text-xs">
                    Customer: {selectedOpportunity?.customer?.name || 'Loading...'}
                  </p>
                  {needsCompletion() && (
                    <span className="px-2 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                      Needs Completion
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={fetchJobCard}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                title="Refresh"
                aria-label="Refresh"
              >
                <RefreshCw className="h-5 w-5 text-white" />
              </button>
              <Link
                href={`/job-cards/${jobCard._id}/edit`}
                className="p-2 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm"
                title="Edit"
                aria-label="Edit job card"
              >
                <Edit className="h-5 w-5 text-white" />
              </Link>
              {needsCompletion() && (
                <button
                  onClick={() => setShowCompleteDetails(true)}
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 flex items-center gap-2 shadow-lg"
                >
                  <CheckSquare className="h-4 w-4" />
                  Complete Details
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Complete Details Modal */}
      {showCompleteDetails && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity" onClick={() => setShowCompleteDetails(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
                      <Wrench className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">Complete Job Card Details</h2>
                      <p className="text-gray-600 text-sm">Fill in the remaining details to complete this job card</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCompleteDetails(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <form onSubmit={(e) => { e.preventDefault(); handleCompleteDetails(); }} className="space-y-6">
                  {/* Basic Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Job Information</h3>
                    
                    {/* Opportunity Info */}
                    {selectedOpportunity && (
                      <div className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <UserType className="h-4 w-4" />
                              Customer Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-600">Name:</span>
                                <span className="font-medium">{selectedOpportunity.customer?.name || 'N/A'}</span>
                              </div>
                              {selectedOpportunity.customer?.companyName && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Company:</span>
                                  <span className="font-medium">{selectedOpportunity.customer.companyName}</span>
                                </div>
                              )}
                              {selectedOpportunity.customer?.email && (
                                <div className="flex items-center gap-2">
                                  <Mail className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">{selectedOpportunity.customer.email}</span>
                                </div>
                              )}
                              {selectedOpportunity.customer?.phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3 text-gray-400" />
                                  <span className="text-gray-600">{selectedOpportunity.customer.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                              <Car className="h-4 w-4" />
                              Vehicle Details
                            </h4>
                            {vehicleDetails ? (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Vehicle:</span>
                                  <span className="font-medium">
                                    {vehicleDetails.make} {vehicleDetails.model}
                                  </span>
                                </div>
                                {vehicleDetails.registrationNumber && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Reg No:</span>
                                    <span className="font-medium">{vehicleDetails.registrationNumber}</span>
                                  </div>
                                )}
                                {vehicleDetails.year && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Year:</span>
                                    <span className="font-medium">{vehicleDetails.year}</span>
                                  </div>
                                )}
                                {vehicleDetails.vin && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">VIN:</span>
                                    <span className="font-medium text-xs">{vehicleDetails.vin}</span>
                                  </div>
                                )}
                              </div>
                            ) : selectedOpportunity.vehicles?.[0] ? (
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-600">Vehicle:</span>
                                  <span className="font-medium">
                                    {selectedOpportunity.vehicles[0].make} {selectedOpportunity.vehicles[0].model}
                                  </span>
                                </div>
                                {selectedOpportunity.vehicles[0].registrationNumber && (
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">Reg No:</span>
                                    <span className="font-medium">{selectedOpportunity.vehicles[0].registrationNumber}</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-gray-500 text-sm">No vehicle details available</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Job Title & Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Job Title
                        </label>
                        <input
                          type="text"
                          name="jobTitle"
                          value={jobCard.jobTitle || ''}
                          readOnly
                          className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-gray-50 cursor-not-allowed"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {priorityOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => setCompleteForm(prev => ({ ...prev, priority: option.value as any }))}
                              className={`px-2.5 py-2 text-xs font-medium rounded-lg border transition-all ${
                                completeForm.priority === option.value
                                  ? `border-blue-500 ${option.color}`
                                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Technician Assignment & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <UserType className="h-4 w-4" />
                          Assign Technician *
                        </label>
                        <div className="relative">
                          <select
                            name="assignedTo"
                            value={completeForm.assignedTo}
                            onChange={handleCompleteFormChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white appearance-none"
                            required
                          >
                            <option value="">Select Technician</option>
                            {technicians.map(tech => (
                              <option key={tech.id} value={tech.id}>
                                {tech.name || tech.email} ({tech.email})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status
                        </label>
                        <div className="relative">
                          <select
                            name="status"
                            value={completeForm.status}
                            onChange={handleCompleteFormChange}
                            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors bg-white appearance-none"
                          >
                            {statusOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time & Cost Information */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Time & Cost Information</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {/* Dates */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Dates
                        </h3>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            name="startDate"
                            value={completeForm.startDate}
                            onChange={handleCompleteFormChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                            required
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            name="endDate"
                            value={completeForm.endDate}
                            onChange={handleCompleteFormChange}
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        {completeForm.status === 'completed' && (
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">
                              Completed Date
                            </label>
                            <input
                              type="date"
                              name="completedDate"
                              value={completeForm.completedDate}
                              onChange={handleCompleteFormChange}
                              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* Hours */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Hours
                        </h3>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Estimated Hours
                          </label>
                          <input
                            type="number"
                            name="estimatedHours"
                            value={completeForm.estimatedHours}
                            onChange={handleCompleteFormChange}
                            min="0.5"
                            step="0.5"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Actual Hours
                          </label>
                          <input
                            type="number"
                            name="actualHours"
                            value={completeForm.actualHours}
                            onChange={handleCompleteFormChange}
                            min="0"
                            step="0.5"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                      
                      {/* Costs */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Costs (KES)
                        </h3>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Labor Cost
                          </label>
                          <input
                            type="number"
                            name="laborCost"
                            value={completeForm.laborCost}
                            onChange={handleCompleteFormChange}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">
                            Parts Cost
                          </label>
                          <input
                            type="number"
                            name="partsCost"
                            value={completeForm.partsCost}
                            onChange={handleCompleteFormChange}
                            min="0"
                            step="0.01"
                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none transition-colors"
                          />
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Total Cost:</span>
                            <span className="text-lg font-bold text-blue-600">
                              {jobCardService.formatCurrency(completeForm.totalCost)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parts Used Section */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Parts Used
                      </h3>
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 flex items-center gap-2 shadow-lg"
                      >
                        <Plus className="h-4 w-4" />
                        Add Part
                      </button>
                    </div>
                    
                    {completeForm.partsUsed.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                        No parts added. Click "Add Part" to add parts used for this job.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="py-3 px-4 text-left font-semibold text-gray-700">Part #</th>
                              <th className="py-3 px-4 text-left font-semibold text-gray-700">Description</th>
                              <th className="py-3 px-4 text-left font-semibold text-gray-700">Qty</th>
                              <th className="py-3 px-4 text-left font-semibold text-gray-700">Unit Price</th>
                              <th className="py-3 px-4 text-left font-semibold text-gray-700">Total</th>
                              <th className="py-3 px-4 text-left font-semibold text-gray-700">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completeForm.partsUsed.map((part, index) => (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4">
                                  <select
                                    value={part.partId}
                                    onChange={(e) => handleSelectPart(index, e.target.value)}
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none bg-white appearance-none"
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
                                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
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
                                    className="w-24 px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 focus:outline-none"
                                  />
                                </td>
                                <td className="py-3 px-4 font-medium">
                                  {jobCardService.formatCurrency(part.totalCost || 0)}
                                </td>
                                <td className="py-3 px-4">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePart(index)}
                                    className="p-2 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-50">
                              <td colSpan={4} className="py-3 px-4 text-right font-medium">
                                Parts Total:
                              </td>
                              <td className="py-3 px-4 font-bold text-blue-600">
                                {jobCardService.formatCurrency(
                                  completeForm.partsUsed.reduce((sum, part) => sum + (part.totalCost || 0), 0)
                                )}
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Notes & Instructions</h3>
                    
                    <div className="space-y-3">
                      {completeForm.notes.map((note, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-blue-100">
                          <span className="text-gray-700">{note}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNote(index)}
                            className="p-1 hover:bg-red-100 rounded text-red-500"
                            aria-label="Remove note"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                      
                      <div className="flex gap-2 mt-4">
                        <input
                          type="text"
                          value={completeForm.newNote}
                          onChange={(e) => setCompleteForm(prev => ({ ...prev, newNote: e.target.value }))}
                          placeholder="Add a note or instruction..."
                          className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-colors"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                        />
                        <button
                          type="button"
                          onClick={handleAddNote}
                          className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all flex items-center gap-2 shadow-lg"
                          aria-label="Add note"
                        >
                          <Plus className="h-4 w-4" />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCompleteDetails(false)}
                      className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 flex items-center gap-2"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white font-medium rounded-xl hover:from-blue-700 hover:via-indigo-700 hover:to-purple-800 flex items-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Complete & Save Job Card
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto p-4">
        {/* Completion Prompt Banner */}
        {needsCompletion() && !showCompleteDetails && (
          <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Complete Job Card Details</h3>
                  <p className="text-sm text-gray-600">
                    This job card was created from an opportunity. Please complete the details to proceed with the workflow.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompleteDetails(true)}
                className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl hover:from-amber-600 hover:to-orange-600 flex items-center gap-2 shadow-lg"
              >
                <CheckSquare className="h-4 w-4" />
                Complete Now
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Job Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions Card */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-800">Job Status</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(jobCard.priority || 'medium')}`}>
                      {(jobCard.priority || 'MEDIUM').toUpperCase()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${jobCardService.getStatusColor(jobCard.status)}`}>
                      {jobCard.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-5">
                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{jobCardService.calculateCompletionPercentage(jobCard)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                      style={{ width: `${jobCardService.calculateCompletionPercentage(jobCard)}%` }}
                    />
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {jobCard.status === 'pending' && (
                    <button
                      onClick={() => handleStatusUpdate('in_progress')}
                      disabled={updating}
                      className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-blue-100 to-blue-200 hover:from-blue-200 hover:to-blue-300 text-blue-700 font-medium transition-all disabled:opacity-60 shadow-sm"
                    >
                      Start Job
                    </button>
                  )}
                  
                  {jobCard.status === 'in_progress' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate('completed')}
                        disabled={updating}
                        className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-green-100 to-green-200 hover:from-green-200 hover:to-green-300 text-green-700 font-medium transition-all disabled:opacity-60 shadow-sm"
                      >
                        Complete
                      </button>
                      <button
                        onClick={() => setShowCompleteDetails(true)}
                        className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-purple-100 to-purple-200 hover:from-purple-200 hover:to-purple-300 text-purple-700 font-medium transition-all shadow-sm"
                      >
                        Update Details
                      </button>
                    </>
                  )}
                  
                  {jobCard.status !== 'completed' && jobCard.status !== 'cancelled' && (
                    <button
                      onClick={() => handleStatusUpdate('cancelled')}
                      disabled={updating}
                      className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-red-100 to-red-200 hover:from-red-200 hover:to-red-300 text-red-700 font-medium transition-all disabled:opacity-60 shadow-sm"
                    >
                      Cancel
                    </button>
                  )}
                  
                  <button
                    onClick={() => setShowCompleteDetails(true)}
                    className="p-2.5 text-sm rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-200 hover:from-yellow-200 hover:to-yellow-300 text-yellow-700 font-medium transition-all shadow-sm"
                  >
                    Edit Details
                  </button>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Job Details</h2>
              </div>
              
              <div className="p-5 space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Job Title</h3>
                  <p className="text-gray-800">{jobCard.jobTitle || 'No title provided'}</p>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-700 whitespace-pre-line">{jobCard.jobDescription || 'No description provided.'}</p>
                </div>
                
                {jobCard.notes && jobCard.notes.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-3">Additional Notes</h3>
                    <div className="space-y-2">
                      {jobCard.notes.map((note: string, index: number) => (
                        <div key={index} className="p-3 bg-blue-50/30 rounded-lg border border-blue-100">
                          <p className="text-gray-700">{note}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parts Used */}
            {jobCard.partsUsed && jobCard.partsUsed.length > 0 && (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
                <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Parts Used
                  </h2>
                </div>
                
                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-600">
                          <th className="py-3 px-4 text-left font-medium">Part #</th>
                          <th className="py-3 px-4 text-left font-medium">Description</th>
                          <th className="py-3 px-4 text-left font-medium">Qty</th>
                          <th className="py-3 px-4 text-left font-medium">Unit Price</th>
                          <th className="py-3 px-4 text-left font-medium">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {jobCard.partsUsed.map((part: any, index: number) => (
                          <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">{part.partNumber || '—'}</td>
                            <td className="py-3 px-4">{part.name || 'Unnamed'}</td>
                            <td className="py-3 px-4">{part.quantity || 0}</td>
                            <td className="py-3 px-4">{jobCardService.formatCurrency(part.unitPrice)}</td>
                            <td className="py-3 px-4 font-medium">
                              {jobCardService.formatCurrency(part.totalCost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="py-3 px-4 text-right font-medium">
                            Total Parts Cost:
                          </td>
                          <td className="py-3 px-4 font-bold text-purple-600">
                            {jobCardService.formatCurrency(totals.partsTotal)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Opportunity Info */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Opportunity</h2>
              </div>
              
              <div className="p-5">
                {selectedOpportunity ? (
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Subject</h3>
                      <p className="text-gray-900">{selectedOpportunity.subject || 'No subject'}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Customer</h3>
                      <p className="text-gray-900">{selectedOpportunity.customer?.name || 'No customer'}</p>
                      {selectedOpportunity.customer?.companyName && (
                        <p className="text-gray-600 text-sm">{selectedOpportunity.customer.companyName}</p>
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-gray-700 mb-1">Status</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        selectedOpportunity.status === 'won' ? 'bg-green-100 text-green-800' :
                        selectedOpportunity.status === 'lost' ? 'bg-red-100 text-red-800' :
                        selectedOpportunity.status === 'new' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedOpportunity.status?.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => router.push(`/opportunities/${selectedOpportunity._id}`)}
                      className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 flex items-center justify-between transition-all"
                    >
                      <span>View Opportunity</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No opportunity linked</p>
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Info */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Vehicle</h2>
              </div>
              
              <div className="p-5">
                {vehicleDetails ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 mt-0.5">
                      <Car className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{vehicleDetails.registrationNumber || 'No registration'}</h3>
                      <p className="text-gray-600 text-sm">
                        {vehicleDetails.make || '—'} {vehicleDetails.model || ''} ({vehicleDetails.year || '?'})
                      </p>
                      {vehicleDetails.vin && (
                        <p className="text-gray-500 text-xs mt-1">VIN: {vehicleDetails.vin}</p>
                      )}
                      {vehicleDetails.color && (
                        <p className="text-gray-500 text-xs">Color: {vehicleDetails.color}</p>
                      )}
                    </div>
                  </div>
                ) : selectedOpportunity?.vehicles?.[0] ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-blue-100 to-purple-100 mt-0.5">
                      <Car className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800">{selectedOpportunity.vehicles[0].registrationNumber || 'No reg'}</h3>
                      <p className="text-gray-600 text-sm">
                        {selectedOpportunity.vehicles[0].make || '—'} {selectedOpportunity.vehicles[0].model || ''} 
                        {selectedOpportunity.vehicles[0].year && ` (${selectedOpportunity.vehicles[0].year})`}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Car className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No vehicle assigned</p>
                  </div>
                )}
              </div>
            </div>

            {/* Technician Info */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Technician</h2>
              </div>
              
              <div className="p-5">
                {jobCard.assignedTo && typeof jobCard.assignedTo === 'object' ? (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-green-100 to-blue-100 mt-0.5">
                      <UserType className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">
                        {getTechnicianName()}
                      </h3>
                      <p className="text-gray-600 text-sm">{getTechnicianRole()}</p>
                      {getTechnicianEmail() && (
                        <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {getTechnicianEmail()}
                        </p>
                      )}
                      <button
                        onClick={() => setShowCompleteDetails(true)}
                        className="mt-2 text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Change Technician
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <UserType className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-3">No technician assigned</p>
                    <button
                      onClick={() => setShowCompleteDetails(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm shadow-lg"
                    >
                      Assign Technician
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Time & Cost Summary */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Time & Cost</h2>
              </div>
              
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    Estimated:
                  </span>
                  <span className="font-medium">{formatDuration(jobCard.estimatedHours || 0)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual:</span>
                  <span className="font-medium">{formatDuration(jobCard.actualHours || 0)}</span>
                </div>
                
                {(jobCard.laborCost || totals.partsTotal > 0) && (
                  <>
                    <div className="pt-2.5 border-t border-gray-100">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-medium">
                          {jobCardService.formatCurrency(jobCard.laborCost || 0)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parts:</span>
                        <span className="font-medium">
                          {jobCardService.formatCurrency(totals.partsTotal)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2.5 border-t border-gray-100">
                      <div className="flex justify-between font-bold text-gray-800">
                        <span>Total Cost:</span>
                        <span className="text-lg text-purple-600 font-bold">
                          {jobCardService.formatCurrency(totals.totalCost)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
                
                {(!jobCard.laborCost && totals.partsTotal === 0) && (
                  <div className="text-center py-4">
                    <DollarSign className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 mb-3">No cost information added</p>
                    <button
                      onClick={() => setShowCompleteDetails(true)}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 text-sm shadow-lg"
                    >
                      Add Costs
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
              <div className="p-5 border-b border-gray-100 bg-gradient-to-r from-blue-50/30 to-purple-50/30">
                <h2 className="text-xl font-bold text-gray-800">Timeline</h2>
              </div>
              
              <div className="p-5 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span>{formatDate(jobCard.createdAt || '')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Updated:</span>
                  <span>{formatDate(jobCard.updatedAt || '')}</span>
                </div>
                {jobCard.startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Started:</span>
                    <span>{formatDate(jobCard.startDate)}</span>
                  </div>
                )}
                {jobCard.completedDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Completed:</span>
                    <span>{formatDate(jobCard.completedDate)}</span>
                  </div>
                )}
                
                {!jobCard.startDate && (
                  <div className="text-center py-2">
                    <button
                      onClick={() => setShowCompleteDetails(true)}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      + Set Start Date
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}