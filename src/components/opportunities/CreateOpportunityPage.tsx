'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, User, Building, Mail, Phone, Car, Plus, Trash2, FileText, 
  DollarSign, Calendar, Tag, AlertCircle, Check, ChevronDown,
  Upload, Clock, Shield, Briefcase, Sparkles, ChevronRight,
  ArrowRight, ChevronLeft, Save, Package, Settings, ShoppingBag,
  Layers, Box, Wrench, Zap, AlertTriangle, Search, ChevronUp,
  Globe, MapPin, Settings as SettingsIcon, Palette, Contact
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreateOpportunityData, opportunityService, SimilarOpportunitiesRequest } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import SuccessModal from '@/components/opportunities/SuccessModal';
import DuplicateModal from '@/components/opportunities/DuplicateModal';
import MergeDuplicatesModal from '@/components/opportunities/MergeDuplicatesModal';
import { Opportunity } from '@/services/opportunityService';
import React from 'react';
import { authService } from '@/services/authService';
import { userService } from '@/services/settings/userService';
import { productService, Product } from '@/services/productService';
import { serviceService, Service } from '@/services/serviceService';
import { cardataService } from '@/services/carDataService';

interface Vehicle {
  id: string;
  vin: string;
  registrationNumber: string;
  make: string;
  model: string;
  year: string;
  colorCode: string;
  engineSize?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: string;
  bodyType?: string;
}

interface ServiceProduct {
  id: string;
  title: string;
  description: string;
  type: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
  productId?: string; // Reference to actual product ID
  serviceId?: string; // Reference to actual service ID
  productCode?: string; // Product code if it's a product
  serviceCode?: string; // Service code if it's a service
}

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

interface OpportunityFormData {
  accountType: 'individual' | 'organization';
  source?:
    | 'web'
    | 'website'
    | 'email'
    | 'call'
    | 'phone'
    | 'walk_in'
    | 'referral'
    | 'partner'
    | 'manual'
    | 'social_media';
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
  secondaryPhone: string;
  customerCountry: string;
  customerLocation: string;
  phoneCode: string;
  vehicles: Vehicle[];
  servicesProducts: ServiceProduct[];
  notes: string;
  currentStep: number;
  opportunityType: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
  contactPersonName?: string;
  contactPersonPhone?: string;
  contactPersonEmail?: string;
  contactPersonTitle?: string;
  assignedTo?: string;
}

interface User {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: string | { 
    _id?: string; 
    id?: string; 
    name: string; 
    display_name: string; 
    permissions?: string[] 
  };
  permissions: string[];
  active: boolean;
  phone?: string;
  department?: string;
  lastLogin?: string;
  canViewSummary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface Role {
  id: string;
  _id?: string;
  name: string;
  display_name: string;
  description?: string;
  category: string;
  permissions: string[];
  active?: boolean;
}

interface UserPreferences {
  useDropdowns: boolean;
}

const fallbackVehicleMakes = [
  'Toyota', 'Honda', 'Ford', 'Mercedes-Benz', 'BMW', 'Volkswagen',
  'Nissan', 'Mazda', 'Subaru', 'Mitsubishi', 'Hyundai', 'Kia',
  'Chevrolet', 'Audi', 'Lexus', 'Jeep', 'Land Rover', 'Porsche',
  'Volvo', 'Ferrari', 'Lamborghini', 'Tesla', 'Suzuki', 'Isuzu',
  'Peugeot', 'Renault', 'Other'
];

const fallbackVehicleModels: Record<string, string[]> = {
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

const normalizeSourceForApi = (value?: OpportunityFormData['source']): CreateOpportunityData['source'] => {
  if (value === 'phone') return 'call';
  if (value === 'website') return 'web';
  return (value || 'walk_in') as CreateOpportunityData['source'];
};

const normalizeSourceForForm = (value?: string): OpportunityFormData['source'] => {
  if (!value) return 'walk_in';
  if (value === 'call') return 'phone';
  if (value === 'web') return 'website';
  return value as OpportunityFormData['source'];
};

const normalizeEmailValue = (value?: string): string | undefined => {
  const trimmed = String(value || '').trim().toLowerCase();
  return trimmed || undefined;
};

const normalizePhoneForStorage = (phoneCode: string, phone: string): string => {
  const codeDigits = String(phoneCode || '').replace(/\D+/g, '');
  const rawDigits = String(phone || '').replace(/\D+/g, '');
  if (!rawDigits) return '';

  let localDigits = rawDigits;
  if (codeDigits) {
    if (rawDigits.startsWith(codeDigits)) {
      localDigits = rawDigits.slice(codeDigits.length);
    }
    localDigits = localDigits.replace(/^0+/, '');
    return `+${codeDigits}${localDigits || rawDigits}`;
  }

  return `+${rawDigits}`;
};

const buildPhoneDuplicateCandidates = (phoneCode: string, phone: string): string[] => {
  const candidates = new Set<string>();
  const normalizedPhone = normalizePhoneForStorage(phoneCode, phone);
  const digits = normalizedPhone.replace(/\D+/g, '');
  const codeDigits = String(phoneCode || '').replace(/\D+/g, '');

  if (normalizedPhone) {
    candidates.add(normalizedPhone);
  }
  if (digits) {
    candidates.add(digits);
  }

  if (digits.startsWith('254') && digits.length >= 12) {
    const lastNine = digits.slice(-9);
    candidates.add(`+254${lastNine}`);
    candidates.add(`254${lastNine}`);
    candidates.add(`0${lastNine}`);
    candidates.add(lastNine);
  }

  if (digits.startsWith('0') && digits.length > 7) {
    const withoutZero = digits.replace(/^0+/, '');
    candidates.add(withoutZero);
    if (codeDigits) {
      candidates.add(`+${codeDigits}${withoutZero}`);
      candidates.add(`${codeDigits}${withoutZero}`);
    }
  }

  if (digits.length === 9 && codeDigits) {
    candidates.add(`+${codeDigits}${digits}`);
    candidates.add(`${codeDigits}${digits}`);
    candidates.add(`0${digits}`);
  }

  return Array.from(candidates).filter((candidate) => candidate.replace(/\D+/g, '').length >= 7);
};

const vehicleColorCodes = [
  '#FFFFFF', '#000000', '#C0C0C0', '#808080', '#FF0000', '#0000FF', '#008000', '#964B00',
  '#FFFF00', '#FFA500', '#800080', '#FFD700', '#F5F5DC', '#800000', '#000080',
  '#F8F8FF', '#A9A9A9', '#808000'
];

const vehicleColorNames = [
  'White', 'Black', 'Silver', 'Gray', 'Red', 'Blue', 'Green', 'Brown',
  'Yellow', 'Orange', 'Purple', 'Gold', 'Beige', 'Maroon', 'Navy Blue',
  'Pearl White', 'Metallic Gray', 'Other'
];

const vehicleFuelTypes = [
  'Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG', 'LPG', 'Other'
];

const vehicleTransmissions = [
  'Manual', 'Automatic'
];

const vehicleBodyTypes = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon',
  'Pickup Truck', 'Van', 'Minivan', 'Truck', 'Bus', 'Motorcycle',
  'Other'
];

const getFieldIdentifiers = (name: string) => ({
  id: name.replace(/[^a-zA-Z0-9_-]+/g, '-'),
  name,
});

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const submitInFlightRef = useRef(false);
  const [step, setStep] = useState(1);
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') {
      const savedPrefs = localStorage.getItem('userPreferences');
      return savedPrefs ? JSON.parse(savedPrefs) : { useDropdowns: true };
    }
    return { useDropdowns: true };
  });
  
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [formData, setFormData] = useState<OpportunityFormData>({
    accountType: 'individual',
    source: 'walk_in',
    firstName: '',
    lastName: '',
    companyName: '',
    email: '',
    phone: '',
    secondaryPhone: '',
    customerCountry: '',
    customerLocation: '',
    phoneCode: '+254',
    vehicles: [{
      id: '1',
      vin: '',
      registrationNumber: '',
      make: '',
      model: '',
      year: '',
      colorCode: '',
      engineSize: '',
      fuelType: '',
      transmission: '',
      mileage: '',
      bodyType: ''
    }],
    servicesProducts: [],
    notes: '',
    currentStep: 1,
    opportunityType: 'SERVICE',
    contactPersonName: '',
    contactPersonPhone: '',
    contactPersonEmail: '',
    contactPersonTitle: '',
    assignedTo: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [countryCodes, setCountryCodes] = useState<CountryCode[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [showCountryCodes, setShowCountryCodes] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [createdOpportunity, setCreatedOpportunity] = useState<Opportunity | null>(null);
  
  const [showMakeDropdown, setShowMakeDropdown] = useState<number | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState<number | null>(null);
  const [showFuelDropdown, setShowFuelDropdown] = useState<number | null>(null);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState<number | null>(null);
  const [showBodyTypeDropdown, setShowBodyTypeDropdown] = useState<number | null>(null);
  const [showServiceProductDropdown, setShowServiceProductDropdown] = useState<number | null>(null);
  
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [fuelSearch, setFuelSearch] = useState('');
  const [transmissionSearch, setTransmissionSearch] = useState('');
  const [bodyTypeSearch, setBodyTypeSearch] = useState('');
  const [serviceProductSearch, setServiceProductSearch] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [vehicleMakes, setVehicleMakes] = useState<string[]>(fallbackVehicleMakes);
  const [vehicleModelsByMake, setVehicleModelsByMake] = useState<Record<string, string[]>>(fallbackVehicleModels);
  const [loadingVehicleData, setLoadingVehicleData] = useState(false);
   
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateOpportunities, setDuplicateOpportunities] = useState<Opportunity[]>([]);
  const [showMergeDuplicatesModal, setShowMergeDuplicatesModal] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  
  // New state for services and products from APIs
  const [services, setServices] = useState<Service[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [servicesLoaded, setServicesLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const accountTypes = [
    { value: 'individual', label: 'Individual', icon: User, disabled: false },
    { value: 'organization', label: 'Company/Organization', icon: Building, disabled: false }
  ];

  const sources = [
    { value: 'walk_in', label: 'Walk In' },
    { value: 'website', label: 'Website' },
    { value: 'referral', label: 'Referral' },
    { value: 'manual', label: 'Manual' },
    { value: 'phone', label: 'Phone Call' },
    { value: 'email', label: 'Email' },
    { value: 'social_media', label: 'Social Media' },
    { value: 'partner', label: 'Partner' },
  ];

  const opportunityTypes = [
    { value: 'SERVICE', label: 'Service', icon: Settings, color: 'bg-blue-100 text-blue-600' },
    { value: 'SALE', label: 'Product', icon: Package, color: 'bg-green-100 text-green-600' },
  ];

  const totalSteps = 3;

  const makeDropdownRef = useRef<HTMLDivElement | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement | null>(null);
  const fuelDropdownRef = useRef<HTMLDivElement | null>(null);
  const transmissionDropdownRef = useRef<HTMLDivElement | null>(null);
  const bodyTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const serviceProductDropdownRef = useRef<HTMLDivElement | null>(null);
  const preferencesRef = useRef<HTMLDivElement | null>(null);
  const usersDropdownRef = useRef<HTMLDivElement | null>(null);

  // Fetch services and products when step changes to 3 or opportunityType changes
  useEffect(() => {
    if (step === 3) {
      fetchServicesAndProducts();
    }
  }, [step, formData.opportunityType]);

  const fetchServicesAndProducts = async () => {
    if (formData.opportunityType === 'SERVICE' && !servicesLoaded) {
      try {
        setLoadingServices(true);
        const servicesData = await serviceService.getActiveServices();
        setServices(servicesData);
        setServicesLoaded(true);
      } catch (error) {
        console.error('Error fetching services:', error);
        showToast('Failed to load services', 'error', 3000);
      } finally {
        setLoadingServices(false);
      }
    }
    
    if (formData.opportunityType === 'SALE' && !productsLoaded) {
      try {
        setLoadingProducts(true);
        const productsData = await productService.getActiveProducts();
        setProducts(productsData);
        setProductsLoaded(true);
      } catch (error) {
        console.error('Error fetching products:', error);
        showToast('Failed to load products', 'error', 3000);
      } finally {
        setLoadingProducts(false);
      }
    }
  };

  const isSalesPerson = (user: User): boolean => {
    if (typeof user.role === 'string') {
      const lowerRole = user.role.toLowerCase();
      return lowerRole.includes('sales') || lowerRole.includes('representative');
    } else if (user.role && typeof user.role === 'object') {
      const roleName = user.role.name?.toLowerCase() || user.role.display_name?.toLowerCase() || '';
      return roleName.includes('sales') || roleName.includes('representative');
    }
    return false;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (makeDropdownRef.current && !makeDropdownRef.current.contains(event.target as Node)) {
        setShowMakeDropdown(null);
        setMakeSearch('');
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(null);
        setModelSearch('');
      }
      if (fuelDropdownRef.current && !fuelDropdownRef.current.contains(event.target as Node)) {
        setShowFuelDropdown(null);
        setFuelSearch('');
      }
      if (transmissionDropdownRef.current && !transmissionDropdownRef.current.contains(event.target as Node)) {
        setShowTransmissionDropdown(null);
        setTransmissionSearch('');
      }
      if (bodyTypeDropdownRef.current && !bodyTypeDropdownRef.current.contains(event.target as Node)) {
        setShowBodyTypeDropdown(null);
        setBodyTypeSearch('');
      }
      if (serviceProductDropdownRef.current && !serviceProductDropdownRef.current.contains(event.target as Node)) {
        setShowServiceProductDropdown(null);
        setServiceProductSearch('');
      }
      if (preferencesRef.current && !preferencesRef.current.contains(event.target as Node)) {
        setShowPreferences(false);
      }
      if (usersDropdownRef.current && !usersDropdownRef.current.contains(event.target as Node)) {
        setShowUsersDropdown(false);
        setUserSearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        setLoadingCountries(true);
        const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,idd');
        const data = await response.json();
        
        const formattedCountries = data
          .filter((country: any) => country.idd?.root && country.idd?.suffixes?.[0])
          .map((country: any) => {
            const getFlagEmoji = (countryCode: string) => {
              const codePoints = countryCode
                .toUpperCase()
                .split('')
                .map(char => 127397 + char.charCodeAt(0));
              return String.fromCodePoint(...codePoints);
            };
            
            return {
              code: country.cca2,
              name: country.name.common,
              flag: getFlagEmoji(country.cca2),
              dialCode: `${country.idd.root}${country.idd.suffixes[0]}`
            };
          })
          .sort((a: CountryCode, b: CountryCode) => a.name.localeCompare(b.name));
        
        setCountryCodes(formattedCountries);
      } catch (error) {
        console.error('Error fetching countries:', error);
        const staticCountries: CountryCode[] = [
          { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254' },
          { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1' },
          { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44' },
          { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91' },
          { code: 'CN', name: 'China', flag: '🇨🇳', dialCode: '+86' },
          { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27' },
          { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234' },
          { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251' },
          { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971' },
          { code: 'SA', name: 'Saudi Arabia', flag: '🇸🇦', dialCode: '+966' }
        ];
        setCountryCodes(staticCountries);
      } finally {
        setLoadingCountries(false);
      }
    };

    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoadingUsers(true);
        const usersData = await userService.getAllUsers();
        const salesPeople = usersData.filter(user => isSalesPerson(user));
        setUsers(salesPeople || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        // showToast('Failed to load users list', 'error', 3000);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [showToast]);

  useEffect(() => {
    const fetchVehicleData = async () => {
      try {
        setLoadingVehicleData(true);
        const makeModels = await cardataService.getMakeModels();

        if (Array.isArray(makeModels) && makeModels.length > 0) {
          const normalizedMakes = makeModels
            .map(item => item.make)
            .filter(Boolean)
            .sort((a, b) => a.localeCompare(b));

          const normalizedModels: Record<string, string[]> = {};
          makeModels.forEach(item => {
            if (!item.make) return;
            normalizedModels[item.make] = (item.models || []).filter(Boolean);
          });

          setVehicleMakes(normalizedMakes);
          setVehicleModelsByMake(normalizedModels);
        } else {
          setVehicleMakes(fallbackVehicleMakes);
          setVehicleModelsByMake(fallbackVehicleModels);
        }
      } catch (error) {
        console.error('Error loading vehicle make/model data:', error);
        setVehicleMakes(fallbackVehicleMakes);
        setVehicleModelsByMake(fallbackVehicleModels);
      } finally {
        setLoadingVehicleData(false);
      }
    };

    fetchVehicleData();
  }, []);

  const getUserRoleName = (user: User): string => {
    if (typeof user.role === 'string') {
      return user.role;
    } else if (user.role && typeof user.role === 'object') {
      return user.role.name || 'User';
    }
    return 'User';
  };

  const getUserDisplayInfo = (user: User) => {
    const roleInfo = getUserRoleName(user);
    return {
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      roleName: roleInfo,
      isSales: isSalesPerson(user),
      email: user.email || '',
      department: user.department || '',
    };
  };

  const getUserId = (user: User): string => user._id || user.id;
  const getCurrentUserId = (): string | undefined => {
    const currentUser = authService.getUser();
    return currentUser?.id || undefined;
  };

  const canCurrentUserMergeDuplicates = (): boolean => {
    const currentUser = authService.getUser();
    const role = String(currentUser?.role || '').toLowerCase().trim();
    return ['superadmin', 'admin', 'management'].includes(role);
  };

  const savePreferences = (prefs: UserPreferences) => {
    setUserPreferences(prefs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(prefs));
    }
    showToast('Preferences saved!', 'success', 2000);
  };

  const toggleDropdownsPreference = () => {
    const newPrefs = { ...userPreferences, useDropdowns: !userPreferences.useDropdowns };
    savePreferences(newPrefs);
  };

  const handleInputChange = (field: keyof OpportunityFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVehicleChange = (index: number, field: keyof Vehicle, value: string) => {
    const updatedVehicles = [...formData.vehicles];
    updatedVehicles[index] = { ...updatedVehicles[index], [field]: value };
    
    if (field === 'make') {
      updatedVehicles[index].model = '';
    }
    
    setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleServiceProductChange = (index: number, field: keyof ServiceProduct, value: any) => {
    const updatedServicesProducts = [...formData.servicesProducts];
    const item = { ...updatedServicesProducts[index], [field]: value };
    
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discountAmount = subtotal * ((item.discount || 0) / 100);
      item.subtotal = subtotal;
      item.total = subtotal - discountAmount;
    }
    
    updatedServicesProducts[index] = item;
    setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
  };

  const selectServiceProductSuggestion = (index: number, item: Service | Product, isService: boolean) => {
    const updatedServicesProducts = [...formData.servicesProducts];
    const productItem = item as Product;
    const serviceItem = item as Service;
    
    updatedServicesProducts[index].title = isService ? serviceItem.name : productItem.name;
    updatedServicesProducts[index].description = isService ? serviceItem.description : productItem.description;
    updatedServicesProducts[index].unitPrice = isService ? 0 : (productItem as any).price || 0;
    
    // Store references for cascading modules
    if (isService) {
      updatedServicesProducts[index].serviceId = serviceItem.id;
      updatedServicesProducts[index].serviceCode = serviceItem.serviceCode;
      updatedServicesProducts[index].type = 'SERVICE';
    } else {
      updatedServicesProducts[index].productId = productItem.id;
      updatedServicesProducts[index].productCode = productItem.productCode;
      updatedServicesProducts[index].type = 'PRODUCT';
    }
    
    setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
    setShowServiceProductDropdown(null);
    setServiceProductSearch('');
  };

  const addVehicle = () => {
    setFormData(prev => ({
      ...prev,
      vehicles: [...prev.vehicles, {
        id: Date.now().toString(),
        vin: '',
        registrationNumber: '',
        make: '',
        model: '',
        year: '',
        colorCode: '',
        engineSize: '',
        fuelType: '',
        transmission: '',
        mileage: '',
        bodyType: ''
      }]
    }));
  };

  const removeVehicle = (index: number) => {
    if (formData.vehicles.length > 1) {
      const updatedVehicles = formData.vehicles.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
    }
  };

  const addServiceProduct = () => {
    setFormData(prev => ({
      ...prev,
      servicesProducts: [...prev.servicesProducts, {
        id: Date.now().toString(),
        title: '',
        description: '',
        type: formData.opportunityType === 'SERVICE' ? 'SERVICE' : 'PRODUCT',
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

  const calculateSubtotal = () => {
    return formData.servicesProducts.reduce((total, item) => {
      return total + (item.subtotal || 0);
    }, 0);
  };

  const calculateTotalDiscount = () => {
    return formData.servicesProducts.reduce((total, item) => {
      return total + (item.subtotal * (item.discount / 100) || 0);
    }, 0);
  };

  const calculateTotal = () => {
    return formData.servicesProducts.reduce((total, item) => {
      return total + (item.total || 0);
    }, 0);
  };

  const getFlagEmoji = (countryCode: string) => {
    let country;
    
    if (countryCode.startsWith('+')) {
      country = countryCodes.find(c => c.dialCode === countryCode);
    } else {
      country = countryCodes.find(c => c.code === countryCode);
    }
    
    if (country) {
      return country.flag;
    }
    
    return '🌍';
  };

  const selectCountryCode = (dialCode: string) => {
    setFormData(prev => ({ ...prev, phoneCode: dialCode }));
    setShowCountryCodes(false);
    setCountrySearch('');
  };

  const filteredCountries = countryCodes.filter(country =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    country.dialCode.includes(countrySearch) ||
    country.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const filteredMakes = vehicleMakes.filter(make =>
    make.toLowerCase().includes(makeSearch.toLowerCase())
  );

  const filteredModels = (make: string) => {
    const models = vehicleModelsByMake[make] || [];
    return models.filter(model =>
      model.toLowerCase().includes(modelSearch.toLowerCase())
    );
  };

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
    if (formData.opportunityType === 'SERVICE') {
      return services.filter(service =>
        service.name.toLowerCase().includes(serviceProductSearch.toLowerCase()) ||
        service.description.toLowerCase().includes(serviceProductSearch.toLowerCase()) ||
        service.serviceCode.toLowerCase().includes(serviceProductSearch.toLowerCase())
      );
    } else {
      return products.filter(product =>
        product.name.toLowerCase().includes(serviceProductSearch.toLowerCase()) ||
        product.description.toLowerCase().includes(serviceProductSearch.toLowerCase()) ||
        product.productCode.toLowerCase().includes(serviceProductSearch.toLowerCase())
      );
    }
  };

  const RequiredField = () => (
    <span className="text-red-500 ml-1">*</span>
  );

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (formData.accountType === 'individual') {
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      } else if (formData.accountType === 'organization') {
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.contactPersonName?.trim()) newErrors.contactPersonName = 'Contact person name is required';
      }
      
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      const phoneRegex = /^\d+$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number (digits only)';
      }
    }

    if (step === 3) {
      if (formData.servicesProducts.length === 0) {
        newErrors.servicesProducts = 'At least one service or product is required';
      } else {
        const hasInvalidItem = formData.servicesProducts.some(item => 
          !item.title.trim() || !item.type
        );
        if (hasInvalidItem) {
          newErrors.servicesProducts = 'Each service/product must have a title and valid type';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (step < totalSteps) {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveDraft = () => {
    localStorage.setItem('opportunityDraft', JSON.stringify(formData));
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 3000);
  };

  const handleSubmit = async () => {
    if (submitInFlightRef.current || isSubmitting) {
      return;
    }

    if (!validateStep()) {
      showToast('Please fix the validation errors before submitting.', 'error', 3000);
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const similarOpportunities = await findSimilarOpportunities();

      if (similarOpportunities.length > 0) {
        setDuplicateOpportunities(similarOpportunities);
        setShowDuplicateModal(true);
        setIsSubmitting(false);
        submitInFlightRef.current = false;
        const firstMatchName = similarOpportunities[0]?.customer?.name || 'This client';
        showToast(`${firstMatchName} already exists in opportunities. Use the existing record.`, 'warning', 5000);
        return;
      }

      await createOpportunity();
    } catch (error: any) {
      console.error('Validation error:', error);
      let errorMessage = 'Failed to validate duplicates. Opportunity was not created.';
      
      if (error?.response?.data?.validationErrors) {
        errorMessage = Array.isArray(error.response.data.validationErrors)
          ? error.response.data.validationErrors.join(', ')
          : error.response.data.validationErrors;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      showToast(errorMessage, 'error', 5000);
      setIsSubmitting(false);
      submitInFlightRef.current = false;
    }
  };
  const createOpportunity = async () => {
    if (!submitInFlightRef.current) {
      submitInFlightRef.current = true;
      setIsSubmitting(true);
    }

    try {
      const isIndividual = formData.accountType === 'individual';

      const subject = isIndividual
        ? `${formData.firstName} ${formData.lastName}'s ${formData.opportunityType.toLowerCase()} request`
        : `${formData.companyName}'s ${formData.opportunityType.toLowerCase()} request`;

      const subtotal = calculateSubtotal();
      const totalDiscount = calculateTotalDiscount();
      const total = calculateTotal();

      const packageType = formData.opportunityType === 'SERVICE' ? 'work_order' : 'sales_order';

      // Map services/products to include references for cascading modules
      const mappedServicesProducts = formData.servicesProducts.map(item => {
        let mappedType: 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR';
        
        switch (formData.opportunityType) {
          case 'SERVICE':
          case 'REPAIR':
          case 'MAINTENANCE':
          case 'INSPECTION':
            mappedType = 'SERVICE';
            break;
          case 'SALE':
            mappedType = 'PRODUCT';
            break;
          default:
            mappedType = 'SERVICE';
        }

        const serviceProductDto = {
          title: item.title,
          description: item.description,
          type: mappedType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
          total: item.total,
          // Include references for cascading modules
          ...(item.productId && { productId: item.productId, productCode: item.productCode }),
          ...(item.serviceId && { serviceId: item.serviceId, serviceCode: item.serviceCode })
        };

        return serviceProductDto;
      });

      const apiFormData: CreateOpportunityData = {
        type: formData.accountType,
        source: normalizeSourceForApi(formData.source),
        subject,
        status: 'new',
        opportunityType: formData.opportunityType,
        packageType: packageType,
        assignedTo: formData.assignedTo || getCurrentUserId(),

        customer: {
          name: isIndividual
            ? `${formData.firstName} ${formData.lastName}`.trim()
            : formData.companyName,
          email: normalizeEmailValue(formData.email),
          phone: normalizePhoneForStorage(formData.phoneCode, formData.phone) || undefined,
          secondaryPhone: formData.secondaryPhone
            ? normalizePhoneForStorage(formData.phoneCode, formData.secondaryPhone)
            : undefined,
          country: formData.customerCountry.trim() || undefined,
          location: formData.customerLocation.trim() || undefined,
          companyName: !isIndividual ? formData.companyName : undefined,
          ...(formData.accountType === 'organization' && {
            contactPersonName: formData.contactPersonName || undefined,
            contactPersonEmail: normalizeEmailValue(formData.contactPersonEmail),
            contactPersonPhone: formData.contactPersonPhone ? 
              normalizePhoneForStorage(formData.phoneCode, formData.contactPersonPhone) : undefined,
            contactPersonTitle: formData.contactPersonTitle || undefined,
          }),
        },

        vehicles: formData.vehicles?.length
          ? formData.vehicles.map(mapVehicle)
          : undefined,

        servicesProducts: mappedServicesProducts.length > 0 ? mappedServicesProducts : undefined,

        notes: formData.notes || undefined,
        subtotal,
        totalDiscount,
        total,
      };

      const result = await opportunityService.createOpportunity(apiFormData);

      setCreatedOpportunity(result);
      setShowSuccessModal(true);
      localStorage.removeItem('opportunityDraft');
      
      showToast('Opportunity created successfully!', 'success', 3000);

    } catch (error: any) {
      const duplicateFromApi = extractDuplicatesFromApiError(error);
      if (duplicateFromApi.length > 0) {
        setDuplicateOpportunities(duplicateFromApi);
        setShowDuplicateModal(true);
        const firstMatchName = duplicateFromApi[0]?.customer?.name || 'This client';
        showToast(`${firstMatchName} already exists in opportunities. Use the existing record.`, 'warning', 5000);
        return;
      }

      handleCreateOpportunityError(error);
    } finally {
      setIsSubmitting(false);
      submitInFlightRef.current = false;
    }
  };
  const handleContinueAnyway = () => {
    showToast('Client already exists. Creating duplicate opportunities is disabled.', 'error', 5000);
  };
  const findSimilarOpportunities = async () => {
    const normalizedEmail = normalizeEmailValue(formData.email);
    const phoneCandidates = buildPhoneDuplicateCandidates(formData.phoneCode, formData.phone);
    const customerName =
      formData.accountType === 'individual'
        ? `${formData.firstName} ${formData.lastName}`.trim()
        : formData.companyName.trim();

    const hasParams = Boolean(normalizedEmail || phoneCandidates.length > 0 || customerName);
    if (!hasParams) {
      throw new Error('Provide customer email, phone, or name to verify duplicates.');
    }

    const baseParams: SimilarOpportunitiesRequest = {
      customerName: customerName || undefined,
      customerEmail: normalizedEmail,
      limit: 25,
    };

    const duplicateBuckets: Opportunity[][] = [];

    // Initial broad check with primary normalized phone candidate.
    const primaryPhone = phoneCandidates[0];
    const initialParams: SimilarOpportunitiesRequest = primaryPhone
      ? { ...baseParams, customerPhone: primaryPhone }
      : baseParams;
    duplicateBuckets.push(await opportunityService.findSimilarOpportunities(initialParams));

    // Additional checks for common phone-format variants (e.g. +254..., 254..., 07..., local).
    const alternatePhoneCandidates = phoneCandidates.filter((candidate) => candidate !== primaryPhone).slice(0, 4);
    if (alternatePhoneCandidates.length > 0) {
      const alternateResults = await Promise.allSettled(
        alternatePhoneCandidates.map((candidate) =>
          opportunityService.findSimilarOpportunities({
            ...baseParams,
            customerPhone: candidate,
            limit: 25,
          })
        )
      );

      alternateResults.forEach((result) => {
        if (result.status === 'fulfilled') {
          duplicateBuckets.push(result.value);
        }
      });
    }

    // Fallback duplicate endpoint for organizations that have stricter duplicate rules on backend.
    const fallbackDuplicateResult = await opportunityService.checkForDuplicatesSimple({
      email: normalizedEmail,
      phone: primaryPhone || undefined,
      firstName: formData.accountType === 'individual' ? formData.firstName : undefined,
      lastName: formData.accountType === 'individual' ? formData.lastName : undefined,
      companyName: formData.accountType === 'organization' ? formData.companyName : undefined,
    });
    if (fallbackDuplicateResult.isDuplicate && fallbackDuplicateResult.existingOpportunities.length > 0) {
      duplicateBuckets.push(fallbackDuplicateResult.existingOpportunities);
    }

    const similarOpportunities = duplicateBuckets
      .flat()
      .filter((opportunity) => Boolean(opportunity?._id || opportunity?.id))
      .reduce<Opportunity[]>((acc, opportunity) => {
        const key = String(opportunity._id || opportunity.id);
        if (!acc.some((existing) => String(existing._id || existing.id) === key)) {
          acc.push(opportunity);
        }
        return acc;
      }, []);

    if (similarOpportunities.length > 0) {
      showToast(`Found ${similarOpportunities.length} similar opportunity(s)`, 'info', 2000);
    }

    return similarOpportunities;
  };
  const mapOpportunityTypeToServiceProductType = (
    opportunityType: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION'
  ): 'SERVICE' | 'PRODUCT' | 'PART' | 'LABOR' => {
    switch (opportunityType) {
      case 'SERVICE':
      case 'REPAIR':
      case 'MAINTENANCE':
      case 'INSPECTION':
        return 'SERVICE';
      case 'SALE':
        return 'PRODUCT';
      default:
        return 'SERVICE';
    }
  };

  type VehicleDTO = NonNullable<CreateOpportunityData['vehicles']>[number];

  const mapVehicle = (v: Vehicle): VehicleDTO => ({
    vin: v.vin || undefined,
    registrationNumber: v.registrationNumber || undefined,
    licensePlate: v.registrationNumber || undefined, // Use registration number as license plate if not provided
    make: v.make,
    model: v.model,
    year: v.year ? Number(v.year) || undefined : undefined,
    mileage: v.mileage ? String(v.mileage) : undefined,
    color: v.colorCode || undefined,
    engineSize: v.engineSize || undefined,
    fuelType: v.fuelType || undefined,
    transmission: v.transmission || undefined,
    bodyType: v.bodyType || undefined,
  });

  const normalizeDuplicateOpportunity = (raw: any): Opportunity => {
    const customer = raw?.customer || {};
    const id = raw?._id || raw?.id || '';
    const owner = raw?.owner || null;

    return {
      _id: String(id),
      id: String(id),
      type: (raw?.type || formData.accountType || 'individual') as Opportunity['type'],
      subject: String(raw?.subject || 'Potential duplicate'),
      status: (raw?.status || 'new') as Opportunity['status'],
      source: raw?.source || undefined,
      customer: {
        name: String(customer?.name || ''),
        email: customer?.email || undefined,
        phone: customer?.phone || undefined,
        companyName: customer?.companyName || undefined,
        _id: String(customer?._id || customer?.id || ''),
        id: String(customer?.id || customer?._id || ''),
      },
      vehicles: Array.isArray(raw?.vehicles) ? raw.vehicles : [],
      jobCards: [],
      waivers: [],
      quotes: [],
      assignedTo: owner || raw?.assignedTo || null,
      createdAt: raw?.createdAt || new Date().toISOString(),
      updatedAt: raw?.updatedAt || new Date().toISOString(),
      isNurturing: Boolean(raw?.isNurturing),
      leadScore: raw?.leadScore
        ? {
            totalScore: Number(raw.leadScore.totalScore || 0),
            tier: (raw.leadScore.tier || 'cold') as 'hot' | 'warm' | 'cold',
            priority: Number(raw.leadScore.priority || 0),
            lastCalculated: raw.leadScore.lastCalculated || new Date().toISOString(),
          }
        : undefined,
    };
  };

  const extractDuplicatePayload = (error: any): any | null => {
    const parsePayload = (value: unknown): any | null => {
      if (!value) return null;
      if (typeof value === 'object') return value;
      if (typeof value !== 'string') return null;

      const marker = '): ';
      const payload = value.includes(marker) ? value.split(marker).slice(1).join(marker) : value;
      try {
        return JSON.parse(payload);
      } catch {
        return null;
      }
    };

    return (
      parsePayload(error?.response?.data) ||
      parsePayload(error?.data) ||
      parsePayload(error?.message)
    );
  };

  const extractDuplicatesFromApiError = (error: any): Opportunity[] => {
    const parsed = extractDuplicatePayload(error);

    const code = parsed?.code || parsed?.errorCode;
    const normalizedCode = String(code || '').toUpperCase();
    const isDuplicateCode =
      normalizedCode === 'DUPLICATE_OPPORTUNITY' ||
      normalizedCode === 'DUPLICATE_OPPORTUNITY_AUTO_REASSIGNED';
    const duplicateList = Array.isArray(parsed?.duplicates) ? parsed.duplicates : [];

    if (!isDuplicateCode || duplicateList.length === 0) {
      return [];
    }

    return duplicateList.map((item: any) => normalizeDuplicateOpportunity(item));
  };

  const getDuplicateFeedbackMessage = (error: any): string | null => {
    const parsed = extractDuplicatePayload(error);
    const code = String(parsed?.code || parsed?.errorCode || '').toUpperCase();

    if (code !== 'DUPLICATE_OPPORTUNITY' && code !== 'DUPLICATE_OPPORTUNITY_AUTO_REASSIGNED') {
      return null;
    }

    const firstDuplicate = Array.isArray(parsed?.duplicates) ? parsed.duplicates[0] : null;
    const ownerName =
      firstDuplicate?.owner?.name ||
      firstDuplicate?.assignedTo?.name ||
      firstDuplicate?.assignedTo?.fullName ||
      null;

    if (code === 'DUPLICATE_OPPORTUNITY_AUTO_REASSIGNED') {
      return 'Duplicate found. The existing opportunity was reassigned to you because the previous owner was unavailable.';
    }

    if (ownerName) {
      return `This opportunity already exists and is currently owned by ${ownerName}.`;
    }

    return 'This opportunity already exists and is currently assigned to another sales representative.';
  };

  const handleCreateOpportunityError = (error: any) => {
    console.error('Create opportunity error:', error);

    let errorMessage = 'Failed to create opportunity.';

    const duplicateFromApi = extractDuplicatesFromApiError(error);
    if (duplicateFromApi.length > 0) {
      setDuplicateOpportunities(duplicateFromApi);
      setShowDuplicateModal(true);
      showToast(
        getDuplicateFeedbackMessage(error) || 'Client already exists in opportunities. Use the existing record.',
        'warning',
        5000
      );
      return;
    }
    
    if (error?.response?.data) {
      // Handle different error response formats
      if (Array.isArray(error.response.data.validationErrors)) {
        errorMessage = error.response.data.validationErrors.join(', ');
      } else if (error.response.data.message) {
        errorMessage = error.response.data.message;
      } else if (error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (typeof error.response.data === 'string') {
        errorMessage = error.response.data;
      }
    } else if (error?.request) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error?.message) {
      errorMessage = error.message;
    }

    showToast(errorMessage, 'error', 5000);
  };

  const handleViewOpportunityDetails = () => {
    if (createdOpportunity) {
      showToast(`Redirecting to opportunity ${createdOpportunity.subject}`, 'info', 2000);
      setShowSuccessModal(false);
      router.push(`/opportunities/${createdOpportunity._id}`);
    }
  };

  const handleCreateAnother = () => {
    setShowSuccessModal(false);
    setFormData({
      accountType: 'individual',
      source: 'walk_in',
      firstName: '',
      lastName: '',
      companyName: '',
      email: '',
      phone: '',
      secondaryPhone: '',
      customerCountry: '',
      customerLocation: '',
      phoneCode: '+254',
      vehicles: [{
        id: '1',
        vin: '',
        registrationNumber: '',
        make: '',
        model: '',
        year: '',
        colorCode: '',
        engineSize: '',
        fuelType: '',
        transmission: '',
        mileage: '',
        bodyType: ''
      }],
      servicesProducts: [],
      notes: '',
      currentStep: 1,
      opportunityType: 'SERVICE',
      contactPersonName: '',
      contactPersonPhone: '',
      contactPersonEmail: '',
      contactPersonTitle: '',
      assignedTo: ''
    });
    setStep(1);
    setErrors({});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    router.push('/opportunities');
  };

  const handleMergeComplete = (mergedOpportunity: Opportunity) => {
    setShowMergeDuplicatesModal(false);
    setShowDuplicateModal(false);
    setDuplicateOpportunities([]);
    showToast('Duplicate opportunities merged successfully', 'success', 3000);

    if (mergedOpportunity?._id) {
      router.push(`/opportunities/details?id=${mergedOpportunity._id}`);
    }
  };

  useEffect(() => {
    const savedDraft = localStorage.getItem('opportunityDraft');
    if (savedDraft) {
      const parsedDraft = JSON.parse(savedDraft);
      setFormData((prev) => ({
        ...prev,
        ...parsedDraft,
        source: normalizeSourceForForm(parsedDraft?.source),
        customerCountry: typeof parsedDraft?.customerCountry === 'string' ? parsedDraft.customerCountry : '',
        customerLocation: typeof parsedDraft?.customerLocation === 'string' ? parsedDraft.customerLocation : '',
      }));
    }
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, currentStep: step }));
  }, [step]);

  const stepTitles = [
    'Account Information',
    'Vehicle Details',
    'Services & Products'
  ];

  const stepDescriptions = [
    'Enter customer and basic opportunity information',
    'Add vehicle(s) for this opportunity',
    'Select services, products, and create quotes'
  ];

  const renderVehicleFieldWithDropdown = (
    index: number,
    field: keyof Vehicle,
    label: string,
    placeholder: string,
    options: string[],
    showDropdown: number | null,
    setShowDropdown: (index: number | null) => void,
    searchValue: string,
    setSearchValue: (value: string) => void,
    filteredOptions: string[],
    dropdownRef?: React.RefObject<HTMLDivElement | null>
  ) => {
    if (userPreferences.useDropdowns) {
      return (
        <div className="relative" ref={dropdownRef}>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {label}
          </label>
          <div className="relative">
            <input
              id={`vehicle-${index}-${String(field)}`}
              name={`vehicles.${index}.${String(field)}`}
              type="text"
              value={formData.vehicles[index][field] || ''}
              onChange={(e) => {
                handleVehicleChange(index, field, e.target.value);
                setSearchValue(e.target.value);
              }}
              onFocus={() => setShowDropdown(index)}
              placeholder={placeholder}
              className={`pl-3 pr-8 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors`}
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
                    id={`vehicle-${index}-${String(field)}-search`}
                    name={`vehicleFieldSearch.${index}.${String(field)}`}
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
            id={`vehicle-${index}-${String(field)}`}
            name={`vehicles.${index}.${String(field)}`}
            type="text"
            value={formData.vehicles[index][field] || ''}
            onChange={(e) => handleVehicleChange(index, field, e.target.value)}
            placeholder={placeholder}
            className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
          />
        </div>
      );
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 shadow-lg">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Create New Opportunity</h1>
                  <p className="text-blue-100 text-sm">{stepTitles[step - 1]}</p>
                  <p className="text-blue-200 text-xs mt-1">{stepDescriptions[step - 1]}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="relative" ref={preferencesRef}>
                  <button
                    onClick={() => setShowPreferences(!showPreferences)}
                    className="p-2 hover:bg-white/20 rounded-xl transition-colors flex items-center gap-2"
                  >
                    <SettingsIcon className="h-5 w-5 text-white" />
                  </button>
                  
                  {showPreferences && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Form Settings</h3>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">Use dropdowns for vehicle fields</span>
                            <button
                              onClick={toggleDropdownsPreference}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                userPreferences.useDropdowns ? 'bg-blue-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  userPreferences.useDropdowns ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          </div>
                          
                          <div className="text-xs text-gray-500 pt-2 border-t">
                            <p>When enabled, vehicle fields will show dropdowns with suggestions.</p>
                            <p>When disabled, you can type freely in all fields.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => router.push('/opportunities')}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
            
            <div className="mt-8">
              <div className="flex items-center justify-between">
                {[1, 2, 3].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                      step === stepNumber 
                        ? 'bg-white border-white text-blue-600 scale-110 shadow-lg' 
                        : step > stepNumber 
                          ? 'bg-white/30 border-white/30 text-white'
                          : 'bg-transparent border-white/30 text-white'
                    }`}>
                      {step > stepNumber ? <Check className="h-5 w-5" /> : stepNumber}
                    </div>
                    <div className="ml-3">
                      <div className={`text-sm font-medium transition-all ${
                        step >= stepNumber ? 'text-white' : 'text-white/60'
                      }`}>
                        Step {stepNumber}
                      </div>
                      <div className={`text-xs transition-all ${
                        step >= stepNumber ? 'text-white' : 'text-white/40'
                      }`}>
                        {stepNumber === 1 && 'Account'}
                        {stepNumber === 2 && 'Vehicles'}
                        {stepNumber === 3 && 'Services'}
                      </div>
                    </div>
                    {stepNumber < 3 && (
                      <div className={`h-0.5 w-16 md:w-24 mx-4 transition-all ${
                        step > stepNumber ? 'bg-white/50' : 'bg-white/20'
                      }`} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 md:p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
                  
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Type <RequiredField />
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {accountTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => handleInputChange('accountType', type.value)}
                            className={`p-4 rounded-xl border transition-all duration-200 ${
                              formData.accountType === type.value
                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            } ${type.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            disabled={type.disabled}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${
                                formData.accountType === type.value
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-500'
                              }`}>
                                <Icon className="h-5 w-5" />
                              </div>
                              <span className="font-medium text-gray-800">{type.label}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Where did this opportunity come from?
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

                  <div className="space-y-4">
                    {formData.accountType === 'individual' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name <RequiredField />
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              {...getFieldIdentifiers('firstName')}
                              type="text"
                              value={formData.firstName}
                              onChange={(e) => handleInputChange('firstName', e.target.value)}
                              placeholder="e.g., John"
                              className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                                errors.firstName ? 'border-red-300' : 'border-gray-200'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                            />
                          </div>
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
                            {...getFieldIdentifiers('lastName')}
                            type="text"
                            value={formData.lastName}
                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                            placeholder="e.g., Doe"
                            className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Company Name <RequiredField />
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                              {...getFieldIdentifiers('companyName')}
                              type="text"
                              value={formData.companyName}
                              onChange={(e) => handleInputChange('companyName', e.target.value)}
                              placeholder="e.g., Doe Enterprises Ltd."
                              className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                                errors.companyName ? 'border-red-300' : 'border-gray-200'
                              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                            />
                          </div>
                          {errors.companyName && (
                            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              {errors.companyName}
                            </p>
                          )}
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Contact className="h-5 w-5 text-blue-600" />
                            Contact Person Details
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Person Name <RequiredField />
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  {...getFieldIdentifiers('contactPersonName')}
                                  type="text"
                                  value={formData.contactPersonName}
                                  onChange={(e) => handleInputChange('contactPersonName', e.target.value)}
                                  placeholder="e.g., John Doe"
                                  className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                                    errors.contactPersonName ? 'border-red-300' : 'border-gray-200'
                                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                />
                              </div>
                              {errors.contactPersonName && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.contactPersonName}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title/Position
                              </label>
                              <input
                                {...getFieldIdentifiers('contactPersonTitle')}
                                type="text"
                                value={formData.contactPersonTitle}
                                onChange={(e) => handleInputChange('contactPersonTitle', e.target.value)}
                                placeholder="e.g., Procurement Manager"
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Person Email
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  {...getFieldIdentifiers('contactPersonEmail')}
                                  type="email"
                                  value={formData.contactPersonEmail}
                                  onChange={(e) => handleInputChange('contactPersonEmail', e.target.value)}
                                  placeholder="e.g., john.doe@company.com"
                                  className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                                    errors.contactPersonEmail ? 'border-red-300' : 'border-gray-200'
                                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                                />
                              </div>
                              {errors.contactPersonEmail && (
                                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.contactPersonEmail}
                                </p>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Person Phone
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  {...getFieldIdentifiers('contactPersonPhone')}
                                  type="tel"
                                  value={formData.contactPersonPhone}
                                  onChange={(e) => handleInputChange('contactPersonPhone', e.target.value)}
                                  placeholder="e.g., 712345678"
                                  className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formData.accountType === 'individual' ? 'Email' : 'Company Email'}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...getFieldIdentifiers('email')}
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            placeholder={
                              formData.accountType === 'individual' 
                                ? "e.g., john.doe@example.com"
                                : "e.g., info@company.com"
                            }
                            className={`pl-10 pr-4 py-3 w-full rounded-xl border ${
                              errors.email ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.email}
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formData.accountType === 'individual' ? 'Phone' : 'Company Phone'} <RequiredField />
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <button
                              type="button"
                              onClick={() => setShowCountryCodes(!showCountryCodes)}
                              className="flex items-center justify-between w-full px-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50"
                            >
                              <div className="flex items-center gap-2">
                                {loadingCountries ? (
                                  <>
                                    <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
                                    <span className="text-gray-500">Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-lg">
                                      {getFlagEmoji(formData.phoneCode)}
                                    </span>
                                    <span>{formData.phoneCode}</span>
                                  </>
                                )}
                              </div>
                              <ChevronDown className="h-4 w-4 text-gray-500" />
                            </button>
                            
                            {showCountryCodes && (
                              <div className="absolute z-10 bottom-full mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                                <div className="sticky top-0 bg-white p-2 border-b">
                                  <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input
                                      {...getFieldIdentifiers('countrySearch')}
                                      type="text"
                                      value={countrySearch}
                                      onChange={(e) => setCountrySearch(e.target.value)}
                                      placeholder="Search countries..."
                                      className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>
                                <div className="max-h-48 overflow-y-auto">
                                  {filteredCountries.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                      No countries found
                                    </div>
                                  ) : (
                                    filteredCountries.map((country) => (
                                      <button
                                        key={country.code}
                                        type="button"
                                        onClick={() => selectCountryCode(country.dialCode)}
                                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center gap-3"
                                      >
                                        <span className="text-lg">{country.flag}</span>
                                        <div className="flex-1">
                                          <div className="text-sm font-medium">{country.name}</div>
                                          <div className="text-xs text-gray-500">{country.dialCode}</div>
                                        </div>
                                      </button>
                                    ))
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                          
                          <input
                            {...getFieldIdentifiers('phone')}
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            placeholder="700123456"
                            className={`flex-1 pl-4 pr-4 py-3 rounded-xl border ${
                              errors.phone ? 'border-red-300' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {errors.phone}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Phone: {formData.phoneCode}{formData.phone || '_______'}
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Secondary Number
                        </label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <div className="flex items-center justify-between w-full px-3 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50">
                              <div className="flex items-center gap-2">
                                {loadingCountries ? (
                                  <>
                                    <div className="h-4 w-6 bg-gray-200 rounded animate-pulse" />
                                    <span className="text-gray-500">Loading...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="text-lg">
                                      {getFlagEmoji(formData.phoneCode)}
                                    </span>
                                    <span>{formData.phoneCode}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <input
                            {...getFieldIdentifiers('secondaryPhone')}
                            type="tel"
                            value={formData.secondaryPhone}
                            onChange={(e) => handleInputChange('secondaryPhone', e.target.value)}
                            placeholder="711234567"
                            className="flex-1 pl-4 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Secondary Number: {formData.secondaryPhone ? `${formData.phoneCode}${formData.secondaryPhone}` : 'Not provided'}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Country
                        </label>
                        <div className="relative">
                          <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...getFieldIdentifiers('customerCountry')}
                            type="text"
                            value={formData.customerCountry}
                            onChange={(e) => handleInputChange('customerCountry', e.target.value)}
                            placeholder="e.g., Kenya"
                            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Location
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
                            {...getFieldIdentifiers('customerLocation')}
                            type="text"
                            value={formData.customerLocation}
                            onChange={(e) => handleInputChange('customerLocation', e.target.value)}
                            placeholder="e.g., Nairobi, Westlands"
                            className="pl-10 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign To Sales Representative (Optional)
                      </label>
                      <div className="relative" ref={usersDropdownRef}>
                        <div className="relative">
                          <input
                            {...getFieldIdentifiers('assignedToSearch')}
                            type="text"
                            value={
                              formData.assignedTo
                                ? (users.find(u => getUserId(u) === formData.assignedTo)
                                  ? getUserDisplayInfo(users.find(u => getUserId(u) === formData.assignedTo)!).name
                                  : userSearch)
                                : userSearch
                            }
                            onChange={(e) => {
                              setUserSearch(e.target.value);
                              if (formData.assignedTo) {
                                handleInputChange('assignedTo', '');
                              }
                            }}
                            onFocus={() => setShowUsersDropdown(true)}
                            placeholder="Search for sales representative to assign..."
                            className="pl-10 pr-8 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                          />
                          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <button
                            type="button"
                            onClick={() => setShowUsersDropdown(!showUsersDropdown)}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showUsersDropdown ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                        
                        {showUsersDropdown && (
                          <div className="absolute bottom-full mb-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            <div className="sticky top-0 bg-white p-2 border-b">
                              <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  {...getFieldIdentifiers('userSearch')}
                                  type="text"
                                  value={userSearch}
                                  onChange={(e) => setUserSearch(e.target.value)}
                                  placeholder="Search users..."
                                  className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                              {loadingUsers ? (
                                <div className="p-4 text-center text-gray-500">
                                  <div className="flex items-center justify-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                    Loading sales team...
                                  </div>
                                </div>
                              ) : users.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                  <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                  <p className="text-sm">No sales representatives found</p>
                                  <p className="text-xs mt-1">Add sales team members in user management</p>
                                </div>
                              ) : (
                                users
                                  .filter(user => {
                                    const displayInfo = getUserDisplayInfo(user);
                                    return (
                                      displayInfo.name.toLowerCase().includes(userSearch.toLowerCase()) ||
                                      displayInfo.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                                      displayInfo.roleName.toLowerCase().includes(userSearch.toLowerCase())
                                    );
                                  })
                                  .map((user) => {
                                    const displayInfo = getUserDisplayInfo(user);
                                    
                                    return (
                                      <button
                                        key={getUserId(user)}
                                        type="button"
                                        onClick={() => {
                                          handleInputChange('assignedTo', getUserId(user));
                                          setShowUsersDropdown(false);
                                          setUserSearch('');
                                        }}
                                        className="w-full px-3 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                                      >
                                        <div className="flex-shrink-0">
                                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                                            <span className="text-sm font-medium text-gray-700">
                                              {displayInfo.name.charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                              {displayInfo.name}
                                            </p>
                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                              displayInfo.roleName.toLowerCase().includes('sales') ? 
                                              'bg-orange-100 text-orange-800' : 
                                              'bg-gray-100 text-gray-800'
                                            }`}>
                                              {displayInfo.roleName}
                                            </span>
                                          </div>
                                          <p className="text-xs text-gray-500 truncate">{displayInfo.email}</p>
                                          {displayInfo.department && (
                                            <p className="text-xs text-gray-400 mt-1">{displayInfo.department}</p>
                                          )}
                                        </div>
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {formData.assignedTo && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-700">
                                Assigned to: {
                                  users.find(u => getUserId(u) === formData.assignedTo) 
                                    ? getUserDisplayInfo(users.find(u => getUserId(u) === formData.assignedTo)!).name
                                    : 'Selected user'
                                }
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                handleInputChange('assignedTo', '');
                                setUserSearch('');
                              }}
                              className="text-xs text-red-500 hover:text-red-600"
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Vehicle Details</h2>
                  <p className="text-gray-500 text-sm mb-6">Add comprehensive vehicle information</p>
                  {loadingVehicleData && (
                    <p className="text-xs text-blue-600">Loading make and model data...</p>
                  )}

                  {errors.vehicles && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.vehicles}
                      </p>
                    </div>
                  )}

                  <div className="space-y-4">
                    {formData.vehicles.map((vehicle, index) => (
                      <div key={vehicle.id} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
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
                              id={`vehicle-${index}-vin`}
                              name={`vehicles.${index}.vin`}
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
                              id={`vehicle-${index}-registrationNumber`}
                              name={`vehicles.${index}.registrationNumber`}
                              type="text"
                              value={vehicle.registrationNumber}
                              onChange={(e) => handleVehicleChange(index, 'registrationNumber', e.target.value)}
                              placeholder="e.g., KCA 123A"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                          
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
                            filteredMakes,
                            makeDropdownRef
                          )}
                          
                          {userPreferences.useDropdowns ? (
                            <div className="relative" ref={modelDropdownRef}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Model
                              </label>
                              <div className="relative">
                                <input
                                  id={`vehicle-${index}-model`}
                                  name={`vehicles.${index}.model`}
                                  type="text"
                                  value={vehicle.model}
                                  onChange={(e) => {
                                    handleVehicleChange(index, 'model', e.target.value);
                                    setModelSearch(e.target.value);
                                  }}
                                  onFocus={() => setShowModelDropdown(index)}
                                  disabled={!vehicle.make}
                                  placeholder={vehicle.make ? `Type or select ${vehicle.make} model` : "Select make first"}
                                  className={`pl-3 pr-8 py-2 w-full rounded-lg border ${
                                    errors.vehicles && !vehicle.model.trim() ? 'border-red-300' : 'border-gray-200'
                                  } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors ${!vehicle.make ? 'bg-gray-100 cursor-not-allowed' : ''}`}
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
                                        {...getFieldIdentifiers('modelSearch')}
                                        type="text"
                                        value={modelSearch}
                                        onChange={(e) => setModelSearch(e.target.value)}
                                        placeholder={`Search ${vehicle.make} models...`}
                                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredModels(vehicle.make).length > 0 ? (
                                      filteredModels(vehicle.make).map((model) => (
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
                                      ))
                                    ) : (
                                      <div className="px-3 py-2 text-xs text-gray-500">
                                        No models found for {vehicle.make}
                                      </div>
                                    )}
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
                                id={`vehicle-${index}-model`}
                                name={`vehicles.${index}.model`}
                                type="text"
                                value={vehicle.model}
                                onChange={(e) => handleVehicleChange(index, 'model', e.target.value)}
                                placeholder="e.g., Land Cruiser V8"
                                className={`pl-3 pr-3 py-2 w-full rounded-lg border ${
                                  errors.vehicles && !vehicle.model.trim() ? 'border-red-300' : 'border-gray-200'
                                } focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors`}
                              />
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Year
                            </label>
                            <input
                              id={`vehicle-${index}-year`}
                              name={`vehicles.${index}.year`}
                              type="text"
                              value={vehicle.year}
                              onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                              placeholder="e.g., 2023"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Color Code
                            </label>
                            <div className="relative">
                              <input
                                id={`vehicle-${index}-colorCode`}
                                name={`vehicles.${index}.colorCode`}
                                type="text"
                                value={vehicle.colorCode}
                                onChange={(e) => handleVehicleChange(index, 'colorCode', e.target.value)}
                                placeholder="e.g., White, Black, Red, Blue"
                                className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Engine Size (CC)
                            </label>
                            <input
                              id={`vehicle-${index}-engineSize`}
                              name={`vehicles.${index}.engineSize`}
                              type="text"
                              value={vehicle.engineSize}
                              onChange={(e) => handleVehicleChange(index, 'engineSize', e.target.value)}
                              placeholder="e.g., 4500"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>

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
                            filteredFuelTypes,
                            fuelDropdownRef
                          )}

                          {userPreferences.useDropdowns ? (
                            <div className="relative" ref={transmissionDropdownRef}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Transmission
                              </label>
                              <div className="relative">
                                <input
                                  id={`vehicle-${index}-transmission`}
                                  name={`vehicles.${index}.transmission`}
                                  type="text"
                                  value={vehicle.transmission}
                                  onChange={(e) => {
                                    handleVehicleChange(index, 'transmission', e.target.value);
                                    setTransmissionSearch(e.target.value);
                                  }}
                                  onFocus={() => setShowTransmissionDropdown(index)}
                                  placeholder="Select Manual or Automatic"
                                  className="pl-3 pr-8 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowTransmissionDropdown(showTransmissionDropdown === index ? null : index)}
                                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showTransmissionDropdown === index ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              
                              {showTransmissionDropdown === index && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  <div className="sticky top-0 bg-white p-2 border-b">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                      <input
                                        {...getFieldIdentifiers('transmissionSearch')}
                                        type="text"
                                        value={transmissionSearch}
                                        onChange={(e) => setTransmissionSearch(e.target.value)}
                                        placeholder="Search transmission..."
                                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredTransmissions.map((transmission) => (
                                      <button
                                        key={transmission}
                                        type="button"
                                        onClick={() => {
                                          handleVehicleChange(index, 'transmission', transmission);
                                          setShowTransmissionDropdown(null);
                                          setTransmissionSearch('');
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                                      >
                                        <span>{transmission}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Transmission
                              </label>
                              <input
                                id={`vehicle-${index}-transmission`}
                                name={`vehicles.${index}.transmission`}
                                type="text"
                                value={vehicle.transmission}
                                onChange={(e) => handleVehicleChange(index, 'transmission', e.target.value)}
                                placeholder="Manual or Automatic"
                                className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Mileage (KM)
                            </label>
                            <input
                              id={`vehicle-${index}-mileage`}
                              name={`vehicles.${index}.mileage`}
                              type="text"
                              value={vehicle.mileage}
                              onChange={(e) => handleVehicleChange(index, 'mileage', e.target.value)}
                              placeholder="e.g., 45000"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>

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
                            filteredBodyTypes,
                            bodyTypeDropdownRef
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={addVehicle}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200 text-sm font-medium transition-all"
                  >
                    <Plus className="h-4 w-4" />
                    Add Another Vehicle
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Services & Products</h2>
                  <p className="text-gray-500 text-sm mb-6">Select services or products and create quotes</p>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Opportunity Type <RequiredField />
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {opportunityTypes.map((type) => {
                        const Icon = type.icon;
                        return (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => {
                              handleInputChange('opportunityType', type.value as 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION');
                              const updatedItems = formData.servicesProducts.map(item => ({
                                ...item,
                                type: mapOpportunityTypeToServiceProductType(type.value as 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION')
                              }));
                              setFormData(prev => ({ ...prev, servicesProducts: updatedItems }));
                              // Reset loaded flags when type changes
                              if (type.value === 'SERVICE') {
                                setProductsLoaded(false);
                              } else {
                                setServicesLoaded(false);
                              }
                            }}
                            className={`p-4 rounded-xl border transition-all duration-200 flex flex-col items-center gap-2 ${
                              formData.opportunityType === type.value
                                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 ring-2 ring-blue-200'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`p-3 rounded-lg ${type.color}`}>
                              <Icon className="h-6 w-6" />
                            </div>
                            <span className="font-medium text-gray-800">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          opportunityTypes.find(t => t.value === formData.opportunityType)?.color
                        }`}>
                          {React.createElement(opportunityTypes.find(t => t.value === formData.opportunityType)?.icon || Settings, { className: "h-5 w-5" })}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">
                            {opportunityTypes.find(t => t.value === formData.opportunityType)?.label} Opportunity
                          </h3>
                          <p className="text-sm text-gray-500">
                            Adding {formData.opportunityType.toLowerCase()} items to quote
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">
                          KES {calculateTotal().toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formData.servicesProducts.length} item{formData.servicesProducts.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    {formData.servicesProducts.length === 0 && (
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gradient-to-r from-gray-50/50 to-gray-100/50">
                        <div className="max-w-md mx-auto">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
                            {formData.opportunityType === 'SERVICE' ? (
                              <Settings className="h-8 w-8 text-gray-600" />
                            ) : (
                              <Package className="h-8 w-8 text-gray-600" />
                            )}
                          </div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            No {formData.opportunityType.toLowerCase()} items added yet
                          </h3>
                          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                            Start by adding {formData.opportunityType === 'SERVICE' ? 'services' : 'products'} to build your quote.
                          </p>
                        </div>
                      </div>
                    )}

                    {errors.servicesProducts && (
                      <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                        <p className="text-sm text-red-600 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          {errors.servicesProducts}
                        </p>
                      </div>
                    )}

                    <div className="space-y-4">
                      {formData.servicesProducts.map((item, index) => (
                        <div key={item.id} className="p-4 rounded-xl border border-gray-200 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
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
                            <div className="relative" ref={serviceProductDropdownRef}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title/Description <RequiredField />
                              </label>
                              <div className="relative">
                                <input
                                  {...getFieldIdentifiers('servicesProducts.title')}
                                  type="text"
                                  value={item.title}
                                  onChange={(e) => {
                                    handleServiceProductChange(index, 'title', e.target.value);
                                    setServiceProductSearch(e.target.value);
                                  }}
                                  onFocus={() => setShowServiceProductDropdown(index)}
                                  placeholder={
                                    formData.opportunityType === 'SERVICE' 
                                      ? "Search or type service name..." 
                                      : "Search or type product name..."
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
                                        {...getFieldIdentifiers('serviceProductSearch')}
                                        type="text"
                                        value={serviceProductSearch}
                                        onChange={(e) => setServiceProductSearch(e.target.value)}
                                        placeholder={`Search ${formData.opportunityType.toLowerCase()}...`}
                                        className="w-full pl-9 pr-2 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {(loadingServices && formData.opportunityType === 'SERVICE') || 
                                     (loadingProducts && formData.opportunityType === 'SALE') ? (
                                      <div className="p-4 text-center">
                                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent mx-auto" />
                                        <p className="text-sm text-gray-500 mt-2">Loading...</p>
                                      </div>
                                    ) : filteredServiceProducts().length === 0 ? (
                                      <div className="p-4 text-center text-gray-500">
                                        No {formData.opportunityType.toLowerCase()}s found
                                      </div>
                                    ) : (
                                      filteredServiceProducts().map((suggestion) => {
                                        const isService = formData.opportunityType === 'SERVICE';
                                        const itemData = suggestion as any;
                                        
                                        return (
                                          <button
                                            key={itemData.id}
                                            type="button"
                                            onClick={() => selectServiceProductSuggestion(index, suggestion, isService)}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex flex-col items-start gap-1 border-b border-gray-100 last:border-b-0"
                                          >
                                            <div className="font-medium">{itemData.name || itemData.title}</div>
                                            <div className="text-xs text-gray-500 truncate w-full">
                                              {isService ? itemData.description : itemData.description}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1">
                                              <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                                {isService ? itemData.serviceCode : itemData.productCode}
                                              </span>
                                              {!isService && (
                                                <span className="text-xs text-gray-600">
                                                  Stock: {itemData.quantityInStock}
                                                </span>
                                              )}
                                            </div>
                                          </button>
                                        );
                                      })
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Detailed Description
                              </label>
                              <textarea
                                {...getFieldIdentifiers('servicesProducts.description')}
                                value={item.description}
                                onChange={(e) => handleServiceProductChange(index, 'description', e.target.value)}
                                placeholder={
                                  formData.opportunityType === 'SERVICE'
                                    ? "Enter detailed service description..."
                                    : "Enter detailed product description..."
                                }
                                rows={3}
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                              />
                            </div>
                            
                            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Pricing Details</h4>
                              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Quantity
                                  </label>
                                  <input
                                    {...getFieldIdentifiers('servicesProducts.quantity')}
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
                                    {...getFieldIdentifiers('servicesProducts.unitPrice')}
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
                                    {...getFieldIdentifiers('servicesProducts.discount')}
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
                            
                            <div className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium text-gray-800">Line Item Total</span>
                                  <p className="text-xs text-gray-500 mt-1">
                                    Subtotal: KES {(item.subtotal || 0).toLocaleString()}
                                    {item.discount > 0 && ` - ${item.discount}% discount: KES ${(item.subtotal * item.discount / 100).toLocaleString()}`}
                                  </p>
                                  {(item.productCode || item.serviceCode) && (
                                    <p className="text-xs text-gray-400 mt-1">
                                      Code: {item.productCode || item.serviceCode}
                                    </p>
                                  )}
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

                    <div className="mt-6 flex justify-center">
                      <button
                        type="button"
                        onClick={addServiceProduct}
                        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 text-sm font-medium shadow-sm transition-all"
                      >
                        <Plus className="h-4 w-4" />
                        Add Item
                      </button>
                    </div>
                  </div>

                  {formData.servicesProducts.length > 0 && (
                    <div className="p-6 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Totals</h3>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium text-gray-800">
                            KES {calculateSubtotal().toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-600">Total Discount</span>
                          <span className="font-medium text-red-600">
                            - KES {calculateTotalDiscount().toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2
                            })}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-t border-gray-300">
                          <span className="text-lg font-semibold text-gray-800">Grand Total</span>
                          <span className="text-2xl font-bold text-green-600">
                            KES {calculateTotal().toLocaleString(undefined, {
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

                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Notes</h3>
                    <textarea
                      {...getFieldIdentifiers('notes')}
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add any additional notes or special instructions..."
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                    />
                  </div>

                  <div className="p-6 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Opportunity Summary</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Customer Information</h4>
                        <div className="space-y-1">
                          <p className="text-sm">
                            <span className="font-medium">Account Type:</span> {formData.accountType === 'individual' ? 'Individual' : 'Company'}
                          </p>
                          {formData.accountType === 'individual' ? (
                            <>
                              <p className="text-sm">
                                <span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm">
                                <span className="font-medium">Company:</span> {formData.companyName}
                              </p>
                              {formData.contactPersonName && (
                                <p className="text-sm">
                                  <span className="font-medium">Contact Person:</span> {formData.contactPersonName}
                                  {formData.contactPersonTitle && ` (${formData.contactPersonTitle})`}
                                </p>
                              )}
                            </>
                          )}
                          <p className="text-sm">
                            <span className="font-medium">Email:</span> {formData.email}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Phone:</span> {formData.phoneCode}{formData.phone}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Country:</span> {formData.customerCountry || 'Not provided'}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Location:</span> {formData.customerLocation || 'Not provided'}
                          </p>
                          {formData.secondaryPhone && (
                            <p className="text-sm">
                              <span className="font-medium">Secondary Number:</span> {formData.phoneCode}{formData.secondaryPhone}
                            </p>
                          )}
                          <p className="text-sm">
                            <span className="font-medium">Assigned To:</span> {
                              formData.assignedTo && users.find(u => getUserId(u) === formData.assignedTo)
                                ? getUserDisplayInfo(users.find(u => getUserId(u) === formData.assignedTo)!).name
                                : 'Not assigned'
                            }
                          </p>
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2">Opportunity Details</h4>
                        <div className="space-y-1">
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
                            <span className="font-medium">Subtotal:</span> KES {calculateSubtotal().toLocaleString()}
                          </p>
                          <p className="text-sm">
                            <span className="font-medium">Total Discount:</span> KES {calculateTotalDiscount().toLocaleString()}
                          </p>
                          <p className="text-sm font-semibold">
                            <span className="font-medium">Grand Total:</span> KES {calculateTotal().toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={saveDraft}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Save Draft
                  </button>
                  {draftSaved && (
                    <span className="text-sm text-green-600 flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Draft saved!
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => router.push('/opportunities')}
                    className="px-4 py-2 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  
                  {step < totalSteps ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2"
                    >
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="px-6 py-2 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 text-sm font-medium shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Creating...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Create Opportunity
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        opportunity={createdOpportunity}
        onViewDetails={handleViewOpportunityDetails}
        onCreateAnother={handleCreateAnother}
      />

      <DuplicateModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        onContinueAnyway={handleContinueAnyway}
        allowCreateAnyway={false}
        canMergeDuplicates={canCurrentUserMergeDuplicates()}
        onMergeDuplicates={() => setShowMergeDuplicatesModal(true)}
        existingOpportunities={duplicateOpportunities}
        newOpportunityData={formData}
      />

      {duplicateOpportunities.length > 1 && (
        <MergeDuplicatesModal
          isOpen={showMergeDuplicatesModal}
          onClose={() => setShowMergeDuplicatesModal(false)}
          onMergeComplete={handleMergeComplete}
          sourceOpportunity={duplicateOpportunities[0]}
          duplicateOpportunities={duplicateOpportunities.slice(1)}
        />
      )}
    </>
  );
}
