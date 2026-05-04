import React from 'react';
import {
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image,
  Font,
  Link
} from '@react-pdf/renderer';
import { format } from 'date-fns';
import { API_BASE_URL } from '@/lib/api/config';

// Register fonts (you can use custom fonts if needed)
Font.register({
  family: 'Helvetica',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-light-webfont.ttf', fontWeight: 300 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-medium-webfont.ttf', fontWeight: 500 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ]
});

// Define styles
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 22,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af',
    borderBottomStyle: 'solid'
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e40af',
    textAlign: 'center',
    marginBottom: 5
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 10
  },
  subtitle: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 10
  },
  section: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#1e40af'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 5
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4
  },
  col: {
    flexDirection: 'column',
    flex: 1
  },
  label: {
    fontSize: 10,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: 'medium'
  },
  value: {
    fontSize: 11,
    color: '#111827',
    marginBottom: 4
  },
  required: {
    fontSize: 8,
    color: '#ef4444',
    marginLeft: 2
  },
  checkbox: {
    fontSize: 10,
    marginRight: 5
  },
  checkboxLabel: {
    fontSize: 10,
    color: '#374151'
  },
  inspectionTable: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db'
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  tableCell: {
    fontSize: 9,
    color: '#374151',
    paddingHorizontal: 4
  },
  tableCellHeader: {
    fontSize: 9,
    color: '#1e40af',
    fontWeight: 'bold',
    paddingHorizontal: 4
  },
  inspectionItemCell: {
    flex: 2
  },
  statusCell: {
    flex: 1,
    textAlign: 'center'
  },
  sideCell: {
    flex: 1,
    textAlign: 'center'
  },
  remarksCell: {
    flex: 3
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 4,
    padding: 10,
    marginBottom: 15
  },
  warningText: {
    fontSize: 10,
    color: '#92400e',
    lineHeight: 1.4
  },
  termsSection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 8
  },
  termsContent: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.3,
    marginBottom: 4
  },
  signatureSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db'
  },
  signatureBox: {
    height: 72,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: '#f9fafb'
  },
  signatureImage: {
    width: '100%',
    height: '100%',
    objectFit: 'contain'
  },
  footer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    fontSize: 8,
    color: '#6b7280',
    textAlign: 'center'
  },
  pageNumber: {
    position: 'absolute',
    fontSize: 10,
    bottom: 30,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#9ca3af'
  },
  mediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6
  },
  mediaItem: {
    width: '48%',
    marginRight: '2%',
    marginBottom: 8
  },
  mediaImage: {
    width: '100%',
    height: 120,
    objectFit: 'cover',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  mediaCaption: {
    fontSize: 8,
    color: '#6b7280',
    marginTop: 2
  },
  mediaMeta: {
    fontSize: 7,
    color: '#6b7280',
    marginTop: 1
  },
  mediaLink: {
    fontSize: 8,
    color: '#2563eb',
    marginTop: 3
  },
  mediaPlaceholder: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
  }
});

interface PreChecklistPDFProps {
  formData: any;
  stats: any;
  existingChecklist?: any;
  opportunity?: any;
  vehicle?: any;
  workOrder?: any;
}

const PreChecklistPDF: React.FC<PreChecklistPDFProps> = ({ 
  formData, 
  stats, 
  existingChecklist,
  opportunity,
  vehicle,
  workOrder 
}) => {
  const currentDate = new Date();
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'â€”';
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy hh:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to get service type label
  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'pickup_only': return 'Product Pickup Only';
      case 'workshop_installation': return 'Workshop Installation';
      case 'mobile_service': return 'Mobile Service';
      default: return type;
    }
  };

  // Helper function to get installation time label
  const getInstallationTimeLabel = (time: string) => {
    switch (time) {
      case 'less_1_hour': return '< 1 hour';
      case '1_2_hours': return '1-2 hours';
      case '3_hours': return '3 hours';
      case 'more_3_hours': return '> 3 hours';
      default: return time;
    }
  };

  // Helper function to get delivery method label
  const getDeliveryMethodLabel = (method: string) => {
    switch (method) {
      case 'customer_pickup': return 'Customer Pickup (at workshop)';
      case 'courier_delivery': return 'Courier Service Delivery';
      case 'mobile_delivery_install': return 'We Deliver & Install (mobile service)';
      default: return method;
    }
  };

  // Get status symbol
  const getStatusSymbol = (status: string) => {
    switch (status) {
      case 'ok': return 'âœ“';
      case 'fault': return 'âœ—';
      case 'n/a': return 'â€”';
      case 'pending': return '?';
      default: return '';
    }
  };

  const apiBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '').replace(/\/+$/, '');
  const normalizeMediaSource = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:video/')) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) {
      if (apiBaseUrl) return `${apiBaseUrl}${trimmed}`;
      return trimmed;
    }
    if (apiBaseUrl && !trimmed.startsWith('blob:')) {
      return `${apiBaseUrl}/${trimmed.replace(/^\/+/, '')}`;
    }
    return null;
  };

  const normalizeImageSource = (value: unknown): string | null => {
    const normalized = normalizeMediaSource(value);
    if (!normalized || normalized.startsWith('data:video/')) return null;
    return normalized;
  };

  const parseAdditionalInfo = (value: unknown) => {
    if (typeof value !== 'string') return {};
    const trimmed = value.trim();
    if (!trimmed.startsWith('{')) return {};
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  };

  const additionalInfo = parseAdditionalInfo(formData.additionalInformation);
  const customerDetails = formData.customerDetails || {};
  const carDetails = formData.carDetails || {};
  const installationDetails = formData.installationDetails || additionalInfo.installationDetails || {};
  const resolvedServiceType = formData.serviceType || additionalInfo.serviceType || 'workshop_installation';
  const resolvedDeliveryMethod = formData.deliveryPickupMethod || additionalInfo.deliveryPickupMethod || 'customer_pickup';
  const clientSignatureSrc = normalizeImageSource(formData.clientSignature);
  const inspectorSignatureSrc = normalizeImageSource(formData.inspectorSignature);
  const mediaEntries = Array.isArray(formData.files)
    ? formData.files
        .map((file: any, index: number) => {
          const src = normalizeMediaSource(file?.path || file?.url || '');
          const thumbnailSrc = normalizeImageSource(file?.thumbnailPath || '');
          const mimeType = String(file?.mimeType || file?.fileType || '').toLowerCase();
          const filename = String(file?.originalName || file?.filename || '').trim();
          const sourceHint = String(file?.path || file?.url || '').toLowerCase();
          const isVideo =
            mimeType.includes('video') ||
            /\.(mp4|mov|avi|webm|mkv|m4v|3gp|ogv|ogg)(\?|#|$)/i.test(filename.toLowerCase()) ||
            /\.(mp4|mov|avi|webm|mkv|m4v|3gp|ogv|ogg)(\?|#|$)/i.test(sourceHint);

          return {
            src,
            thumbnailSrc,
            label: filename || `Attachment ${index + 1}`,
            isVideo,
          };
        })
        .filter((entry) => Boolean(entry.src))
    : [];

  const uploadedImageSources = Array.from(
    new Set(
      [
        ...(Array.isArray(formData.uploadedImages) ? formData.uploadedImages : []),
        ...mediaEntries
          .filter((entry) => !entry.isVideo)
          .map((entry) => entry.src),
        ...mediaEntries
          .map((entry) => entry.thumbnailSrc)
          .filter((entry): entry is string => Boolean(entry)),
      ]
        .map((source) => normalizeImageSource(source))
        .filter((source): source is string => Boolean(source))
    )
  );
  const uploadedVideoEntries: Array<{ src: string; label: string; previewSrc: string | null }> = Array.from(
    new Map<string, { src: string; label: string; previewSrc: string | null }>(
      mediaEntries
        .filter((entry) => entry.isVideo)
        .map((entry) => [
          entry.src,
          {
            src: entry.src as string,
            label: entry.label || 'Video attachment',
            previewSrc: entry.thumbnailSrc || null,
          },
        ])
    ).values()
  );

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Eagle Lights Automotive LTD</Text>
          <Text style={styles.title}>HEADLIGHT PRE-SERVICE INSPECTION CHECKLIST</Text>
          <Text style={styles.subtitle}>
            Checklist ID: {existingChecklist?._id?.slice(-8) || 'NEW'} | Date: {formatDate(currentDate.toISOString())}
          </Text>
        </View>

        {/* Service Type */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRE-CHECKLIST</Text>
          <Text style={styles.sectionSubtitle}>SERVICE TYPE</Text>
          <View style={{ flexDirection: 'row', marginTop: 5 }}>
            {['pickup_only', 'workshop_installation', 'mobile_service'].map((type) => (
              <View key={type} style={{ marginRight: 15 }}>
                <Text style={styles.checkbox}>
                  {resolvedServiceType === type ? 'â˜‘' : 'â˜'} {getServiceTypeLabel(type)}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Inspector Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSPECTOR DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>INSPECTOR NAME </Text>
              <Text style={styles.value}>{formData.inspectorName || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>NAME </Text>
              <Text style={styles.value}>
                {`${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() || customerDetails.name || 'â€”'}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>EMAIL </Text>
              <Text style={styles.value}>{formData.customerDetails.email || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>PHONE NO </Text>
              <Text style={styles.value}>{customerDetails.mobile || customerDetails.phone || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Car Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAR DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>REG NO</Text>
              <Text style={styles.value}>{carDetails.regNo || carDetails.licensePlate || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>MAKE</Text>
              <Text style={styles.value}>{carDetails.make || carDetails.carMake || 'â€”'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>YEAR OF MANUFACTURE</Text>
              <Text style={styles.value}>{carDetails.year || carDetails.yearOfManufacture || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>MODEL</Text>
              <Text style={styles.value}>{carDetails.model || carDetails.carModel || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>VIN</Text>
              <Text style={styles.value}>{formData.carDetails.vin || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Product/Service Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRODUCT / SERVICE DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>PRODUCT / SERVICE NEEDED</Text>
              <Text style={styles.value}>{formData.productServiceNeeded || 'â€”'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>PRODUCT PRICE (KES)</Text>
              <Text style={styles.value}>{formData.productPrice ? `KES ${formData.productPrice.toLocaleString()}` : 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>SERVICE PRICE (KES)</Text>
              <Text style={styles.value}>{formData.servicePrice ? `KES ${formData.servicePrice.toLocaleString()}` : 'â€”'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>ADDITIONAL INFORMATION</Text>
              <Text style={styles.value}>{formData.additionalInformation || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Installation Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INSTALLATION DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>ESTIMATED INSTALLATION TIME</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 3 }}>
                {['less_1_hour', '1_2_hours', '3_hours', 'more_3_hours'].map((time) => (
                  <Text key={time} style={{ fontSize: 9, marginRight: 10, marginBottom: 3 }}>
                    {installationDetails.estimatedTime === time ? 'â˜‘' : 'â˜'} {getInstallationTimeLabel(time)}
                  </Text>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>ASSIGNED TECHNICIAN</Text>
              <Text style={styles.value}>{installationDetails.assignedTechnician || 'â€”'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>WORK START TIME</Text>
              <Text style={styles.value}>{formatDate(installationDetails.workStartTime)}</Text>
            </View>
          </View>
        </View>

        {/* Inspection Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            INSPECTION DETAILS  L-LEFT SIDE  R-RIGHT SIDE
          </Text>
          <Text style={{ fontSize: 10, color: '#374151', marginBottom: 5 }}>
            INSPECTION ITEM (TICK IF IT IS WORKING)
          </Text>
          
          {/* Inspection Table */}
          <View style={styles.inspectionTable}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <View style={[styles.tableCell, styles.inspectionItemCell]}>
                <Text style={styles.tableCellHeader}>INSPECTION ITEM</Text>
              </View>
              <View style={[styles.tableCell, styles.statusCell]}>
                <Text style={styles.tableCellHeader}>STATUS</Text>
              </View>
              <View style={[styles.tableCell, styles.sideCell]}>
                <Text style={styles.tableCellHeader}>L</Text>
              </View>
              <View style={[styles.tableCell, styles.sideCell]}>
                <Text style={styles.tableCellHeader}>R</Text>
              </View>
              <View style={[styles.tableCell, styles.remarksCell]}>
                <Text style={styles.tableCellHeader}>REMARKS</Text>
              </View>
            </View>

            {/* Table Rows */}
            {formData.inspectionItems.map((item: any, index: number) => (
              <View key={index} style={styles.tableRow}>
                <View style={[styles.tableCell, styles.inspectionItemCell]}>
                  <Text style={{ fontSize: 9 }}>{item.item}</Text>
                </View>
                <View style={[styles.tableCell, styles.statusCell]}>
                  <Text style={{ fontSize: 9 }}>{getStatusSymbol(item.status)}</Text>
                </View>
                <View style={[styles.tableCell, styles.sideCell]}>
                  <Text style={{ fontSize: 9 }}>
                    {item.side === 'both' || item.side === 'left' ? 'âœ“' : 'â€”'}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.sideCell]}>
                  <Text style={{ fontSize: 9 }}>
                    {item.side === 'both' || item.side === 'right' ? 'âœ“' : 'â€”'}
                  </Text>
                </View>
                <View style={[styles.tableCell, styles.remarksCell]}>
                  <Text style={{ fontSize: 8 }}>{item.remarks || 'â€”'}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Inspection Summary */}
          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>Total Items: {stats.total}</Text>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>OK: {stats.ok}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>Faults: {stats.fault}</Text>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>N/A: {stats.na}</Text>
            </View>
            <View>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>Pending: {stats.pending}</Text>
            </View>
          </View>
        </View>

        {/* Delivery/Pickup Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY/PICKUP METHOD</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 }}>
            {['customer_pickup', 'courier_delivery', 'mobile_delivery_install'].map((method) => (
              <Text key={method} style={{ fontSize: 9, marginRight: 15, marginBottom: 3 }}>
                {resolvedDeliveryMethod === method ? 'â˜‘' : 'â˜'} {getDeliveryMethodLabel(method)}
              </Text>
            ))}
          </View>
        </View>

        {/* Warning Notice */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            NOTICE: If your vehicle has dashboard warning lights/errors, 
            additional diagnostic charges may apply for error code reading/clearing
          </Text>
          <View style={{ marginTop: 5 }}>
            <Text style={styles.checkbox}>
              {formData.acceptDiagnosticCharges ? 'â˜‘' : 'â˜'} I understand that dashboard error diagnosis/clearing incurs additional charges as per the service rate card
            </Text>
          </View>
        </View>

        {/* Page Break for terms if needed */}
        <View style={{ marginTop: 15 }}>
          <Text style={styles.footer}>--- Page 1 of 2 ---</Text>
        </View>
      </Page>

      {/* Second Page for Terms */}
      <Page size="A4" style={styles.page}>
        {/* Terms and Conditions Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>Eagle Lights Automotive LTD</Text>
          <Text style={styles.title}>TERMS AND CONDITIONS</Text>
          <Text style={styles.subtitle}>Headlight Pre-Service Inspection Checklist</Text>
        </View>

        {/* Personal Items Terms */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>Personal Items & Valuables</Text>
          <Text style={styles.termsContent}>
            1. Eagle Lights Automotive LTD takes great care in servicing your vehicle, but we strongly recommend that you remove all personal items, valuables, and items of sentimental value from your vehicle before leaving it in our care for service.
          </Text>
          <Text style={styles.termsContent}>
            2. While we make every effort to ensure the safety and security of your personal belongings, we want to make it clear that we cannot accept liability for any loss, damage, or theft of items left in your vehicle during the service process.
          </Text>
          <Text style={styles.termsContent}>
            3. This includes, but is not limited to, electronic devices, jewelry, cash, documents, and any other personal property.
          </Text>
          <Text style={styles.termsContent}>
            4. We advise you to thoroughly inspect your vehicle before handing it over to us for service and ensure that all personal items are removed.
          </Text>
          <Text style={styles.termsContent}>
            5. By choosing to leave personal items in your vehicle during service, you acknowledge and accept that Eagle Lights Automotive LTD is not liable for any loss or damage to these items.
          </Text>
        </View>

        {/* Headlight Specific Terms */}
        <View style={[styles.termsSection, { marginTop: 10 }]}>
          <Text style={styles.termsTitle}>Headlight Service Terms & Conditions</Text>
          
          {/* Section 1 */}
          <Text style={[styles.termsContent, { marginTop: 5 }]}>
            <Text style={{ fontWeight: 'bold' }}>1. Scope and Customer Obligations:</Text>
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            1.1. Eagle Lights specialises in automotive lighting, offering headlight installations and customizations.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            1.2. Accurate vehicle information is crucial, and customers must disclose pre-existing modifications.
          </Text>

          {/* Section 2 */}
          <Text style={[styles.termsContent, { marginTop: 5 }]}>
            <Text style={{ fontWeight: 'bold' }}>2. Manufacturer's Warranty and Voiding Conditions:</Text>
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            2.1. While Eagle Lights provides a limited warranty for workmanship, manufacturer's warranties vary and are not our responsibility.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            2.2. Certain actions, like unauthorised modifications, shall void the warranty.
          </Text>

          {/* Section 3 */}
          <Text style={[styles.termsContent, { marginTop: 5 }]}>
            <Text style={{ fontWeight: 'bold' }}>3. Warranty Period and Refund:</Text>
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            3.1. The warranty period for workmanship is Six Months to One Year depending on the product.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            3.2. Refunds cannot be given if Eagle Lights has attained the expected standards regardless of whether the client's standards have not been achieved.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            3.3. If a client requests a refund, Eagle Lights will charge it as a new installation, and installation rates will be applicable.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            3.4. We do not provide a refund if the vehicle rejects the product installed, and the product testing shows that the product is working properly.
          </Text>

          {/* Section 4 */}
          <Text style={[styles.termsContent, { marginTop: 5 }]}>
            <Text style={{ fontWeight: 'bold' }}>4. Unauthorised Modifications:</Text>
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            4.1. Unauthorised alterations to installed components, including those not performed by Eagle Lights technicians, will void the warranty and limit liability.
          </Text>

          {/* Continue with other sections... */}
          <Text style={[styles.termsContent, { marginTop: 5 }]}>
            <Text style={{ fontWeight: 'bold' }}>5. Service Charges and Payments:</Text>
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            5.1. Customers agree to pay for services as outlined in the invoice.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            5.2. Late payments may incur additional charges.
          </Text>

          <Text style={[styles.termsContent, { marginTop: 5 }]}>
            <Text style={{ fontWeight: 'bold' }}>6. Risks and Informed Decision:</Text>
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            6.1. Customers acknowledge that customizations and upgrades involve risks, including compatibility and breakage issues.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            6.2. They make informed decisions to proceed despite these risks.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            6.3. Customization/Upgrade may cause engine errors. In such events, the customer will be responsible for clearing such errors with Eagle Lights assistance.
          </Text>
          <Text style={[styles.termsContent, { marginLeft: 10 }]}>
            6.4. Once customization is done, it may be impossible to return the headlight back to the original manufacturer's design.
          </Text>

          {/* Add more sections as needed... */}
        </View>

        {/* Terms Acceptance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERMS ACCEPTANCE</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.checkbox}>
              {formData.acceptTerms ? 'â˜‘' : 'â˜'} I accept the Terms and Conditions of Eagle Lights Automotive LTD
            </Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>CLIENT SIGNATURE </Text>
              <View style={styles.signatureBox}>
                {clientSignatureSrc ? (
                  <Image src={clientSignatureSrc} style={styles.signatureImage} />
                ) : (
                  <Text style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', paddingTop: 24 }}>No client signature captured</Text>
                )}
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>INSPECTOR SIGNATURE </Text>
              <View style={styles.signatureBox}>
                {inspectorSignatureSrc ? (
                  <Image src={inspectorSignatureSrc} style={styles.signatureImage} />
                ) : (
                  <Text style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', paddingTop: 24 }}>No inspector signature captured</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Uploads Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>UPLOADS</Text>
          <Text style={styles.label}>Images & Videos</Text>
          {(uploadedImageSources.length > 0 || uploadedVideoEntries.length > 0) ? (
            <>
              <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 5 }}>
                {`${uploadedImageSources.length} image(s), ${uploadedVideoEntries.length} video(s) attached`}
              </Text>
              <View style={styles.mediaGrid}>
                {uploadedImageSources.slice(0, 8).map((imageSrc, index) => (
                  <View key={`${imageSrc}-${index}`} style={styles.mediaItem}>
                    <Image src={imageSrc} style={styles.mediaImage} />
                    <Text style={styles.mediaCaption}>Image {index + 1}</Text>
                  </View>
                ))}
                {uploadedVideoEntries.slice(0, 4).map((videoEntry, index) => (
                  <View key={`${videoEntry.src}-${index}`} style={styles.mediaItem}>
                    {videoEntry.previewSrc ? (
                      <Image src={videoEntry.previewSrc} style={styles.mediaImage} />
                    ) : (
                      <View style={styles.mediaPlaceholder}>
                        <Text style={styles.value}>Video Preview Unavailable</Text>
                      </View>
                    )}
                    <Text style={styles.mediaCaption}>Video {index + 1}</Text>
                    <Text style={styles.mediaMeta}>{videoEntry.label}</Text>
                    <Link src={videoEntry.src} style={styles.mediaLink}>
                      Open video link
                    </Link>
                  </View>
                ))}
              </View>
            </>
          ) : (
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 5 }}>No images or videos uploaded</Text>
          )}
        </View>

        {/* Remarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ADDITIONAL REMARKS</Text>
          <Text style={{ fontSize: 10, color: '#374151', marginTop: 5 }}>
            {formData.remarks || 'No additional remarks'}
          </Text>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on: {formatDate(currentDate.toISOString())}</Text>
          <Text>Checklist ID: {existingChecklist?._id?.slice(-8) || 'NEW'}</Text>
          <Text>Vehicle: {carDetails.regNo || carDetails.licensePlate || 'Not specified'}</Text>
          <Text style={styles.pageNumber}>--- Page 2 of 2 ---</Text>
        </View>
      </Page>
    </Document>
  );
};

export default PreChecklistPDF;
