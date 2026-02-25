// services/settings/countriesService.ts
export interface Country {
  name: string;
  code: string;
  flag: string;
  dialCode?: string;
}

class CountriesService {
  private countries: Country[] = [];
  private isLoading = false;
  private error: string | null = null;

  /**
   * Fetch countries from REST Countries API
   */
  async fetchCountries(): Promise<Country[]> {
    try {
      this.isLoading = true;
      this.error = null;
      
      // Using REST Countries API (free, no API key required)
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,flags,cca2,idd');
      
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }
      
      const data = await response.json();
      
      // Transform the data to our format
      this.countries = data
        .map((country: any) => ({
          name: country.name.common,
          code: country.cca2,
          flag: country.flags.svg || country.flags.png,
          dialCode: country.idd?.root + (country.idd?.suffixes?.[0] || '')
        }))
        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));
      
      return this.countries;
    } catch (error) {
      console.error('Error fetching countries:', error);
      this.error = 'Failed to load countries';
      // Return fallback countries if API fails
      return this.getFallbackCountries();
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Get cached countries or fetch if not available
   */
  async getCountries(): Promise<Country[]> {
    if (this.countries.length > 0) {
      return this.countries;
    }
    return this.fetchCountries();
  }

  /**
   * Get country by code
   */
  async getCountryByCode(code: string): Promise<Country | undefined> {
    const countries = await this.getCountries();
    return countries.find(c => c.code === code);
  }

  /**
   * Get country by name
   */
  async getCountryByName(name: string): Promise<Country | undefined> {
    const countries = await this.getCountries();
    return countries.find(c => c.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Fallback countries in case API fails
   */
  private getFallbackCountries(): Country[] {
    return [
      { name: 'United States', code: 'US', flag: 'https://flagcdn.com/us.svg', dialCode: '+1' },
      { name: 'Canada', code: 'CA', flag: 'https://flagcdn.com/ca.svg', dialCode: '+1' },
      { name: 'United Kingdom', code: 'GB', flag: 'https://flagcdn.com/gb.svg', dialCode: '+44' },
      { name: 'Australia', code: 'AU', flag: 'https://flagcdn.com/au.svg', dialCode: '+61' },
      { name: 'Germany', code: 'DE', flag: 'https://flagcdn.com/de.svg', dialCode: '+49' },
      { name: 'France', code: 'FR', flag: 'https://flagcdn.com/fr.svg', dialCode: '+33' },
      { name: 'Japan', code: 'JP', flag: 'https://flagcdn.com/jp.svg', dialCode: '+81' },
      { name: 'China', code: 'CN', flag: 'https://flagcdn.com/cn.svg', dialCode: '+86' },
      { name: 'India', code: 'IN', flag: 'https://flagcdn.com/in.svg', dialCode: '+91' },
      { name: 'Brazil', code: 'BR', flag: 'https://flagcdn.com/br.svg', dialCode: '+55' },
      { name: 'Mexico', code: 'MX', flag: 'https://flagcdn.com/mx.svg', dialCode: '+52' },
      { name: 'Spain', code: 'ES', flag: 'https://flagcdn.com/es.svg', dialCode: '+34' },
      { name: 'Italy', code: 'IT', flag: 'https://flagcdn.com/it.svg', dialCode: '+39' },
      { name: 'Netherlands', code: 'NL', flag: 'https://flagcdn.com/nl.svg', dialCode: '+31' },
      { name: 'Sweden', code: 'SE', flag: 'https://flagcdn.com/se.svg', dialCode: '+46' },
      { name: 'Norway', code: 'NO', flag: 'https://flagcdn.com/no.svg', dialCode: '+47' },
      { name: 'Denmark', code: 'DK', flag: 'https://flagcdn.com/dk.svg', dialCode: '+45' },
      { name: 'Finland', code: 'FI', flag: 'https://flagcdn.com/fi.svg', dialCode: '+358' },
      { name: 'Switzerland', code: 'CH', flag: 'https://flagcdn.com/ch.svg', dialCode: '+41' },
      { name: 'Singapore', code: 'SG', flag: 'https://flagcdn.com/sg.svg', dialCode: '+65' },
      { name: 'New Zealand', code: 'NZ', flag: 'https://flagcdn.com/nz.svg', dialCode: '+64' },
      { name: 'South Africa', code: 'ZA', flag: 'https://flagcdn.com/za.svg', dialCode: '+27' },
      { name: 'Nigeria', code: 'NG', flag: 'https://flagcdn.com/ng.svg', dialCode: '+234' },
      { name: 'Kenya', code: 'KE', flag: 'https://flagcdn.com/ke.svg', dialCode: '+254' },
      { name: 'Egypt', code: 'EG', flag: 'https://flagcdn.com/eg.svg', dialCode: '+20' },
      { name: 'Saudi Arabia', code: 'SA', flag: 'https://flagcdn.com/sa.svg', dialCode: '+966' },
      { name: 'UAE', code: 'AE', flag: 'https://flagcdn.com/ae.svg', dialCode: '+971' },
      { name: 'Israel', code: 'IL', flag: 'https://flagcdn.com/il.svg', dialCode: '+972' },
      { name: 'Turkey', code: 'TR', flag: 'https://flagcdn.com/tr.svg', dialCode: '+90' },
      { name: 'Russia', code: 'RU', flag: 'https://flagcdn.com/ru.svg', dialCode: '+7' },
      { name: 'South Korea', code: 'KR', flag: 'https://flagcdn.com/kr.svg', dialCode: '+82' },
      { name: 'Indonesia', code: 'ID', flag: 'https://flagcdn.com/id.svg', dialCode: '+62' },
      { name: 'Malaysia', code: 'MY', flag: 'https://flagcdn.com/my.svg', dialCode: '+60' },
      { name: 'Thailand', code: 'TH', flag: 'https://flagcdn.com/th.svg', dialCode: '+66' },
      { name: 'Vietnam', code: 'VN', flag: 'https://flagcdn.com/vn.svg', dialCode: '+84' },
      { name: 'Philippines', code: 'PH', flag: 'https://flagcdn.com/ph.svg', dialCode: '+63' },
      { name: 'Pakistan', code: 'PK', flag: 'https://flagcdn.com/pk.svg', dialCode: '+92' },
      { name: 'Bangladesh', code: 'BD', flag: 'https://flagcdn.com/bd.svg', dialCode: '+880' },
      { name: 'Sri Lanka', code: 'LK', flag: 'https://flagcdn.com/lk.svg', dialCode: '+94' },
      { name: 'Nepal', code: 'NP', flag: 'https://flagcdn.com/np.svg', dialCode: '+977' },
      { name: 'Afghanistan', code: 'AF', flag: 'https://flagcdn.com/af.svg', dialCode: '+93' },
      { name: 'Iran', code: 'IR', flag: 'https://flagcdn.com/ir.svg', dialCode: '+98' },
      { name: 'Iraq', code: 'IQ', flag: 'https://flagcdn.com/iq.svg', dialCode: '+964' },
      { name: 'Jordan', code: 'JO', flag: 'https://flagcdn.com/jo.svg', dialCode: '+962' },
      { name: 'Lebanon', code: 'LB', flag: 'https://flagcdn.com/lb.svg', dialCode: '+961' },
      { name: 'Syria', code: 'SY', flag: 'https://flagcdn.com/sy.svg', dialCode: '+963' },
      { name: 'Kuwait', code: 'KW', flag: 'https://flagcdn.com/kw.svg', dialCode: '+965' },
      { name: 'Qatar', code: 'QA', flag: 'https://flagcdn.com/qa.svg', dialCode: '+974' },
      { name: 'Bahrain', code: 'BH', flag: 'https://flagcdn.com/bh.svg', dialCode: '+973' },
      { name: 'Oman', code: 'OM', flag: 'https://flagcdn.com/om.svg', dialCode: '+968' },
      { name: 'Yemen', code: 'YE', flag: 'https://flagcdn.com/ye.svg', dialCode: '+967' }
    ];
  }

  /**
   * Search countries by name
   */
  async searchCountries(searchTerm: string): Promise<Country[]> {
    const countries = await this.getCountries();
    const term = searchTerm.toLowerCase();
    return countries.filter(c => 
      c.name.toLowerCase().includes(term) || 
      c.code.toLowerCase().includes(term)
    );
  }

  /**
   * Get loading state
   */
  getLoadingState() {
    return {
      isLoading: this.isLoading,
      error: this.error
    };
  }
}

export const countriesService = new CountriesService();