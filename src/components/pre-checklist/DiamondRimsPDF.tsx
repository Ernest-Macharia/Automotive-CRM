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
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    paddingBottom: 15,
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
    marginBottom: 15,
    padding: 12,
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
    marginBottom: 6
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
    marginTop: 10,
    padding: 15,
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
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#d1d5db'
  },
  signatureBox: {
    height: 60,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: '#f9fafb'
  },
  footer: {
    marginTop: 20,
    paddingTop: 15,
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
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'dd-MMM-yyyy');
    } catch (error) {
      return dateString;
    }
  };

  // Helper function to format KES
  const formatKES = (amount: number) => {
    if (!amount) return 'KES 0';
    return `KES ${amount.toLocaleString()}`;
  };

  // Check if array has items
  const hasItems = (array: any[]) => {
    return array && Array.isArray(array) && array.length > 0;
  };

  // Check if value exists
  const hasValue = (value: any) => {
    return value !== undefined && value !== null && value !== '';
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

  // Get suitability label
  const getSuitabilityLabel = (value: string) => {
    switch (value) {
      case 'yes': return 'Yes';
      case 'no': return 'No';
      case 'maybe': return 'Maybe';
      default: return 'Not Specified';
    }
  };

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
              <Text style={styles.value}>{formatDate(formData.serviceIntake?.date) || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>CUSTOMER SERVICE REP</Text>
              <Text style={styles.value}>{formData.serviceIntake?.customerServiceRep || '—'}</Text>
            </View>
          </View>
        </View>

        {/* CUSTOMER DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>NAME <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>
                {formData.customerDetails?.firstName || ''} {formData.customerDetails?.lastName || ''}
              </Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>MOBILE <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.customerDetails?.mobile || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>EMAIL <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.customerDetails?.email || '—'}</Text>
            </View>
          </View>
        </View>

        {/* CAR DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CAR DETAILS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>CAR MAKE</Text>
              <Text style={styles.value}>{formData.carDetails?.carMake || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>CAR MODEL</Text>
              <Text style={styles.value}>{formData.carDetails?.carModel || '—'}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>MILEAGE</Text>
              <Text style={styles.value}>{formData.carDetails?.mileage || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>YEAR OF MANUFACTURE</Text>
              <Text style={styles.value}>{formData.carDetails?.yearOfManufacture || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>LICENSE PLATE <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.carDetails?.licensePlate || '—'}</Text>
            </View>
          </View>
        </View>

        {/* SERVICES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SERVICES</Text>
          <Text style={styles.label}>ACTUAL SERVICE <Text style={styles.required}>*Required</Text></Text>
          <View style={styles.badgeContainer}>
            {hasItems(formData.services?.actualService) ? (
              formData.services.actualService.map((service: string, index: number) => (
                <View key={index} style={styles.serviceBadge}>
                  <Text>{service}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>—</Text>
            )}
          </View>
        </View>

        {/* PRE-SERVICE INSPECTION */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PRE-SERVICE INSPECTION</Text>
          <Text style={styles.label}>CONDITION <Text style={styles.required}>*Required</Text></Text>
          <View style={styles.badgeContainer}>
            {hasItems(formData.preServiceInspection?.condition) ? (
              formData.preServiceInspection.condition.map((condition: string, index: number) => (
                <View key={index} style={styles.conditionBadge}>
                  <Text>{condition}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.value}>—</Text>
            )}
          </View>
        </View>

        {/* POWDER COATING COLOURS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>POWDER COATING COLOURS</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>POWDER COATING COLOUR (RAL)</Text>
              <Text style={styles.value}>{formData.powderCoating?.colourRAL || '—'}</Text>
            </View>
          </View>
        </View>

        {/* Page Break */}
        <View style={styles.footer}>
          <Text>--- Page 1 of 3 ---</Text>
        </View>
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
              <Text style={styles.label}>DELIVERY MODE <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{getDeliveryModeLabel(formData.deliveryMode) || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TPMS SENSORS FITTED</Text>
              <Text style={styles.value}>{formData.tpmsSensorsFitted ? 'Yes' : 'No'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TOTAL NUMBER OF WHEEL NUTS <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.wheelNutsTotal || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TOTAL NUMBER OF NOZZLE CAPS <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.nozzleCapsTotal || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>NOZZLE CAPS TYPE <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.nozzleCapsType || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TOTAL NUMBER OF LOCK NUTS <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.lockNutsTotal || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>CENTER CAPS</Text>
              <Text style={styles.value}>{formData.centerCaps || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>RIMS/TIRES <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.rimsTires || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>DECLARED VALUABLE <Text style={styles.required}>*Required</Text></Text>
              <Text style={styles.value}>{formData.declaredValuable ? 'Yes' : 'No'}</Text>
            </View>
          </View>
        </View>

        {/* TIRE BRANDS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIRE BRANDS</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE BRAND - FR (FRONT RIGHT)</Text>
              <Text style={styles.value}>{formData.tireBrands?.fr || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE BRAND - FL (FRONT LEFT)</Text>
              <Text style={styles.value}>{formData.tireBrands?.fl || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE BRAND - BR (BACK RIGHT)</Text>
              <Text style={styles.value}>{formData.tireBrands?.br || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE BRAND - BL (BACK LEFT)</Text>
              <Text style={styles.value}>{formData.tireBrands?.bl || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE BRAND - SPARE</Text>
              <Text style={styles.value}>{formData.tireBrands?.spare || '—'}</Text>
            </View>
          </View>
        </View>

        {/* TIRE DOT NUMBERS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TIRE DOT NUMBERS</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE DOT - FR (FRONT RIGHT)</Text>
              <Text style={styles.value}>{formData.tireDOT?.fr || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE DOT - FL (FRONT LEFT)</Text>
              <Text style={styles.value}>{formData.tireDOT?.fl || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE DOT - BR (BACK RIGHT)</Text>
              <Text style={styles.value}>{formData.tireDOT?.br || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE DOT - BL (BACK LEFT)</Text>
              <Text style={styles.value}>{formData.tireDOT?.bl || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>TIRE DOT - SPARE</Text>
              <Text style={styles.value}>{formData.tireDOT?.spare || '—'}</Text>
            </View>
          </View>
        </View>

        {/* SUITABILITY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUITABILITY</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>SUITABLE FOR SKIMMING</Text>
              <Text style={styles.value}>{getSuitabilityLabel(formData.suitability?.skimming)}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>SUITABLE FOR POWDER COATING</Text>
              <Text style={styles.value}>{getSuitabilityLabel(formData.suitability?.powderCoating)}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>SUITABLE FOR STRAIGHTENING</Text>
              <Text style={styles.value}>{getSuitabilityLabel(formData.suitability?.straightening)}</Text>
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

        {/* Page Break */}
        <View style={styles.footer}>
          <Text>--- Page 2 of 3 ---</Text>
        </View>
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
              {formData.mustKnowAccepted ? '☑' : '☐'} I acknowledge and understand all the above points *
            </Text>
          </View>
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
                • Skimming is only possible if your brake disc still has enough thickness above the manufacturer's minimum spec
              </Text>
              <Text style={styles.termsContent}>
                • If your disc is cracked, heat-damaged, or severely warped, skimming may worsen the condition — replacement is advised
              </Text>
              <Text style={styles.termsContent}>
                • We recommend fitting new brake pads with skimmed discs. Old or uneven pads can reduce braking effectiveness.
              </Text>
              <Text style={styles.termsContent}>
                • Noise or squealing may continue post-skimming if poor-quality or worn pads are used.
              </Text>
              <Text style={styles.termsContent}>
                • We do not guarantee results if the disc has been skimmed before or has unknown machining history.
              </Text>
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {formData.clientUpdate?.brakeDiscSkimming ? '☑ Accepted' : '☐ Not Accepted'}
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
                • Exclusion of hidden flaws (scratches, gouges, casting pits)
              </Text>
              <Text style={styles.termsContent}>
                • No warranty for high-heat areas (engine, brake)
              </Text>
              <Text style={styles.termsContent}>
                • Colour match disclaimer (shade, lighting, material)
              </Text>
              <Text style={styles.termsContent}>
                • No guarantee of OEM matching
              </Text>
              <Text style={styles.termsContent}>
                • Hidden flaws may appear after stripping/blasting
              </Text>
              <Text style={styles.termsContent}>
                • Redo policy (only for technical failure, not color dissatisfaction)
              </Text>
              <Text style={styles.termsContent}>
                • Customer aesthetic dissatisfaction not a valid claim
              </Text>
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {formData.clientUpdate?.powderCoating ? '☑ Accepted' : '☐ Not Accepted'}
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
                • Cracked rims should not be straightened.
              </Text>
              <Text style={styles.termsContent}>
                • Welded rims are at high risk of failure during straightening.
              </Text>
              <Text style={styles.termsContent}>
                • Severely bent rims may not return to true shape.
              </Text>
              <Text style={styles.termsContent}>
                • Rims that have been straightened multiple times may fatigue.
              </Text>
              <Text style={styles.termsContent}>
                • Out-of-round rims may remain slightly distorted even after straightening.
              </Text>
              <Text style={styles.termsContent}>
                • There is no warranty on straightening services.
              </Text>
              <Text style={styles.termsContent}>
                • Rims may crack during straightening
              </Text>
              <Text style={{ marginTop: 5, fontSize: 8 }}>
                {formData.clientUpdate?.straightening ? '☑ Accepted' : '☐ Not Accepted'}
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
                {formatKES(formData.agreedAmount?.total || 0)}
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

        {/* AGENT DETAILS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AGENT DETAILS</Text>
          
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>FIRST NAME</Text>
              <Text style={styles.value}>{formData.agentDetails?.firstName || '—'}</Text>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>LAST NAME</Text>
              <Text style={styles.value}>{formData.agentDetails?.lastName || '—'}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>ID NUMBER</Text>
              <Text style={styles.value}>{formData.agentDetails?.idNumber || '—'}</Text>
            </View>
          </View>
        </View>

        {/* TERMS ACCEPTANCE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TERMS ACCEPTANCE</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.checkbox}>
              {formData.acceptTerms ? '☑' : '☐'} I accept the Terms and Conditions of Diamond Rimz *
            </Text>
          </View>
        </View>

        {/* SIGNATURES */}
        <View style={styles.signatureSection}>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.label}>SIGNATURE (FOR AND ON BEHALF OF THE CLIENT) <Text style={styles.required}>*Required</Text></Text>
              <View style={styles.signatureBox}>
                {formData.clientSignature ? (
                  <View style={{ padding: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#374151' }}>Digitally Signed</Text>
                    <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5 }}>E-Signature Applied</Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', paddingTop: 20 }}>E-Signature Field</Text>
                )}
              </View>
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>INSPECTOR SIGNATURE <Text style={styles.required}>*Required</Text></Text>
              <View style={styles.signatureBox}>
                {formData.inspectorSignature ? (
                  <View style={{ padding: 10, alignItems: 'center' }}>
                    <Text style={{ fontSize: 9, color: '#374151' }}>Digitally Signed</Text>
                    <Text style={{ fontSize: 8, color: '#6b7280', marginTop: 5 }}>E-Signature Applied</Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: 9, color: '#9ca3af', textAlign: 'center', paddingTop: 20 }}>E-Signature Field</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* UPLOADED IMAGES */}
        {hasItems(formData.uploadedImages) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UPLOADED IMAGES</Text>
            <Text style={styles.label}>{formData.uploadedImages.length} image(s) attached</Text>
          </View>
        )}

        {/* REMARKS */}
        {hasValue(formData.remarks) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ADDITIONAL REMARKS</Text>
            <Text style={styles.multiLineValue}>{formData.remarks}</Text>
          </View>
        )}

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text>Generated on: {formatDate(currentDate.toISOString())}</Text>
          <Text>Checklist ID: {formData._id?.slice(-8) || 'NEW'}</Text>
          <Text>Vehicle: {formData.carDetails?.licensePlate || 'Not specified'}</Text>
          <Text>Inspector: {formData.inspectorName || 'Not specified'}</Text>
          <Text style={styles.pageNumber}>--- Page 3 of 3 ---</Text>
        </View>
      </Page>
    </Document>
  );
};

export default DiamondRimsPDF;