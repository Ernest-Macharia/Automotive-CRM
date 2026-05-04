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
    backgroundColor: '#FFFFFF',
    padding: 22,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 14,
    paddingBottom: 10,
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
    fontSize: 20,
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
    borderLeftColor: '#7c3aed'
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c3aed',
    marginBottom: 8
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
  badgeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 3
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
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb'
  },
  checkLabel: {
    fontSize: 10,
    color: '#374151',
    flex: 2
  },
  checkValue: {
    fontSize: 10,
    color: '#111827',
    flex: 1,
    textAlign: 'right'
  },
  termsSection: {
    marginTop: 10,
    padding: 15,
    backgroundColor: '#f1f5f9',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1'
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
    marginTop: 10,
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
  multiLineValue: {
    fontSize: 11,
    color: '#111827',
    marginBottom: 4,
    lineHeight: 1.3
  },
  qualityBox: {
    backgroundColor: '#dbeafe',
    borderRadius: 4,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#93c5fd'
  },
  qualityTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 6
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

interface DiamondRimsPostChecklistPDFProps {
  formData: any;
  preChecklist?: any;
  opportunity?: any;
  vehicle?: any;
  workOrder?: any;
}

const DiamondRimsPostChecklistPDF: React.FC<DiamondRimsPostChecklistPDFProps> = ({ 
  formData, 
  preChecklist,
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

  // Helper function to format boolean
  const formatBoolean = (value: boolean) => {
    return value ? 'Yes' : 'No';
  };

  // Check if array has items
  const hasItems = (array: any[]) => {
    return array && Array.isArray(array) && array.length > 0;
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

  const signatureSrc = normalizeImageSource(formData.signature);
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
          <Text style={styles.companyName}>DIAMOND RIMZ LTD</Text>
          <Text style={styles.title}>POST-SERVICE CHECKLIST</Text>
          <Text style={styles.subtitle}>
            Date: {formatDate(formData.date)} | Inspector: {formData.inspectorName || 'â€”'}
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>BASIC INFORMATION</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>DATE</Text>
              <Text style={styles.value}>{formatDate(formData.date) || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>INSPECTOR</Text>
              <Text style={styles.value}>{formData.inspectorName || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Contact Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CONTACT INFORMATION</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>MOBILE </Text>
              <Text style={styles.value}>{formData.contactDetails?.mobile || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>EMAIL </Text>
              <Text style={styles.value}>{formData.contactDetails?.email || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Vehicle Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VEHICLE INFORMATION</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>LICENSE PLATE </Text>
              <Text style={styles.value}>{formData.vehicleDetails?.licensePlate || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Services Completed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SERVICES COMPLETED</Text>
          <Text style={styles.label}>ACTUAL SERVICE </Text>
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

        {/* Final Checks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FINAL CHECKS</Text>
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>TPMS Sensors Fitted:</Text>
            <Text style={styles.checkValue}>{formatBoolean(formData.finalChecks?.tpmsSensorsFitted)}</Text>
          </View>
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Lock Nuts:</Text>
            <Text style={styles.checkValue}>{formatBoolean(formData.finalChecks?.lockNuts)}</Text>
          </View>
          
          {formData.finalChecks?.lockNuts && (
            <View style={styles.checkRow}>
              <Text style={styles.checkLabel}>Number of Lock Nuts:</Text>
              <Text style={styles.checkValue}>{formData.finalChecks.numberOfLockNuts || 'â€”'}</Text>
            </View>
          )}
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Nozzle Caps:</Text>
            <Text style={styles.checkValue}>{formatBoolean(formData.finalChecks?.nozzleCaps)}</Text>
          </View>
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Center Caps:</Text>
            <Text style={styles.checkValue}>{formatBoolean(formData.finalChecks?.centerCaps)}</Text>
          </View>
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Tires:</Text>
            <Text style={styles.checkValue}>{formatBoolean(formData.finalChecks?.tires)}</Text>
          </View>
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Tire Condition:</Text>
            <Text style={styles.checkValue}>{formData.finalChecks?.tireCondition || 'â€”'}</Text>
          </View>
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Wheel Balanced:</Text>
            <Text style={styles.checkValue}>{formatBoolean(formData.finalChecks?.wheelBalanced)}</Text>
          </View>
          
          <View style={styles.checkRow}>
            <Text style={styles.checkLabel}>Checked For Puncture:</Text>
            <Text style={styles.checkValue}>{formatBoolean(formData.finalChecks?.checkedForPuncture)}</Text>
          </View>
        </View>

        {/* Tire Specifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIRE SPECIFICATIONS</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Tire Brand</Text>
              <Text style={styles.value}>{formData.tireSpecifications?.brand || 'â€”'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Inflation PSI</Text>
              <Text style={styles.value}>{formData.tireSpecifications?.inflationPSI || 'â€”'}</Text>
            </View>
          </View>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>Tire DOT</Text>
              <Text style={styles.value}>{formData.tireSpecifications?.dot || 'â€”'}</Text>
            </View>
          </View>
        </View>

        {/* Page Footer */}
        <View style={styles.footer}>
          <Text>--- Page 1 of 2 ---</Text>
        </View>
      </Page>

      {/* Second Page */}
      <Page size="A4" style={styles.page}>
        {/* Header for Page 2 */}
        <View style={styles.header}>
          <Text style={styles.companyName}>DIAMOND RIMZ LTD</Text>
          <Text style={styles.title}>POST-SERVICE CHECKLIST (CONTINUED)</Text>
          <Text style={styles.subtitle}>
            Date: {formatDate(formData.date)} | Vehicle: {formData.vehicleDetails?.licensePlate || 'â€”'}
          </Text>
        </View>

        {/* Additional Information */}
        {formData.additionalInformation && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDITIONAL INFORMATION</Text>
            <Text style={styles.multiLineValue}>{formData.additionalInformation}</Text>
          </View>
        )}

        {/* Quality Assurance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QUALITY ASSURANCE</Text>
          
          <View style={styles.qualityBox}>
            <Text style={styles.qualityTitle}>Lead Technician Confirmation</Text>
            <Text style={styles.checkbox}>
              {formData.qualityAssurance?.leadTechnicianConfirmation ? 'â˜‘' : 'â˜'} 
              I confirm that all services have been completed as per Diamond Rimz quality standards and specifications
            </Text>
          </View>
          
          <View style={[styles.qualityBox, { backgroundColor: '#f0f9ff' }]}>
            <Text style={[styles.qualityTitle, { color: '#0369a1' }]}>Operations Counter Check</Text>
            <Text style={styles.checkbox}>
              {formData.qualityAssurance?.operationsCounterCheck ? 'â˜‘' : 'â˜'} 
              I confirm that all operations checks have been completed and the vehicle is ready for customer collection
            </Text>
          </View>
        </View>

        {/* Terms and Conditions */}
        <View style={styles.termsSection}>
          <Text style={[styles.sectionTitle, { marginBottom: 10 }]}>TERMS AND CONDITIONS</Text>
          
          <Text style={styles.termsContent}>
            By signing this post-service checklist, you acknowledge and agree that:
          </Text>
          
          <Text style={styles.termsContent}>
            1. All services have been completed as per the agreed scope and specifications
          </Text>
          <Text style={styles.termsContent}>
            2. All work has been performed to Diamond Rimz quality standards
          </Text>
          <Text style={styles.termsContent}>
            3. The vehicle is ready for customer collection and safe for road use
          </Text>
          <Text style={styles.termsContent}>
            4. All final checks have been completed and documented
          </Text>
          <Text style={styles.termsContent}>
            5. Customer has been notified of completion and is ready for collection
          </Text>
          
          <Text style={[styles.termsContent, { marginTop: 8 }]}>
            Full terms and conditions: https://workdrive.zohoexternal.com/external/514e71190ff26c8c58d7cfd57081bc4eb026595ceebef81e51bad062c5ce3701
          </Text>
          
          <View style={{ marginTop: 10 }}>
            <Text style={styles.checkbox}>
              {formData.acceptTerms ? 'â˜‘' : 'â˜'} I accept the Terms and Conditions of Diamond Rimz
            </Text>
          </View>
        </View>

        {/* Signature */}
        <View style={styles.signatureSection}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>SIGNATURE (FOR AND ON BEHALF OF DIAMOND RIMZ)</Text>
              <View style={styles.signatureBox}>
                {signatureSrc ? (
                  <Image src={signatureSrc} style={styles.signatureImage} />
                ) : (
                  <Text style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', paddingTop: 24 }}>No signature captured</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Uploaded Media */}
        {(uploadedImageSources.length > 0 || uploadedVideoEntries.length > 0) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>DOCUMENTATION</Text>
            <Text style={styles.label}>
              {uploadedImageSources.length} completion photo(s), {uploadedVideoEntries.length} video(s) attached
            </Text>
            <View style={styles.mediaGrid}>
              {uploadedImageSources.slice(0, 8).map((imageSrc, index) => (
                <View key={`${imageSrc}-${index}`} style={styles.mediaItem}>
                  <Image src={imageSrc} style={styles.mediaImage} />
                  <Text style={styles.mediaCaption}>Photo {index + 1}</Text>
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

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Generated on: {formatDate(currentDate.toISOString())}</Text>
          <Text>Post-Checklist ID: {formData._id?.slice(-8) || 'NEW'}</Text>
          <Text>Vehicle: {formData.vehicleDetails?.licensePlate || 'Not specified'}</Text>
          <Text>Inspector: {formData.inspectorName || 'Not specified'}</Text>
          {formData.preChecklistId && (
            <Text>Pre-Checklist ID: {typeof formData.preChecklistId === 'object' ? formData.preChecklistId._id?.slice(-8) : formData.preChecklistId.slice(-8)}</Text>
          )}
          <Text style={styles.pageNumber}>--- Page 2 of 2 ---</Text>
        </View>
      </Page>
    </Document>
  );
};

export default DiamondRimsPostChecklistPDF;
