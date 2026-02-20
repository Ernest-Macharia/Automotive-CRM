import { apiClient } from '@/lib/api/client';

export interface Country {
  country: string;
}

export interface Make {
  make: string;
}

export interface Model {
  model: string;
}

export interface Trim {
  trim: string;
}

export interface CardataItem {
  _id?: string;
  country: string;
  make: string;
  model: string;
  trim: string;
  trimSource: 'master' | 'manual';
  notes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ManualTrimDto {
  country: string;
  make: string;
  model: string;
  trim: string;
  notes?: string;
}

export interface ImportResult {
  imported: number;
}

// Extended ApiClient for cardata service
class ExtendedApiClient {
  private getApiBaseUrl(): string {
    if ((apiClient as any).API_BASE_URL) {
      return (apiClient as any).API_BASE_URL;
    }
    try {
      const config = require('@/lib/api/config');
      return config.API_BASE_URL || '';
    } catch {
      return '';
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const token = sessionStorage.getItem('accessToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async requestWithHeaders<T>(
    endpoint: string, 
    options: RequestInit = {},
    customHeaders?: Record<string, string>
  ): Promise<T> {
    const url = `${this.getApiBaseUrl()}${endpoint}`;
    
    const headers = {
      ...this.getHeaders(),
      ...options.headers,
      ...customHeaders,
    };

    const config: RequestInit = {
      ...options,
      headers,
      mode: 'cors',
      credentials: 'include',
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      
      if (response.status === 401) {
        sessionStorage.removeItem('accessToken');
        window.location.href = '/auth/login';
      }
      
      throw new Error(`API Error (${response.status}): ${errorText || response.statusText}`);
    }
    
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    }
    return {} as T;
  }

  async get<T>(endpoint: string, params?: Record<string, string>, headers?: Record<string, string>): Promise<T> {
    let url = endpoint;
    if (params) {
      const queryParams = new URLSearchParams(params);
      url += `?${queryParams.toString()}`;
    }
    return this.requestWithHeaders<T>(url, { method: 'GET' }, headers);
  }

  async post<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    }, headers);
  }

  async put<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, headers);
  }

  async patch<D, T>(endpoint: string, data: D, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }, headers);
  }

  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.requestWithHeaders<T>(endpoint, {
      method: 'DELETE',
    }, headers);
  }
}

const extendedApiClient = new ExtendedApiClient();

class CardataService {
  // 1. Get all countries
  async getCountries(): Promise<string[]> {
    try {
      return await extendedApiClient.get<string[]>('/cardata/countries');
    } catch (error) {
      console.error('Error getting countries:', error);
      throw error;
    }
  }

  // 2. Get makes by country
  async getMakesByCountry(country: string): Promise<string[]> {
    try {
      if (!country) {
        throw new Error('Country is required');
      }
      
      return await extendedApiClient.get<string[]>('/cardata/makes', { country });
    } catch (error) {
      console.error(`Error getting makes for country ${country}:`, error);
      throw error;
    }
  }

  // 3. Get models by country and make
  async getModelsByMake(country: string, make: string): Promise<string[]> {
    try {
      if (!country || !make) {
        throw new Error('Country and make are required');
      }
      
      return await extendedApiClient.get<string[]>('/cardata/models', { country, make });
    } catch (error) {
      console.error(`Error getting models for ${make} in ${country}:`, error);
      throw error;
    }
  }

  // 4. Get trims by country, make, and model
  async getTrims(country: string, make: string, model: string): Promise<string[]> {
    try {
      if (!country || !make || !model) {
        throw new Error('Country, make, and model are required');
      }
      
      return await extendedApiClient.get<string[]>('/cardata/trims', { country, make, model });
    } catch (error) {
      console.error(`Error getting trims for ${make} ${model} in ${country}:`, error);
      throw error;
    }
  }

  // 5. Add a manual trim override
  async addManualTrim(data: ManualTrimDto): Promise<CardataItem> {
    try {
      if (!data.country || !data.make || !data.model || !data.trim) {
        throw new Error('Country, make, model, and trim are required');
      }
      
      return await extendedApiClient.post<ManualTrimDto, CardataItem>('/cardata/manual-trim', data);
    } catch (error) {
      console.error('Error adding manual trim:', error);
      throw error;
    }
  }

  // 6. Import master cardata JSON into DB
  async importMasterData(): Promise<ImportResult> {
    try {
      return await extendedApiClient.post<any, ImportResult>('/cardata/import-master', {});
    } catch (error) {
      console.error('Error importing master cardata:', error);
      throw error;
    }
  }

  // Utility methods
  async getAllVehicleData(): Promise<{
    countries: string[];
    makesByCountry: Record<string, string[]>;
    modelsByMake: Record<string, string[]>;
    trimsByModel: Record<string, string[]>;
  }> {
    try {
      const countries = await this.getCountries();
      
      const makesByCountry: Record<string, string[]> = {};
      const modelsByMake: Record<string, string[]> = {};
      const trimsByModel: Record<string, string[]> = {};
      
      // Get makes for each country
      for (const country of countries) {
        try {
          const makes = await this.getMakesByCountry(country);
          makesByCountry[country] = makes;
        } catch (error) {
          console.warn(`Could not get makes for country ${country}:`, error);
          makesByCountry[country] = [];
        }
      }
      
      // Get models for each make in each country
      for (const country of countries) {
        const makes = makesByCountry[country];
        for (const make of makes) {
          try {
            const models = await this.getModelsByMake(country, make);
            const key = `${country}_${make}`;
            modelsByMake[key] = models;
          } catch (error) {
            console.warn(`Could not get models for ${make} in ${country}:`, error);
            const key = `${country}_${make}`;
            modelsByMake[key] = [];
          }
        }
      }
      
      // Get trims for each model
      for (const country of countries) {
        const makes = makesByCountry[country];
        for (const make of makes) {
          const key = `${country}_${make}`;
          const models = modelsByMake[key] || [];
          for (const model of models) {
            try {
              const trims = await this.getTrims(country, make, model);
              const trimKey = `${country}_${make}_${model}`;
              trimsByModel[trimKey] = trims;
            } catch (error) {
              console.warn(`Could not get trims for ${make} ${model} in ${country}:`, error);
              const trimKey = `${country}_${make}_${model}`;
              trimsByModel[trimKey] = [];
            }
          }
        }
      }
      
      return {
        countries,
        makesByCountry,
        modelsByMake,
        trimsByModel
      };
    } catch (error) {
      console.error('Error getting all vehicle data:', error);
      throw error;
    }
  }

  async searchVehicles(
    searchTerm: string,
    limit: number = 20
  ): Promise<Array<{
    country: string;
    make: string;
    model: string;
    trim: string;
    fullName: string;
  }>> {
    try {
      // Note: This is a client-side search since the backend doesn't have a search endpoint
      // In a real scenario, you'd want a proper search API endpoint
      
      // Get all countries first
      const countries = await this.getCountries();
      const results: Array<{
        country: string;
        make: string;
        model: string;
        trim: string;
        fullName: string;
      }> = [];
      
      const searchLower = searchTerm.toLowerCase();
      
      // Search through countries
      const matchingCountries = countries.filter(country => 
        country.toLowerCase().includes(searchLower)
      );
      
      for (const country of matchingCountries.slice(0, 3)) {
        const makes = await this.getMakesByCountry(country);
        for (const make of makes.slice(0, 3)) {
          const models = await this.getModelsByMake(country, make);
          for (const model of models.slice(0, 3)) {
            const trims = await this.getTrims(country, make, model);
            for (const trim of trims.slice(0, 3)) {
              const fullName = `${country} - ${make} ${model} ${trim}`;
              results.push({
                country,
                make,
                model,
                trim,
                fullName
              });
              
              if (results.length >= limit) {
                return results;
              }
            }
          }
        }
      }
      
      // If we still have room, search makes
      if (results.length < limit) {
        for (const country of countries.slice(0, 5)) {
          const makes = await this.getMakesByCountry(country);
          const matchingMakes = makes.filter(make => 
            make.toLowerCase().includes(searchLower)
          );
          
          for (const make of matchingMakes.slice(0, 3)) {
            const models = await this.getModelsByMake(country, make);
            for (const model of models.slice(0, 3)) {
              const trims = await this.getTrims(country, make, model);
              for (const trim of trims.slice(0, 2)) {
                const fullName = `${country} - ${make} ${model} ${trim}`;
                // Check if already in results
                if (!results.some(r => 
                  r.country === country && 
                  r.make === make && 
                  r.model === model && 
                  r.trim === trim
                )) {
                  results.push({
                    country,
                    make,
                    model,
                    trim,
                    fullName
                  });
                  
                  if (results.length >= limit) {
                    return results;
                  }
                }
              }
            }
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error(`Error searching vehicles for "${searchTerm}":`, error);
      throw error;
    }
  }

  async getVehicleHierarchy(): Promise<Array<{
    country: string;
    makes: Array<{
      make: string;
      models: Array<{
        model: string;
        trims: string[];
      }>;
    }>;
  }>> {
    try {
      const countries = await this.getCountries();
      const hierarchy = [];
      
      for (const country of countries) {
        const makes = await this.getMakesByCountry(country);
        const makeHierarchy = [];
        
        for (const make of makes) {
          const models = await this.getModelsByMake(country, make);
          const modelHierarchy = [];
          
          for (const model of models) {
            const trims = await this.getTrims(country, make, model);
            modelHierarchy.push({
              model,
              trims
            });
          }
          
          makeHierarchy.push({
            make,
            models: modelHierarchy
          });
        }
        
        hierarchy.push({
          country,
          makes: makeHierarchy
        });
      }
      
      return hierarchy;
    } catch (error) {
      console.error('Error getting vehicle hierarchy:', error);
      throw error;
    }
  }

  async getPopularVehicles(limit: number = 10): Promise<Array<{
    country: string;
    make: string;
    model: string;
    trim: string;
    frequency: number;
  }>> {
    try {
      // Note: This is a simulated method since the backend doesn't track popularity
      // In a real scenario, this would come from actual usage statistics
      
      const countries = await this.getCountries();
      const popularVehicles = [];
      
      // Get a sample of vehicles from each country
      for (const country of countries.slice(0, 3)) {
        const makes = await this.getMakesByCountry(country);
        for (const make of makes.slice(0, 3)) {
          const models = await this.getModelsByMake(country, make);
          for (const model of models.slice(0, 2)) {
            const trims = await this.getTrims(country, make, model);
            if (trims.length > 0) {
              // Simulate frequency based on position in array
              const frequency = Math.floor(Math.random() * 100) + 1;
              popularVehicles.push({
                country,
                make,
                model,
                trim: trims[0],
                frequency
              });
              
              if (popularVehicles.length >= limit) {
                break;
              }
            }
          }
          if (popularVehicles.length >= limit) break;
        }
        if (popularVehicles.length >= limit) break;
      }
      
      // Sort by frequency (simulated)
      return popularVehicles.sort((a, b) => b.frequency - a.frequency);
    } catch (error) {
      console.error('Error getting popular vehicles:', error);
      throw error;
    }
  }

  async validateVehicle(
    country: string,
    make: string,
    model: string,
    trim?: string
  ): Promise<{
    isValid: boolean;
    message?: string;
    availableCountries?: string[];
    availableMakes?: string[];
    availableModels?: string[];
    availableTrims?: string[];
  }> {
    try {
      // Validate country
      const countries = await this.getCountries();
      const isValidCountry = countries.some(c => 
        c.toLowerCase() === country.toLowerCase()
      );
      
      if (!isValidCountry) {
        return {
          isValid: false,
          message: `Invalid country. Available countries: ${countries.join(', ')}`,
          availableCountries: countries
        };
      }
      
      // Validate make
      const makes = await this.getMakesByCountry(country);
      const isValidMake = makes.some(m => 
        m.toLowerCase() === make.toLowerCase()
      );
      
      if (!isValidMake) {
        return {
          isValid: false,
          message: `Invalid make for country ${country}. Available makes: ${makes.join(', ')}`,
          availableMakes: makes
        };
      }
      
      // Validate model
      const models = await this.getModelsByMake(country, make);
      const isValidModel = models.some(m => 
        m.toLowerCase() === model.toLowerCase()
      );
      
      if (!isValidModel) {
        return {
          isValid: false,
          message: `Invalid model for ${make} in ${country}. Available models: ${models.join(', ')}`,
          availableModels: models
        };
      }
      
      // Validate trim if provided
      if (trim) {
        const trims = await this.getTrims(country, make, model);
        const isValidTrim = trims.some(t => 
          t.toLowerCase() === trim.toLowerCase()
        );
        
        if (!isValidTrim) {
          return {
            isValid: false,
            message: `Invalid trim for ${make} ${model} in ${country}. Available trims: ${trims.join(', ')}`,
            availableTrims: trims
          };
        }
      }
      
      return {
        isValid: true,
        message: 'Vehicle is valid'
      };
    } catch (error) {
      console.error(`Error validating vehicle ${make} ${model} in ${country}:`, error);
      throw error;
    }
  }

  async getVehicleDetails(
    country: string,
    make: string,
    model: string,
    trim: string
  ): Promise<{
    country: string;
    make: string;
    model: string;
    trim: string;
    source: 'master' | 'manual' | 'unknown';
    fullSpecification?: string;
    yearRange?: string;
    engineOptions?: string[];
    transmissionOptions?: string[];
    drivetrainOptions?: string[];
  }> {
    try {
      // Note: This is a basic implementation. In a real scenario,
      // you'd have a dedicated API endpoint for vehicle details
      
      // First validate the vehicle exists
      const validation = await this.validateVehicle(country, make, model, trim);
      
      if (!validation.isValid) {
        throw new Error(validation.message || 'Invalid vehicle');
      }
      
      // Get all trims for this model to determine source
      const allTrims = await this.getTrims(country, make, model);
      const trimExists = allTrims.some(t => 
        t.toLowerCase() === trim.toLowerCase()
      );
      
      // Simulate additional details (in a real app, this would come from a detailed API)
      const yearRange = '2018-2023';
      const engineOptions = ['1.5L I4', '2.0L I4', '2.5L V6'];
      const transmissionOptions = ['Manual', 'Automatic', 'CVT'];
      const drivetrainOptions = ['FWD', 'RWD', 'AWD'];
      
      return {
        country,
        make,
        model,
        trim,
        source: trimExists ? 'master' : 'unknown',
        fullSpecification: `${make} ${model} ${trim} (${country})`,
        yearRange,
        engineOptions,
        transmissionOptions,
        drivetrainOptions
      };
    } catch (error) {
      console.error(`Error getting details for ${make} ${model} ${trim} in ${country}:`, error);
      throw error;
    }
  }

  async addVehicleWithValidation(data: ManualTrimDto): Promise<{
    success: boolean;
    data?: CardataItem;
    message: string;
    warnings?: string[];
  }> {
    try {
      // Validate the vehicle doesn't already exist
      const validation = await this.validateVehicle(
        data.country,
        data.make,
        data.model,
        data.trim
      );
      
      if (validation.isValid) {
        // Vehicle already exists in master data
        return {
          success: false,
          message: `Vehicle already exists in master data. Available trims: ${validation.availableTrims?.join(', ')}`,
          warnings: ['Consider using existing trim instead of adding manual override']
        };
      }
      
      // Add as manual trim
      const result = await this.addManualTrim(data);
      
      return {
        success: true,
        data: result,
        message: 'Manual trim added successfully'
      };
    } catch (error: any) {
      console.error('Error adding vehicle with validation:', error);
      return {
        success: false,
        message: error.message || 'Failed to add manual trim'
      };
    }
  }

  async getStatistics(): Promise<{
    totalCountries: number;
    totalMakes: number;
    totalModels: number;
    totalTrims: number;
    manualTrims: number;
    masterTrims: number;
    lastUpdated?: string;
  }> {
    try {
      // Note: This is a simulated method since the backend doesn't provide statistics
      // In a real scenario, this would come from an actual statistics endpoint
      
      const countries = await this.getCountries();
      let totalMakes = 0;
      let totalModels = 0;
      let totalTrims = 0;
      
      // Count makes, models, and trims
      for (const country of countries) {
        const makes = await this.getMakesByCountry(country);
        totalMakes += makes.length;
        
        for (const make of makes) {
          const models = await this.getModelsByMake(country, make);
          totalModels += models.length;
          
          for (const model of models) {
            const trims = await this.getTrims(country, make, model);
            totalTrims += trims.length;
          }
        }
      }
      
      // Simulate manual trims count (would need API endpoint in real scenario)
      const manualTrims = Math.floor(totalTrims * 0.1); // 10% are manual
      const masterTrims = totalTrims - manualTrims;
      
      return {
        totalCountries: countries.length,
        totalMakes,
        totalModels,
        totalTrims,
        manualTrims,
        masterTrims,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  async exportVehicleData(
    format: 'csv' | 'json' = 'json',
    country?: string
  ): Promise<string> {
    try {
      let countriesToExport = [];
      
      if (country) {
        // Validate country exists
        const allCountries = await this.getCountries();
        const countryExists = allCountries.some(c => 
          c.toLowerCase() === country.toLowerCase()
        );
        
        if (!countryExists) {
          throw new Error(`Country "${country}" not found`);
        }
        
        countriesToExport = [country];
      } else {
        countriesToExport = await this.getCountries();
      }
      
      const exportData: Array<{
        country: string;
        make: string;
        model: string;
        trim: string;
      }> = [];
      
      // Collect all vehicle data
      for (const country of countriesToExport) {
        const makes = await this.getMakesByCountry(country);
        
        for (const make of makes) {
          const models = await this.getModelsByMake(country, make);
          
          for (const model of models) {
            const trims = await this.getTrims(country, make, model);
            
            for (const trim of trims) {
              exportData.push({
                country,
                make,
                model,
                trim
              });
            }
          }
        }
      }
      
      if (format === 'csv') {
        const headers = ['Country', 'Make', 'Model', 'Trim'];
        const rows = exportData.map(item => [
          `"${item.country}"`,
          `"${item.make}"`,
          `"${item.model}"`,
          `"${item.trim}"`
        ]);
        
        return [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
      } else {
        return JSON.stringify(exportData, null, 2);
      }
    } catch (error) {
      console.error(`Error exporting vehicle data (format: ${format}, country: ${country}):`, error);
      throw error;
    }
  }

  async bulkAddManualTrims(
    items: ManualTrimDto[]
  ): Promise<Array<{
    item: ManualTrimDto;
    success: boolean;
    data?: CardataItem;
    error?: string;
  }>> {
    try {
      const results = [];
      
      for (const item of items) {
        try {
          const data = await this.addVehicleWithValidation(item);
          
          if (data.success) {
            results.push({
              item,
              success: true,
              data: data.data
            });
          } else {
            results.push({
              item,
              success: false,
              error: data.message
            });
          }
        } catch (error: any) {
          results.push({
            item,
            success: false,
            error: error.message || 'Unknown error'
          });
        }
        
        // Small delay to prevent overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      return results;
    } catch (error) {
      console.error('Error bulk adding manual trims:', error);
      throw error;
    }
  }

  async getVehicleSuggestions(
    partialMake?: string,
    partialModel?: string,
    limit: number = 10
  ): Promise<Array<{
    make: string;
    model: string;
    country: string;
    matchScore: number;
  }>> {
    try {
      const allData = await this.getAllVehicleData();
      const suggestions: Array<{
        make: string;
        model: string;
        country: string;
        matchScore: number;
      }> = [];
      
      const makeLower = partialMake?.toLowerCase() || '';
      const modelLower = partialModel?.toLowerCase() || '';
      
      // Generate suggestions based on partial matches
      for (const country in allData.makesByCountry) {
        const makes = allData.makesByCountry[country];
        
        for (const make of makes) {
          let makeScore = 0;
          
          if (partialMake) {
            if (make.toLowerCase().startsWith(makeLower)) {
              makeScore = 100;
            } else if (make.toLowerCase().includes(makeLower)) {
              makeScore = 50;
            } else {
              continue; // Skip makes that don't match at all
            }
          } else {
            makeScore = 10; // Base score when no make specified
          }
          
          const models = allData.modelsByMake[`${country}_${make}`] || [];
          
          for (const model of models) {
            let modelScore = 0;
            
            if (partialModel) {
              if (model.toLowerCase().startsWith(modelLower)) {
                modelScore = 100;
              } else if (model.toLowerCase().includes(modelLower)) {
                modelScore = 50;
              } else {
                continue; // Skip models that don't match at all
              }
            } else {
              modelScore = 10; // Base score when no model specified
            }
            
            const totalScore = makeScore + modelScore;
            
            suggestions.push({
              make,
              model,
              country,
              matchScore: totalScore
            });
            
            // Keep only top suggestions
            if (suggestions.length > limit * 2) {
              suggestions.sort((a, b) => b.matchScore - a.matchScore);
              suggestions.splice(limit);
            }
          }
        }
      }
      
      // Sort by match score and limit results
      suggestions.sort((a, b) => b.matchScore - a.matchScore);
      return suggestions.slice(0, limit);
    } catch (error) {
      console.error('Error getting vehicle suggestions:', error);
      throw error;
    }
  }
}

export const cardataService = new CardataService();