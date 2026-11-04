export interface CountryDetails {
  code: string;
  name: string;
  flag: string;
  dialCode: string;
  currency: string;
  city: string;
  timeZone: string;
  forexPair: string | null;
  marketIndex: string | null;
}

export const DEFAULT_COUNTRY_CODE = 'UG';

export const COUNTRIES: CountryDetails[] = [
  { code: 'UG', name: 'Uganda', flag: '🇺🇬', dialCode: '+256', currency: 'UGX', city: 'Kampala', timeZone: 'Africa/Kampala', forexPair: 'USD/UGX', marketIndex: 'USE ALSI' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪', dialCode: '+254', currency: 'KES', city: 'Nairobi', timeZone: 'Africa/Nairobi', forexPair: 'USD/KES', marketIndex: 'NSE 20' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬', dialCode: '+234', currency: 'NGN', city: 'Lagos', timeZone: 'Africa/Lagos', forexPair: 'USD/NGN', marketIndex: null },
  { code: 'ZA', name: 'South Africa', flag: '🇿🇦', dialCode: '+27', currency: 'ZAR', city: 'Johannesburg', timeZone: 'Africa/Johannesburg', forexPair: 'USD/ZAR', marketIndex: null },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭', dialCode: '+233', currency: 'GHS', city: 'Accra', timeZone: 'Africa/Accra', forexPair: 'USD/GHS', marketIndex: null },
  { code: 'EG', name: 'Egypt', flag: '🇪🇬', dialCode: '+20', currency: 'EGP', city: 'Cairo', timeZone: 'Africa/Cairo', forexPair: 'USD/EGP', marketIndex: null },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼', dialCode: '+250', currency: 'RWF', city: 'Kigali', timeZone: 'Africa/Kigali', forexPair: 'USD/RWF', marketIndex: null },
  { code: 'TZ', name: 'Tanzania', flag: '🇹🇿', dialCode: '+255', currency: 'TZS', city: 'Dar es Salaam', timeZone: 'Africa/Dar_es_Salaam', forexPair: 'USD/TZS', marketIndex: null },
  { code: 'ZM', name: 'Zambia', flag: '🇿🇲', dialCode: '+260', currency: 'ZMW', city: 'Lusaka', timeZone: 'Africa/Lusaka', forexPair: 'USD/ZMW', marketIndex: null },
  { code: 'ET', name: 'Ethiopia', flag: '🇪🇹', dialCode: '+251', currency: 'ETB', city: 'Addis Ababa', timeZone: 'Africa/Addis_Ababa', forexPair: 'USD/ETB', marketIndex: null },
  { code: 'AU', name: 'Australia', flag: '🇦🇺', dialCode: '+61', currency: 'AUD', city: 'Sydney', timeZone: 'Australia/Sydney', forexPair: 'USD/AUD', marketIndex: 'ASX 200' },
  { code: 'NZ', name: 'New Zealand', flag: '🇳🇿', dialCode: '+64', currency: 'NZD', city: 'Auckland', timeZone: 'Pacific/Auckland', forexPair: 'NZD/USD', marketIndex: null },
  { code: 'IN', name: 'India', flag: '🇮🇳', dialCode: '+91', currency: 'INR', city: 'Mumbai', timeZone: 'Asia/Kolkata', forexPair: 'USD/INR', marketIndex: 'Nifty 50' },
  { code: 'PH', name: 'Philippines', flag: '🇵🇭', dialCode: '+63', currency: 'PHP', city: 'Manila', timeZone: 'Asia/Manila', forexPair: 'USD/PHP', marketIndex: 'PSEi' },
  { code: 'ID', name: 'Indonesia', flag: '🇮🇩', dialCode: '+62', currency: 'IDR', city: 'Jakarta', timeZone: 'Asia/Jakarta', forexPair: 'USD/IDR', marketIndex: null },
  { code: 'TH', name: 'Thailand', flag: '🇹🇭', dialCode: '+66', currency: 'THB', city: 'Bangkok', timeZone: 'Asia/Bangkok', forexPair: 'USD/THB', marketIndex: null },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', dialCode: '+60', currency: 'MYR', city: 'Kuala Lumpur', timeZone: 'Asia/Kuala_Lumpur', forexPair: 'USD/MYR', marketIndex: null },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', dialCode: '+65', currency: 'SGD', city: 'Singapore', timeZone: 'Asia/Singapore', forexPair: 'USD/SGD', marketIndex: null },
  { code: 'PK', name: 'Pakistan', flag: '🇵🇰', dialCode: '+92', currency: 'PKR', city: 'Karachi', timeZone: 'Asia/Karachi', forexPair: 'USD/PKR', marketIndex: null },
  { code: 'BD', name: 'Bangladesh', flag: '🇧🇩', dialCode: '+880', currency: 'BDT', city: 'Dhaka', timeZone: 'Asia/Dhaka', forexPair: 'USD/BDT', marketIndex: null },
  { code: 'JP', name: 'Japan', flag: '🇯🇵', dialCode: '+81', currency: 'JPY', city: 'Tokyo', timeZone: 'Asia/Tokyo', forexPair: 'USD/JPY', marketIndex: 'Nikkei 225' },
  { code: 'AE', name: 'United Arab Emirates', flag: '🇦🇪', dialCode: '+971', currency: 'AED', city: 'Dubai', timeZone: 'Asia/Dubai', forexPair: 'USD/AED', marketIndex: 'DFM' },
  { code: 'TR', name: 'Turkey', flag: '🇹🇷', dialCode: '+90', currency: 'TRY', city: 'Istanbul', timeZone: 'Europe/Istanbul', forexPair: 'USD/TRY', marketIndex: null },
  { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', dialCode: '+44', currency: 'GBP', city: 'London', timeZone: 'Europe/London', forexPair: 'GBP/USD', marketIndex: 'FTSE 100' },
  { code: 'DE', name: 'Germany', flag: '🇩🇪', dialCode: '+49', currency: 'EUR', city: 'Frankfurt', timeZone: 'Europe/Berlin', forexPair: 'EUR/USD', marketIndex: 'DAX' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦', dialCode: '+1', currency: 'CAD', city: 'Toronto', timeZone: 'America/Toronto', forexPair: 'USD/CAD', marketIndex: 'TSX' },
  { code: 'BR', name: 'Brazil', flag: '🇧🇷', dialCode: '+55', currency: 'BRL', city: 'Sao Paulo', timeZone: 'America/Sao_Paulo', forexPair: 'USD/BRL', marketIndex: 'Bovespa' },
  { code: 'MX', name: 'Mexico', flag: '🇲🇽', dialCode: '+52', currency: 'MXN', city: 'Mexico City', timeZone: 'America/Mexico_City', forexPair: 'USD/MXN', marketIndex: null },
  { code: 'US', name: 'United States', flag: '🇺🇸', dialCode: '+1', currency: 'USD', city: 'New York', timeZone: 'America/New_York', forexPair: null, marketIndex: 'NASDAQ Composite' },
];

const COUNTRY_BY_CODE: Record<string, CountryDetails> = Object.fromEntries(COUNTRIES.map((c) => [c.code, c]));

export function getCountryDetails(code: string): CountryDetails {
  return COUNTRY_BY_CODE[code.toUpperCase()] ?? COUNTRY_BY_CODE[DEFAULT_COUNTRY_CODE];
}
