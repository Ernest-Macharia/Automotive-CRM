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

// Register fonts
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
    padding: 18,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 2,
    borderBottomColor: '#7c3aed',
    borderBottomStyle: 'solid'
  },
  companyName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#7c3aed',
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
    marginBottom: 8,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#7c3aed'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c3aed',
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
    marginBottom: 3
  },
  col: {
    flexDirection: 'column',
    flex: 1
  },
  label: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 2,
    fontWeight: 'medium'
  },
  value: {
    fontSize: 10.5,
    color: '#111827',
    marginBottom: 3
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
  table: {
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
    color: '#7c3aed',
    fontWeight: 'bold',
    paddingHorizontal: 4
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
    marginTop: 8,
    padding: 10,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1'
  },
  termsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 8
  },
  termsContent: {
    fontSize: 8,
    color: '#374151',
    lineHeight: 1.3,
    marginBottom: 4
  },
  signatureSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db'
  },
  signatureBox: {
    height: 64,
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
    marginTop: 8,
    paddingTop: 8,
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
  multiLineValue: {
    fontSize: 10.5,
    color: '#111827',
    marginBottom: 3,
    lineHeight: 1.3
  },
  serviceBadge: {
    backgroundColor: '#ede9fe',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 3,
    fontSize: 8,
    color: '#7c3aed'
  },
  conditionBadge: {
    backgroundColor: '#fef3c7',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 5,
    marginBottom: 3,
    fontSize: 8,
    color: '#92400e'
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5
  },
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3
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
    height: 95,
    objectFit: 'cover',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  mediaPlaceholder: {
    width: '100%',
    height: 95,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8
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
  }
});

interface DiamondRimsPDFProps {
  formData: any;
  opportunity?: any;
  vehicle?: any;
  workOrder?: any;
}

const DiamondRimsPDF: React.FC<DiamondRimsPDFProps> = ({ 
  formData, 
  opportunity,
  vehicle,
  workOrder 
}) => {
  const currentDate = new Date();
  
  // Helper function to format date
  const formatDate = (dateString: string) => {
    if (!dateString) return 'â€”';
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to format KSH amounts
  const formatKES = (amount: unknown, currencyCode?: unknown) => {
    const parsedAmount = typeof amount === 'number' ? amount : Number(amount);
    const safeAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
    const normalizedCurrency = String(currencyCode || '').trim().toUpperCase();
    const currencyLabel = normalizedCurrency === 'KES' || normalizedCurrency === 'KSH' ? 'KSH' : 'KSH';

    return `KSH ${safeAmount.toLocaleString('en-KE', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    })}`;
  };

  // Check if array has items
  const hasItems = (array: any[]) => {
    return array && Array.isArray(array) && array.length > 0;
  };

  // Check if value exists
  const hasValue = (value: any) => {
    return value !== undefined && value !== null && value !== '';
  };

  const apiBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || '').replace(/\/+$/, '');
  const normalizeMediaSource = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:video/')) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/') && apiBaseUrl) return `${apiBaseUrl}${trimmed}`;
    return null;
  };

  const normalizeImageSource = (value: unknown): string | null => {
    const normalized = normalizeMediaSource(value);
    if (!normalized || normalized.startsWith('data:video/')) return null;
    return normalized;
  };

  // Get delivery mode label
  const getDeliveryModeLabel = (mode: string) => {
    switch (mode) {
      case 'Customer Pickup': return 'Customer Pickup';
      case 'Courier Delivery': return 'Courier Delivery';
      case 'Mobile Service': return 'Mobile Service';
      default: return mode;
    }
  };

  const stringifyValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    return '';
  };

  const toPositiveNumber = (value: unknown): number | null => {
    const candidate = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(candidate) || candidate <= 0) {
      return null;
    }
    return candidate;
  };

  const agreedAmountTotal =
    toPositiveNumber(formData.agreedAmount?.total) ??
    toPositiveNumber(formData.pricingSnapshot?.total) ??
    0;

  const mediaEntries = Array.isArray(formData.files)
    ? formData.files
        .map((file: any, index: number) => {
          const src = normalizeMediaSource(file?.path || file?.url || '');
          const thumbnailSrc = normalizeImageSource(file?.thumbnailPath || '');
          const mimeType = stringifyValue(file?.mimeType || file?.fileType).toLowerCase();
          const filename = stringifyValue(file?.originalName || file?.filename || '');
          const sourceHint = stringifyValue(file?.path || file?.url || '').toLowerCase();
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

  const resolveRiskAcknowledgement = (riskKey: string): boolean => {
    const associatedRisks = formData.clientUpdate?.associatedRisks;
    if (associatedRisks && typeof associatedRisks[riskKey] === 'boolean') {
      return associatedRisks[riskKey];
    }
    if (typeof formData.clientUpdate?.[riskKey] === 'boolean') {
      return formData.clientUpdate[riskKey];
    }
    return false;
  };

  const formatCenterCapsSummary = () => {
    const centerCaps = formData.centerCaps;
    if (!centerCaps || typeof centerCaps !== 'object') {
      return stringifyValue(centerCaps) || '-';
    }

    const presentLabel = centerCaps.present ? 'Present' : 'Not Present';
    const quantityLabel = hasValue(centerCaps.quantity) ? `Qty ${centerCaps.quantity}` : '';
    const conditionLabel = stringifyValue(centerCaps.condition);
    const typeLabel = stringifyValue(centerCaps.type);
    const parts = [presentLabel, quantityLabel, conditionLabel, typeLabel].filter(Boolean);
    return parts.join(' | ') || '-';
  };

  const formatDeclaredValuableSummary = () => {
    const declared = formData.declaredValuable;
    if (declared && typeof declared === 'object') {
      return declared.value ? 'Yes' : 'No';
    }
    return declared ? 'Yes' : 'No';
  };

  const isObjectIdLike = (value: unknown): boolean => {
    if (typeof value !== 'string') return false;
    return /^[a-fA-F0-9]{24}$/.test(value.trim());
  };

  const resolveInspectorName = (): string => {
    const intakeInspectorName = stringifyValue(formData.serviceIntake?.customerServiceRep);
    if (intakeInspectorName) return intakeInspectorName;

    const directInspectorName = stringifyValue(formData.inspectorName);
    if (directInspectorName) return directInspectorName;

    const inspectedBy = formData.inspectedBy;
    if (inspectedBy && typeof inspectedBy === 'object') {
      const firstName = stringifyValue((inspectedBy as any).firstName);
      const lastName = stringifyValue((inspectedBy as any).lastName);
      const fullName = `${firstName} ${lastName}`.trim();
      if (fullName) return fullName;

      const displayName = stringifyValue((inspectedBy as any).name);
      if (displayName) return displayName;
    }

    const inspectedByText = stringifyValue(inspectedBy);
    if (inspectedByText && !isObjectIdLike(inspectedByText)) {
      return inspectedByText;
    }

    return '-';
  };

  const rimOrTireLabel = stringifyValue(formData.rimOrTireSelection) || '-';
  const resolvedInspectorName = resolveInspectorName();
  const selectedSuitabilityServices = Array.from(
    new Set(
      (Array.isArray(formData.services?.actualService) ? formData.services.actualService : [])
        .map((service: unknown) => stringifyValue(service))
        .filter(Boolean)
    )
  );
  const suitabilityServiceSummary = selectedSuitabilityServices.length > 0
    ? selectedSuitabilityServices.join(', ')
    : '-';
  const hasAnyTireBrandValue = ['fr', 'fl', 'br', 'bl', 'spare'].some((position) =>
    hasValue(formData.tireBrands?.[position])
  );
  const hasAnyTireDotValue = ['fr', 'fl', 'br', 'bl', 'spare'].some((position) => {
    const dot = formData.tireDOT?.[position];
    return hasValue(dot?.code) || hasValue(dot?.week) || hasValue(dot?.year) || hasValue(dot?.plant);
  });
  const clientSignatureSrc = normalizeImageSource(formData.clientSignature);
  const inspectorSignatureSrc = normalizeImageSource(formData.inspectorSignature);
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
        .map((candidate) => normalizeImageSource(candidate))
        .filter((candidate): candidate is string => Boolean(candidate))
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
          <Text style={styles.companyName}>DIAMOND RIMZ LTD</Text>
          <Text style={styles.title}>SERVICE INTAKE FORM</Text>
          <Text style={styles.subtitle}>
            Checklist ID: {formData._id?.slice(-8) || 'NEW'} | Date: {formatDate(currentDate.toISOString())}
          </Text>
        </View>

        {/* CUSTOMER SERVICE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER SERVICE</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>DATE</Text>
              <Text style={styles.value}>{formatDate(formData.serviceIntake?.date) || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>INSPECTOR NAME</Text>
              <Text style={styles.value}>{resolvedInspectorName}</Text>
            </View>
          </View>
          {hasValue(formData.serviceIntake?.priorityLevel) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>PRIORITY LEVEL</Text>
                <Text style={styles.value}>{formData.serviceIntake?.priorityLevel || '-'}</Text>
              </View>
            </View>
          )}
          {(hasValue(formData.serviceIntake?.inspectorNotes) || hasValue(formData.serviceIntake?.specialInstructions)) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>INSPECTOR NOTES</Text>
                <Text style={styles.multiLineValue}>{formData.serviceIntake?.inspectorNotes || '-'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>SPECIAL INSTRUCTIONS</Text>
                <Text style={styles.multiLineValue}>{formData.serviceIntake?.specialInstructions || '-'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* CUSTOMER DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>NAME</Text>
              <Text style={styles.value}>
                {formData.customerDetails?.firstName || ''} {formData.customerDetails?.lastName || ''}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>MOBILE</Text>
              <Text style={styles.value}>{formData.customerDetails?.mobile || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>EMAIL</Text>
              <Text style={styles.value}>{formData.customerDetails?.email || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* CAR DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAR DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>CAR MAKE</Text>
              <Text style={styles.value}>{formData.carDetails?.carMake || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>CAR MODEL</Text>
              <Text style={styles.value}>{formData.carDetails?.carModel || 'â€”'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>MILEAGE</Text>
              <Text style={styles.value}>{formData.carDetails?.mileage || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>YEAR OF MANUFACTURE</Text>
              <Text style={styles.value}>{formData.carDetails?.yearOfManufacture || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>LICENSE PLATE</Text>
              <Text style={styles.value}>{formData.carDetails?.licensePlate || 'â€”'}</Text>
            </View>
          </View>
          {(hasValue(formData.carDetails?.color) || hasValue(formData.carDetails?.vehicleType) || hasValue(formData.carDetails?.fuelType)) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>COLOR</Text>
                <Text style={styles.value}>{formData.carDetails?.color || '-'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>VEHICLE TYPE</Text>
                <Text style={styles.value}>{formData.carDetails?.vehicleType || '-'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>FUEL TYPE</Text>
                <Text style={styles.value}>{formData.carDetails?.fuelType || '-'}</Text>
              </View>
            </View>
          )}
          {hasValue(formData.carDetails?.engineSize) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>ENGINE SIZE</Text>
                <Text style={styles.value}>{formData.carDetails?.engineSize || '-'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* SERVICES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SERVICES</Text>
          <Text style={styles.label}>ACTUAL SERVICE</Text>
          <View style={styles.badgeContainer}>
            {hasItems(formData.services?.actualService) ? (
              formData.services.actualService.map((service: string, index: number) => (
                <View key={index} style={styles.serviceBadge}>
                  <Text>{service}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>â€”</Text>
            )}
          </View>
        </View>

        {/* PRE-SERVICE INSPECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRE-SERVICE INSPECTION</Text>
          <Text style={styles.label}>CONDITION</Text>
          <View style={styles.badgeContainer}>
            {hasItems(formData.preServiceInspection?.condition) ? (
              formData.preServiceInspection.condition.map((condition: string, index: number) => (
                <View key={index} style={styles.conditionBadge}>
                  <Text>{condition}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>â€”</Text>
            )}
          </View>
          {(hasValue(formData.preServiceInspection?.inspectorAccessNotes) || hasValue(formData.preServiceInspection?.inspectionNotes)) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>INSPECTOR ACCESS NOTES</Text>
                <Text style={styles.multiLineValue}>{formData.preServiceInspection?.inspectorAccessNotes || '-'}</Text>
              </View>
            </View>
          )}
          {(hasValue(formData.preServiceInspection?.inspectionNotes) || hasValue(formData.preServiceInspection?.photosRequired) || hasValue(formData.preServiceInspection?.videoRequired)) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>INSPECTION NOTES</Text>
                <Text style={styles.multiLineValue}>{formData.preServiceInspection?.inspectionNotes || '-'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>MEDIA REQUIREMENTS</Text>
                <Text style={styles.value}>
                  Photos: {formData.preServiceInspection?.photosRequired ? 'Yes' : 'No'} | Video: {formData.preServiceInspection?.videoRequired ? 'Yes' : 'No'}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* POWDER COATING COLOURS */}
        {hasValue(formData.powderCoating?.colourRAL) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>POWDER COATING COLOURS</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>POWDER COATING COLOUR (RAL)</Text>
                <Text style={styles.value}>{formData.powderCoating?.colourRAL || 'â€”'}</Text>
              </View>
            </View>
          </View>
        )}

      </Page>

      {/* Second Page */}
      <Page size="A4" style={styles.page}>
        {/* Header for Page 2 */}
        <View style={styles.header}>
          <Text style={styles.companyName}>DIAMOND RIMZ LTD</Text>
          <Text style={styles.title}>SERVICE INTAKE FORM (CONTINUED)</Text>
          <Text style={styles.subtitle}>
            Checklist ID: {formData._id?.slice(-8) || 'NEW'} | Date: {formatDate(currentDate.toISOString())}
          </Text>
        </View>

        {/* DELIVERY & ACCESSORIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DELIVERY & ACCESSORIES</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>DELIVERY MODE</Text>
              <Text style={styles.value}>{getDeliveryModeLabel(formData.deliveryMode) || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TPMS SENSORS FITTED</Text>
              <Text style={styles.value}>{formData.tpmsSensorsFitted ? 'Yes' : 'No'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TOTAL NUMBER OF WHEEL NUTS</Text>
              <Text style={styles.value}>{formData.wheelNutsTotal || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TOTAL NUMBER OF NOZZLE CAPS</Text>
              <Text style={styles.value}>{formData.nozzleCapsTotal || 'â€”'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>NOZZLE CAPS TYPE</Text>
              <Text style={styles.value}>{formData.nozzleCapsType || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TOTAL NUMBER OF LOCK NUTS</Text>
              <Text style={styles.value}>{formData.lockNutsTotal || 'â€”'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>CENTER CAPS</Text>
              <Text style={styles.value}>{formatCenterCapsSummary()}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>RIMS/TIRES</Text>
              <Text style={styles.value}>{rimOrTireLabel}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>DECLARED VALUABLE</Text>
              <Text style={styles.value}>{formatDeclaredValuableSummary()}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>DECLARED VALUE</Text>
              <Text style={styles.value}>
                {formData.declaredValuable?.value && Number(formData.declaredValuable?.declaredValue || 0) > 0
                  ? formatKES(Number(formData.declaredValuable?.declaredValue || 0))
                  : '-'}
              </Text>
            </View>
          </View>
          {hasValue(formData.declaredValuable?.notes) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>DECLARED VALUABLE NOTES</Text>
                <Text style={styles.multiLineValue}>{formData.declaredValuable?.notes || '-'}</Text>
              </View>
            </View>
          )}
        </View>

        {/* RIMS / TIRES DETAILS */}
        {(hasValue(formData.rimOrTireSelection) || hasValue(formData.rimsDetails?.size) || hasValue(formData.tiresDetails?.size)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>RIMS / TIRES DETAILS</Text>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>SELECTION</Text>
                <Text style={styles.value}>{rimOrTireLabel}</Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>RIMS</Text>
                <Text style={styles.multiLineValue}>
                  Qty: {formData.rimsDetails?.quantity || 0} | Size: {formData.rimsDetails?.size || '-'} | Type: {formData.rimsDetails?.type || '-'} | Condition: {formData.rimsDetails?.condition || '-'}
                </Text>
              </View>
            </View>
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TIRES</Text>
                <Text style={styles.multiLineValue}>
                  Qty: {formData.tiresDetails?.quantity || 0} | Size: {formData.tiresDetails?.size || '-'} | Type: {formData.tiresDetails?.type || '-'} | Tread Depth: {formData.tiresDetails?.treadDepth || '-'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* TIRE BRANDS */}
        {hasAnyTireBrandValue && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TIRE BRANDS</Text>
            
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE BRAND - FR (FRONT RIGHT)</Text>
                <Text style={styles.value}>{formData.tireBrands?.fr || 'â€”'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE BRAND - FL (FRONT LEFT)</Text>
                <Text style={styles.value}>{formData.tireBrands?.fl || 'â€”'}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE BRAND - BR (BACK RIGHT)</Text>
                <Text style={styles.value}>{formData.tireBrands?.br || 'â€”'}</Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE BRAND - BL (BACK LEFT)</Text>
                <Text style={styles.value}>{formData.tireBrands?.bl || 'â€”'}</Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE BRAND - SPARE</Text>
                <Text style={styles.value}>{formData.tireBrands?.spare || 'â€”'}</Text>
              </View>
            </View>
          </View>
        )}

        {/* TIRE DOT NUMBERS */}
        {hasAnyTireDotValue && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>TIRE DOT NUMBERS</Text>
            
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE DOT - FR (FRONT RIGHT)</Text>
                <Text style={styles.value}>
                  {[formData.tireDOT?.fr?.code, formData.tireDOT?.fr?.week && `W${formData.tireDOT?.fr?.week}`, formData.tireDOT?.fr?.year, formData.tireDOT?.fr?.plant].filter(Boolean).join(' | ') || 'â€”'}
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE DOT - FL (FRONT LEFT)</Text>
                <Text style={styles.value}>
                  {[formData.tireDOT?.fl?.code, formData.tireDOT?.fl?.week && `W${formData.tireDOT?.fl?.week}`, formData.tireDOT?.fl?.year, formData.tireDOT?.fl?.plant].filter(Boolean).join(' | ') || 'â€”'}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE DOT - BR (BACK RIGHT)</Text>
                <Text style={styles.value}>
                  {[formData.tireDOT?.br?.code, formData.tireDOT?.br?.week && `W${formData.tireDOT?.br?.week}`, formData.tireDOT?.br?.year, formData.tireDOT?.br?.plant].filter(Boolean).join(' | ') || 'â€”'}
                </Text>
              </View>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE DOT - BL (BACK LEFT)</Text>
                <Text style={styles.value}>
                  {[formData.tireDOT?.bl?.code, formData.tireDOT?.bl?.week && `W${formData.tireDOT?.bl?.week}`, formData.tireDOT?.bl?.year, formData.tireDOT?.bl?.plant].filter(Boolean).join(' | ') || 'â€”'}
                </Text>
              </View>
            </View>

            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>TIRE DOT - SPARE</Text>
                <Text style={styles.value}>
                  {[formData.tireDOT?.spare?.code, formData.tireDOT?.spare?.week && `W${formData.tireDOT?.spare?.week}`, formData.tireDOT?.spare?.year, formData.tireDOT?.spare?.plant].filter(Boolean).join(' | ') || 'â€”'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* SUITABILITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUITABILITY</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>SELECTED SERVICE</Text>
              <Text style={styles.value}>{suitabilityServiceSummary}</Text>
            </View>
          </View>
        </View>

        {/* ADDITIONAL INFORMATION */}
        {hasValue(formData.additionalInformation) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDITIONAL INFORMATION</Text>
            <Text style={styles.multiLineValue}>{formData.additionalInformation}</Text>
          </View>
        )}

      </Page>

      {/* Third Page - Terms, Agreements, and Signatures */}
      <Page size="A4" style={styles.page}>
        {/* Header for Page 3 */}
        <View style={styles.header}>
          <Text style={styles.companyName}>DIAMOND RIMZ LTD</Text>
          <Text style={styles.title}>TERMS, AGREEMENTS & SIGNATURES</Text>
          <Text style={styles.subtitle}>
            Checklist ID: {formData._id?.slice(-8) || 'NEW'} | Date: {formatDate(currentDate.toISOString())}
          </Text>
        </View>

        {/* MUST KNOW SECTION */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>MUST KNOW</Text>
          <Text style={styles.termsContent}>
            1. Entire Process Explained to the Customers.
          </Text>
          <Text style={styles.termsContent}>
            2. Tyres, caps, locknuts, sensors, and other items are accepted at the client's own risk.
          </Text>
          <Text style={styles.termsContent}>
            3. Personal belongings left in or with the vehicle/rims are the client's responsibility.
          </Text>
          <Text style={styles.termsContent}>
            4. Completion timelines are estimates only.
          </Text>
          <Text style={styles.termsContent}>
            5. Diamond Rimz will not release any item until full payment is received.
          </Text>
          <Text style={styles.termsContent}>
            6. Uncollected rims/parts after 5 days will attract a storage fee of KES 500 per day per part.
          </Text>
          <Text style={styles.termsContent}>
            7. Rims not collected within 12 hours of completion notification are stored at the client's risk.
          </Text>
          
          <View style={{ marginTop: 10 }}>
            <Text style={styles.checkbox}>
              {formData.mustKnowAccepted ? 'â˜‘' : 'â˜'} I acknowledge and understand all the above points *
            </Text>
          </View>
          {formData.clientUpdate?.mustKnows && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>CLIENT MUST-KNOW ACKNOWLEDGEMENTS</Text>
              <Text style={styles.termsContent}>
                {formData.clientUpdate.mustKnows.processExplained ? 'â˜‘' : 'â˜'} Process explained
              </Text>
              <Text style={styles.termsContent}>
                {formData.clientUpdate.mustKnows.clientRiskAcceptance ? 'â˜‘' : 'â˜'} Risk acceptance confirmed
              </Text>
              <Text style={styles.termsContent}>
                {formData.clientUpdate.mustKnows.personalBelongings ? 'â˜‘' : 'â˜'} Personal belongings disclosure
              </Text>
              <Text style={styles.termsContent}>
                {formData.clientUpdate.mustKnows.timelineEstimates ? 'â˜‘' : 'â˜'} Timeline estimate acknowledged
              </Text>
              <Text style={styles.termsContent}>
                {formData.clientUpdate.mustKnows.fullPaymentRequired ? 'â˜‘' : 'â˜'} Full payment requirement acknowledged
              </Text>
              <Text style={styles.termsContent}>
                {formData.clientUpdate.mustKnows.storageFees ? 'â˜‘' : 'â˜'} Storage fee notice acknowledged
              </Text>
              <Text style={styles.termsContent}>
                {formData.clientUpdate.mustKnows.storageRisk ? 'â˜‘' : 'â˜'} Storage risk acknowledged
              </Text>
            </View>
          )}
        </View>

        {/* CLIENT UPDATE - Service Risks */}
        <View style={[styles.termsSection, { marginTop: 10 }]}>
          <Text style={styles.termsTitle}>CLIENT UPDATE</Text>
          <Text style={styles.termsContent}>
            The client has been explained to the following inherent risks related with the services.
          </Text>
          
          {/* Brake Disc Skimming Risks */}
          {hasItems(formData.services?.actualService) && formData.services.actualService.includes('Brake Disc Skimming') && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.termsContent, { fontWeight: 'bold', color: '#92400e' }]}>
                Brake Disc Skimming Risks:
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Skimming is only possible if your brake disc still has enough thickness above the manufacturer's minimum spec
              </Text>
              <Text style={styles.termsContent}>
                â€¢ If your disc is cracked, heat-damaged, or severely warped, skimming may worsen the condition â€” replacement is advised
              </Text>
              <Text style={styles.termsContent}>
                â€¢ We recommend fitting new brake pads with skimmed discs. Old or uneven pads can reduce braking effectiveness.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Noise or squealing may continue post-skimming if poor-quality or worn pads are used.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ We do not guarantee results if the disc has been skimmed before or has unknown machining history.
              </Text>
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {resolveRiskAcknowledgement('brakeDiscSkimming') ? 'â˜‘ Accepted' : 'â˜ Not Accepted'}
              </Text>
            </View>
          )}

          {/* Powder Coating Risks */}
          {hasItems(formData.services?.actualService) && formData.services.actualService.includes('Powder Coating') && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.termsContent, { fontWeight: 'bold', color: '#92400e' }]}>
                Powder Coating Risks:
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Exclusion of hidden flaws (scratches, gouges, casting pits)
              </Text>
              <Text style={styles.termsContent}>
                â€¢ No warranty for high-heat areas (engine, brake)
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Colour match disclaimer (shade, lighting, material)
              </Text>
              <Text style={styles.termsContent}>
                â€¢ No guarantee of OEM matching
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Hidden flaws may appear after stripping/blasting
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Redo policy (only for technical failure, not color dissatisfaction)
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Customer aesthetic dissatisfaction not a valid claim
              </Text>
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {resolveRiskAcknowledgement('powderCoating') ? 'â˜‘ Accepted' : 'â˜ Not Accepted'}
              </Text>
            </View>
          )}

          {/* Straightening Risks */}
          {hasItems(formData.services?.actualService) && formData.services.actualService.includes('Rim Straightening') && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.termsContent, { fontWeight: 'bold', color: '#92400e' }]}>
                Straightening Risks:
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Cracked rims should not be straightened.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Welded rims are at high risk of failure during straightening.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Severely bent rims may not return to true shape.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Rims that have been straightened multiple times may fatigue.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Out-of-round rims may remain slightly distorted even after straightening.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ There is no warranty on straightening services.
              </Text>
              <Text style={styles.termsContent}>
                â€¢ Rims may crack during straightening
              </Text>
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {resolveRiskAcknowledgement('straightening') ? 'â˜‘ Accepted' : 'â˜ Not Accepted'}
              </Text>
            </View>
          )}
        </View>

        {/* AGREED AMOUNT */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AGREED AMOUNT</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TOTAL AMOUNT</Text>
              <Text style={[styles.value, { fontWeight: 'bold', color: '#7c3aed' }]}>
                {formatKES(agreedAmountTotal, formData.pricingSnapshot?.currency)}
              </Text>
            </View>
          </View>

          {hasValue(formData.agreedAmount?.breakdown) && (
            <View style={styles.row}>
              <View style={styles.col}>
                <Text style={styles.label}>BREAKDOWN (IF ANY)</Text>
                <Text style={styles.multiLineValue}>{formData.agreedAmount.breakdown}</Text>
              </View>
            </View>
          )}
        </View>

        {/* STAFF DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STAFF DETAILS</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>INSPECTOR NAME</Text>
              <Text style={styles.value}>{resolvedInspectorName}</Text>
            </View>
          </View>
        </View>

        {/* TERMS ACCEPTANCE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERMS ACCEPTANCE</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.checkbox}>
              {formData.acceptTerms ? 'â˜‘' : 'â˜'} I accept the Terms and Conditions of Diamond Rimz
            </Text>
          </View>
        </View>

        {/* SIGNATURES */}
        <View style={styles.signatureSection}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>SIGNATURE (FOR AND ON BEHALF OF THE CLIENT)</Text>
              <View style={styles.signatureBox}>
                {clientSignatureSrc ? (
                  <Image src={clientSignatureSrc} style={styles.signatureImage} />
                ) : (
                  <Text style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', paddingTop: 24 }}>No client signature captured</Text>
                )}
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>INSPECTOR SIGNATURE</Text>
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

        {/* UPLOADED MEDIA */}
        {(uploadedImageSources.length > 0 || uploadedVideoEntries.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UPLOADED MEDIA</Text>
            <Text style={styles.label}>
              {uploadedImageSources.length} image(s), {uploadedVideoEntries.length} video(s) attached
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
          </View>
        )}

        {/* REMARKS */}
        {hasValue(formData.remarks) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDITIONAL REMARKS</Text>
            <Text style={styles.multiLineValue}>{formData.remarks}</Text>
          </View>
        )}

        {hasItems(formData.inspectionItems) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>INSPECTION ITEMS</Text>
            {formData.inspectionItems.map((item: any, index: number) => (
              <Text key={`${item?._id || index}`} style={styles.termsContent}>
                {index + 1}. {item?.item || 'Inspection item'} | Status: {item?.status || 'pending'}{item?.remarks ? ` | Remarks: ${item.remarks}` : ''}
              </Text>
            ))}
          </View>
        )}

        {hasItems(formData.files) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ATTACHED FILES</Text>
            {formData.files.map((file: any, index: number) => (
              <Text key={`${file?._id || index}`} style={styles.termsContent}>
                {index + 1}. {file?.originalName || file?.filename || 'Attachment'}
              </Text>
            ))}
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>Generated on: {formatDate(currentDate.toISOString())}</Text>
          <Text>Checklist ID: {formData._id?.slice(-8) || 'NEW'}</Text>
          <Text>Vehicle: {formData.carDetails?.licensePlate || 'Not specified'}</Text>
          <Text>Inspector: {resolvedInspectorName}</Text>
          <Text style={styles.pageNumber}>--- Page 3 of 3 ---</Text>
        </View>
      </Page>
    </Document>
  );
};

export default DiamondRimsPDF;
