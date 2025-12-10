'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, User, Building, Mail, Phone, MapPin, Car, 
  Calendar, Upload, X, Camera, Users, Target, Globe, 
  PhoneCall, MessageSquare, Briefcase, Check, AlertCircle,
  Loader2, ChevronRight, Star, Shield, Wrench, Fuel, Battery,
  Radio, Wind, Settings, Sparkles, Search, ChevronDown,
  ChevronUp, Settings as SettingsIcon, Plus
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';
import { leadService, CreateLeadData } from '@/services/leadService';
import { opportunityService } from '@/services/opportunityService';

interface VehicleInfo {
  make: string;
  model: string;
  year: string;
  color?: string;
  vin?: string;
  registrationNumber?: string;
  engineSize?: string;
  fuelType?: string;
  transmission?: string;
  mileage?: string;
}

interface ProductInterest {
  id: string;
  name: string;
  description: string;
  category: 'lighting' | 'audio' | 'security' | 'performance' | 'accessories';
  selected: boolean;
}

const serviceTypes = [
  { id: 'installation', name: 'Installation', icon: Settings },
  { id: 'repair', name: 'Repair', icon: Wrench },
  { id: 'maintenance', name: 'Maintenance', icon: Shield },
  { id: 'customization', name: 'Customization', icon: Sparkles },
  { id: 'diagnostics', name: 'Diagnostics', icon: Target },
];

const leadStages = [
  'New Inquiry',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
];

const leadSources = [
  'Website',
  'Referral',
  'Walk-in',
  'Phone Call',
  'Email',
  'Social Media',
  'Trade Show',
  'Other'
];

const prospectingReasons = [
  'Regular Customer',
  'New Vehicle',
  'Upgrade',
  'Maintenance Required',
  'Accident Repair',
  'Customization Request',
  'Other'
];

const genders = ['Male', 'Female', 'Other', 'Prefer not to say'];

const productInterests: ProductInterest[] = [
  { id: 'led_lights', name: 'LED Headlights', description: 'High-performance LED lighting systems', category: 'lighting', selected: false },
  { id: 'fog_lights', name: 'Fog Lights', description: 'Enhanced visibility in poor weather', category: 'lighting', selected: false },
  { id: 'audio_system', name: 'Audio System', description: 'Premium car audio and speakers', category: 'audio', selected: false },
  { id: 'alarm_system', name: 'Alarm System', description: 'Vehicle security and anti-theft', category: 'security', selected: false },
  { id: 'gps_tracker', name: 'GPS Tracker', description: 'Real-time vehicle tracking', category: 'security', selected: false },
  { id: 'performance_chip', name: 'Performance Chip', description: 'Engine performance enhancement', category: 'performance', selected: false },
  { id: 'exhaust_system', name: 'Exhaust System', description: 'Custom exhaust systems', category: 'performance', selected: false },
  { id: 'seat_covers', name: 'Seat Covers', description: 'Premium interior accessories', category: 'accessories', selected: false },
  { id: 'window_tinting', name: 'Window Tinting', description: 'UV protection and privacy', category: 'accessories', selected: false },
];

// Car makes and models data
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

const townsCities = [
  'Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Eldoret', 'Thika', 'Malindi', 'Kitale',
  'Kakamega', 'Nyeri', 'Meru', 'Garissa', 'Lamu', 'Naivasha', 'Kericho', 'Other'
];

interface UserPreferences {
  useDropdowns: boolean;
}

export default function CreateLeadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  
  const opportunityId = searchParams.get('opportunityId');
  
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // User preferences for dropdowns
  const [userPreferences, setUserPreferences] = useState<UserPreferences>(() => {
    if (typeof window !== 'undefined') {
      const savedPrefs = localStorage.getItem('leadUserPreferences');
      return savedPrefs ? JSON.parse(savedPrefs) : { useDropdowns: true };
    }
    return { useDropdowns: true };
  });
  
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [formData, setFormData] = useState<CreateLeadData>({
    name: '',
    email: '',
    phone: '',
    type: 'individual',
    companyName: '',
    source: 'website',
    notes: '',
    address: '',
    city: '',
    stage: 'New Inquiry',
    sourceDetails: '',
    prospectingReason: '',
    gender: '',
    firstName: '',
    lastName: '',
    productsInterested: [],
    vehicleInfo: {},
    leadOwner: 'Dalton Ongeche',
  });
  
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: '',
    model: '',
    year: '',
    color: '',
    vin: '',
    registrationNumber: '',
    engineSize: '',
    fuelType: '',
    transmission: '',
    mileage: '',
  });
  
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Dropdown states
  const [showMakeDropdown, setShowMakeDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showFuelDropdown, setShowFuelDropdown] = useState(false);
  const [showTransmissionDropdown, setShowTransmissionDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showStageDropdown, setShowStageDropdown] = useState(false);
  const [showSourceDropdown, setShowSourceDropdown] = useState(false);
  const [showReasonDropdown, setShowReasonDropdown] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  
  // Search states for dropdowns
  const [makeSearch, setMakeSearch] = useState('');
  const [modelSearch, setModelSearch] = useState('');
  const [colorSearch, setColorSearch] = useState('');
  const [fuelSearch, setFuelSearch] = useState('');
  const [transmissionSearch, setTransmissionSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [stageSearch, setStageSearch] = useState('');
  const [sourceSearch, setSourceSearch] = useState('');
  const [reasonSearch, setReasonSearch] = useState('');
  const [genderSearch, setGenderSearch] = useState('');

  // Refs for dropdown click outside detection
  const makeDropdownRef = useRef<HTMLDivElement | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement | null>(null);
  const colorDropdownRef = useRef<HTMLDivElement | null>(null);
  const fuelDropdownRef = useRef<HTMLDivElement | null>(null);
  const transmissionDropdownRef = useRef<HTMLDivElement | null>(null);
  const cityDropdownRef = useRef<HTMLDivElement | null>(null);
  const stageDropdownRef = useRef<HTMLDivElement | null>(null);
  const sourceDropdownRef = useRef<HTMLDivElement | null>(null);
  const reasonDropdownRef = useRef<HTMLDivElement | null>(null);
  const genderDropdownRef = useRef<HTMLDivElement | null>(null);
  const preferencesRef = useRef<HTMLDivElement | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (makeDropdownRef.current && !makeDropdownRef.current.contains(event.target as Node)) {
        setShowMakeDropdown(false);
        setMakeSearch('');
      }
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
        setModelSearch('');
      }
      if (colorDropdownRef.current && !colorDropdownRef.current.contains(event.target as Node)) {
        setShowColorDropdown(false);
        setColorSearch('');
      }
      if (fuelDropdownRef.current && !fuelDropdownRef.current.contains(event.target as Node)) {
        setShowFuelDropdown(false);
        setFuelSearch('');
      }
      if (transmissionDropdownRef.current && !transmissionDropdownRef.current.contains(event.target as Node)) {
        setShowTransmissionDropdown(false);
        setTransmissionSearch('');
      }
      if (cityDropdownRef.current && !cityDropdownRef.current.contains(event.target as Node)) {
        setShowCityDropdown(false);
        setCitySearch('');
      }
      if (stageDropdownRef.current && !stageDropdownRef.current.contains(event.target as Node)) {
        setShowStageDropdown(false);
        setStageSearch('');
      }
      if (sourceDropdownRef.current && !sourceDropdownRef.current.contains(event.target as Node)) {
        setShowSourceDropdown(false);
        setSourceSearch('');
      }
      if (reasonDropdownRef.current && !reasonDropdownRef.current.contains(event.target as Node)) {
        setShowReasonDropdown(false);
        setReasonSearch('');
      }
      if (genderDropdownRef.current && !genderDropdownRef.current.contains(event.target as Node)) {
        setShowGenderDropdown(false);
        setGenderSearch('');
      }
      if (preferencesRef.current && !preferencesRef.current.contains(event.target as Node)) {
        setShowPreferences(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const fetchOpportunityData = async () => {
      if (opportunityId) {
        try {
          const opportunity = await opportunityService.getOpportunityById(opportunityId);
          if (opportunity) {
            // Split name into first and last names
            const fullName = opportunity.customer?.name || '';
            const nameParts = fullName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            setFormData(prev => ({
              ...prev,
              name: fullName,
              firstName: firstName,
              lastName: lastName,
              email: opportunity.customer?.email || '',
              phone: opportunity.customer?.phone || '',
              type: opportunity.type || 'individual',
              companyName: opportunity.customer?.companyName || '',
              source: opportunity.source || 'website',
              notes: `Created from opportunity: ${opportunity.subject || ''}`,
            }));
            
            // If opportunity has vehicles, prefill vehicle info
            if (opportunity.vehicles && opportunity.vehicles.length > 0) {
              const vehicle = opportunity.vehicles[0];
              setVehicleInfo({
                make: vehicle.make || '',
                model: vehicle.model || '',
                year: vehicle.year?.toString() || '',
                color: vehicle.color || '',
                vin: vehicle.vin || '',
                registrationNumber: vehicle.registrationNumber || '',
                engineSize: vehicle.engineSize || '',
                fuelType: vehicle.fuelType || '',
                transmission: vehicle.transmission || '',
                mileage: vehicle.mileage || '',
              });
            }
          }
        } catch (error) {
          console.error('Error fetching opportunity:', error);
        }
      }
    };
    
    fetchOpportunityData();
  }, [opportunityId]);

  // Save preferences to localStorage
  const savePreferences = (prefs: UserPreferences) => {
    setUserPreferences(prefs);
    if (typeof window !== 'undefined') {
      localStorage.setItem('leadUserPreferences', JSON.stringify(prefs));
    }
    showToast('Preferences saved!', 'success', 2000);
  };

  // Toggle dropdowns preference
  const toggleDropdownsPreference = () => {
    const newPrefs = { ...userPreferences, useDropdowns: !userPreferences.useDropdowns };
    savePreferences(newPrefs);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      showToast('Please upload an image file', 'error', 3000);
      return;
    }
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size should be less than 5MB', 'error', 3000);
      return;
    }
    
    setUploadingImage(true);
    
    // Simulate upload
    setTimeout(() => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
        setUploadingImage(false);
      };
      reader.readAsDataURL(file);
    }, 1000);
  };

  const handleProductToggle = (productId: string) => {
    setSelectedProducts(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const handleInputChange = (field: keyof CreateLeadData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleVehicleInfoChange = (field: keyof VehicleInfo, value: string) => {
    setVehicleInfo(prev => ({ ...prev, [field]: value }));
    
    // If make changes, reset model
    if (field === 'make') {
      setVehicleInfo(prev => ({ ...prev, model: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Prepare final data
      const finalData: CreateLeadData = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        productsInterested: selectedProducts,
        vehicleInfo: vehicleInfo,
      };
      
      // Add opportunityId if available
      if (opportunityId) {
        finalData.opportunityId = opportunityId;
      }
      
      await leadService.createLead(finalData);
      
      showToast('Lead created successfully', 'success', 3000);
      
      // Redirect based on context
      if (opportunityId) {
        // If created from opportunity, redirect back to opportunity
        router.push(`/opportunities/details?id=${opportunityId}`);
      } else {
        // Otherwise redirect to leads list
        router.push('/leads');
      }
    } catch (error: any) {
      console.error('Error creating lead:', error);
      showToast(error.message || 'Failed to create lead', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const getProductIcon = (category: string) => {
    switch (category) {
      case 'lighting': return <Sparkles className="h-4 w-4" />;
      case 'audio': return <Radio className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      case 'performance': return <Wrench className="h-4 w-4" />;
      case 'accessories': return <Settings className="h-4 w-4" />;
      default: return <Briefcase className="h-4 w-4" />;
    }
  };

  const getProductColor = (category: string) => {
    switch (category) {
      case 'lighting': return 'bg-yellow-100 text-yellow-800';
      case 'audio': return 'bg-blue-100 text-blue-800';
      case 'security': return 'bg-red-100 text-red-800';
      case 'performance': return 'bg-green-100 text-green-800';
      case 'accessories': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const filteredCities = townsCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  );

  const filteredStages = leadStages.filter(stage =>
    stage.toLowerCase().includes(stageSearch.toLowerCase())
  );

  const filteredSources = leadSources.filter(source =>
    source.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  const filteredReasons = prospectingReasons.filter(reason =>
    reason.toLowerCase().includes(reasonSearch.toLowerCase())
  );

  const filteredGenders = genders.filter(gender =>
    gender.toLowerCase().includes(genderSearch.toLowerCase())
  );

  // Render field with dropdown or regular input based on preference
  const renderFieldWithDropdown = (
    label: string,
    value: string,
    placeholder: string,
    options: string[],
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void,
    searchValue: string,
    setSearchValue: (value: string) => void,
    filteredOptions: string[],
    onChange: (value: string) => void,
    dropdownRef: React.RefObject<HTMLDivElement | null>,
    error?: string
  ) => {
    if (userPreferences.useDropdowns) {
      return (
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={value}
              onChange={(e) => {
                onChange(e.target.value);
                setSearchValue(e.target.value);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={placeholder}
              className={`w-full px-4 py-3 rounded-xl border ${
                error ? 'border-red-300' : 'border-gray-200'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
            />
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showDropdown ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="sticky top-0 bg-white p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="w-full pl-9 pr-2 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option);
                      setShowDropdown(false);
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
          {error && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
      );
    } else {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-4 py-3 rounded-xl border ${
              error ? 'border-red-300' : 'border-gray-200'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
          />
          {error && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error}
            </p>
          )}
        </div>
      );
    }
  };

  // Render vehicle field with dropdown
  const renderVehicleFieldWithDropdown = (
    field: keyof VehicleInfo,
    label: string,
    placeholder: string,
    options: string[],
    showDropdown: boolean,
    setShowDropdown: (show: boolean) => void,
    searchValue: string,
    setSearchValue: (value: string) => void,
    filteredOptions: string[],
    dropdownRef: React.RefObject<HTMLDivElement | null>
  ) => {
    if (userPreferences.useDropdowns) {
      return (
        <div className="relative" ref={dropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <input
              type="text"
              value={vehicleInfo[field] || ''}
              onChange={(e) => {
                handleVehicleInfoChange(field, e.target.value);
                setSearchValue(e.target.value);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder={placeholder}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showDropdown ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {showDropdown && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="sticky top-0 bg-white p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder={`Search ${label.toLowerCase()}...`}
                    className="w-full pl-9 pr-2 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      handleVehicleInfoChange(field, option);
                      setShowDropdown(false);
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
          <input
            type="text"
            value={vehicleInfo[field] || ''}
            onChange={(e) => handleVehicleInfoChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      );
    }
  };

  // For model dropdown which depends on make
  const renderModelDropdown = () => {
    if (userPreferences.useDropdowns) {
      return (
        <div className="relative" ref={modelDropdownRef}>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Car Model
          </label>
          <div className="relative">
            <input
              type="text"
              value={vehicleInfo.model}
              onChange={(e) => {
                handleVehicleInfoChange('model', e.target.value);
                setModelSearch(e.target.value);
              }}
              onFocus={() => setShowModelDropdown(true)}
              disabled={!vehicleInfo.make}
              placeholder={vehicleInfo.make ? `Type or select ${vehicleInfo.make} model` : "Select make first"}
              className={`w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                !vehicleInfo.make ? 'bg-gray-100 cursor-not-allowed' : ''
              }`}
            />
            <button
              type="button"
              onClick={() => vehicleInfo.make && setShowModelDropdown(!showModelDropdown)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={!vehicleInfo.make}
            >
              {showModelDropdown ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          </div>
          
          {showModelDropdown && vehicleInfo.make && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              <div className="sticky top-0 bg-white p-2 border-b">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder={`Search ${vehicleInfo.make} models...`}
                    className="w-full pl-9 pr-2 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredModels(vehicleInfo.make).map((model) => (
                  <button
                    key={model}
                    type="button"
                    onClick={() => {
                      handleVehicleInfoChange('model', model);
                      setShowModelDropdown(false);
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
      );
    } else {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Car Model
          </label>
          <input
            type="text"
            value={vehicleInfo.model}
            onChange={(e) => handleVehicleInfoChange('model', e.target.value)}
            placeholder="e.g., Corolla"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Create New Lead</h1>
                <p className="text-gray-600 text-sm mt-1">
                  Fill in the details below to create a new lead record
                  {opportunityId && ' from opportunity'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Settings Button */}
              <div className="relative" ref={preferencesRef}>
                <button
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <SettingsIcon className="h-5 w-5 text-gray-600" />
                </button>
                
                {showPreferences && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-800 mb-3">Form Settings</h3>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Use dropdowns for form fields</span>
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
                          <p>When enabled, form fields will show dropdowns with suggestions.</p>
                          <p>When disabled, you can type freely in all fields.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    Create Lead
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-600">
              {userPreferences.useDropdowns ? 'Dropdown mode: Type or select from suggestions' : 'Free text mode: Type anything in all fields'}
            </span>
          </div>
          <button
            onClick={() => setShowPreferences(true)}
            className="text-xs text-blue-500 hover:text-blue-600 underline"
          >
            Change
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Lead Image & Basic Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Lead Image Upload */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-800">Lead Image</h3>
                <span className="text-xs text-gray-500">Optional</span>
              </div>
              
              <div className="relative">
                {previewImage ? (
                  <div className="relative group">
                    <img 
                      src={previewImage} 
                      alt="Lead preview" 
                      className="w-full h-64 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <button
                        onClick={() => setPreviewImage(null)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-full hover:bg-white/30 transition-colors"
                      >
                        <X className="h-5 w-5 text-white" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className={`block border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors ${uploadingImage ? 'opacity-50' : ''}`}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                    {uploadingImage ? (
                      <div className="space-y-3">
                        <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto" />
                        <p className="text-sm text-gray-600">Uploading image...</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                          <Camera className="h-8 w-8 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Click to upload lead image
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, GIF up to 5MB
                          </p>
                        </div>
                      </div>
                    )}
                  </label>
                )}
              </div>
            </div>

            {/* Service Type */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Service Type</h3>
              <div className="space-y-3">
                {serviceTypes.map((service) => {
                  const Icon = service.icon;
                  return (
                    <button
                      key={service.id}
                      type="button"
                      className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors cursor-pointer text-left"
                    >
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <Icon className="h-5 w-5 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-700">{service.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Business</h3>
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-lg">
                <div className="p-2 bg-white rounded-lg">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">Eagle Lights</p>
                  <p className="text-sm text-gray-600">Auto Accessories & Services</p>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column - Lead Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Lead Information Card */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Lead Information</h2>
                <p className="text-sm text-gray-600 mt-1">Basic contact and demographic details</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* First Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      value={formData.firstName || ''}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Enter first name"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.firstName ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      value={formData.lastName || ''}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Enter last name"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.lastName ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Lead Owner */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lead Owner
                    </label>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-medium">
                        DO
                      </div>
                      <span className="font-medium text-gray-700">Dalton Ongeche</span>
                    </div>
                  </div>

                  {/* Gender - with dropdown */}
                  {renderFieldWithDropdown(
                    'Gender',
                    formData.gender || '',
                    'Select Gender',
                    genders,
                    showGenderDropdown,
                    setShowGenderDropdown,
                    genderSearch,
                    setGenderSearch,
                    filteredGenders,
                    (value) => handleInputChange('gender', value),
                    genderDropdownRef
                  )}

                  {/* Lead Stage - with dropdown */}
                  {renderFieldWithDropdown(
                    'Lead Stage',
                    formData.stage || '',
                    'Select Lead Stage',
                    leadStages,
                    showStageDropdown,
                    setShowStageDropdown,
                    stageSearch,
                    setStageSearch,
                    filteredStages,
                    (value) => handleInputChange('stage', value),
                    stageDropdownRef
                  )}

                  {/* Lead Source - with dropdown */}
                  {renderFieldWithDropdown(
                    'Lead Source',
                    formData.source || '',
                    'Select Lead Source',
                    leadSources,
                    showSourceDropdown,
                    setShowSourceDropdown,
                    sourceSearch,
                    setSourceSearch,
                    filteredSources,
                    (value) => handleInputChange('source', value),
                    sourceDropdownRef
                  )}

                  {/* Prospecting Reasons - with dropdown */}
                  {renderFieldWithDropdown(
                    'Prospecting Reasons',
                    formData.prospectingReason || '',
                    'Select Reason',
                    prospectingReasons,
                    showReasonDropdown,
                    setShowReasonDropdown,
                    reasonSearch,
                    setReasonSearch,
                    filteredReasons,
                    (value) => handleInputChange('prospectingReason', value),
                    reasonDropdownRef
                  )}

                  {/* Mobile */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mobile *
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Enter mobile number"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Enter email address"
                      className={`w-full px-4 py-3 rounded-lg border ${errors.email ? 'border-red-300' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Interested In */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Products Interested In</h2>
                <p className="text-sm text-gray-600 mt-1">Select products the lead is interested in</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productInterests.map((product) => (
                    <div
                      key={product.id}
                      onClick={() => handleProductToggle(product.id)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all hover:border-blue-300 ${
                        selectedProducts.includes(product.id)
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getProductColor(product.category)}`}>
                            {getProductIcon(product.category)}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-800">{product.name}</h4>
                            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                          </div>
                        </div>
                        <div className={`h-5 w-5 rounded-full border flex items-center justify-center ${
                          selectedProducts.includes(product.id)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedProducts.includes(product.id) && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Vehicle & Product Details */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Vehicle & Product Details</h2>
                <p className="text-sm text-gray-600 mt-1">Information about the vehicle and requirements</p>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Car Make - with dropdown */}
                  {renderVehicleFieldWithDropdown(
                    'make',
                    'Car Make',
                    'e.g., Toyota',
                    vehicleMakes,
                    showMakeDropdown,
                    setShowMakeDropdown,
                    makeSearch,
                    setMakeSearch,
                    filteredMakes,
                    makeDropdownRef
                  )}

                  {/* Car Model - with dropdown (depends on make) */}
                  {renderModelDropdown()}

                  {/* Year of Manufacture */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Year of Manufacture
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.year || ''}
                      onChange={(e) => handleVehicleInfoChange('year', e.target.value)}
                      placeholder="e.g., 2022"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Town/City - with dropdown */}
                  {renderFieldWithDropdown(
                    'Town/City',
                    formData.city || '',
                    'Enter town or city',
                    townsCities,
                    showCityDropdown,
                    setShowCityDropdown,
                    citySearch,
                    setCitySearch,
                    filteredCities,
                    (value) => handleInputChange('city', value),
                    cityDropdownRef
                  )}

                  {/* Vehicle Color - with dropdown */}
                  {renderVehicleFieldWithDropdown(
                    'color',
                    'Vehicle Color',
                    'e.g., Red',
                    vehicleColors,
                    showColorDropdown,
                    setShowColorDropdown,
                    colorSearch,
                    setColorSearch,
                    filteredColors,
                    colorDropdownRef
                  )}

                  {/* VIN Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      VIN Number
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.vin || ''}
                      onChange={(e) => handleVehicleInfoChange('vin', e.target.value)}
                      placeholder="Enter VIN"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Engine Size */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Engine Size
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.engineSize || ''}
                      onChange={(e) => handleVehicleInfoChange('engineSize', e.target.value)}
                      placeholder="e.g., 2000 CC"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Fuel Type - with dropdown */}
                  {renderVehicleFieldWithDropdown(
                    'fuelType',
                    'Fuel Type',
                    'Select Fuel Type',
                    vehicleFuelTypes,
                    showFuelDropdown,
                    setShowFuelDropdown,
                    fuelSearch,
                    setFuelSearch,
                    filteredFuelTypes,
                    fuelDropdownRef
                  )}

                  {/* Transmission - with dropdown */}
                  {renderVehicleFieldWithDropdown(
                    'transmission',
                    'Transmission',
                    'Select Transmission',
                    vehicleTransmissions,
                    showTransmissionDropdown,
                    setShowTransmissionDropdown,
                    transmissionSearch,
                    setTransmissionSearch,
                    filteredTransmissions,
                    transmissionDropdownRef
                  )}

                  {/* Registration Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Registration Number
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.registrationNumber || ''}
                      onChange={(e) => handleVehicleInfoChange('registrationNumber', e.target.value)}
                      placeholder="e.g., KAA 123A"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Mileage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mileage (KM)
                    </label>
                    <input
                      type="text"
                      value={vehicleInfo.mileage || ''}
                      onChange={(e) => handleVehicleInfoChange('mileage', e.target.value)}
                      placeholder="e.g., 45000"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Address */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Address
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Enter complete address"
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Non-Progressive Reasons */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Non-Progressive Reasons</h2>
                <p className="text-sm text-gray-600 mt-1">Reasons for lead not progressing (if applicable)</p>
              </div>
              
              <div className="p-6">
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Enter any additional notes, reasons for delay, or specific requirements..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors min-h-[120px]"
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}