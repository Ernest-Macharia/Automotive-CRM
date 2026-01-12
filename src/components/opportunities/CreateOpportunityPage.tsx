'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  X, User, Building, Mail, Phone, Car, Plus, Trash2, FileText, 
  DollarSign, Calendar, Tag, AlertCircle, Check, ChevronDown,
  Upload, Clock, Shield, Briefcase, Sparkles, ChevronRight,
  ArrowRight, ChevronLeft, Save, Package, Settings, ShoppingBag,
  Layers, Box, Wrench, Zap, AlertTriangle, Search, ChevronUp,
  Globe, Settings as SettingsIcon, Palette, Contact
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { CreateOpportunityData, opportunityService } from '@/services/opportunityService';
import { useToast } from '@/contexts/ToastContext';
import SuccessModal from '@/components/opportunities/SuccessModal';
import { Opportunity } from '@/services/opportunityService';
import React from 'react';
import { userService } from '@/services/settings/userService';

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
  type: 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION';
  quantity: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
  total: number;
}

interface CountryCode {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}

interface OpportunityFormData {
  accountType: 'individual' | 'organization';
  source?: 'web' | 'email' | 'call' | 'walk_in' | 'referral' | 'partner';
  firstName: string;
  lastName: string;
  companyName: string;
  email: string;
  phone: string;
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

// Add these interfaces near your other interfaces in CreateOpportunityPage.tsx
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

// Simplified transmission options
const vehicleTransmissions = [
  'Manual', 'Automatic'
];

const vehicleBodyTypes = [
  'Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon',
  'Pickup Truck', 'Van', 'Minivan', 'Truck', 'Bus', 'Motorcycle',
  'Other'
];

// Service suggestions with pre-filled descriptions
const serviceSuggestions = [
  {
    title: 'Oil Change Service',
    description: 'Complete oil and filter change using high-quality synthetic oil. Includes fluid level check, tire pressure check, and basic inspection of brakes, lights, and belts.'
  },
  {
    title: 'Brake System Repair',
    description: 'Comprehensive brake system inspection and repair. Includes brake pad/disc replacement, brake fluid flush, caliper inspection, and system bleeding.'
  },
  {
    title: 'Engine Tune-up',
    description: 'Complete engine performance optimization. Includes spark plug replacement, air filter change, fuel system cleaning, and ignition system check.'
  },
  {
    title: 'Transmission Service',
    description: 'Transmission fluid flush and filter replacement. Includes pan gasket replacement, fluid level adjustment, and transmission performance test.'
  },
  {
    title: 'Suspension Repair',
    description: 'Suspension system inspection and repair. Includes shock absorber/strut replacement, bushing inspection, wheel alignment, and ride height adjustment.'
  },
  {
    title: 'Wheel Alignment',
    description: 'Precision wheel alignment service. Includes camber, caster, and toe adjustment using computerized alignment equipment.'
  },
  {
    title: 'AC Repair & Service',
    description: 'Air conditioning system service. Includes refrigerant recharge, compressor check, condenser cleaning, and system pressure test.'
  },
  {
    title: 'Electrical System Repair',
    description: 'Complete electrical system diagnosis and repair. Includes battery test, alternator check, wiring inspection, and electrical component testing.'
  },
  {
    title: 'Exhaust System Repair',
    description: 'Exhaust system inspection and repair. Includes muffler replacement, catalytic converter check, pipe repair, and emissions system test.'
  },
  {
    title: 'Fuel System Service',
    description: 'Fuel system cleaning and service. Includes fuel filter replacement, injector cleaning, pump test, and system pressure check.'
  },
  {
    title: 'Tire Replacement',
    description: 'Tire replacement and balancing. Includes old tire removal, new tire installation, wheel balancing, and tire pressure monitoring system reset.'
  },
  {
    title: 'Battery Replacement',
    description: 'Battery replacement service. Includes old battery removal, new battery installation, terminal cleaning, and charging system test.'
  },
  {
    title: 'Windshield Replacement',
    description: 'Windshield glass replacement. Includes old glass removal, new glass installation, sealant application, and curing time.'
  },
  {
    title: 'Paint Job & Body Work',
    description: 'Body repair and painting service. Includes dent removal, surface preparation, primer application, color matching, and clear coat finishing.'
  },
  {
    title: 'Full Vehicle Service',
    description: 'Comprehensive vehicle maintenance package. Includes all fluid changes, filter replacements, system inspections, and safety checks.'
  },
  {
    title: 'Pre-purchase Inspection',
    description: 'Detailed vehicle inspection for prospective buyers. Includes mechanical, electrical, body, and interior condition assessment with detailed report.'
  },
  {
    title: 'Custom Service',
    description: 'Customized service based on specific requirements. Please provide detailed description of needed service.'
  }
];

// Product suggestions with pre-filled descriptions
const productSuggestions = [
  {
    title: 'Engine Oil',
    description: 'High-quality synthetic engine oil. Provides superior engine protection, improves fuel efficiency, and extends engine life. Available in various viscosity grades.'
  },
  {
    title: 'Brake Pads',
    description: 'Premium brake pads with ceramic or semi-metallic compounds. Offers excellent stopping power, reduced brake dust, and quiet operation. Compatible with most vehicle models.'
  },
  {
    title: 'Brake Discs',
    description: 'High-performance brake discs/rotors. Made from premium materials for improved heat dissipation and longer lifespan. Includes proper fitment for specific vehicle models.'
  },
  {
    title: 'Air Filter',
    description: 'High-flow air filter element. Improves engine performance and fuel efficiency. Washable/reusable options available for certain models.'
  },
  {
    title: 'Oil Filter',
    description: 'Premium oil filter with synthetic media. Provides superior filtration, protects engine from contaminants, and ensures optimal oil flow.'
  },
  {
    title: 'Fuel Filter',
    description: 'High-efficiency fuel filter. Removes contaminants from fuel, protects fuel injectors, and maintains proper fuel pressure.'
  },
  {
    title: 'Spark Plugs',
    description: 'Performance spark plugs. Improves ignition efficiency, fuel economy, and engine performance. Available in copper, platinum, and iridium options.'
  },
  {
    title: 'Car Battery',
    description: 'Maintenance-free car battery. Provides reliable starting power, long service life, and excellent cold-cranking performance. Includes proper warranty.'
  },
  {
    title: 'Tires (Set of 4)',
    description: 'Complete set of 4 premium tires. Includes all-season or performance options with proper load rating and speed index for your vehicle.'
  },
  {
    title: 'Wheel Rims',
    description: 'Alloy or steel wheel rims. Available in various sizes and designs. Includes proper hub centric fitment and load capacity for your vehicle.'
  },
  {
    title: 'Shock Absorbers',
    description: 'Premium shock absorbers. Improves ride comfort, handling, and vehicle stability. Available in standard or performance variants.'
  },
  {
    title: 'Struts',
    description: 'Complete strut assembly. Includes shock absorber, spring, and mounting hardware. Provides improved suspension performance and ride quality.'
  },
  {
    title: 'AC Compressor',
    description: 'OE-quality AC compressor. Includes proper refrigerant capacity and compatibility with your vehicle\'s AC system.'
  },
  {
    title: 'Alternator',
    description: 'High-output alternator. Provides reliable electrical power for all vehicle systems. Includes proper amperage rating for your vehicle.'
  },
  {
    title: 'Starter Motor',
    description: 'Premium starter motor. Ensures reliable engine starting in all conditions. Includes proper torque specifications for your engine.'
  },
  {
    title: 'Radiator',
    description: 'High-efficiency radiator. Provides optimal engine cooling with improved heat dissipation. Includes proper fitment for your vehicle.'
  },
  {
    title: 'Windshield',
    description: 'OE-quality windshield glass. Includes proper tint, curvature, and sensor compatibility if applicable.'
  },
  {
    title: 'Headlights',
    description: 'Premium headlight assembly. Includes proper beam pattern, brightness, and compatibility with your vehicle\'s electrical system.'
  },
  {
    title: 'Taillights',
    description: 'OE-quality taillight assembly. Includes proper lighting functions, lens clarity, and weather sealing.'
  },
  {
    title: 'Custom Part',
    description: 'Custom automotive part. Please specify exact requirements, vehicle details, and any special instructions.'
  }
];

export default function CreateOpportunityPage() {
  const router = useRouter();
  const { showToast } = useToast();
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
  
  // Dropdown states
  const [showMakeDropdown, setShowMakeDropdown] = useState<number | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState<number | null>(null);
  const [showColorCodeDropdown, setShowColorCodeDropdown] = useState<number | null>(null);
  const [showFuelDropdown, setShowFuelDropdown] = useState<number | null>(null);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState<number | null>(null);
  const [showBodyTypeDropdown, setShowBodyTypeDropdown] = useState<number | null>(null);
  const [showServiceProductDropdown, setShowServiceProductDropdown] = useState<number | null>(null);
  
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [colorCodeSearch, setColorCodeSearch] = useState('');
  const [fuelSearch, setFuelSearch] = useState('');
  const [transmissionSearch, setTransmissionSearch] = useState('');
  const [bodyTypeSearch, setBodyTypeSearch] = useState('');
  const [serviceProductSearch, setServiceProductSearch] = useState('');
  // Add this to your state declarations
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUsersDropdown, setShowUsersDropdown] = useState(false);
  const [userSearch, setUserSearch] = useState('');

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

  // Refs for dropdown click outside detection
  const makeDropdownRef = useRef<HTMLDivElement | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement | null>(null);
  const colorCodeDropdownRef = useRef<HTMLDivElement | null>(null);
  const fuelDropdownRef = useRef<HTMLDivElement | null>(null);
  const transmissionDropdownRef = useRef<HTMLDivElement | null>(null);
  const bodyTypeDropdownRef = useRef<HTMLDivElement | null>(null);
  const serviceProductDropdownRef = useRef<HTMLDivElement | null>(null);
  const preferencesRef = useRef<HTMLDivElement | null>(null);
  const usersDropdownRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
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
      if (colorCodeDropdownRef.current && !colorCodeDropdownRef.current.contains(event.target as Node)) {
        setShowColorCodeDropdown(null);
        setColorCodeSearch('');
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
        // userService.getAllUsers() returns User[] directly
        const usersData = await userService.getAllUsers();
        setUsers(usersData || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        showToast('Failed to load users list', 'error', 3000);
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, [showToast]);

  const getUserRoleName = (user: User): string => {
  if (typeof user.role === 'string') {
    return user.role;
  } else if (user.role && typeof user.role === 'object') {
    return user.role.name || 'User';
  }
  return 'User';
};

// Helper function to get user display info
  const getUserDisplayInfo = (user: User) => {
    return {
      name: user.name || user.email?.split('@')[0] || 'Unknown User',
      roleName: getUserRoleName(user),
      email: user.email || '',
      department: user.department || '',
    };
  };


  // Save preferences to localStorage
  const savePreferences = (prefs: UserPreferences) => {
    setUserPreferences(prefs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPreferences', JSON.stringify(prefs));
    }
    showToast('Preferences saved!', 'success', 2000);
  };

  // Toggle dropdowns preference
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
    
    // If make changes, reset model
    if (field === 'make') {
      updatedVehicles[index].model = '';
    }
    
    setFormData(prev => ({ ...prev, vehicles: updatedVehicles }));
  };

  const handleServiceProductChange = (index: number, field: keyof ServiceProduct, value: any) => {
    const updatedServicesProducts = [...formData.servicesProducts];
    const item = { ...updatedServicesProducts[index], [field]: value };
    
    // Recalculate totals if quantity, unitPrice, or discount changes
    if (field === 'quantity' || field === 'unitPrice' || field === 'discount') {
      const subtotal = (item.quantity || 0) * (item.unitPrice || 0);
      const discountAmount = subtotal * ((item.discount || 0) / 100);
      item.subtotal = subtotal;
      item.total = subtotal - discountAmount;
    }
    
    updatedServicesProducts[index] = item;
    setFormData(prev => ({ ...prev, servicesProducts: updatedServicesProducts }));
  };

  // Updated to include pre-filled description
  const selectServiceProductSuggestion = (index: number, suggestion: { title: string; description: string }) => {
    const updatedServicesProducts = [...formData.servicesProducts];
    updatedServicesProducts[index].title = suggestion.title;
    updatedServicesProducts[index].description = suggestion.description;
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
        type: formData.opportunityType,
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

  const filteredColorCodes = vehicleColorCodes.filter((colorCode, index) =>
    vehicleColorNames[index].toLowerCase().includes(colorCodeSearch.toLowerCase())
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
      item.title.toLowerCase().includes(serviceProductSearch.toLowerCase())
    );
  };

  const validateStep = () => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (formData.accountType === 'individual') {
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      } else if (formData.accountType === 'organization') {
        if (!formData.companyName.trim()) newErrors.companyName = 'Company name is required';
        if (!formData.contactPersonName?.trim()) newErrors.contactPersonName = 'Contact person name is required';
        if (!formData.contactPersonEmail?.trim()) newErrors.contactPersonEmail = 'Contact person email is required';
      }
      
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (formData.email && !emailRegex.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
      
      if (formData.contactPersonEmail && !emailRegex.test(formData.contactPersonEmail)) {
        newErrors.contactPersonEmail = 'Please enter a valid email address for contact person';
      }
      
      const phoneRegex = /^\d+$/;
      if (formData.phone && !phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Please enter a valid phone number (digits only)';
      }
    }

    if (step === 2) {
      const hasValidVehicle = formData.vehicles.some(vehicle => 
        vehicle.make.trim() && vehicle.model.trim()
      );
      if (!hasValidVehicle) {
        newErrors.vehicles = 'At least one vehicle with make and model is required';
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
    if (!validateStep()) {
      showToast('Please fix the validation errors before submitting.', 'error', 3000);
      return;
    }

    setIsSubmitting(true);

    try {
      const isIndividual = formData.accountType === 'individual';

      const subject = isIndividual
        ? `${formData.firstName} ${formData.lastName}'s ${formData.opportunityType.toLowerCase()} request`
        : `${formData.companyName}'s ${formData.opportunityType.toLowerCase()} request`;

      // Calculate financials
      const subtotal = calculateSubtotal();
      const totalDiscount = calculateTotalDiscount();
      const total = calculateTotal();

      // Determine the package type based on opportunity type
      const packageType = formData.opportunityType === 'SERVICE' ? 'work_order' : 'sales_order';

      // Map service products to match the expected type
      const mappedServicesProducts = formData.servicesProducts.map(item => {
        // Map opportunity types to service/product types
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

        return {
          title: item.title,
          description: item.description,
          type: mappedType,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          subtotal: item.subtotal,
          total: item.total
        };
      });

      const apiFormData: CreateOpportunityData = {
        type: formData.accountType,
        source: formData.source,
        subject,
        status: 'new',
        opportunityType: formData.opportunityType,
        packageType: packageType,
        assignedTo: formData.assignedTo || undefined,

        customer: {
          name: isIndividual
            ? `${formData.firstName} ${formData.lastName}`.trim()
            : formData.companyName,
          email: formData.email || undefined,
          phone: `${formData.phoneCode}${formData.phone}` || undefined,
          companyName: !isIndividual ? formData.companyName : undefined,
          // Include contact person details for organizations
          ...(formData.accountType === 'organization' && {
            contactPersonName: formData.contactPersonName || undefined,
            contactPersonEmail: formData.contactPersonEmail || undefined,
            contactPersonPhone: formData.contactPersonPhone ? 
              `${formData.phoneCode}${formData.contactPersonPhone}` : undefined,
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
      handleCreateOpportunityError(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  type VehicleDTO = NonNullable<CreateOpportunityData['vehicles']>[number];

  const mapVehicle = (v: VehicleDTO): VehicleDTO => ({
    vin: v.vin || undefined,
    registrationNumber: v.registrationNumber || undefined,
    licensePlate: v.licensePlate || undefined,

    make: v.make,
    model: v.model,

    year: v.year ? Number(v.year) || undefined : undefined,
    mileage: v.mileage ? String(v.mileage) : undefined,

    color: v.color || undefined,
    engineSize: v.engineSize || undefined,
    fuelType: v.fuelType || undefined,
    transmission: v.transmission || undefined,
    bodyType: v.bodyType || undefined,
  });


  const handleCreateOpportunityError = (error: any) => {
    console.error('Create opportunity error:', error);

    if (error?.response) {
      showToast(
        error.response.data?.message ||
        error.response.data?.error ||
        'Failed to create opportunity.',
        'error',
        5000
      );
      return;
    }

    if (error?.request) {
      showToast(
        'Network error. Please check your connection.',
        'error',
        5000
      );
      return;
    }

    showToast(
      error?.message || 'Failed to create opportunity.',
      'error',
      5000
    );
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

  useEffect(() => {
    const savedDraft = localStorage.getItem('opportunityDraft');
    if (savedDraft) {
      setFormData(JSON.parse(savedDraft));
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

  // Render dropdown or regular input based on user preference
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
        {/* Header */}
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
                {/* Settings Button */}
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
            
            {/* Progress Steps */}
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

        {/* Form Content */}
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Current Step Content */}
            <div className="p-6 md:p-8">
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">Account Information</h2>
                  
                  {/* Account Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Account Type *
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

                  {/* Source Selection */}
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

                  {/* Personal/Company Information */}
                  <div className="space-y-4">
                    {formData.accountType === 'individual' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            First Name *
                          </label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
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
                            Company Name *
                          </label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
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

                        {/* Contact Person Details Section */}
                        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100">
                          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                            <Contact className="h-5 w-5 text-blue-600" />
                            Contact Person Details
                          </h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Person Name *
                              </label>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
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
                                type="text"
                                value={formData.contactPersonTitle}
                                onChange={(e) => handleInputChange('contactPersonTitle', e.target.value)}
                                placeholder="e.g., Procurement Manager"
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                              />
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Contact Person Email *
                              </label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
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

                    {/* Email and Phone (common to both account types) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {formData.accountType === 'individual' ? 'Email *' : 'Company Email *'}
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <input
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
                          {formData.accountType === 'individual' ? 'Phone *' : 'Company Phone *'}
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
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign To (Optional)
                      </label>
                      <div className="relative" ref={usersDropdownRef}>
                        <div className="relative">
                          <input
                            type="text"
                            value={formData.assignedTo || ''}
                            onChange={(e) => {
                              handleInputChange('assignedTo', e.target.value);
                              setUserSearch(e.target.value);
                            }}
                            onFocus={() => setShowUsersDropdown(true)}
                            placeholder="Search for user to assign..."
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
                                    Loading users...
                                  </div>
                                </div>
                              ) : users.length === 0 ? (
                                <div className="p-4 text-center text-gray-500">
                                  No users found
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
                                        key={user.id}
                                        type="button"
                                        onClick={() => {
                                          handleInputChange('assignedTo', user.id);
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
                                              displayInfo.roleName === 'admin' ? 'bg-purple-100 text-purple-800' :
                                              displayInfo.roleName === 'management' ? 'bg-blue-100 text-blue-800' :
                                              displayInfo.roleName === 'technician' ? 'bg-green-100 text-green-800' :
                                              displayInfo.roleName === 'sales_representative' ? 'bg-orange-100 text-orange-800' :
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
                      
                      {/* Selected user preview */}
                      {formData.assignedTo && (
                        <div className="mt-2 p-2 rounded-lg bg-blue-50 border border-blue-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-600" />
                              <span className="text-sm text-gray-700">
                                Assigned to: {
                                  users.find(u => u.id === formData.assignedTo) 
                                    ? getUserDisplayInfo(users.find(u => u.id === formData.assignedTo)!).name
                                    : 'Selected user'
                                }
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleInputChange('assignedTo', '')}
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

                  {errors.vehicles && (
                    <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200">
                      <p className="text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.vehicles}
                      </p>
                    </div>
                  )}

                  {/* Vehicles Section */}
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
                          
                          {/* Make with dropdown/regular input */}
                          {renderVehicleFieldWithDropdown(
                            index,
                            'make',
                            'Make *',
                            'Type or select vehicle make',
                            vehicleMakes,
                            showMakeDropdown,
                            setShowMakeDropdown,
                            makeSearch,
                            setMakeSearch,
                            filteredMakes,
                            makeDropdownRef
                          )}
                          
                          {/* Model with dropdown/regular input */}
                          {userPreferences.useDropdowns ? (
                            <div className="relative" ref={modelDropdownRef}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Model *
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
                                Model *
                              </label>
                              <input
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
                              type="text"
                              value={vehicle.year}
                              onChange={(e) => handleVehicleChange(index, 'year', e.target.value)}
                              placeholder="e.g., 2023"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>
                          
                          {/* Color Code with dropdown/regular input */}
                          {userPreferences.useDropdowns ? (
                            <div className="relative" ref={colorCodeDropdownRef}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Color Code
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={vehicle.colorCode}
                                  onChange={(e) => {
                                    handleVehicleChange(index, 'colorCode', e.target.value);
                                    setColorCodeSearch(e.target.value);
                                  }}
                                  onFocus={() => setShowColorCodeDropdown(index)}
                                  placeholder="Type or select color code"
                                  className="pl-8 pr-8 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                />
                                {vehicle.colorCode && (
                                  <div 
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded border border-gray-300"
                                    style={{ backgroundColor: vehicle.colorCode }}
                                  />
                                )}
                                <Palette className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <button
                                  type="button"
                                  onClick={() => setShowColorCodeDropdown(showColorCodeDropdown === index ? null : index)}
                                  className="absolute right-8 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                  {showColorCodeDropdown === index ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                              
                              {showColorCodeDropdown === index && (
                                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                  <div className="sticky top-0 bg-white p-2 border-b">
                                    <div className="relative">
                                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                      <input
                                        type="text"
                                        value={colorCodeSearch}
                                        onChange={(e) => setColorCodeSearch(e.target.value)}
                                        placeholder="Search colors..."
                                        className="w-full pl-7 pr-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                    </div>
                                  </div>
                                  <div className="max-h-48 overflow-y-auto">
                                    {filteredColorCodes.map((colorCode, colorIndex) => (
                                      <button
                                        key={colorCode}
                                        type="button"
                                        onClick={() => {
                                          handleVehicleChange(index, 'colorCode', colorCode);
                                          setShowColorCodeDropdown(null);
                                          setColorCodeSearch('');
                                        }}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between"
                                      >
                                        <div className="flex items-center gap-2">
                                          <div 
                                            className="h-4 w-4 rounded border border-gray-300"
                                            style={{ backgroundColor: colorCode }}
                                          />
                                          <span>{vehicleColorNames[colorIndex]}</span>
                                        </div>
                                        <span className="text-xs text-gray-500">{colorCode}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Color Code
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  value={vehicle.colorCode}
                                  onChange={(e) => handleVehicleChange(index, 'colorCode', e.target.value)}
                                  placeholder="e.g., #FFFFFF"
                                  className="pl-8 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                                />
                                {vehicle.colorCode && (
                                  <div 
                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 rounded border border-gray-300"
                                    style={{ backgroundColor: vehicle.colorCode }}
                                  />
                                )}
                              </div>
                            </div>
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

                          {/* Fuel Type with dropdown/regular input */}
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

                          {/* Transmission with simplified options */}
                          {userPreferences.useDropdowns ? (
                            <div className="relative" ref={transmissionDropdownRef}>
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Transmission
                              </label>
                              <div className="relative">
                                <input
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
                              type="text"
                              value={vehicle.mileage}
                              onChange={(e) => handleVehicleChange(index, 'mileage', e.target.value)}
                              placeholder="e.g., 45000"
                              className="pl-3 pr-3 py-2 w-full rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent text-sm transition-colors"
                            />
                          </div>

                          {/* Body Type with dropdown/regular input */}
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

                  {/* Opportunity Type Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Opportunity Type *
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
                              // Update all items to match the selected type
                              const updatedItems = formData.servicesProducts.map(item => ({
                                ...item,
                                type: type.value as 'SERVICE' | 'SALE' | 'REPAIR' | 'MAINTENANCE' | 'INSPECTION'
                              }));
                              setFormData(prev => ({ ...prev, servicesProducts: updatedItems }));
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

                  {/* Opportunity Type Display */}
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

                  {/* Services/Products Section */}
                  <div>
                    {/* Empty State */}
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
                            {/* Title with suggestions dropdown */}
                            <div className="relative" ref={serviceProductDropdownRef}>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Title/Description *
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
                                        key={suggestion.title}
                                        type="button"
                                        onClick={() => selectServiceProductSuggestion(index, suggestion)}
                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex flex-col items-start gap-1"
                                      >
                                        <div className="font-medium">{suggestion.title}</div>
                                        <div className="text-xs text-gray-500 truncate w-full">
                                          {suggestion.description}
                                        </div>
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
                                rows={3}
                                className="pl-4 pr-4 py-3 w-full rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                              />
                            </div>
                            
                            {/* Pricing Section in one row */}
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

                    {/* Add Item Button moved to bottom */}
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

                  {/* Overall Totals Section */}
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
                          {formData.servicesProducts.filter(item => item.type === 'SALE').length} product{formData.servicesProducts.filter(item => item.type === 'SALE').length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Additional Notes</h3>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Add any additional notes or special instructions..."
                      rows={4}
                      className="w-full rounded-xl border border-gray-200 p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-colors"
                    />
                  </div>

                  {/* Summary Section */}
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
                            <span className="font-medium">Assigned To:</span> {
                              formData.assignedTo && users.find(u => u.id === formData.assignedTo)
                                ? getUserDisplayInfo(users.find(u => u.id === formData.assignedTo)!).name
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

            {/* Footer */}
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        opportunity={createdOpportunity}
        onViewDetails={handleViewOpportunityDetails}
        onCreateAnother={handleCreateAnother}
      />
    </>
  );
}