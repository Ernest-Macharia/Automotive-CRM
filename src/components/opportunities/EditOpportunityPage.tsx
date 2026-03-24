'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft, Save, X, Building, User, Phone, Mail, Car,
  Trash2, Plus, Search, ChevronDown, ChevronUp, AlertCircle,
  Loader2, FileText, DollarSign, Tag, Check, Sparkles,
  Settings as SettingsIcon, Package, Settings
} from 'lucide-react';
import { opportunityService, Opportunity as ApiOpportunity, UpdateOpportunityData } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';

// Define interfaces for form data
interface VehicleForm {
  _id?: string;
  vin: string;
  registrationNumber: string;
  licensePlate: string;
  make: string;
  model: string;
  year: string;
  color: string;
  engineSize: string;
  fuelType: string;
  transmission: string;
  mileage: string;
  chassisNumber: string;
  bodyType: string;
}

interface ServiceProductForm {
  _id?: string;
  id?: string;
  title: string;
  description: string;
  type: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
}

interface CustomerForm {
  name: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  companyName: string;
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonTitle?: string;
}

interface UserPreferences {
  useDropdowns: boolean;
}

const getSafeCustomerField = (customer: any, field: string): string => {
  if (!customer || typeof customer !== 'object') return '';
  return customer[field as keyof typeof customer] || '';
};

const normalizePhoneForInput = (value: string, phoneCode: string): string => {
  if (!value) return '';

  const compact = value.replace(/\s+/g, '');
  if (compact.startsWith(phoneCode)) {
    return compact.slice(phoneCode.length);
  }

  const numericCode = phoneCode.replace('+', '');
  if (compact.startsWith(numericCode)) {
    return compact.slice(numericCode.length);
  }

  return compact.startsWith('+') ? compact.replace(/^\+\d{1,4}/, '') : compact;
};

const vehicleMakes = [
  'Toyota', 'Honda', 'Ford', 'Mercedes-Benz', 'BMW', 'Volkswagen',
  'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Hyundai', 'Kia',
  'Chevrolet', 'Audi', 'Lexus', 'Jeep', 'Land Rover', 'Porsche',
  'Volvo', 'Ferrari', 'Lamborghini', 'Tesla', 'Suzuki', 'Isuzu',
  'Peugeot', 'Renault', 'Other'
];

const vehicleModels: Record<string, string[]> = {
  'Toyota': ['Land Cruiser', 'Hilux', 'Corolla', 'Camry', 'RAV4', 'Prado', 'Fortuner', 'Hiace', 'Other'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Fit', 'HR-V', 'Pilot', 'Odyssey', 'Other'],
  'Ford': ['Ranger', 'Everest', 'F-150', 'Explorer', 'Focus', 'Fiesta', 'Mustang', 'Other'],
  'Mercedes-Benz': ['C-Class', 'E-Class', 'S-Class', 'GLE', 'GLC', 'GLA', 'Other'],
  'BMW': ['3 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'Other'],
  'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Polo', 'Jetta', 'Amarok', 'Other'],
  'Nissan': ['Navara', 'X-Trail', 'Qashqai', 'Sunny', 'Patrol', 'Other'],
  'Mazda': ['CX-5', 'CX-30', 'Mazda3', 'Mazda6', 'CX-9', 'Other'],
  'Other': ['Custom Model']
};

const vehicleColors = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown',
  'Yellow', 'Orange', 'Purple', 'Gold', 'Beige', 'Maroon', 'Navy Blue',
  'Pearl White', 'Metallic Gray', 'Other'
];

const vehicleFuelTypes = [
  'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG', 'Other'
];

const vehicleTransmissions = [
  'Manual', 'Automatic', 'Semi-Automatic', 'CVT', 'DSG', 'Other'
];

const vehicleBodyTypes = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon',
  'Pickup Truck', 'Van', 'Minivan', 'Truck', 'Bus', 'Motorcycle',
  'Other'
];

const serviceSuggestions = [
  'Oil Change Service',
  'Brake System Repair',
  'Engine Tune-up',
  'Transmission Service',
  'Suspension Repair',
  'Wheel Alignment',
  'AC Repair & Service',
  'Electrical System Repair',
  'Exhaust System Repair',
  'Fuel System Service',
  'Tire Replacement',
  'Battery Replacement',
  'Windshield Replacement',
  'Paint Job & Body Work',
  'Full Vehicle Service',
  'Pre-purchase Inspection',
  'Custom Service'
];

const productSuggestions = [
  'Engine Oil',
  'Brake Pads',
  'Brake Discs',
  'Air Filter',
  'Oil Filter',
  'Fuel Filter',
  'Spark Plugs',
  'Car Battery',
  'Tires (Set of 4)',
  'Wheel Rims',
  'Shock Absorbers',
  'Struts',
  'AC Compressor',
  'Alternator',
  'Starter Motor',
  'Radiator',
  'Windshield',
  'Headlights',
  'Taillights',
  'Custom Part'
];

const sources = [
  { value: 'walk_in', label: 'Walk In' },
  { value: 'website', label: 'Website' },
  { value: 'referral', label: 'Referral' },
  { value: 'manual', label: 'Manual' },
  { value: 'phone', label: 'Phone Call' },
  { value: 'email', label: 'Email' },
  { value: 'social_media', label: 'Social Media' },
  { value: 'partner', label: 'Partner' }
];

const opportunityTypes = [
  { value: 'SERVICE', label: 'Service', icon: Settings, color: 'bg-blue-100 text-blue-600' },
  { value: 'SALE', label: 'Product', icon: Package, color: 'bg-green-100 text-green-600' }
];

const mapOpportunityTypeToServiceProductType = (
  opportunityType: 'SERVICE' | 'SALE'
): 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR' => {
  switch (opportunityType) {
    case 'SERVICE':
      return 'SERVICE';
    case 'SALE':
      return 'PRODUCT';
    default:
      return 'SERVICE';
  }
};

export default function EditOpportunityPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const opportunityId = searchParams.get('id');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [opportunity, setOpportunity] = useState<ApiOpportunity | null>(null);
  
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') {
      const savedPrefs = localStorage.getItem('userPreferences');
      return savedPrefs ? JSON.parse(savedPrefs) : { useDropdowns: true };
    }
    return { useDropdowns: true };
  });
  
  const [formData, setFormData] = useState({
    type: 'individual' as 'individual' | 'organization',
      source: 'walk_in' as 'web' | 'email' | 'call' | 'walk_in' | 'referral' | 'partner',
      opportunityType: 'SERVICE' as 'SERVICE' | 'SALE',
      phoneCode: '+254',
      customer: {
        name: '',
        email: '',
        phone: '',
        secondaryPhone: '',
        companyName: '',
        contactPersonName: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      contactPersonTitle: ''
    },
    vehicles: [] as VehicleForm[],
    servicesProducts: [] as ServiceProductForm[],
    notes: '',
    subtotal: 0,
    totalDiscount: 0,
    total: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Dropdown states
  const [showMakeDropdown, setShowMakeDropdown] = useState<number | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState<number | null>(null);
  const [showColorDropdown, setShowColorDropdown] = useState<number | null>(null);
  const [showFuelDropdown, setShowFuelDropdown] = useState<number | null>(null);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState<number | null>(null);
  const [showBodyTypeDropdown, setShowBodyTypeDropdown] = useState<number | null>(null);
  const [showServiceProductDropdown, setShowServiceProductDropdown] = useState<number | null>(null);
  
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [fuelSearch, setFuelSearch] = useState('');
  const [transmissionSearch, setTransmissionSearch] = useState('');
  const [bodyTypeSearch, setBodyTypeSearch] = useState('');
  const [serviceProductSearch, setServiceProductSearch] = useState('');

  // Split name into firstName and lastName for individual accounts
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  useEffect(() => {
    if (opportunityId) {
      fetchOpportunity();
    } else {
      setError('No opportunity ID provided');
      setLoading(false);
      showToast('No opportunity ID provided', 'error', 3000);
      router.push('/opportunities');
    }
  }, [opportunityId]);

  const fetchOpportunity = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await opportunityService.getOpportunityById(opportunityId!);
      setOpportunity(data);
      
      // Split name into firstName and lastName for individual accounts
      let firstName = '';
      let lastName = '';
      if (data.type === 'individual' && data.customer?.name) {
        const nameParts = data.customer.name.split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      setFirstName(firstName);
      setLastName(lastName);
      
      // Format phone for display
      let phoneCode = '+254';
      let phoneNumber = data.customer?.phone || '';
      
      // Try to extract country code
      if (data.customer?.phone) {
        if (data.customer.phone.startsWith('+254')) {
          phoneCode = '+254';
          phoneNumber = data.customer.phone.substring(4);
        } else if (data.customer.phone.startsWith('254')) {
          phoneCode = '+254';
          phoneNumber = data.customer.phone.substring(3);
        } else if (data.customer.phone.startsWith('+')) {
          // Extract first 3-4 digits after +
          const match = data.customer.phone.match(/^\+(\d{1,4})(\d+)/);
          if (match) {
            phoneCode = '+' + match[1];
            phoneNumber = match[2];
          }
        }
      }
      
      // Prepare vehicles data - safely handle the API response
      const vehicles: VehicleForm[] = (data.vehicles || []).map((v: any) => ({
        _id: v._id,
        vin: v.vin || '',
        registrationNumber: v.registrationNumber || '',
        licensePlate: v.licensePlate || '',
        make: v.make || '',
        model: v.model || '',
        year: v.year?.toString() || '',
        color: v.color || '',
        engineSize: v.engineSize || '',
        fuelType: v.fuelType || '',
        transmission: v.transmission || '',
        mileage: v.mileage || '',
        chassisNumber: v.chassisNumber || '',
        bodyType: v.bodyType || ''
      }));
      
      const servicesProducts: ServiceProductForm[] = (data.servicesProducts || []).map((sp: any) => {
        const formType: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR' =
          sp.type === 'PRODUCT' || sp.type === 'PART' || sp.type === 'LABOR'
            ? sp.type
            : 'SERVICE';

        const subtotal = sp.subtotal || (sp.quantity || 0) * (sp.unitPrice || 0);
        const discountAmount = subtotal * ((sp.discount || 0) / 100);
        const total = sp.total || subtotal - discountAmount;
        
        return {
          _id: sp._id || sp.id,
          id: sp.id || sp._id,
          title: sp.title || '',
          description: sp.description || '',
          type: formType,
          quantity: sp.quantity || 1,
          unitPrice: sp.unitPrice || 0,
          discount: sp.discount || 0,
          subtotal: subtotal,
          total: total
        };
      });
      
      // Get customer fields safely
      const customer = data.customer;

      const opportunityType = data.opportunityType || 'SERVICE';
      const mappedOpportunityType: 'SERVICE' | 'SALE' = 
        opportunityType === 'SALE' ? 'SALE' : 'SERVICE';
      
      setFormData({
        type: data.type || 'individual',
        source: (data.source as any) || 'walk_in',
        opportunityType: mappedOpportunityType,
        phoneCode,
        customer: {
          name: customer.name || '',
          email: customer.email || '',
          phone: phoneNumber,
          secondaryPhone: normalizePhoneForInput(
            getSafeCustomerField(customer, 'secondaryPhone'),
            phoneCode
          ),
          companyName: getSafeCustomerField(customer, 'companyName'),
          contactPersonName: getSafeCustomerField(customer, 'contactPersonName'),
          contactPersonPhone: normalizePhoneForInput(
            getSafeCustomerField(customer, 'contactPersonPhone'),
            phoneCode
          ),
          contactPersonEmail: getSafeCustomerField(customer, 'contactPersonEmail'),
          contactPersonTitle: getSafeCustomerField(customer, 'contactPersonTitle')
        },
        vehicles,
        servicesProducts,
        notes: data.notes || '',
        subtotal: data.subtotal || calculateSubtotal(servicesProducts),
        totalDiscount: data.totalDiscount || calculateTotalDiscount(servicesProducts),
        total: data.total || calculateTotal(servicesProducts)
      });
      
    } catch (err: any) {
      console.error('Error fetching opportunity:', err);
      setError(err.message || 'Failed to load opportunity');
      showToast('Failed to load opportunity', 'error', 3000);
      router.push('/opportunities');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors(prev => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleCustomerChange = (field: keyof CustomerForm, value: string) => {
    setFormData(prev => ({
      ...prev,
      customer: {
        ...prev.customer,
        [field]: value
      }
    }));
  };

  const handleVehicleChange = (index: number, field: keyof VehicleForm, value: string) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [field]: value };
    
    // If make changes, reset model
    if (field === 'make') {
      updatedVehicles[index].model = '';
    }
    
    setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleServiceProductChange = (index: number, field: keyof ServiceProductForm, value: any) => {
    const updatedServicesProducts = [...formData.servicesProducts];
    const item = { ...updatedServicesProducts[index] };
    
    // Handle type field specially
    if (field === 'type') {
      item[field] = value as 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
    } else {
      (item as any)[field] = value;
    }
    
    // Recalculate totals if quantity, unitPrice, or discount changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const discount = Number(item.discount) || 0;
      
      const subtotal = quantity * unitPrice;
      const discountAmount = subtotal * (discount / 100);
      item.subtotal = subtotal;
      item.total = subtotal - discountAmount;
    }
    
    updatedServicesProducts[index] = item;
    setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
  };

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, {
        vin: '',
        registrationNumber: '',
        licensePlate: '',
        make: '',
        model: '',
        year: '',
        color: '',
        engineSize: '',
        fuelType: '',
        transmission: '',
        mileage: '',
        chassisNumber: '',
        bodyType: ''
      }]
    }));
  };

  const removeVehicle = (index: number) => {
    if (formData.vehicles.length > 0) {
      const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
    }
  };

  const addServiceProduct = () => {
    setFormData(prev => ({
      ...prev,
      servicesProducts: [...prev.servicesProducts, {
        _id: undefined,
        id: undefined,
        title: '',
        description: '',
        type: mapOpportunityTypeToServiceProductType(formData.opportunityType),
        quantity: 1,
        unitPrice: 0,
        discount: 0,
        subtotal: 0,
        total: 0
      }]
    }));
  };

  const removeServiceProduct = (index: number) => {
    if (formData.servicesProducts.length > 0) {
      const updatedServicesProducts = formData.servicesProducts.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
    }
  };

  // Helper functions for calculations
  const calculateSubtotal = (items: ServiceProductForm[]) => {
    return items.reduce((total, item) => {
      return total + (item.subtotal || 0);
    }, 0);
  };

  const calculateTotalDiscount = (items: ServiceProductForm[]) => {
    return items.reduce((total, item) => {
      return total + (item.subtotal * (item.discount / 100) || 0);
    }, 0);
  };

  const calculateTotal = (items: ServiceProductForm[]) => {
    return items.reduce((total, item) => {
      return total + (item.total || 0);
    }, 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate customer
    if (formData.type === 'individual') {
      if (!firstName.trim()) newErrors.firstName = 'First name is required';
    } else {
      if (!formData.customer.companyName?.trim()) newErrors.companyName = 'Company name is required';
    }
    
    if (!formData.customer.phone?.trim()) newErrors.phone = 'Phone is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.customer.email && !emailRegex.test(formData.customer.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (formData.type === 'organization' && !formData.customer.contactPersonName?.trim()) {
      newErrors.contactPersonName = 'Contact person name is required';
    }

    if (formData.servicesProducts.length === 0) {
      newErrors.servicesProducts = 'At least one service or product is required';
    } else {
      const hasInvalidItem = formData.servicesProducts.some(item => !item.title.trim() || !item.type);
      if (hasInvalidItem) {
        newErrors.servicesProducts = 'Each service/product must have a title and valid type';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form', 'warning', 3000);
      return;
    }

    try {
      setSaving(true);
      
      // Prepare customer name based on account type
      let customerName = formData.customer.name;
      if (formData.type === 'individual') {
        customerName = `${firstName} ${lastName}`.trim();
      } else {
        customerName = formData.customer.companyName || '';
      }

      const mappedServicesProducts = formData.servicesProducts.map(item => ({
        title: item.title,
        description: item.description,
        type: item.type,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        subtotal: item.subtotal,
        total: item.total
      }));

      const subject = formData.type === 'individual'
        ? `${firstName} ${lastName}'s ${formData.opportunityType.toLowerCase()} request`
        : `${formData.customer.companyName}'s ${formData.opportunityType.toLowerCase()} request`;

      // Prepare update data according to UpdateOpportunityData interface
      const updateData: UpdateOpportunityData = {
        type: formData.type,
        source: formData.source as 'walk_in' | 'web' | 'email' | 'call' | 'referral' | 'partner',
        subject,
        opportunityType: formData.opportunityType,
        packageType: formData.opportunityType === 'SERVICE' ? 'work_order' : 'sales_order',
        customer: {
          name: customerName,
          email: formData.customer.email || undefined,
          phone: formData.customer.phone ? `${formData.phoneCode}${formData.customer.phone}` : undefined,
          secondaryPhone: formData.customer.secondaryPhone
            ? `${formData.phoneCode}${formData.customer.secondaryPhone}`
            : undefined,
          ...(formData.type === 'organization' && {
            companyName: formData.customer.companyName,
            contactPersonName: formData.customer.contactPersonName || undefined,
            contactPersonEmail: formData.customer.contactPersonEmail || undefined,
            contactPersonPhone: formData.customer.contactPersonPhone
              ? `${formData.phoneCode}${formData.customer.contactPersonPhone}`
              : undefined,
            contactPersonTitle: formData.customer.contactPersonTitle || undefined
          })
        },
        vehicles: formData.vehicles.map(vehicle => ({
          vin: vehicle.vin,
          registrationNumber: vehicle.registrationNumber,
          licensePlate: vehicle.licensePlate,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          color: vehicle.color,
          engineSize: vehicle.engineSize,
          fuelType: vehicle.fuelType,
          transmission: vehicle.transmission,
          mileage: vehicle.mileage,
          chassisNumber: vehicle.chassisNumber,
          bodyType: vehicle.bodyType
        })),
        servicesProducts: mappedServicesProducts.length ? mappedServicesProducts : undefined,
        notes: formData.notes,
        subtotal: calculateSubtotal(formData.servicesProducts),
        totalDiscount: calculateTotalDiscount(formData.servicesProducts),
        total: calculateTotal(formData.servicesProducts),
        status: opportunity?.status as 'new' | 'attempted_to_contact' | 'prospecting'
          | 'appointment_scheduled' | 'non_progressive' | 'lost' | 'won' | undefined
      };

      const result = await opportunityService.updateOpportunity(opportunityId!, updateData);
      
      showToast('Opportunity updated successfully!', 'success', 3000);
      router.push(`/opportunities/details?id=${opportunityId}`);
      
    } catch (err: any) {
      console.error('Error updating opportunity:', err);
      const errorMessage = err.message || 'Failed to update opportunity';
      setError(errorMessage);
      showToast(errorMessage, 'error', 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Are you sure you want to discard changes?')) {
      router.push(`/opportunities/details?id=${opportunityId}`);
    }
  };

  // Filtered dropdown options
  const filteredMakes = vehicleMakes.filter(make =>
    make.toLowerCase().includes(makeSearch.toLowerCase())
  );

  const filteredModels = (make: string) => {
    const models = vehicleModels[make] || [];
    return models.filter(model =>
      model.toLowerCase().includes(modelSearch.toLowerCase())
    );
  };

  const filteredColors = vehicleColors.filter(color =>
    color.toLowerCase().includes(colorSearch.toLowerCase())
  );

  const filteredFuelTypes = vehicleFuelTypes.filter(fuel =>
    fuel.toLowerCase().includes(fuelSearch.toLowerCase())
  );

  const filteredTransmissions = vehicleTransmissions.filter(trans =>
    trans.toLowerCase().includes(transmissionSearch.toLowerCase())
  );

  const filteredBodyTypes = vehicleBodyTypes.filter(body =>
    body.toLowerCase().includes(bodyTypeSearch.toLowerCase())
  );

  const filteredServiceProducts = () => {
    const suggestions = formData.opportunityType === 'SERVICE' ? serviceSuggestions : productSuggestions;
    return suggestions.filter(item =>
      item.toLowerCase().includes(serviceProductSearch.toLowerCase())
    );
  };

  const selectServiceProductSuggestion = (index: number, suggestion: string) => {
    const updatedServicesProducts = [...formData.servicesProducts];
    updatedServicesProducts[index].title = suggestion;
    setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
    setShowServiceProductDropdown(null);
    setServiceProductSearch('');
  };

  // Render dropdown or regular input based on user preference
  const renderVehicleFieldWithDropdown = (
    index: number,
    field: keyof VehicleForm,
    label: string,
    placeholder: string,
    options: string[],
    showDropdown: number | null,
    setShowDropdown: (index: number | null) => void,
    searchValue: string,
    setSearchValue: (value: string) => void,
    filteredOptions: string[]
  ) => {
    const vehicleValue = formData.vehicles[index]?.[field] || '';
    
    if (userPreferences.useDropdowns) {
      return (
        <div className="relative">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={vehicleValue}
              onChange={(e) => {
                handleVehicleChange(index, field, e.target.value);
                setSearchValue(e.target.value);
              }}
              onFocus={() => setShowDropdown(index)}
              placeholder={placeholder}
              className="pl-3 pr-8 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1
                focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowDropdown(showDropdown === index ? null : index)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showDropdown === index ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {showDropdown === index && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="sticky top-0 bg-white p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      handleVehicleChange(index, field, option);
                      setShowDropdown(null);
                      setSearchValue('');
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                  >
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {label}
          </label>
          <input
            type="text"
            value={vehicleValue}
            onChange={(e) => handleVehicleChange(index, field, e.target.value)}
            placeholder={placeholder}
            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none
              focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
          />
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/30 rounded-full animate-pulse"></div>
              <div className="h-6 w-48 bg-white/30 rounded animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6">
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-gray-200/50 rounded-xl"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
        <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/opportunities')}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-white" />
              </button>
              <h1 className="text-xl font-bold text-white">Edit Opportunity</h1>
            </div>
          </div>
        </div>
        
        <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                {error ? 'Error Loading Opportunity' : 'Opportunity Not Found'}
              </h2>
              <p className="text-gray-600 mb-6">
                {error || 'The opportunity you are looking for does not exist or has been removed.'}
              </p>
              <button
                onClick={() => router.push('/opportunities')}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all"
              >
                Back to Opportunities
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Fixed Header */}
      <div className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center px-6">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push(`/opportunities/details?id=${opportunityId}`)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-white" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-white">Edit Opportunity</h1>
              <p className="text-blue-100 text-sm mt-1">
                Update opportunity: {opportunity.subject}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-white/30 bg-white/10 text-white rounded-lg text-sm font-medium hover:bg-white/20 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-gradient-to-r from-white to-white/90 text-blue-600 rounded-lg text-sm font-medium hover:from-white hover:to-white transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="h-[calc(100vh-64px)] p-4 md:p-6 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Basic Information */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-500" />
                Basic Information
              </h2>
              
              {/* Account Type */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Account Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleInputChange('type', 'individual')}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      formData.type === 'individual'
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        formData.type === 'individual'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <User className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-gray-800">Individual</span>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleInputChange('type', 'organization')}
                    className={`p-4 rounded-xl border transition-all duration-200 ${
                      formData.type === 'organization'
                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        formData.type === 'organization'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        <Building className="h-5 w-5" />
                      </div>
                      <span className="font-medium text-gray-800">Company/Organization</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Source */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Where did this lead come from?
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {sources.map((source) => (
                    <button
                      key={source.value}
                      type="button"
                      onClick={() => handleInputChange('source', source.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        formData.source === source.value
                          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {source.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Customer Information */}
              <div className="space-y-4">
                {formData.type === 'individual' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name *
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.firstName ? 'border-red-300' : 'border-gray-200'
                        } bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="e.g., John"
                        required
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="e.g., Doe"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        value={formData.customer.companyName}
                        onChange={(e) => handleCustomerChange('companyName', e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border ${
                          errors.companyName ? 'border-red-300' : 'border-gray-200'
                        } bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="e.g., Doe Enterprises Ltd."
                        required
                      />
                      {errors.companyName && (
                        <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.companyName}
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person Name *
                        </label>
                        <input
                          type="text"
                          value={formData.customer.contactPersonName}
                          onChange={(e) => handleCustomerChange('contactPersonName', e.target.value)}
                          className={`w-full px-4 py-3 rounded-xl border ${
                            errors.contactPersonName ? 'border-red-300' : 'border-gray-200'
                          } bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                          placeholder="e.g., Jane Doe"
                        />
                        {errors.contactPersonName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.contactPersonName}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person Title
                        </label>
                        <input
                          type="text"
                          value={formData.customer.contactPersonTitle}
                          onChange={(e) => handleCustomerChange('contactPersonTitle', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="e.g., Procurement Manager"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person Email
                        </label>
                        <input
                          type="email"
                          value={formData.customer.contactPersonEmail}
                          onChange={(e) => handleCustomerChange('contactPersonEmail', e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          placeholder="e.g., jane.doe@company.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Contact Person Phone
                        </label>
                        <div className="flex gap-2">
                          <div className="w-24 px-3 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm text-gray-700 flex items-center">
                            {formData.phoneCode}
                          </div>
                          <input
                            type="tel"
                            value={formData.customer.contactPersonPhone}
                            onChange={(e) => handleCustomerChange('contactPersonPhone', e.target.value)}
                            className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="700123456"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Email and Phone (common to both account types) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email
                      </label>
                    <input
                      type="email"
                      value={formData.customer.email}
                      onChange={(e) => handleCustomerChange('email', e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.email ? 'border-red-300' : 'border-gray-200'
                      } bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                      placeholder="e.g., john.doe@example.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="flex items-center justify-between w-full px-3 py-3 rounded-xl border border-gray-200 bg-white/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">🇰🇪</span>
                            <span>{formData.phoneCode}</span>
                          </div>
                        </div>
                      </div>
                      
                      <input
                        type="tel"
                        value={formData.customer.phone}
                        onChange={(e) => handleCustomerChange('phone', e.target.value)}
                        className={`flex-1 px-4 py-3 rounded-xl border ${
                          errors.phone ? 'border-red-300' : 'border-gray-200'
                        } bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                        placeholder="700123456"
                        required
                      />
                    </div>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Phone: {formData.phoneCode}{formData.customer.phone || '_______'}
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Secondary Number
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="flex items-center justify-between w-full px-3 py-3 rounded-xl border border-gray-200 bg-white/50">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">ðŸ‡°ðŸ‡ª</span>
                            <span>{formData.phoneCode}</span>
                          </div>
                        </div>
                      </div>

                      <input
                        type="tel"
                        value={formData.customer.secondaryPhone}
                        onChange={(e) => handleCustomerChange('secondaryPhone', e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        placeholder="711234567"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Secondary Number: {formData.customer.secondaryPhone ? `${formData.phoneCode}${formData.customer.secondaryPhone}` : 'Not provided'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicles Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Car className="h-5 w-5 text-green-500" />
                  Vehicle Details
                  {formData.vehicles.length > 0 && (
                    <span className="px-2 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-gray-600 text-xs font-medium rounded">
                      {formData.vehicles.length} vehicle(s)
                    </span>
                  )}
                </h2>
                
                <button
                  type="button"
                  onClick={addVehicle}
                  className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Vehicle
                </button>
              </div>
              
              {/* Vehicles List */}
              {formData.vehicles.length > 0 ? (
                <div className="space-y-4">
                  {formData.vehicles.map((vehicle, index) => (
                    <div key={index} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Car className="h-5 w-5 text-gray-600" />
                          <span className="font-medium text-gray-800">Vehicle {index + 1}</span>
                        </div>
                        {formData.vehicles.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeVehicle(index)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            VIN (Vehicle Identification Number)
                          </label>
                          <input
                            type="text"
                            value={vehicle.vin}
                            onChange={(e) => handleVehicleChange(index, 'vin', e.target.value)}
                            placeholder="e.g., 1HGCM82633A123456"
                            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Registration Number
                          </label>
                          <input
                            type="text"
                            value={vehicle.registrationNumber}
                            onChange={(e) => handleVehicleChange(index, 'registrationNumber', e.target.value)}
                            placeholder="e.g., KCA 123A"
                            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            License Plate
                          </label>
                          <input
                            type="text"
                            value={vehicle.licensePlate}
                            onChange={(e) => handleVehicleChange(index, 'licensePlate', e.target.value)}
                            placeholder="e.g., KDL 456B"
                            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          />
                        </div>
                        
                        {/* Make */}
                        {renderVehicleFieldWithDropdown(
                          index,
                          'make',
                          'Make',
                          'Type or select vehicle make',
                          vehicleMakes,
                          showMakeDropdown,
                          setShowMakeDropdown,
                          makeSearch,
                          setMakeSearch,
                          filteredMakes
                        )}
                        
                        {/* Model */}
                        {userPreferences.useDropdowns ? (
                          <div className="relative">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Model
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value={vehicle.model}
                                onChange={(e) => {
                                  handleVehicleChange(index, 'model', e.target.value);
                                  setModelSearch(e.target.value);
                                }}
                                onFocus={() => setShowModelDropdown(index)}
                                disabled={!vehicle.make}
                                placeholder={vehicle.make ? `Type or select ${vehicle.make} model` : "Select make first"}
                                className="pl-3 pr-8 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                              />
                              <button
                                type="button"
                                onClick={() => vehicle.make && setShowModelDropdown(showModelDropdown === index ? null : index)}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                disabled={!vehicle.make}
                              >
                                {showModelDropdown === index ? (
                                  <ChevronUp className="h-4 w-4" />
                                ) : (
                                  <ChevronDown className="h-4 w-4" />
                                )}
                              </button>
                            </div>
                            
                            {showModelDropdown === index && vehicle.make && (
                              <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                <div className="sticky top-0 bg-white p-2 border-b">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                    <input
                                      type="text"
                                      value={modelSearch}
                                      onChange={(e) => setModelSearch(e.target.value)}
                                      placeholder={`Search ${vehicle.make} models...`}
                                      className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {filteredModels(vehicle.make).map((model) => (
                                    <button
                                      key={model}
                                      type="button"
                                      onClick={() => {
                                        handleVehicleChange(index, 'model', model);
                                        setShowModelDropdown(null);
                                        setModelSearch('');
                                      }}
                                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                                    >
                                      <span>{model}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Model
                            </label>
                            <input
                              type="text"
                              value={vehicle.model}
                              onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                              placeholder="e.g., Land Cruiser V8"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                        )}
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Year
                          </label>
                          <input
                            type="text"
                            value={vehicle.year}
                            onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                            placeholder="e.g., 2023"
                            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          />
                        </div>
                        
                        {/* Color */}
                        {renderVehicleFieldWithDropdown(
                          index,
                          'color',
                          'Color',
                          'Type or select color',
                          vehicleColors,
                          showColorDropdown,
                          setShowColorDropdown,
                          colorSearch,
                          setColorSearch,
                          filteredColors
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Engine Size (CC)
                          </label>
                          <input
                            type="text"
                            value={vehicle.engineSize}
                            onChange={(e) => handleVehicleChange(index, 'engineSize', e.target.value)}
                            placeholder="e.g., 4500"
                            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          />
                        </div>

                        {/* Fuel Type */}
                        {renderVehicleFieldWithDropdown(
                          index,
                          'fuelType',
                          'Fuel Type',
                          'Type or select fuel type',
                          vehicleFuelTypes,
                          showFuelDropdown,
                          setShowFuelDropdown,
                          fuelSearch,
                          setFuelSearch,
                          filteredFuelTypes
                        )}

                        {/* Transmission */}
                        {renderVehicleFieldWithDropdown(
                          index,
                          'transmission',
                          'Transmission',
                          'Type or select transmission',
                          vehicleTransmissions,
                          showTransmissionDropdown,
                          setShowTransmissionDropdown,
                          transmissionSearch,
                          setTransmissionSearch,
                          filteredTransmissions
                        )}

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Mileage (KM)
                          </label>
                          <input
                            type="text"
                            value={vehicle.mileage}
                            onChange={(e) => handleVehicleChange(index, 'mileage', e.target.value)}
                            placeholder="e.g., 45000"
                            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            Chassis Number
                          </label>
                          <input
                            type="text"
                            value={vehicle.chassisNumber}
                            onChange={(e) => handleVehicleChange(index, 'chassisNumber', e.target.value)}
                            placeholder="e.g., JTEHT05J402123456"
                            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                          />
                        </div>

                        {/* Body Type */}
                        {renderVehicleFieldWithDropdown(
                          index,
                          'bodyType',
                          'Body Type',
                          'Type or select body type',
                          vehicleBodyTypes,
                          showBodyTypeDropdown,
                          setShowBodyTypeDropdown,
                          bodyTypeSearch,
                          setBodyTypeSearch,
                          filteredBodyTypes
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Car className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No vehicles added yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add vehicles associated with this opportunity
                  </p>
                </div>
              )}
            </div>

            {/* Services & Products Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-500" />
                  Services & Products
                </h2>
                
                <div className="flex items-center gap-3">
                  {/* Opportunity Type */}
                  <div className="grid grid-cols-2 gap-2">
                    {opportunityTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            handleInputChange('opportunityType', type.value);
                            // Update all items to match the selected type
                            const updatedItems = formData.servicesProducts.map(item => ({
                              ...item,
                              type: mapOpportunityTypeToServiceProductType(type.value as 'SERVICE' | 'SALE')
                            }));
                            setFormData(prev => ({ ...prev, servicesProducts: updatedItems }));
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                            formData.opportunityType === type.value
                              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          <Icon className="h-4 w-4" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    type="button"
                    onClick={addServiceProduct}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Item
                  </button>
                </div>
              </div>
              
              {/* Services/Products List */}
              {formData.servicesProducts.length > 0 ? (
                <div className="space-y-4">
                  {formData.servicesProducts.map((item, index) => (
                    <div key={index} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${
                            item.type === 'SERVICE' ? 'bg-blue-100 text-blue-600' : 
                            'bg-green-100 text-green-600'
                          }`}>
                            {item.type === 'SERVICE' ? (
                              <Settings className="h-4 w-4" />
                            ) : (
                              <Package className="h-4 w-4" />
                            )}
                          </div>
                          <span className="font-medium text-gray-800">Item {index + 1}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            item.type === 'SERVICE' ? 'bg-blue-100 text-blue-600' : 
                            'bg-green-100 text-green-600'
                          }`}>
                            {item.type}
                          </span>
                        </div>
                        {formData.servicesProducts.length > 0 && (
                          <button
                            type="button"
                            onClick={() => removeServiceProduct(index)}
                            className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {/* Title with suggestions dropdown */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title/Description
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => {
                                handleServiceProductChange(index, 'title', e.target.value);
                                setServiceProductSearch(e.target.value);
                              }}
                              onFocus={() => setShowServiceProductDropdown(index)}
                              placeholder={
                                formData.opportunityType === 'SERVICE' 
                                  ? "e.g., Oil Change Service, Brake System Repair..." 
                                  : "e.g., Engine Oil, Brake Pads, Car Battery..."
                              }
                              className="pl-4 pr-10 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                            />
                            <button
                              type="button"
                              onClick={() => setShowServiceProductDropdown(showServiceProductDropdown === index ? null : index)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              {showServiceProductDropdown === index ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                          
                          {showServiceProductDropdown === index && (
                            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                              <div className="sticky top-0 bg-white p-2 border-b">
                                <div className="relative">
                                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                  <input
                                    type="text"
                                    value={serviceProductSearch}
                                    onChange={(e) => setServiceProductSearch(e.target.value)}
                                    placeholder={`Search ${formData.opportunityType.toLowerCase()} suggestions...`}
                                    className="w-full pl-9 pr-2 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  />
                                </div>
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredServiceProducts().map((suggestion) => (
                                  <button
                                    key={suggestion}
                                    type="button"
                                    onClick={() => selectServiceProductSuggestion(index, suggestion)}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                                  >
                                    <span>{suggestion}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detailed Description
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) => handleServiceProductChange(index, 'description', e.target.value)}
                            placeholder={
                              formData.opportunityType === 'SERVICE'
                                ? "e.g., Full synthetic oil change and filter replacement, including labor and inspection..."
                                : "e.g., High-quality brake pads for improved stopping power, compatible with most models..."
                            }
                            rows={2}
                            className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                          />
                        </div>
                        
                        {/* Pricing Section */}
                        <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                          <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  handleServiceProductChange(index, 'quantity', value === '' ? 0 : parseInt(value) || 0);
                                }}
                                className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Unit Price (KES)
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.unitPrice}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  handleServiceProductChange(index, 'unitPrice', value === '' ? 0 : parseFloat(value) || 0);
                                }}
                                className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Discount (%)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  handleServiceProductChange(index, 'discount', value === '' ? 0 : parseFloat(value) || 0);
                                }}
                                className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            </div>
                            
                            <div className="p-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                              <div className="text-center">
                                <div className="text-xs font-medium text-gray-600 mb-1">
                                  Subtotal
                                </div>
                                <div className="text-lg font-bold text-gray-800">
                                  KES {(item.subtotal || 0).toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                  })}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {item.quantity} × KES {item.unitPrice.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Line Item Total */}
                        <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-gray-800">Line Item Total</span>
                              <p className="text-xs text-gray-500 mt-1">
                                Subtotal: KES {(item.subtotal || 0).toLocaleString()}
                                {item.discount > 0 && ` - ${item.discount}% discount: KES ${(item.subtotal * item.discount / 100).toLocaleString()}`}
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-800">
                                KES {(item.total || 0).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2
                                })}
                              </div>
                              <p className="text-xs text-gray-500">
                                After discount
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-600">No items added yet</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Add {formData.opportunityType.toLowerCase()} items to build your quote
                  </p>
                </div>
              )}
              {errors.servicesProducts && (
                <p className="mt-3 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {errors.servicesProducts}
                </p>
              )}

              {/* Overall Totals */}
              {formData.servicesProducts.length > 0 && (
                <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Totals</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium text-gray-800">
                        KES {calculateSubtotal(formData.servicesProducts).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Total Discount</span>
                      <span className="font-medium text-red-600">
                        - KES {calculateTotalDiscount(formData.servicesProducts).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2 border-t border-gray-300">
                      <span className="text-lg font-semibold text-gray-800">Grand Total</span>
                      <span className="text-2xl font-bold text-green-600">
                        KES {calculateTotal(formData.servicesProducts).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-500 mt-2">
                      {formData.servicesProducts.length} item{formData.servicesProducts.length !== 1 ? 's' : ''} | 
                      {formData.servicesProducts.filter(item => item.type === 'SERVICE').length} service{formData.servicesProducts.filter(item => item.type === 'SERVICE').length !== 1 ? 's' : ''} | 
                      {formData.servicesProducts.filter(item => item.type === 'PRODUCT').length} product{formData.servicesProducts.filter(item => item.type === 'PRODUCT').length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-amber-500" />
                Additional Notes
              </h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes & Comments
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Add any additional notes, comments, or special instructions..."
                />
              </div>
            </div>

            {/* Summary Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Opportunity Summary</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Customer Information</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Account Type:</span> {formData.type === 'individual' ? 'Individual' : 'Company'}
                    </p>
                    {formData.type === 'individual' ? (
                      <>
                        <p className="text-sm">
                          <span className="font-medium">Name:</span> {firstName} {lastName}
                        </p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm">
                          <span className="font-medium">Company:</span> {formData.customer.companyName}
                        </p>
                        {formData.customer.contactPersonName && (
                          <p className="text-sm">
                            <span className="font-medium">Contact Person:</span> {formData.customer.contactPersonName}
                            {formData.customer.contactPersonTitle ? ` (${formData.customer.contactPersonTitle})` : ''}
                          </p>
                        )}
                      </>
                    )}
                    <p className="text-sm">
                      <span className="font-medium">Email:</span> {formData.customer.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Phone:</span> {formData.phoneCode}{formData.customer.phone}
                    </p>
                    {formData.customer.secondaryPhone && (
                      <p className="text-sm">
                        <span className="font-medium">Secondary Number:</span> {formData.phoneCode}{formData.customer.secondaryPhone}
                      </p>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-600 mb-3">Opportunity Details</h3>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">Type:</span> {formData.opportunityType}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Source:</span> {sources.find(s => s.value === formData.source)?.label}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Vehicles:</span> {formData.vehicles.length}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Items:</span> {formData.servicesProducts.length}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Subtotal:</span> KES {calculateSubtotal(formData.servicesProducts).toLocaleString()}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Total Discount:</span> KES {calculateTotalDiscount(formData.servicesProducts).toLocaleString()}
                    </p>
                    <p className="text-sm font-semibold">
                      <span className="font-medium">Grand Total:</span> KES {calculateTotal(formData.servicesProducts).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 shadow-lg">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  <p>Make sure all required fields are filled before saving</p>
                  <p className="mt-1 text-xs">
                    Last updated: {opportunity?.updatedAt ? new Date(opportunity.updatedAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-6 py-2.5 border border-gray-200 bg-white/50 text-gray-700 rounded-lg text-sm font-medium hover:bg-white transition-colors"
                  >
                    Discard Changes
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Changes...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save All Changes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
