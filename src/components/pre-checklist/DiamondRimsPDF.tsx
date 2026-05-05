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
    backgroundColor: '#f5f7fb',
    padding: 14,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#312e81'
  },
  companyName: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#c4b5fd',
    textAlign: 'center',
    letterSpacing: 0.4
  },
  title: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 8
  },
  subtitle: {
    fontSize: 10,
    color: '#d1d5db',
    textAlign: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: '#312e81'
  },
  section: {
    marginBottom: 5,
    padding: 7,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe3ef',
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed'
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#5b21b6',
    marginBottom: 6,
    letterSpacing: 0.2
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
    marginTop: 5,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dbe3ef'
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
  bulletList: {
    marginTop: 2
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4
  },
  bulletMarker: {
    width: 12,
    fontSize: 10,
    color: '#7c3aed',
    fontWeight: 'bold',
    paddingTop: 1
  },
  bulletText: {
    flex: 1,
    fontSize: 8,
    lineHeight: 1.3,
    color: '#374151'
  },
  signatureSection: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db'
  },
  signatureBox: {
    height: 58,
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
    marginTop: 6,
    paddingTop: 6,
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
    marginBottom: 6
  },
  mediaImage: {
    width: '100%',
    height: 82,
    objectFit: 'cover',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#d1d5db'
  },
  mediaPlaceholder: {
    width: '100%',
    height: 82,
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

  const parseFlexibleNumber = (value: unknown, depth = 0): number | null => {
    if (depth > 6 || value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;
      let parsedJson: unknown = null;
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          parsedJson = JSON.parse(trimmed);
        } catch {
          parsedJson = null;
        }
      }
      if (parsedJson !== null) {
        const parsedFromJson = parseFlexibleNumber(parsedJson, depth + 1);
        if (parsedFromJson !== null) {
          return parsedFromJson;
        }
      }
      const normalized = trimmed
        .replace(/,/g, '')
        .replace(/[^0-9.-]/g, '')
        .trim();
      if (!normalized) return null;
      const parsed = Number(normalized);
      return Number.isFinite(parsed) ? parsed : null;
    }

    if (Array.isArray(value)) {
      for (const candidate of value) {
        const parsed = parseFlexibleNumber(candidate, depth + 1);
        if (parsed !== null) {
          return parsed;
        }
      }
      return null;
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const numericCandidates = [
        record.total,
        record.amount,
        record.value,
        record.number,
        record.subtotal,
        record.grandTotal,
        record.finalAmount,
        record.agreedAmountTotal,
        record.totalAmount,
        record.price,
        record.cost,
        record.$numberDecimal,
        record.$numberInt,
        record.$numberLong,
      ];

      for (const candidate of numericCandidates) {
        const parsed = parseFlexibleNumber(candidate, depth + 1);
        if (parsed !== null) {
          return parsed;
        }
      }

      for (const candidate of Object.values(record)) {
        const parsed = parseFlexibleNumber(candidate, depth + 1);
        if (parsed !== null) {
          return parsed;
        }
      }
    }

    return null;
  };

  // Helper function to format KSH amounts
  const formatKES = (amount: unknown, currencyCode?: unknown) => {
    const safeAmount = parseFlexibleNumber(amount) ?? 0;
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

  const apiBaseUrl = String(process.env.NEXT_PUBLIC_API_URL || API_BASE_URL || '').replace(/\/+$/, '');
  const parseJsonLike = (value: string): unknown => {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) return null;

    try {
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  const normalizeMediaSource = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('data:image/') || trimmed.startsWith('data:video/')) return trimmed;
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    if (trimmed.startsWith('/')) {
      if (trimmed.startsWith('/_api_proxy/')) return trimmed;
      if (apiBaseUrl && trimmed.startsWith(`${apiBaseUrl}/`)) return trimmed;
      if (apiBaseUrl) return `${apiBaseUrl}${trimmed}`;
      return trimmed;
    }
    if (apiBaseUrl && !trimmed.startsWith('blob:')) {
      return `${apiBaseUrl}/${trimmed.replace(/^\/+/, '')}`;
    }
    return null;
  };

  const collectMediaCandidates = (value: unknown, depth = 0): string[] => {
    if (depth > 4 || value === null || value === undefined) return [];

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return [];
      const parsed = parseJsonLike(trimmed);
      if (parsed !== null) {
        return collectMediaCandidates(parsed, depth + 1);
      }
      return [trimmed];
    }

    if (Array.isArray(value)) {
      return value.flatMap((entry) => collectMediaCandidates(entry, depth + 1));
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const directKeys = [
        'path',
        'url',
        'src',
        'uri',
        'href',
        'location',
        'image',
        'imageUrl',
        'fileUrl',
        'publicUrl',
        'secureUrl',
        'signedUrl',
        'storageUrl',
        'downloadUrl',
        'cdnUrl',
        'thumbnailPath',
        'thumbnailUrl',
        'thumbnail',
        'preview',
        'dataUrl',
        'value',
      ];
      const nestedKeys = [
        'file',
        'files',
        'media',
        'uploadedImages',
        'images',
        'attachments',
        'photos',
        'gallery',
        'documents',
        'evidence',
        'items',
      ];

      return [
        ...directKeys.flatMap((key) => collectMediaCandidates(record[key], depth + 1)),
        ...nestedKeys.flatMap((key) => collectMediaCandidates(record[key], depth + 1)),
      ];
    }

    return [];
  };

  const normalizeMediaSources = (value: unknown): string[] => {
    return Array.from(
      new Set(
        collectMediaCandidates(value)
          .map((candidate) => normalizeMediaSource(candidate))
          .filter((candidate): candidate is string => Boolean(candidate))
      )
    );
  };

  const normalizeImageSource = (value: unknown): string | null => {
    const normalized = normalizeMediaSources(value).find((candidate) => !candidate.startsWith('data:video/'));
    return normalized || null;
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

  const parseAdditionalInfo = (value: unknown): Record<string, any> => {
    if (!value) return {};
    if (typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, any>;
    }

    if (typeof value !== 'string') return {};
    const parsed = parseJsonLike(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, any>;
    }

    return {};
  };

  const additionalInfo = parseAdditionalInfo((formData as any).additionalInformation);
  const pricingItemsTotal = Array.isArray(formData.pricingSnapshot?.items)
    ? formData.pricingSnapshot.items.reduce((sum, item) => {
        const itemTotal =
          parseFlexibleNumber((item as any)?.total) ??
          ((parseFlexibleNumber((item as any)?.quantity) ?? 0) * (parseFlexibleNumber((item as any)?.unitPrice) ?? 0));
        return sum + (Number.isFinite(itemTotal) ? itemTotal : 0);
      }, 0)
    : 0;
  const amountCandidates = [
    parseFlexibleNumber(formData.agreedAmount?.total),
    parseFlexibleNumber((formData as any)?.agreedAmount),
    parseFlexibleNumber((additionalInfo as any)?.agreedAmount?.total),
    parseFlexibleNumber((additionalInfo as any)?.agreedAmount),
    parseFlexibleNumber(formData.pricingSnapshot?.total),
    parseFlexibleNumber(formData.pricingSnapshot?.subtotal),
    pricingItemsTotal > 0 ? pricingItemsTotal : null,
    parseFlexibleNumber((additionalInfo as any)?.pricingSnapshot?.total),
    parseFlexibleNumber((additionalInfo as any)?.pricingSnapshot?.subtotal),
    parseFlexibleNumber((additionalInfo as any)?.totals?.total),
    parseFlexibleNumber((additionalInfo as any)?.totals?.subtotal),
    parseFlexibleNumber((additionalInfo as any)?.payment?.total),
    parseFlexibleNumber((additionalInfo as any)?.payment?.amount),
    parseFlexibleNumber((additionalInfo as any)?.clientCharge?.total),
    parseFlexibleNumber((additionalInfo as any)?.clientCharge?.amount),
    parseFlexibleNumber((formData as any)?.totalAmount),
    parseFlexibleNumber((formData as any)?.agreedAmountTotal),
    parseFlexibleNumber((formData as any)?.amount),
    parseFlexibleNumber((formData as any)?.servicePrice),
    parseFlexibleNumber((formData as any)?.productPrice),
    parseFlexibleNumber((additionalInfo as any)?.totalAmount),
    parseFlexibleNumber((additionalInfo as any)?.agreedAmountTotal),
    parseFlexibleNumber((additionalInfo as any)?.amount),
  ].filter((value): value is number => value !== null);

  const agreedAmountTotal =
    amountCandidates.find((value) => value > 0) ??
    amountCandidates[0] ??
    0;

  const rawFiles = [
    ...(Array.isArray(formData.files) ? formData.files : []),
    ...(Array.isArray((formData as any)?.attachments) ? (formData as any).attachments : []),
    ...(Array.isArray((formData as any)?.media) ? (formData as any).media : []),
    ...(Array.isArray((additionalInfo as any)?.files) ? (additionalInfo as any).files : []),
    ...(Array.isArray((additionalInfo as any)?.attachments) ? (additionalInfo as any).attachments : []),
    ...(Array.isArray((additionalInfo as any)?.media) ? (additionalInfo as any).media : []),
    ...(Array.isArray((additionalInfo as any)?.photos) ? (additionalInfo as any).photos : []),
    ...(Array.isArray((additionalInfo as any)?.gallery) ? (additionalInfo as any).gallery : []),
  ];

  const mediaEntries = Array.isArray(rawFiles)
    ? rawFiles
        .map((file: any, index: number) => {
          const src = normalizeMediaSources(file).find((candidate) => !candidate.startsWith('data:video/')) ||
            normalizeMediaSources(file).find(Boolean) ||
            null;
          const thumbnailSrc = normalizeImageSource(file?.thumbnailPath || file?.thumbnail || file?.preview);
          const mimeType = stringifyValue(file?.mimeType || file?.fileType).toLowerCase();
          const filename = stringifyValue(file?.originalName || file?.filename || '');
          const sourceHint = stringifyValue(file?.path || file?.url || file?.src || '').toLowerCase();
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
        ...normalizeMediaSources(formData.uploadedImages),
        ...normalizeMediaSources((formData as any)?.images),
        ...normalizeMediaSources((formData as any)?.attachments),
        ...normalizeMediaSources((formData as any)?.media),
        ...normalizeMediaSources((formData as any)?.photos),
        ...normalizeMediaSources((formData as any)?.gallery),
        ...normalizeMediaSources((additionalInfo as any)?.uploadedImages),
        ...normalizeMediaSources((additionalInfo as any)?.images),
        ...normalizeMediaSources((additionalInfo as any)?.attachments),
        ...normalizeMediaSources((additionalInfo as any)?.media),
        ...normalizeMediaSources((additionalInfo as any)?.photos),
        ...normalizeMediaSources((additionalInfo as any)?.gallery),
        ...normalizeMediaSources((additionalInfo as any)?.documents),
        ...normalizeMediaSources((additionalInfo as any)?.evidence),
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

  const mustKnowPoints: string[] = [
    'Entire process explained to the customer.',
    "Tyres, caps, locknuts, sensors, and other items are accepted at the client's own risk.",
    "Personal belongings left in or with the vehicle/rims remain the client's responsibility.",
    'Completion timelines are estimates only.',
    'Diamond Rimz will not release any item until full payment is received.',
    'Uncollected rims/parts after 5 days attract storage fee of KES 500 per day per part.',
    "Rims not collected within 12 hours after completion notice are stored at the client's risk.",
  ];

  const renderBulletList = (items: string[], marker = '◆') => (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <Text style={styles.bulletMarker}>{marker}</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
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

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUITABILITY</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>SELECTED SERVICE</Text>
              <Text style={styles.value}>{suitabilityServiceSummary}</Text>
            </View>
          </View>
        </View>

        {hasValue(formData.additionalInformation) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDITIONAL INFORMATION</Text>
            <Text style={styles.multiLineValue}>{formData.additionalInformation}</Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: '#ede9fe', borderLeftColor: '#4c1d95' }]}>
          <Text style={styles.sectionTitle}>TERMS, AGREEMENTS & SIGNATURES</Text>
        </View>

        {/* MUST KNOW SECTION */}
        <View style={styles.termsSection}>
          <Text style={styles.termsTitle}>MUST KNOW</Text>
          {renderBulletList(mustKnowPoints)}
          
          <View style={{ marginTop: 10 }}>
            <Text style={styles.checkbox}>
              {formData.mustKnowAccepted ? '☑' : '☐'} I acknowledge and understand all the above points
            </Text>
          </View>
          {formData.clientUpdate?.mustKnows && (
            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>CLIENT MUST-KNOW ACKNOWLEDGEMENTS</Text>
              {renderBulletList([
                `${formData.clientUpdate.mustKnows.processExplained ? '☑' : '☐'} Process explained`,
                `${formData.clientUpdate.mustKnows.clientRiskAcceptance ? '☑' : '☐'} Risk acceptance confirmed`,
                `${formData.clientUpdate.mustKnows.personalBelongings ? '☑' : '☐'} Personal belongings disclosure`,
                `${formData.clientUpdate.mustKnows.timelineEstimates ? '☑' : '☐'} Timeline estimate acknowledged`,
                `${formData.clientUpdate.mustKnows.fullPaymentRequired ? '☑' : '☐'} Full payment requirement acknowledged`,
                `${formData.clientUpdate.mustKnows.storageFees ? '☑' : '☐'} Storage fee notice acknowledged`,
                `${formData.clientUpdate.mustKnows.storageRisk ? '☑' : '☐'} Storage risk acknowledged`,
              ], '●')}
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
              {renderBulletList([
                "Skimming is possible only when disc thickness remains above manufacturer's minimum spec.",
                'If a disc is cracked, heat-damaged, or severely warped, skimming may worsen condition and replacement is advised.',
                'Fitting new brake pads with skimmed discs is recommended. Old/uneven pads can reduce braking effectiveness.',
                'Noise or squealing may continue post-skimming if poor-quality or worn pads are used.',
                'Results are not guaranteed if a disc was skimmed before or has unknown machining history.',
              ])}
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {resolveRiskAcknowledgement('brakeDiscSkimming') ? '☑ Accepted' : '☐ Not Accepted'}
              </Text>
            </View>
          )}

          {/* Powder Coating Risks */}
          {hasItems(formData.services?.actualService) && formData.services.actualService.includes('Powder Coating') && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.termsContent, { fontWeight: 'bold', color: '#92400e' }]}>
                Powder Coating Risks:
              </Text>
              {renderBulletList([
                'Hidden flaws such as scratches, gouges, or casting pits are excluded.',
                'No warranty for high-heat zones (engine/brake areas).',
                'Colour match may vary by shade, lighting, and material.',
                'OEM colour matching is not guaranteed.',
                'Hidden flaws may become visible after stripping/blasting.',
                'Redo applies only for technical failure, not colour dissatisfaction.',
                'Aesthetic dissatisfaction alone is not a valid claim.',
              ])}
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {resolveRiskAcknowledgement('powderCoating') ? '☑ Accepted' : '☐ Not Accepted'}
              </Text>
            </View>
          )}

          {/* Straightening Risks */}
          {hasItems(formData.services?.actualService) && formData.services.actualService.includes('Rim Straightening') && (
            <View style={{ marginTop: 8 }}>
              <Text style={[styles.termsContent, { fontWeight: 'bold', color: '#92400e' }]}>
                Straightening Risks:
              </Text>
              {renderBulletList([
                'Cracked rims should not be straightened.',
                'Welded rims carry high failure risk during straightening.',
                'Severely bent rims may not return to true shape.',
                'Rims straightened multiple times may fatigue.',
                'Out-of-round rims may remain slightly distorted even after straightening.',
                'No warranty applies to straightening services.',
                'Rims may crack during straightening.',
              ])}
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {resolveRiskAcknowledgement('straightening') ? '☑ Accepted' : '☐ Not Accepted'}
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
        </View>
      </Page>
    </Document>
  );
};

export default DiamondRimsPDF;
