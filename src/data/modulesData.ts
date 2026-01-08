import { LucideIcon } from 'lucide-react';

export interface ModuleData {
  id: string;
  name: string;
  icon: string;
  description: string;
  layouts: string[];
  fields: {
    name: string;
    label: string;
    type: string;
    options?: string[];
    required?: boolean;
    group: string;
    module?: string;
  }[];
}

export const ALL_MODULES: ModuleData[] = [
  {
    id: 'opportunities',
    name: 'Opportunities',
    icon: 'TrendingUp',
    description: 'Sales opportunities pipeline',
    layouts: ['Sales Pipeline', 'Standard', 'Kanban', 'Timeline'],
    fields: [
      { name: 'name', label: 'Opportunity Name', type: 'text', required: true, group: 'basic' },
      { name: 'account', label: 'Account', type: 'lookup', module: 'customers', required: true, group: 'basic' },
      { name: 'stage', label: 'Stage', type: 'select', options: ['Prospecting', 'Qualification', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'], group: 'status' },
      { name: 'amount', label: 'Amount', type: 'currency', group: 'financial' },
      { name: 'probability', label: 'Probability', type: 'percentage', group: 'status' },
      { name: 'close_date', label: 'Close Date', type: 'date', group: 'timeline' },
      { name: 'type', label: 'Opportunity Type', type: 'select', options: ['New Business', 'Existing Business', 'Renewal'], group: 'classification' },
      { name: 'source', label: 'Lead Source', type: 'select', options: ['Web', 'Referral', 'Partner', 'Email', 'Phone'], group: 'source' },
      { name: 'description', label: 'Description', type: 'textarea', group: 'details' },
      { name: 'next_step', label: 'Next Step', type: 'text', group: 'activities' },
      { name: 'campaign', label: 'Campaign', type: 'lookup', module: 'campaigns', group: 'marketing' },
    ]
  },
  {
    id: 'contacts',
    name: 'Contacts',
    icon: 'User',
    description: 'Contact management',
    layouts: ['Standard', 'Card View', 'List View'],
    fields: [
      { name: 'first_name', label: 'First Name', type: 'text', required: true, group: 'basic' },
      { name: 'last_name', label: 'Last Name', type: 'text', required: true, group: 'basic' },
      { name: 'account', label: 'Account', type: 'lookup', module: 'customers', group: 'relationships' },
      { name: 'email', label: 'Email', type: 'email', group: 'contact' },
      { name: 'phone', label: 'Phone', type: 'phone', group: 'contact' },
      { name: 'title', label: 'Title', type: 'text', group: 'professional' },
      { name: 'department', label: 'Department', type: 'text', group: 'professional' },
      { name: 'address', label: 'Address', type: 'textarea', group: 'location' },
      { name: 'type', label: 'Contact Type', type: 'select', options: ['Decision Maker', 'Influencer', 'End User', 'Technical', 'Executive'], group: 'classification' },
      { name: 'lead_source', label: 'Lead Source', type: 'select', options: ['Web', 'Referral', 'Partner'], group: 'source' },
    ]
  },
  {
    id: 'job_cards',
    name: 'Job Cards',
    icon: 'FileText',
    description: 'Job and service management',
    layouts: ['Service Flow', 'Standard', 'Gantt', 'Resource'],
    fields: [
      { name: 'job_number', label: 'Job Number', type: 'text', required: true, group: 'basic' },
      { name: 'customer', label: 'Customer', type: 'lookup', module: 'customers', required: true, group: 'customer' },
      { name: 'service_type', label: 'Service Type', type: 'select', options: ['Repair', 'Maintenance', 'Installation', 'Inspection', 'Emergency'], group: 'service' },
      { name: 'priority', label: 'Priority', type: 'select', options: ['Low', 'Medium', 'High', 'Emergency'], group: 'priority' },
      { name: 'status', label: 'Status', type: 'select', options: ['Scheduled', 'In Progress', 'On Hold', 'Completed', 'Cancelled'], group: 'status' },
      { name: 'assigned_to', label: 'Assigned To', type: 'lookup', module: 'users', group: 'assignment' },
      { name: 'scheduled_date', label: 'Scheduled Date', type: 'datetime', group: 'schedule' },
      { name: 'estimated_hours', label: 'Estimated Hours', type: 'number', group: 'time' },
      { name: 'actual_hours', label: 'Actual Hours', type: 'number', group: 'time' },
      { name: 'parts_required', label: 'Parts Required', type: 'checkbox', group: 'materials' },
      { name: 'description', label: 'Description', type: 'textarea', group: 'details' },
    ]
  },
  {
    id: 'quotes',
    name: 'Quotes',
    icon: 'FileText',
    description: 'Quote and proposal management',
    layouts: ['Quote Process', 'Standard', 'Approval Flow', 'Comparison'],
    fields: [
      { name: 'quote_number', label: 'Quote Number', type: 'text', required: true, group: 'basic' },
      { name: 'customer', label: 'Customer', type: 'lookup', module: 'customers', required: true, group: 'customer' },
      { name: 'opportunity', label: 'Opportunity', type: 'lookup', module: 'opportunities', group: 'sales' },
      { name: 'valid_until', label: 'Valid Until', type: 'date', group: 'validity' },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Expired'], group: 'status' },
      { name: 'total', label: 'Total Amount', type: 'currency', group: 'financial' },
      { name: 'terms', label: 'Terms & Conditions', type: 'textarea', group: 'details' },
      { name: 'notes', label: 'Notes', type: 'textarea', group: 'details' },
    ]
  },
  {
    id: 'invoices',
    name: 'Invoices',
    icon: 'FileText',
    description: 'Invoice and billing',
    layouts: ['Billing Flow', 'Standard', 'Recurring', 'Collections'],
    fields: [
      { name: 'invoice_number', label: 'Invoice Number', type: 'text', required: true, group: 'basic' },
      { name: 'customer', label: 'Customer', type: 'lookup', module: 'customers', required: true, group: 'customer' },
      { name: 'due_date', label: 'Due Date', type: 'date', group: 'dates' },
      { name: 'status', label: 'Status', type: 'select', options: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'], group: 'status' },
      { name: 'total', label: 'Total Amount', type: 'currency', group: 'financial' },
      { name: 'balance', label: 'Balance Due', type: 'currency', group: 'financial' },
      { name: 'payment_terms', label: 'Payment Terms', type: 'select', options: ['Net 15', 'Net 30', 'Net 45', 'Due on Receipt'], group: 'terms' },
      { name: 'po_number', label: 'PO Number', type: 'text', group: 'reference' },
    ]
  },
  // Add other modules here...
];

export const FIELD_GROUPS = {
  basic: 'Basic Information',
  status: 'Status',
  financial: 'Financial',
  timeline: 'Timeline',
  classification: 'Classification',
  source: 'Source',
  details: 'Details',
  activities: 'Activities',
  marketing: 'Marketing',
  relationships: 'Relationships',
  contact: 'Contact Information',
  professional: 'Professional Information',
  location: 'Location',
  customer: 'Customer Information',
  service: 'Service Information',
  priority: 'Priority',
  assignment: 'Assignment',
  schedule: 'Schedule',
  time: 'Time Tracking',
  materials: 'Materials',
  sales: 'Sales',
  validity: 'Validity',
  dates: 'Dates',
  terms: 'Terms & Conditions',
  reference: 'Reference',
};

export const CRITERIA_TEMPLATES: Record<string, any[]> = {
  opportunities: [
    {
      name: 'High Value Opportunities',
      description: 'Opportunities with amount greater than $10,000',
      conditions: [
        { field: 'amount', operator: 'greater_than', value: 10000 }
      ]
    },
    {
      name: 'Closing This Month',
      description: 'Opportunities closing in the current month',
      conditions: [
        { field: 'close_date', operator: 'between', value: 'startOfMonth', value2: 'endOfMonth' }
      ]
    }
  ],
  contacts: [
    {
      name: 'Decision Makers',
      description: 'Contacts who are decision makers',
      conditions: [
        { field: 'type', operator: 'equals', value: 'Decision Maker' }
      ]
    }
  ],
  // Add templates for other modules
};