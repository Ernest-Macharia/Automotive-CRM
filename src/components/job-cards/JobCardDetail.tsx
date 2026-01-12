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

        if (data.opportunityId) {
          const oppId = typeof data.opportunityId === 'object'
            ? data.opportunityId._id
            : data.opportunityId;
          if (oppId) {
            const opp = await opportunityService.getOpportunityById(oppId);
            setSelectedOpportunity(opp);
            if (opp.vehicles?.[0]?._id) {
              const vehicle = await vehicleService.getVehicleById(opp.vehicles[0]._id);
              setVehicleDetails(vehicle);
            }
          }
        }

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
      const users = await userService.getAllUsers();
      const technicianUsers = users.filter(user =>
        userService.getUserRoleName(user) === 'technician' && user.active
      );
      setTechnicians(technicianUsers);

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
        vehicleId: jobCard?.vehicleId || (typeof jobCard?.vehicleId === 'string' ? jobCard.vehicleId : undefined)
      };

      await jobCardService.updateJobCard(jobCardId, updateData);
      showToast('Job card completed successfully!', 'success');

      const opportunityId = typeof jobCard.opportunityId === 'object'
          ? jobCard.opportunityId._id || jobCard.opportunityId.id
          : jobCard.opportunityId;
      
      setTimeout(() => {
            router.push(`/orders/work-orders?opportunity=${opportunityId}`);
          }, 1500);
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
        if (field === 'quantity' || field === 'unitPrice') {
          updatedPart.totalCost = updatedPart.quantity * updatedPart.unitPrice;
        }
        partsUsed[index] = updatedPart;
      }
      return { ...prev, partsUsed };
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

  const needsCompletion = () => {
    if (!jobCard) return false;
    const missingEssentialInfo = !jobCard.assignedTo || !jobCard.startDate || jobCard.status === 'pending';
    const isFromWorkflow = jobCard.opportunityId &&
      (jobCard.status === 'pending' || jobCard.status === 'in_progress');
    return missingEssentialInfo && isFromWorkflow;
  };

  const getTechnicianName = () => {
    if (!jobCard?.assignedTo) return 'Unassigned';
    if (typeof jobCard.assignedTo === 'string') return 'Loading...';
    const userRef = jobCard.assignedTo;
    return userRef.name || userRef.email || 'Technician';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-yellow-100 text-yellow-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const calculateTotals = () => {
    const partsTotal = jobCard?.partsUsed?.reduce((sum, part: any) => sum + (part.totalCost || 0), 0) || 0;
    const laborCost = jobCard?.laborCost || 0;
    const totalCost = partsTotal + laborCost;
    return { partsTotal, laborCost, totalCost };
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!jobCard) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Blue to Purple Theme */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-md flex items-center px-6 flex-shrink-0">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push('/job-cards')}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">{jobCard.jobTitle || 'Untitled Job'}</h1>
              <p className="text-blue-100 text-sm">Job Card #{jobCard.jobNumber || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchJobCard}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Refresh"
            >
              <RefreshCw className="h-5 w-5 text-white" />
            </button>
            <Link
              href={`/job-cards/${jobCard._id}/edit`}
              className="p-2 hover:bg-white/20 rounded-xl transition-colors"
              title="Edit"
            >
              <Edit className="h-5 w-5 text-white" />
            </Link>
            {needsCompletion() && (
              <button
                onClick={() => setShowCompleteDetails(true)}
                className="px-3 py-1.5 bg-white text-blue-600 text-sm font-medium rounded-lg hover:bg-blue-50 flex items-center gap-1.5"
              >
                <CheckSquare className="h-4 w-4" />
                Complete Details
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Complete Details Modal */}
      {showCompleteDetails && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setShowCompleteDetails(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh]">
              <div className="p-5 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  <h2 className="text-base font-semibold text-gray-900">Complete Job Card Details</h2>
                </div>
                <button onClick={() => setShowCompleteDetails(false)} className="p-1.5 rounded hover:bg-gray-100">
                  <X className="h-4 w-4 text-gray-600" />
                </button>
              </div>
              <div className="p-5 max-h-[70vh] overflow-y-auto">
                <form onSubmit={(e) => { e.preventDefault(); handleCompleteDetails(); }} className="space-y-5">
                  {/* Basic Info */}
                  {selectedOpportunity && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Customer</p>
                          <p className="font-medium">{selectedOpportunity.customer?.name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Vehicle</p>
                          <p className="font-medium">
                            {vehicleDetails
                              ? `${vehicleDetails.make} ${vehicleDetails.model} (${vehicleDetails.registrationNumber})`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Job Title</label>
                      <input
                        type="text"
                        value={jobCard.jobTitle || ''}
                        readOnly
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Priority</label>
                      <div className="grid grid-cols-4 gap-1">
                        {[
                          { value: 'low', label: 'Low' },
                          { value: 'medium', label: 'Medium' },
                          { value: 'high', label: 'High' },
                          { value: 'urgent', label: 'Urgent' }
                        ].map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setCompleteForm(prev => ({ ...prev, priority: opt.value as any }))}
                            className={`text-xs px-2 py-1.5 rounded border ${
                              completeForm.priority === opt.value
                                ? getPriorityColor(opt.value) + ' border-transparent'
                                : 'border-gray-300 text-gray-700'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Assign Technician *</label>
                      <select
                        name="assignedTo"
                        value={completeForm.assignedTo}
                        onChange={handleCompleteFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Select Technician</option>
                        {technicians.map(tech => (
                          <option key={tech.id} value={tech.id}>
                            {tech.name || tech.email}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Status</label>
                      <select
                        name="status"
                        value={completeForm.status}
                        onChange={handleCompleteFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {/* Time & Cost */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Start Date *</label>
                      <input
                        type="date"
                        name="startDate"
                        value={completeForm.startDate}
                        onChange={handleCompleteFormChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Estimated Hours</label>
                      <input
                        type="number"
                        name="estimatedHours"
                        value={completeForm.estimatedHours}
                        onChange={handleCompleteFormChange}
                        min="0.5"
                        step="0.5"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Labor Cost (KES)</label>
                      <input
                        type="number"
                        name="laborCost"
                        value={completeForm.laborCost}
                        onChange={handleCompleteFormChange}
                        min="0"
                        step="0.01"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  {/* Parts */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Parts Used</h3>
                      <button
                        type="button"
                        onClick={handleAddPart}
                        className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add Part
                      </button>
                    </div>
                    {completeForm.partsUsed.length === 0 ? (
                      <p className="text-xs text-gray-500">No parts added.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 text-left text-gray-500">
                              <th className="py-2 px-2">Part #</th>
                              <th className="py-2 px-2">Description</th>
                              <th className="py-2 px-2">Qty</th>
                              <th className="py-2 px-2">Unit Price</th>
                              <th className="py-2 px-2">Total</th>
                              <th className="py-2 px-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {completeForm.partsUsed.map((part, index) => (
                              <tr key={index} className="border-b border-gray-100">
                                <td className="py-2 px-2">
                                  <select
                                    value={part.partId}
                                    onChange={(e) => handleSelectPart(index, e.target.value)}
                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                                  >
                                    <option value="">Select</option>
                                    {parts.map(p => (
                                      <option key={p._id} value={p._id}>{p.partNumber}</option>
                                    ))}
                                  </select>
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="text"
                                    value={part.name}
                                    onChange={(e) => handlePartChange(index, 'name', e.target.value)}
                                    className="w-full text-xs px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={part.quantity}
                                    onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                    min="1"
                                    className="w-12 text-xs px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={part.unitPrice}
                                    onChange={(e) => handlePartChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className="w-16 text-xs px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="py-2 px-2 font-medium">
                                  {jobCardService.formatCurrency(part.totalCost || 0)}
                                </td>
                                <td className="py-2 px-2">
                                  <button
                                    type="button"
                                    onClick={() => handleRemovePart(index)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs text-gray-500 mb-2 block">Notes</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={completeForm.newNote}
                        onChange={(e) => setCompleteForm(prev => ({ ...prev, newNote: e.target.value }))}
                        placeholder="Add a note..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddNote())}
                      />
                      <button
                        type="button"
                        onClick={handleAddNote}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg"
                      >
                        Add
                      </button>
                    </div>
                    {completeForm.notes.length > 0 && (
                      <div className="mt-2 space-y-1 max-h-24 overflow-y-auto">
                        {completeForm.notes.map((note, i) => (
                          <div key={i} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                            <span>{note}</span>
                            <button onClick={() => handleRemoveNote(i)} className="text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => setShowCompleteDetails(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-1.5"
                    >
                      {updating ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4" />
                          Save Details
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {needsCompletion() && !showCompleteDetails && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
                <div>
                  <h3 className="font-medium text-gray-900">Complete Job Card Details</h3>
                  <p className="text-sm text-gray-600">
                    This job card was created from an opportunity. Please complete the details to proceed.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowCompleteDetails(true)}
                className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700"
              >
                Complete Now
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status & Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h2 className="text-base font-semibold text-gray-900">Job Status</h2>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPriorityColor(jobCard.priority || 'medium')}`}>
                    {(jobCard.priority || 'MEDIUM').toUpperCase()}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${jobCardService.getStatusColor(jobCard.status)}`}>
                    {jobCard.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                  </span>
                </div>
              </div>

              <div className="mb-5">
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>Progress</span>
                  <span>{jobCardService.calculateCompletionPercentage(jobCard)}%</span>
                </div>
                <div className="h-1.5 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    style={{ width: `${jobCardService.calculateCompletionPercentage(jobCard)}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {jobCard.status === 'pending' && (
                  <button
                    onClick={() => handleStatusUpdate('in_progress')}
                    disabled={updating}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-60"
                  >
                    Start Job
                  </button>
                )}
                {jobCard.status === 'in_progress' && (
                  <>
                    <button
                      onClick={() => handleStatusUpdate('completed')}
                      disabled={updating}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-60"
                    >
                      Complete
                    </button>
                    <button
                      onClick={() => setShowCompleteDetails(true)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200"
                    >
                      Update Details
                    </button>
                  </>
                )}
                {jobCard.status !== 'completed' && jobCard.status !== 'cancelled' && (
                  <button
                    onClick={() => handleStatusUpdate('cancelled')}
                    disabled={updating}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-60"
                  >
                    Cancel
                  </button>
                )}
                <button
                  onClick={() => setShowCompleteDetails(true)}
                  className="px-2.5 py-1.5 text-xs rounded-lg bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                >
                  Edit Details
                </button>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Job Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Job Title</p>
                  <p className="text-gray-900">{jobCard.jobTitle || 'No title provided'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Description</p>
                  <p className="text-gray-700 whitespace-pre-line">{jobCard.jobDescription || 'No description.'}</p>
                </div>
                {jobCard.notes && jobCard.notes.length > 0 && (
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Additional Notes</p>
                    <div className="space-y-2">
                      {jobCard.notes.map((note: string, index: number) => (
                        <div key={index} className="p-2 bg-blue-50 rounded border border-blue-100 text-sm">
                          {note}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Parts Used */}
            {jobCard.partsUsed && jobCard.partsUsed.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-1.5">
                  <Package className="h-4 w-4" />
                  Parts Used
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-500">
                        <th className="py-2 px-3">Part #</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3">Qty</th>
                        <th className="py-2 px-3">Unit Price</th>
                        <th className="py-2 px-3">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {jobCard.partsUsed.map((part: any, index: number) => (
                        <tr key={index} className="border-b border-gray-100">
                          <td className="py-2 px-3">{part.partNumber || '—'}</td>
                          <td className="py-2 px-3">{part.name || 'Unnamed'}</td>
                          <td className="py-2 px-3">{part.quantity || 0}</td>
                          <td className="py-2 px-3">{jobCardService.formatCurrency(part.unitPrice)}</td>
                          <td className="py-2 px-3 font-medium">
                            {jobCardService.formatCurrency(part.totalCost)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={4} className="py-2 px-3 text-right font-medium">
                          Total Parts Cost:
                        </td>
                        <td className="py-2 px-3 font-bold text-purple-600">
                          {jobCardService.formatCurrency(totals.partsTotal)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6">
            {/* Opportunity */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Opportunity</h2>
              {selectedOpportunity ? (
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Subject</p>
                    <p className="font-medium">{selectedOpportunity.subject || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Customer</p>
                    <p className="font-medium">{selectedOpportunity.customer?.name || '—'}</p>
                  </div>
                  <button
                    onClick={() => router.push(`/opportunities/${selectedOpportunity._id}`)}
                    className="mt-3 w-full text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Opportunity
                  </button>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No opportunity linked</p>
              )}
            </div>

            {/* Vehicle */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Vehicle</h2>
              {vehicleDetails ? (
                <div className="text-sm">
                  <p className="font-medium">{vehicleDetails.registrationNumber || '—'}</p>
                  <p className="text-gray-600">
                    {vehicleDetails.make} {vehicleDetails.model} ({vehicleDetails.year})
                  </p>
                </div>
              ) : selectedOpportunity?.vehicles?.[0] ? (
                <div className="text-sm">
                  <p className="font-medium">{selectedOpportunity.vehicles[0].registrationNumber || '—'}</p>
                  <p className="text-gray-600">
                    {selectedOpportunity.vehicles[0].make} {selectedOpportunity.vehicles[0].model}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-2">No vehicle assigned</p>
              )}
            </div>

            {/* Technician */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Technician</h2>
              {jobCard.assignedTo && typeof jobCard.assignedTo === 'object' ? (
                <div className="text-sm">
                  <p className="font-medium">{getTechnicianName()}</p>
                  <button
                    onClick={() => setShowCompleteDetails(true)}
                    className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Change Technician
                  </button>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-sm text-gray-500 mb-2">No technician assigned</p>
                  <button
                    onClick={() => setShowCompleteDetails(true)}
                    className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Assign Technician
                  </button>
                </div>
              )}
            </div>

            {/* Time & Cost */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Time & Cost</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Estimated:</span>
                  <span className="font-medium">{formatDuration(jobCard.estimatedHours || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Actual:</span>
                  <span className="font-medium">{formatDuration(jobCard.actualHours || 0)}</span>
                </div>
                {(jobCard.laborCost || totals.partsTotal > 0) && (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Labor:</span>
                        <span className="font-medium">{jobCardService.formatCurrency(jobCard.laborCost || 0)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Parts:</span>
                        <span className="font-medium">{jobCardService.formatCurrency(totals.partsTotal)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-gray-200">
                      <div className="flex justify-between font-bold">
                        <span>Total Cost:</span>
                        <span className="text-purple-600 font-bold">
                          {jobCardService.formatCurrency(totals.totalCost)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-900 mb-3">Timeline</h2>
              <div className="space-y-2 text-sm">
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}