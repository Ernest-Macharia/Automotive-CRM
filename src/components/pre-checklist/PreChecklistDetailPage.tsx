'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ClipboardCheck,
  Download,
  CheckCircle,
  Printer,
  ArrowLeft,
  Edit,
  Trash2,
  Clock,
  XCircle,
  AlertCircle,
  User,
  Car,
  FileText,
  Eye,
  Share2,
  RefreshCw,
  PlusCircle,
  Wrench,
  Calendar,
  Building,
  Tag,
  Mail
} from 'lucide-react';
import { preChecklistService, PreChecklist, ChecklistFile } from '@/services/preChecklistService';
import { useToast } from '@/contexts/ToastContext';
import Link from 'next/link';
import { format } from 'date-fns';
import { pdf } from '@react-pdf/renderer';
import DiamondRimsPDF from '@/components/pre-checklist/DiamondRimsPDF';
import PreChecklistPDF from '@/components/pre-checklist/PreChecklistPDF';

interface PreChecklistDetailPageProps {
  id: string;
}

export default function PreChecklistDetailPage({ id }: PreChecklistDetailPageProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const [checklist, setChecklist] = useState<PreChecklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (id) {
      loadChecklist(id);
    }
  }, [id]);

  const loadChecklist = async (id: string) => {
    try {
      setLoading(true);
      const data = await preChecklistService.getPreChecklistById(id);
      setChecklist(data);
    } catch (error: any) {
      console.error('Error loading pre-checklist:', error);
      
      // Check if it's a 500 server error
      if (error.message && (error.message.includes('500') || error.message.includes('Internal server error'))) {
        // Create a fallback checklist object
        const fallbackChecklist: PreChecklist = {
          _id: id,
          id: id,
          opportunityId: 'unknown',
          vehicleId: 'unknown',
          inspectionItems: [],
          remarks: 'Pre-checklist loaded in limited mode due to server error',
          approved: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: ''
        };
        
        setChecklist(fallbackChecklist);
        showToast('Pre-checklist loaded with limited data', 'warning');
      } else {
        showToast('Failed to load pre-checklist', 'error');
        router.push('/orders/work-orders');
      }
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- helpers ---------------- */

  const renderVehicle = (vehicle: any) => {
    if (!vehicle) return '-';
    if (typeof vehicle === 'string') return vehicle.slice(0, 8) || 'Unknown';
    
    // Handle object with fallbacks
    const make = vehicle.make || '';
    const model = vehicle.model || '';
    const reg = vehicle.registrationNumber || '';
    
    if (make || model || reg) {
      return `${make} ${model} ${reg ? `(${reg})` : ''}`.trim();
    }
    
    return vehicle._id ? vehicle._id.slice(0, 8) : 'Unknown Vehicle';
  };

  const renderCustomer = (opportunity: any) => {
    if (!opportunity) return '-';
    if (typeof opportunity === 'string') return opportunity.slice(0, 8) || 'Unknown';
    
    // Handle object with fallbacks
    if (opportunity.customer) {
      return opportunity.customer.name || opportunity.customer.companyName || 'Customer';
    }
    
    return opportunity.subject || opportunity._id?.slice(0, 8) || '—';
  };

  const renderInspector = (entry: PreChecklist | null) => {
    if (!entry) return '';

    const intakeInspectorName = String(entry.serviceIntake?.customerServiceRep || '').trim();
    if (intakeInspectorName) return intakeInspectorName;

    const directInspectorName = String(entry.inspectorName || '').trim();
    if (directInspectorName) return directInspectorName;

    const inspectedBy: any = entry.inspectedBy;
    if (inspectedBy && typeof inspectedBy === 'object') {
      const fullName = `${inspectedBy.firstName || ''} ${inspectedBy.lastName || ''}`.trim();
      if (fullName) return fullName;
      const objectDisplayName = String(inspectedBy.name || '').trim();
      if (objectDisplayName) return objectDisplayName;
    }

    if (typeof inspectedBy === 'string') {
      const normalized = inspectedBy.trim();
      if (normalized && !/^[a-fA-F0-9]{24}$/.test(normalized)) {
        return normalized;
      }
    }

    return '';
  };

  const getStatusColor = (approved: boolean) => {
    return approved 
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  const getStatusText = (approved: boolean) => {
    return approved ? 'Approved' : 'Pending Approval';
  };

  const getStatusIcon = (approved: boolean) => {
    return approved ? <CheckCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />;
  };

  const getItemStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-green-100 text-green-800';
      case 'fault': return 'bg-red-100 text-red-800';
      case 'n/a': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'fault': return <AlertCircle className="h-4 w-4" />;
      case 'n/a': return <FileText className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: 'KES',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
  };

  const getChecklistVariant = useCallback((entry: PreChecklist | null) => {
    const rawType = String(entry?.checklistType || '').trim().toLowerCase();
    if (rawType.includes('diamond')) return 'diamond_rims';
    if (rawType.includes('headlight')) return 'headlight';

    if (entry?.services || entry?.powderCoating || entry?.tireDOT || entry?.suitability) {
      return 'diamond_rims';
    }
    return 'headlight';
  }, []);

  const resolveEntityId = useCallback((value: unknown): string => {
    if (!value) return '';

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object') {
      const entity = value as { _id?: string; id?: string };
      return String(entity._id || entity.id || '').trim();
    }

    return '';
  }, []);

  const blobToDataUrl = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        if (!result) {
          reject(new Error('Failed to convert blob to data URL'));
          return;
        }
        resolve(result);
      };
      reader.onerror = () => reject(new Error('Failed to convert blob to data URL'));
      reader.readAsDataURL(blob);
    });
  }, []);

  const enrichChecklistMediaForPdf = useCallback(async (entry: PreChecklist): Promise<PreChecklist> => {
    const cloned = { ...entry } as PreChecklist & { uploadedImages?: string[]; files?: ChecklistFile[] };
    const sourceFiles = Array.isArray(cloned.files) ? [...cloned.files] : [];
    if (sourceFiles.length === 0) {
      return cloned;
    }

    const imageFiles = sourceFiles
      .filter((file) => String(file?.mimeType || file?.fileType || '').toLowerCase().includes('image'))
      .slice(0, 8);
    const videoFiles = sourceFiles
      .filter((file) => String(file?.mimeType || file?.fileType || '').toLowerCase().includes('video'))
      .slice(0, 4);

    const fileDataById = new Map<string, { imageDataUrl?: string; thumbnailDataUrl?: string }>();

    await Promise.all(
      imageFiles.map(async (file) => {
        const fileId = String(file?._id || '').trim();
        if (!fileId) return;
        try {
          const fileBlob = await preChecklistService.downloadFile(fileId);
          const fileDataUrl = await blobToDataUrl(fileBlob);
          fileDataById.set(fileId, {
            ...(fileDataById.get(fileId) || {}),
            imageDataUrl: fileDataUrl,
          });
        } catch (error) {
          console.warn(`Unable to hydrate image file ${fileId} for PDF`, error);
        }
      })
    );

    await Promise.all(
      videoFiles.map(async (file) => {
        const fileId = String(file?._id || '').trim();
        if (!fileId) return;
        try {
          const thumbnailBlob = await preChecklistService.getFileThumbnail(fileId);
          const thumbnailDataUrl = await blobToDataUrl(thumbnailBlob);
          fileDataById.set(fileId, {
            ...(fileDataById.get(fileId) || {}),
            thumbnailDataUrl,
          });
        } catch (error) {
          console.warn(`Unable to hydrate video thumbnail ${fileId} for PDF`, error);
        }
      })
    );

    cloned.files = sourceFiles.map((file) => {
      const fileId = String(file?._id || '').trim();
      const hydrated = fileDataById.get(fileId);
      if (!hydrated) return file;

      return {
        ...file,
        ...(hydrated.imageDataUrl ? { path: hydrated.imageDataUrl, url: hydrated.imageDataUrl } : {}),
        ...(hydrated.thumbnailDataUrl ? { thumbnailPath: hydrated.thumbnailDataUrl } : {}),
      } as ChecklistFile;
    });

    const hydratedUploadedImages = cloned.files
      .filter((file) => String(file?.mimeType || file?.fileType || '').toLowerCase().includes('image'))
      .map((file) => String((file as any).path || (file as any).url || '').trim())
      .filter((item) => item.startsWith('data:image/'));

    if (hydratedUploadedImages.length > 0) {
      cloned.uploadedImages = Array.from(new Set([...(Array.isArray(cloned.uploadedImages) ? cloned.uploadedImages : []), ...hydratedUploadedImages]));
    }

    return cloned;
  }, [blobToDataUrl]);

  const buildChecklistPdfBlob = useCallback(async (entry: PreChecklist): Promise<Blob> => {
    const variant = getChecklistVariant(entry);
    const pdfReadyEntry = await enrichChecklistMediaForPdf(entry);

    if (variant === 'diamond_rims') {
      return pdf(
        <DiamondRimsPDF
          formData={pdfReadyEntry}
          opportunity={typeof pdfReadyEntry.opportunityId === 'object' ? pdfReadyEntry.opportunityId : undefined}
          vehicle={typeof pdfReadyEntry.vehicleId === 'object' ? pdfReadyEntry.vehicleId : undefined}
        />
      ).toBlob();
    }

    const stats = (pdfReadyEntry.inspectionItems || []).reduce(
      (acc, item) => {
        const normalized = String(item?.status || '').toLowerCase();
        if (normalized === 'ok') acc.ok += 1;
        else if (normalized === 'fault') acc.fault += 1;
        else if (normalized === 'n/a') acc.na += 1;
        else acc.pending += 1;
        acc.total += 1;
        return acc;
      },
      { total: 0, ok: 0, fault: 0, na: 0, pending: 0 }
    );

    return pdf(
      <PreChecklistPDF
        formData={pdfReadyEntry}
        stats={stats}
        existingChecklist={pdfReadyEntry}
        opportunity={typeof pdfReadyEntry.opportunityId === 'object' ? pdfReadyEntry.opportunityId : undefined}
        vehicle={typeof pdfReadyEntry.vehicleId === 'object' ? pdfReadyEntry.vehicleId : undefined}
      />
    ).toBlob();
  }, [enrichChecklistMediaForPdf, getChecklistVariant]);

  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = typeof reader.result === 'string' ? reader.result : '';
        const normalized = result.includes(',') ? result.split(',')[1] : result;
        resolve(normalized);
      };
      reader.onerror = () => reject(new Error('Failed to serialize PDF attachment'));
      reader.readAsDataURL(blob);
    });
  }, []);

  const normalizeApiErrorMessage = useCallback((error: unknown): string => {
    const raw = String((error as any)?.message || '').trim();
    if (!raw) return 'Failed to send checklist email';

    const withoutPrefix = raw.replace(/^API Error \(\d{3}\):\s*/i, '').trim();
    if (withoutPrefix.startsWith('{')) {
      try {
        const parsed = JSON.parse(withoutPrefix);
        const parsedMessage = parsed?.message || parsed?.error || parsed?.statusCode;
        if (parsedMessage) {
          return String(parsedMessage);
        }
      } catch {
        // Keep original message when payload isn't valid JSON.
      }
    }

    return withoutPrefix || 'Failed to send checklist email';
  }, []);

  const getActionErrorMessage = useCallback((error: unknown, fallback: string): string => {
    const raw = String((error as any)?.message || '').trim();
    if (!raw) return fallback;

    const withoutPrefix = raw.replace(/^API Error \(\d{3}\):\s*/i, '').trim();
    if (!withoutPrefix) return fallback;

    if (withoutPrefix.startsWith('{')) {
      try {
        const parsed = JSON.parse(withoutPrefix);
        const parsedMessage = parsed?.message || parsed?.error;
        if (parsedMessage) {
          return String(parsedMessage);
        }
      } catch {
        // Keep normalized text.
      }
    }

    return withoutPrefix;
  }, []);

  const buildCustomerEmailMessage = useCallback((entry: PreChecklist) => {
    const variant = getChecklistVariant(entry);
    const companyName = variant === 'diamond_rims' ? 'Diamond Rimz' : 'Eagle Lights';
    const teamName = variant === 'diamond_rims' ? 'Diamond Rimz Team' : 'Eagle Lights Team';
    const supportLine =
      variant === 'diamond_rims'
        ? 'Our team will now proceed as agreed. Kindly note that our Terms and Conditions apply to all services rendered. If you have any questions or follow-up requests, feel free to contact us via WhatsApp or phone at 0758 735 982.'
        : 'Our team will now proceed as agreed. Kindly note that our Terms and Conditions apply to all services rendered. If you have any questions or follow-up requests, feel free to contact us.';
    const customerName =
      `${entry.customerDetails?.firstName || ''} ${entry.customerDetails?.lastName || ''}`.trim() ||
      (typeof entry.opportunityId === 'object' ? entry.opportunityId?.customer?.name : '') ||
      'Client';

    return [
      `Dear ${customerName},`,
      '',
      `Thank you for choosing ${companyName}.`,
      '',
      'Attached is a copy of the signed service intake form for your records.',
      '',
      supportLine,
      '',
      'Kind regards,',
      teamName,
    ].join('\n');
  }, [getChecklistVariant]);

  /* ---------------- actions ---------------- */

  const handleApprove = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const approvedBy = sessionStorage.getItem('userId') || undefined;
      const approvedChecklist = await preChecklistService.approvePreChecklist(checklist._id, approvedBy);
      setChecklist(approvedChecklist);
      showToast('Pre-checklist approved successfully', 'success');
    } catch (error) {
      console.error('Error approving pre-checklist:', error);
      showToast(getActionErrorMessage(error, 'Failed to approve pre-checklist'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  // const handleApproveWithLifecycle = async () => {
  //   if (!checklist) return;
  //   try {
  //     setUpdating(true);
  //     const approvedBy = sessionStorage.getItem('userId') || undefined;
      
  //     const result = await preChecklistService.approvePreChecklistWithLifecycle(
  //       checklist._id, 
  //       approvedBy
  //     );
      
  //     setChecklist(result.checklist);
      
  //     if (result.lifecycleUpdate.stageCompleted) {
  //       if (result.lifecycleUpdate.nextStage) {
  //         showToast(`Checklist approved! Auto-advanced to ${result.lifecycleUpdate.nextStage} stage`, 'success');
  //       } else {
  //         showToast('Checklist approved! Stage marked as complete.', 'success');
  //       }
  //     } else {
  //       showToast('Checklist approved!', 'success');
  //     }
  //   } catch (error) {
  //     console.error('Error approving pre-checklist:', error);
  //     showToast('Failed to approve checklist', 'error');
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

  const handleDelete = async () => {
    if (!checklist) return;
    if (!confirm('Are you sure you want to delete this pre-checklist? This action cannot be undone.')) return;

    try {
      setUpdating(true);
      await preChecklistService.deletePreChecklist(checklist._id);
      showToast('Pre-checklist deleted successfully', 'success');
      router.push('/orders/work-orders');
    } catch (error) {
      console.error('Error deleting pre-checklist:', error);
      showToast(getActionErrorMessage(error, 'Failed to delete pre-checklist'), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleViewPdf = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const blob = await buildChecklistPdfBlob(checklist);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      showToast('PDF opened successfully', 'success');
    } catch (error) {
      console.error('Error opening local pre-checklist PDF, trying backend copy:', error);
      try {
        const fallbackBlob = await preChecklistService.viewPDF(checklist._id);
        const fallbackUrl = window.URL.createObjectURL(fallbackBlob);
        window.open(fallbackUrl, '_blank');
        showToast('PDF opened successfully', 'success');
      } catch (fallbackError) {
        console.error('Error opening pre-checklist PDF from backend:', fallbackError);
        showToast('Failed to open pre-checklist PDF', 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = async () => {
    if (!checklist) return;
    try {
      setUpdating(true);
      const blob = await buildChecklistPdfBlob(checklist);
      const url = window.URL.createObjectURL(blob);
      const win = window.open(url, '_blank');
      if (win) {
        win.onload = () => win.print();
      }
      showToast('Print view opened', 'success');
    } catch (error) {
      console.error('Error printing local PDF, trying backend PDF:', error);
      try {
        const fallbackBlob = await preChecklistService.viewPDF(checklist._id);
        const fallbackUrl = window.URL.createObjectURL(fallbackBlob);
        const fallbackWindow = window.open(fallbackUrl, '_blank');
        if (fallbackWindow) {
          fallbackWindow.onload = () => fallbackWindow.print();
        }
        showToast('Print view opened', 'success');
      } catch (fallbackError) {
        console.error('Error printing pre-checklist PDF:', fallbackError);
        showToast('Failed to print pre-checklist', 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleSendChecklistEmail = async () => {
    if (!checklist) return;

    const recipient =
      checklist.clientEmail ||
      checklist.customerDetails?.email ||
      (typeof checklist.opportunityId === 'object' ? checklist.opportunityId?.customer?.email : '') ||
      '';

    if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
      showToast('A valid client email is required before sending', 'error');
      return;
    }

    try {
      setUpdating(true);

      const customerName =
        `${checklist.customerDetails?.firstName || ''} ${checklist.customerDetails?.lastName || ''}`.trim() ||
        (typeof checklist.opportunityId === 'object' ? checklist.opportunityId?.customer?.name : '') ||
        'Client';
      const vehicleLabel =
        checklist.carDetails?.licensePlate ||
        (typeof checklist.vehicleId === 'object'
          ? `${checklist.vehicleId?.make || ''} ${checklist.vehicleId?.model || ''}`.trim()
          : '') ||
        'Service Intake';

      let pdfBase64: string | undefined;
      try {
        const attachmentBlob = await buildChecklistPdfBlob(checklist);
        pdfBase64 = await blobToBase64(attachmentBlob);
      } catch (attachmentError) {
        console.warn('Failed to pre-build local PDF attachment, continuing with server-side email flow:', attachmentError);
      }

      const fileSafeCustomerName = customerName.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
      const fileSafeVehicle = vehicleLabel.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');

      const response = await preChecklistService.sendChecklistCopyEmail(checklist._id, {
        email: recipient,
        subject: `SERVICE INTAKE FORM - ${customerName} - ${vehicleLabel}`,
        message: buildCustomerEmailMessage(checklist),
        includePdf: true,
        includeSecureLink: false,
        pdfBase64,
        pdfFilename: `SERVICE-INTAKE-${fileSafeCustomerName || 'CLIENT'}-${fileSafeVehicle || 'VEHICLE'}.pdf`,
        pdfMimeType: 'application/pdf',
      });

      if (!response.success) {
        throw new Error(response.message || 'Checklist email endpoint returned unsuccessful response');
      }

      if (response.fallbackUsed) {
        showToast('Checklist email sent using approval flow fallback', 'info');
      } else {
        showToast('Checklist email sent to client', 'success');
      }
    } catch (error) {
      console.error('Error sending checklist email:', error);
      showToast(normalizeApiErrorMessage(error), 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleCreatePostChecklist = () => {
    if (!checklist) return;

    const params = new URLSearchParams();
    const checklistVariant = getChecklistVariant(checklist);
    const clientType = checklistVariant === 'diamond_rims' ? 'diamond-rims' : 'eagle-lights';
    const opportunityId = resolveEntityId(checklist.opportunityId);
    const vehicleId = resolveEntityId(checklist.vehicleId);
    const workOrderId = resolveEntityId((checklist as any).workOrderId);

    params.set('clientType', clientType);
    params.set('source', 'prechecklist');
    params.set('preChecklistId', checklist._id);

    if (opportunityId) {
      params.set('opportunityId', opportunityId);
    }

    if (vehicleId) {
      params.set('vehicleId', vehicleId);
    }

    if (workOrderId) {
      params.set('workOrderId', workOrderId);
    }

    router.push(`/post-checklist/create?${params.toString()}`);
  };

  const handleUpdateItemStatus = async (itemIndex: number, status: 'ok' | 'fault' | 'n/a') => {
    if (!checklist) return;
    try {
      setUpdating(true);
      await preChecklistService.checkItem(checklist._id, itemIndex, {
        checked: status === 'ok',
        remarks: status === 'fault' ? 'Marked as fault from detail view' : undefined,
      });

      const updatedChecklist = await preChecklistService.getPreChecklistById(checklist._id);
      const mappedItems = updatedChecklist.inspectionItems.map((item, idx) =>
        idx === itemIndex ? { ...item, status } : item
      );
      setChecklist({ ...updatedChecklist, inspectionItems: mappedItems });
      showToast('Inspection item updated', 'success');
    } catch (error) {
      console.error('Error updating inspection item:', error);
      showToast('Failed to update inspection item', 'error');
    } finally {
      setUpdating(false);
    }
  };

  // const handleExportPDF = async () => {
  //   if (!checklist) return;
  //   try {
  //     setUpdating(true);
  //     const htmlContent = await preChecklistService.exportPreChecklistToPdf(checklist._id);
      
  //     const printWindow = window.open('', '_blank');
  //     if (printWindow) {
  //       printWindow.document.write(htmlContent);
  //       printWindow.document.close();
  //       printWindow.focus();
  //       printWindow.print();
  //     }
      
  //     showToast('Pre-checklist exported successfully', 'success');
  //   } catch (error) {
  //     console.error('Error exporting pre-checklist:', error);
  //     showToast('Failed to export pre-checklist', 'error');
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

  // const handleUpdateItemStatus = async (itemId: string, status: 'ok' | 'fault' | 'n/a') => {
  //   if (!checklist) return;
    
  //   try {
  //     setUpdating(true);
  //     await preChecklistService.updateInspectionItem(checklist._id, itemId, { status });
  //     const updatedChecklist = await preChecklistService.getPreChecklistById(checklist._id);
  //     setChecklist(updatedChecklist);
  //     showToast('Item status updated successfully', 'success');
  //   } catch (error) {
  //     console.error('Error updating item status:', error);
  //     showToast('Failed to update item status', 'error');
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

  // const handleClone = async () => {
  //   if (!checklist) return;
    
  //   try {
  //     setUpdating(true);
  //     const userId = sessionStorage.getItem('userId') || 'system';
  //     const clonedChecklist = await preChecklistService.clonePreChecklist(checklist._id, userId);
  //     showToast('Pre-checklist cloned successfully', 'success');
  //     router.push(`/prechecklists/${clonedChecklist._id}`);
  //   } catch (error) {
  //     console.error('Error cloning pre-checklist:', error);
  //     showToast('Failed to clone pre-checklist', 'error');
  //   } finally {
  //     setUpdating(false);
  //   }
  // };

  /* ---------------- UI states ---------------- */

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Pre-checklist not found</p>
      </div>
    );
  }

  /* ---------------- render ---------------- */

  const faultItems = checklist.inspectionItems.filter(item => item.status === 'fault');
  const okItems = checklist.inspectionItems.filter(item => item.status === 'ok');
  const completionPercentage = checklist.inspectionItems.length > 0 
    ? Math.round((okItems.length / checklist.inspectionItems.length) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Zoho Style */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/orders/work-orders" className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Pre-Service Checklist #{checklist._id.slice(-8)}
              </h1>
              <p className="text-sm text-gray-500">Vehicle Inspection Details</p>
              {Array.isArray(checklist.tags) && checklist.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {checklist.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700"
                    >
                      <Tag className="h-3.5 w-3.5" />
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(
              checklist.approved
            )}`}
          >
            {getStatusIcon(checklist.approved)}
            {getStatusText(checklist.approved)}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {/* Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <h2 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                  <ClipboardCheck className="h-5 w-5 text-blue-600" />
                  Inspection Information
                </h2>
                <div className="flex gap-2 mt-3 sm:mt-0">
	                  <button 
	                    onClick={handlePrint}
	                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
	                    disabled={updating}
	                  >
                    {updating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Printer className="h-4 w-4" />
                    )}
                    Print
                  </button>
                  <button 
                    // onClick={handleClone} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                    disabled={updating}
                  >
                    <PlusCircle className="h-4 w-4" />
                    Clone
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Created Date
                  </p>
                  <p className="text-sm text-gray-800">{formatDate(checklist.createdAt as string)}</p>

                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-4 mb-1">
                    <Car className="h-3.5 w-3.5" />
                    Vehicle
                  </p>
                  <p className="text-sm text-gray-800">{renderVehicle(checklist.vehicleId)}</p>

                  {typeof checklist.vehicleId === 'object' && checklist.vehicleId.mileage && (
                    <>
                      <p className="text-xs text-gray-500 mt-4 mb-1">Mileage</p>
                      <p className="text-sm text-gray-800">{checklist.vehicleId.mileage.toLocaleString()} km</p>
                    </>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                    <Building className="h-3.5 w-3.5" />
                    Customer / Opportunity
                  </p>
                  <p className="text-sm text-gray-800">{renderCustomer(checklist.opportunityId)}</p>

                  {renderInspector(checklist) && (
                    <>
                      <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-4 mb-1">
                        <User className="h-3.5 w-3.5" />
                        Inspector Name
                      </p>
                      <p className="text-sm text-gray-800">{renderInspector(checklist)}</p>
                    </>
                  )}

                  {checklist.approvedBy && checklist.approvedAt && (
                    <>
                      <p className="text-xs text-gray-500 mt-4 mb-1">Approved By</p>
                      <p className="text-sm text-gray-800">
                        {typeof checklist.approvedBy === 'object' 
                          ? `${checklist.approvedBy.firstName} ${checklist.approvedBy.lastName}`
                          : checklist.approvedBy
                        } on {formatDate(checklist.approvedAt as string)}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {checklist.remarks && (
                <div className="mt-5 pt-5 border-t border-gray-200">
                  <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-1">
                    <FileText className="h-3.5 w-3.5" />
                    Remarks
                  </p>
                  <p className="text-sm text-gray-700">{checklist.remarks}</p>
                </div>
              )}
            </div>

            {/* Inspection Items */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <h2 className="text-base font-semibold flex items-center gap-2 text-gray-800">
                  <Wrench className="h-5 w-5 text-blue-600" />
                  Inspection Items ({checklist.inspectionItems.length})
                </h2>
                
                <div className="flex items-center gap-4 mt-3 sm:mt-0">
                  <div className="text-center">
                    <div className="text-base font-bold text-green-600">{okItems.length}</div>
                    <div className="text-xs text-gray-500">OK</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-red-600">{faultItems.length}</div>
                    <div className="text-xs text-gray-500">Faults</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-blue-600">{completionPercentage}%</div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                {checklist.inspectionItems.map((item, index) => (
                  <div key={item._id || index} className="flex items-start justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <div className="flex items-start gap-2 mb-1">
                        <span className="font-medium text-gray-900 text-sm">
                          {index + 1}. {item.item}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                          {getItemStatusIcon(item.status)}
                          <span className="capitalize">{item.status}</span>
                        </span>
                      </div>
                      {item.remarks && (
                        <p className="text-xs text-gray-600 mt-1">{item.remarks}</p>
                      )}
                    </div>
                    
                    {!checklist.approved && (
                      <div className="flex items-center gap-1 ml-2">
	                        <button
	                          onClick={() => handleUpdateItemStatus(index, 'ok')}
	                          className={`p-1.5 rounded ${item.status === 'ok' ? 'bg-green-100 text-green-700' : 'text-gray-400 hover:text-green-700 hover:bg-green-50'}`}
	                          title="Mark as OK"
	                          disabled={updating}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                        </button>
	                        <button
	                          onClick={() => handleUpdateItemStatus(index, 'fault')}
	                          className={`p-1.5 rounded ${item.status === 'fault' ? 'bg-red-100 text-red-700' : 'text-gray-400 hover:text-red-700 hover:bg-red-50'}`}
	                          title="Mark as Fault"
	                          disabled={updating}
                        >
                          <AlertCircle className="h-3.5 w-3.5" />
                        </button>
	                        <button
	                          onClick={() => handleUpdateItemStatus(index, 'n/a')}
	                          className={`p-1.5 rounded ${item.status === 'n/a' ? 'bg-gray-100 text-gray-700' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'}`}
	                          title="Mark as N/A"
	                          disabled={updating}
                        >
                          <FileText className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="space-y-6">
            {/* Actions Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Actions</h2>

              <div className="space-y-3">
	                {!checklist.approved && (
	                  <button 
	                    onClick={handleApprove}
	                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60"
	                    disabled={updating}
                  >
                    {updating ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
	                    Approve Checklist
	                  </button>
	                )}
	                <button 
	                  onClick={handleViewPdf}
	                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-60"
	                  disabled={updating}
	                >
	                  <Eye className="h-4 w-4" />
	                  View PDF
	                </button>
	                <button 
	                  onClick={handleSendChecklistEmail}
	                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-blue-300 text-blue-700 text-sm font-medium rounded-lg hover:bg-blue-50 disabled:opacity-60"
	                  disabled={updating}
	                >
	                  <Mail className="h-4 w-4" />
	                  Send To Client Email
	                </button>

                <button 
                  onClick={handleDelete} 
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-600 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 disabled:opacity-60"
                  disabled={updating}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Checklist
                </button>

                <button
                  onClick={handleCreatePostChecklist}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-purple-300 text-purple-700 text-sm font-medium rounded-lg hover:bg-purple-50 disabled:opacity-60"
                  disabled={updating}
                >
                  <PlusCircle className="h-4 w-4" />
                  Create Post Checklist
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-800 mb-3">Completion Summary</h3>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-medium">{completionPercentage}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${completionPercentage}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-green-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-green-700">{okItems.length}</div>
                      <div className="text-xs text-green-600">OK</div>
                    </div>
                    <div className="bg-red-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-red-700">{faultItems.length}</div>
                      <div className="text-xs text-red-600">Faults</div>
                    </div>
                    <div className="bg-gray-50 p-2 rounded text-center">
                      <div className="text-sm font-bold text-gray-700">
                        {checklist.inspectionItems.length - okItems.length - faultItems.length}
                      </div>
                      <div className="text-xs text-gray-600">N/A</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Related Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Related Records</h2>
              
              <div className="space-y-2">
                {typeof checklist.opportunityId === 'object' && checklist.opportunityId._id && (
                  <Link
                    href={`/opportunities/${checklist.opportunityId._id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4 text-gray-600" />
                      <span>Opportunity</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-gray-400 transform rotate-180" />
                  </Link>
                )}

                {typeof checklist.vehicleId === 'object' && checklist.vehicleId._id && (
                  <Link
                    href={`/vehicles/${checklist.vehicleId._id}`}
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-gray-600" />
                      <span>Vehicle Details</span>
                    </div>
                    <ArrowLeft className="h-4 w-4 text-gray-400 transform rotate-180" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
