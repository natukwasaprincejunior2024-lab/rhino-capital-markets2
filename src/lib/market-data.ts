import { getCountryDetails } from '@/lib/countries';

export type AssetClass = 'forex' | 'crypto' | 'stock' | 'commodities' | 'bonds' | 'etfs' | 'africa' | 'indices';

export const ASSET_CLASS_LABELS: Record<AssetClass, string> = {
  forex: 'Forex',
  crypto: 'Crypto',
  stock: 'Stock',
  commodities: 'Commodity',
  bonds: 'Bond',
  etfs: 'ETF',
  africa: 'Africa',
  indices: 'Index',
};
export type Timeframe = '1M' | '5M' | '15M' | '1H' | '4H' | '1D' | '1W' | '1M_TF';
export type ImpactLevel = 'low' | 'medium' | 'high';
export type TransactionType = 'buy' | 'sell';

export interface Instrument {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  flag: string;
  price: number;
  prevPrice: number;
  high: number;
  low: number;
  volume: number;
  decimals: number;
  spark: number[];
  currencyCode: string;
  spread: number;
  leverage: number;
  maxLeverage: number;
  buying: number;
  selling: number;
}

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface OrderLevel {
  price: number;
  size: number;
}

export interface OrderBook {
  bids: OrderLevel[];
  asks: OrderLevel[];
}

export interface News {
  id: string;
  title: string;
  source: string;
  time: number;
  impact: ImpactLevel;
  asset: string;
}

export interface EconomicEvent {
  id: string;
  time: number;
  country: string;
  event: string;
  impact: ImpactLevel;
  forecast: string;
  previous: string;
}

export interface Transaction {
  id: string;
  date: string;
  currency: string;
  amount: number;
  rate: number;
  total: number;
  type: TransactionType;
  customer: string;
}

export interface AuditLog {
  id: string;
  user: string;
  action: string;
  oldValue: string;
  newValue: string;
  time: string;
}

export interface TimeframeOption {
  value: Timeframe;
  label: string;
  seconds: number;
}

export interface DailyReportRow {
  symbol: string;
  name: string;
  flag: string;
  currencyCode: string;
  buying: number;
  selling: number;
  middle: number;
  changePct: number;
  high: number;
  low: number;
}

export interface DailyReport {
  date: string;
  rows: DailyReportRow[];
}

interface InstrumentSeed {
  symbol: string;
  name: string;
  assetClass: AssetClass;
  flag: string;
  price: number;
  changePct: number;
  decimals: number;
  currencyCode: string;
  spread: number;
  maxLeverage: number;
  volume: number;
  buying?: number;
  selling?: number;
}

const HOUR_MS = 3600000;

export const TIMEFRAMES: TimeframeOption[] = [
  { value: '1M', label: '1m', seconds: 60 },
  { value: '5M', label: '5m', seconds: 300 },
  { value: '15M', label: '15m', seconds: 900 },
  { value: '1H', label: '1H', seconds: 3600 },
  { value: '4H', label: '4H', seconds: 14400 },
  { value: '1D', label: '1D', seconds: 86400 },
  { value: '1W', label: '1W', seconds: 604800 },
  { value: '1M_TF', label: '1Mo', seconds: 2592000 },
];

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function round(value: number, decimals: number): number {
  return Number(value.toFixed(decimals));
}

function volatilityFor(assetClass: AssetClass): number {
  switch (assetClass) {
    case 'forex':
      return 0.00008;
    case 'bonds':
      return 0.0002;
    case 'africa':
      return 0.0004;
    default:
      return 0.0007;
  }
}

function buildSpark(from: number, to: number, key: string, points = 32): number[] {
  const rand = seededRandom(hashString(key));
  const amplitude = Math.abs(to - from) * 0.6 + Math.abs(to) * 0.0008;
  return Array.from({ length: points }, (_, i) => {
    if (i === 0) return from;
    if (i === points - 1) return to;
    const t = i / (points - 1);
    return from + (to - from) * t + (rand() - 0.5) * amplitude;
  });
}

function buildInstrument(seed: InstrumentSeed): Instrument {
  const { price, decimals, spread } = seed;
  const prevPrice = round(price / (1 + seed.changePct / 100), decimals);
  const range = Math.abs(price - prevPrice) + price * volatilityFor(seed.assetClass) * 12;
  return {
    symbol: seed.symbol,
    name: seed.name,
    assetClass: seed.assetClass,
    flag: seed.flag,
    price,
    prevPrice,
    high: round(Math.max(price, prevPrice) + range * 0.5, decimals),
    low: round(Math.min(price, prevPrice) - range * 0.5, decimals),
    volume: seed.volume,
    decimals,
    spark: buildSpark(prevPrice, price, seed.symbol).map((v) => round(v, decimals)),
    currencyCode: seed.currencyCode,
    spread,
    leverage: seed.maxLeverage,
    maxLeverage: seed.maxLeverage,
    buying: round(seed.buying ?? price - spread / 2, decimals),
    selling: round(seed.selling ?? price + spread / 2, decimals),
  };
}

export const INSTRUMENTS: Instrument[] = [
  buildInstrument({ symbol: 'USD/UGX', name: 'Ugandan Shilling', assetClass: 'africa', flag: '🇺🇬', price: 3720.5, changePct: 0.45, decimals: 2, currencyCode: 'UGX', spread: 15, maxLeverage: 100, volume: 12400000, buying: 3710, selling: 3740 }),
  buildInstrument({ symbol: 'USD/KES', name: 'Kenyan Shilling', assetClass: 'africa', flag: '🇰🇪', price: 129.45, changePct: -0.12, decimals: 2, currencyCode: 'KES', spread: 3, maxLeverage: 100, volume: 8300000, buying: 128, selling: 131 }),
  buildInstrument({ symbol: 'USD/NGN', name: 'Nigerian Naira', assetClass: 'africa', flag: '🇳🇬', price: 1620.75, changePct: 0.82, decimals: 2, currencyCode: 'NGN', spread: 10, maxLeverage: 50, volume: 6100000 }),
  buildInstrument({ symbol: 'USD/ZAR', name: 'South African Rand', assetClass: 'africa', flag: '🇿🇦', price: 18.65, changePct: -0.31, decimals: 4, currencyCode: 'ZAR', spread: 0.05, maxLeverage: 50, volume: 4200000 }),
  buildInstrument({ symbol: 'USD/GHS', name: 'Ghanaian Cedi', assetClass: 'africa', flag: '🇬🇭', price: 15.2, changePct: 0.27, decimals: 4, currencyCode: 'GHS', spread: 0.05, maxLeverage: 50, volume: 1900000 }),
  buildInstrument({ symbol: 'USD/EGP', name: 'Egyptian Pound', assetClass: 'africa', flag: '🇪🇬', price: 50.85, changePct: 0.1, decimals: 2, currencyCode: 'EGP', spread: 0.1, maxLeverage: 50, volume: 2100000 }),
  buildInstrument({ symbol: 'USD/RWF', name: 'Rwandan Franc', assetClass: 'africa', flag: '🇷🇼', price: 1320.1, changePct: -0.05, decimals: 2, currencyCode: 'RWF', spread: 5, maxLeverage: 50, volume: 900000 }),
  buildInstrument({ symbol: 'USD/TZS', name: 'Tanzanian Shilling', assetClass: 'africa', flag: '🇹🇿', price: 2630, changePct: 0.18, decimals: 2, currencyCode: 'TZS', spread: 8, maxLeverage: 50, volume: 1500000 }),

  buildInstrument({ symbol: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'forex', flag: '🇪🇺', price: 1.0856, changePct: 0.12, decimals: 5, currencyCode: 'USD', spread: 0.00008, maxLeverage: 500, volume: 1200000000 }),
  buildInstrument({ symbol: 'GBP/USD', name: 'British Pound / US Dollar', assetClass: 'forex', flag: '🇬🇧', price: 1.2715, changePct: -0.34, decimals: 5, currencyCode: 'USD', spread: 0.00012, maxLeverage: 500, volume: 980000000 }),
  buildInstrument({ symbol: 'USD/JPY', name: 'US Dollar / Japanese Yen', assetClass: 'forex', flag: '🇯🇵', price: 151.26, changePct: 0.3, decimals: 3, currencyCode: 'JPY', spread: 0.012, maxLeverage: 500, volume: 870000000 }),
  buildInstrument({ symbol: 'USD/CHF', name: 'US Dollar / Swiss Franc', assetClass: 'forex', flag: '🇨🇭', price: 0.8812, changePct: -0.09, decimals: 5, currencyCode: 'CHF', spread: 0.00015, maxLeverage: 500, volume: 310000000 }),
  buildInstrument({ symbol: 'AUD/USD', name: 'Australian Dollar / US Dollar', assetClass: 'forex', flag: '🇦🇺', price: 0.6588, changePct: 0.21, decimals: 5, currencyCode: 'USD', spread: 0.00012, maxLeverage: 500, volume: 340000000 }),
  buildInstrument({ symbol: 'USD/CAD', name: 'US Dollar / Canadian Dollar', assetClass: 'forex', flag: '🇨🇦', price: 1.3612, changePct: -0.14, decimals: 5, currencyCode: 'CAD', spread: 0.00014, maxLeverage: 500, volume: 290000000 }),

  buildInstrument({ symbol: 'BTC/USD', name: 'Bitcoin', assetClass: 'crypto', flag: '₿', price: 67234, changePct: 1.85, decimals: 2, currencyCode: 'USD', spread: 15, maxLeverage: 100, volume: 32000000000 }),
  buildInstrument({ symbol: 'ETH/USD', name: 'Ethereum', assetClass: 'crypto', flag: 'Ξ', price: 3421, changePct: 2.1, decimals: 2, currencyCode: 'USD', spread: 1.2, maxLeverage: 50, volume: 14000000000 }),
  buildInstrument({ symbol: 'SOL/USD', name: 'Solana', assetClass: 'crypto', flag: '◎', price: 145.2, changePct: 3.42, decimals: 2, currencyCode: 'USD', spread: 0.05, maxLeverage: 20, volume: 3200000000 }),

  buildInstrument({ symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stock', flag: '🇺🇸', price: 182.52, changePct: 0.64, decimals: 2, currencyCode: 'USD', spread: 0.02, maxLeverage: 20, volume: 58000000 }),
  buildInstrument({ symbol: 'MSFT', name: 'Microsoft Corp.', assetClass: 'stock', flag: '🇺🇸', price: 378.85, changePct: 0.41, decimals: 2, currencyCode: 'USD', spread: 0.03, maxLeverage: 20, volume: 22000000 }),
  buildInstrument({ symbol: 'NVDA', name: 'NVIDIA Corp.', assetClass: 'stock', flag: '🇺🇸', price: 875.3, changePct: 2.35, decimals: 2, currencyCode: 'USD', spread: 0.05, maxLeverage: 20, volume: 41000000 }),
  buildInstrument({ symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stock', flag: '🇺🇸', price: 248.5, changePct: -1.12, decimals: 2, currencyCode: 'USD', spread: 0.04, maxLeverage: 20, volume: 98000000 }),
  buildInstrument({ symbol: 'META', name: 'Meta Platforms', assetClass: 'stock', flag: '🇺🇸', price: 512.3, changePct: 0.88, decimals: 2, currencyCode: 'USD', spread: 0.04, maxLeverage: 20, volume: 15000000 }),
  buildInstrument({ symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'stock', flag: '🇺🇸', price: 171.4, changePct: 0.23, decimals: 2, currencyCode: 'USD', spread: 0.02, maxLeverage: 20, volume: 21000000 }),

  buildInstrument({ symbol: 'XAU/USD', name: 'Gold', assetClass: 'commodities', flag: '🪙', price: 2035.4, changePct: 0.52, decimals: 2, currencyCode: 'USD', spread: 0.3, maxLeverage: 200, volume: 210000 }),
  buildInstrument({ symbol: 'WTI/USD', name: 'Crude Oil (WTI)', assetClass: 'commodities', flag: '🛢️', price: 78.25, changePct: -0.66, decimals: 2, currencyCode: 'USD', spread: 0.03, maxLeverage: 100, volume: 460000 }),

  buildInstrument({ symbol: 'US10Y', name: 'US 10-Year Treasury Yield', assetClass: 'bonds', flag: '🇺🇸', price: 4.25, changePct: -0.8, decimals: 3, currencyCode: 'USD', spread: 0.005, maxLeverage: 10, volume: 5400000 }),

  buildInstrument({ symbol: 'SPY', name: 'SPDR S&P 500 ETF', assetClass: 'etfs', flag: '🇺🇸', price: 475.3, changePct: 0.37, decimals: 2, currencyCode: 'USD', spread: 0.02, maxLeverage: 20, volume: 61000000 }),
  buildInstrument({ symbol: 'QQQ', name: 'Invesco QQQ Trust', assetClass: 'etfs', flag: '🇺🇸', price: 408.6, changePct: 0.58, decimals: 2, currencyCode: 'USD', spread: 0.02, maxLeverage: 20, volume: 38000000 }),

  buildInstrument({ symbol: 'USD/PHP', name: 'Philippine Peso', assetClass: 'forex', flag: '🇵🇭', price: 58.25, changePct: 0.11, decimals: 2, currencyCode: 'PHP', spread: 0.15, maxLeverage: 100, volume: 45000000, buying: 58.15, selling: 58.35 }),
  buildInstrument({ symbol: 'USD/INR', name: 'Indian Rupee', assetClass: 'forex', flag: '🇮🇳', price: 83.5, changePct: 0.06, decimals: 2, currencyCode: 'INR', spread: 0.05, maxLeverage: 100, volume: 310000000 }),
  buildInstrument({ symbol: 'USD/AUD', name: 'US Dollar / Australian Dollar', assetClass: 'forex', flag: '🇦🇺', price: 1.52, changePct: -0.18, decimals: 4, currencyCode: 'AUD', spread: 0.0005, maxLeverage: 500, volume: 180000000 }),
  buildInstrument({ symbol: 'USD/AED', name: 'UAE Dirham', assetClass: 'forex', flag: '🇦🇪', price: 3.67, changePct: 0, decimals: 4, currencyCode: 'AED', spread: 0.0002, maxLeverage: 100, volume: 40000000 }),
  buildInstrument({ symbol: 'USD/BRL', name: 'Brazilian Real', assetClass: 'forex', flag: '🇧🇷', price: 5.2, changePct: 0.42, decimals: 4, currencyCode: 'BRL', spread: 0.005, maxLeverage: 100, volume: 62000000 }),
  buildInstrument({ symbol: 'USD/PKR', name: 'Pakistani Rupee', assetClass: 'forex', flag: '🇵🇰', price: 278.5, changePct: 0.15, decimals: 2, currencyCode: 'PKR', spread: 0.2, maxLeverage: 50, volume: 9000000 }),
  buildInstrument({ symbol: 'USD/BDT', name: 'Bangladeshi Taka', assetClass: 'forex', flag: '🇧🇩', price: 117, changePct: 0.09, decimals: 2, currencyCode: 'BDT', spread: 0.2, maxLeverage: 50, volume: 5200000 }),
  buildInstrument({ symbol: 'USD/IDR', name: 'Indonesian Rupiah', assetClass: 'forex', flag: '🇮🇩', price: 16200, changePct: 0.22, decimals: 2, currencyCode: 'IDR', spread: 15, maxLeverage: 100, volume: 74000000 }),
  buildInstrument({ symbol: 'USD/THB', name: 'Thai Baht', assetClass: 'forex', flag: '🇹🇭', price: 36.5, changePct: -0.08, decimals: 2, currencyCode: 'THB', spread: 0.02, maxLeverage: 100, volume: 28000000 }),
  buildInstrument({ symbol: 'USD/MYR', name: 'Malaysian Ringgit', assetClass: 'forex', flag: '🇲🇾', price: 4.7, changePct: 0.12, decimals: 4, currencyCode: 'MYR', spread: 0.002, maxLeverage: 100, volume: 21000000 }),
  buildInstrument({ symbol: 'USD/SGD', name: 'Singapore Dollar', assetClass: 'forex', flag: '🇸🇬', price: 1.32, changePct: -0.05, decimals: 4, currencyCode: 'SGD', spread: 0.0003, maxLeverage: 100, volume: 36000000 }),
  buildInstrument({ symbol: 'USD/MXN', name: 'Mexican Peso', assetClass: 'forex', flag: '🇲🇽', price: 17.2, changePct: 0.38, decimals: 4, currencyCode: 'MXN', spread: 0.004, maxLeverage: 100, volume: 52000000 }),
  buildInstrument({ symbol: 'NZD/USD', name: 'New Zealand Dollar / US Dollar', assetClass: 'forex', flag: '🇳🇿', price: 0.6105, changePct: 0.19, decimals: 5, currencyCode: 'NZD', spread: 0.00012, maxLeverage: 500, volume: 95000000 }),
  buildInstrument({ symbol: 'USD/TRY', name: 'Turkish Lira', assetClass: 'forex', flag: '🇹🇷', price: 32.1, changePct: 0.7, decimals: 4, currencyCode: 'TRY', spread: 0.02, maxLeverage: 50, volume: 33000000 }),
  buildInstrument({ symbol: 'USD/ZMW', name: 'Zambian Kwacha', assetClass: 'africa', flag: '🇿🇲', price: 26.4, changePct: 0.31, decimals: 4, currencyCode: 'ZMW', spread: 0.05, maxLeverage: 50, volume: 1100000 }),
  buildInstrument({ symbol: 'USD/ETB', name: 'Ethiopian Birr', assetClass: 'africa', flag: '🇪🇹', price: 56.2, changePct: 0.25, decimals: 2, currencyCode: 'ETB', spread: 0.1, maxLeverage: 50, volume: 800000 }),

  buildInstrument({ symbol: 'MTNU', name: 'MTN Uganda', assetClass: 'stock', flag: '🇺🇬', price: 1720, changePct: 0.58, decimals: 0, currencyCode: 'UGX', spread: 5, maxLeverage: 20, volume: 2400000 }),
  buildInstrument({ symbol: 'MTNN', name: 'MTN Nigeria', assetClass: 'stock', flag: '🇳🇬', price: 240, changePct: 1.27, decimals: 2, currencyCode: 'NGN', spread: 0.2, maxLeverage: 20, volume: 6800000 }),
  buildInstrument({ symbol: 'SCOM', name: 'Safaricom', assetClass: 'stock', flag: '🇰🇪', price: 19, changePct: -0.52, decimals: 2, currencyCode: 'KES', spread: 0.05, maxLeverage: 20, volume: 9100000 }),
  buildInstrument({ symbol: 'AAF', name: 'Airtel Africa', assetClass: 'stock', flag: '🇬🇧', price: 120, changePct: 0.84, decimals: 2, currencyCode: 'GBX', spread: 0.1, maxLeverage: 20, volume: 3300000 }),

  buildInstrument({ symbol: 'NASDAQ Composite', name: 'NASDAQ Composite', assetClass: 'indices', flag: '🇺🇸', price: 16500, changePct: 0.74, decimals: 2, currencyCode: 'USD', spread: 1, maxLeverage: 20, volume: 5200000000 }),
  buildInstrument({ symbol: 'ASX 200', name: 'S&P/ASX 200', assetClass: 'indices', flag: '🇦🇺', price: 7600, changePct: 0.31, decimals: 2, currencyCode: 'AUD', spread: 1, maxLeverage: 20, volume: 980000000 }),
  buildInstrument({ symbol: 'Nifty 50', name: 'NIFTY 50', assetClass: 'indices', flag: '🇮🇳', price: 22100, changePct: 0.45, decimals: 2, currencyCode: 'INR', spread: 2, maxLeverage: 20, volume: 720000000 }),
  buildInstrument({ symbol: 'PSEi', name: 'Philippine Stock Exchange Index', assetClass: 'indices', flag: '🇵🇭', price: 6850, changePct: -0.21, decimals: 2, currencyCode: 'PHP', spread: 1, maxLeverage: 20, volume: 210000000 }),
  buildInstrument({ symbol: 'USE ALSI', name: 'Uganda Securities Exchange All-Share', assetClass: 'indices', flag: '🇺🇬', price: 2000, changePct: 0.12, decimals: 2, currencyCode: 'UGX', spread: 1, maxLeverage: 10, volume: 1800000 }),
  buildInstrument({ symbol: 'NSE 20', name: 'Nairobi Securities Exchange 20', assetClass: 'indices', flag: '🇰🇪', price: 150, changePct: -0.36, decimals: 2, currencyCode: 'KES', spread: 0.2, maxLeverage: 10, volume: 3500000 }),
  buildInstrument({ symbol: 'DFM', name: 'Dubai Financial Market General', assetClass: 'indices', flag: '🇦🇪', price: 4000, changePct: 0.27, decimals: 2, currencyCode: 'AED', spread: 1, maxLeverage: 10, volume: 430000000 }),
  buildInstrument({ symbol: 'Bovespa', name: 'Ibovespa', assetClass: 'indices', flag: '🇧🇷', price: 128000, changePct: 0.63, decimals: 0, currencyCode: 'BRL', spread: 10, maxLeverage: 20, volume: 16000000000 }),
  buildInstrument({ symbol: 'TSX', name: 'S&P/TSX Composite', assetClass: 'indices', flag: '🇨🇦', price: 21500, changePct: 0.18, decimals: 2, currencyCode: 'CAD', spread: 2, maxLeverage: 20, volume: 410000000 }),
  buildInstrument({ symbol: 'FTSE 100', name: 'FTSE 100', assetClass: 'indices', flag: '🇬🇧', price: 7700, changePct: 0.22, decimals: 2, currencyCode: 'GBP', spread: 1, maxLeverage: 20, volume: 860000000 }),
  buildInstrument({ symbol: 'DAX', name: 'DAX Performance Index', assetClass: 'indices', flag: '🇩🇪', price: 17500, changePct: 0.4, decimals: 2, currencyCode: 'EUR', spread: 2, maxLeverage: 20, volume: 290000000 }),
  buildInstrument({ symbol: 'Nikkei 225', name: 'Nikkei 225', assetClass: 'indices', flag: '🇯🇵', price: 39000, changePct: 0.52, decimals: 0, currencyCode: 'JPY', spread: 5, maxLeverage: 20, volume: 2100000000 }),
];

const EXTRA_COUNTRY_SYMBOLS: Partial<Record<string, string[]>> = {
  UG: ['MTNU'],
  NG: ['MTNN'],
  KE: ['SCOM'],
  GB: ['AAF'],
};

export const INSTRUMENTS_BY_SYMBOL: Record<string, Instrument> = Object.fromEntries(
  INSTRUMENTS.map((i) => [i.symbol, i])
);

export function getInstrumentsByClass(assetClass: AssetClass): Instrument[] {
  return INSTRUMENTS.filter((i) => i.assetClass === assetClass);
}

export function getInstrumentsForCountry(code: string): Instrument[] {
  const country = getCountryDetails(code);
  const symbols = [
    country.forexPair,
    country.marketIndex,
    ...(EXTRA_COUNTRY_SYMBOLS[country.code] ?? []),
    'NASDAQ Composite',
  ];
  return [...new Set(symbols)]
    .map((symbol) => (symbol ? INSTRUMENTS_BY_SYMBOL[symbol] : undefined))
    .filter((i): i is Instrument => Boolean(i));
}

export function getCurrencyForCountry(code: string): string {
  return getCountryDetails(code).currency;
}

export function formatCurrencyForCountry(amount: number, code: string): string {
  return formatCurrency(amount, getCurrencyForCountry(code));
}

export function searchInstruments(list: Instrument[], query: string): Instrument[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    (i) =>
      i.symbol.toLowerCase().includes(q) ||
      i.name.toLowerCase().includes(q) ||
      i.currencyCode.toLowerCase().includes(q)
  );
}

export function changePercent(price: number, prevPrice: number): number {
  return prevPrice === 0 ? 0 : ((price - prevPrice) / prevPrice) * 100;
}

export function formatPrice(value: number, decimals: number): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatCompact(value: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(value);
}

export function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function tickInstrument(inst: Instrument): Instrument {
  const drift = inst.price * volatilityFor(inst.assetClass) * (Math.random() * 2 - 1);
  const price = round(inst.price + drift, inst.decimals);
  const delta = price - inst.price;
  return {
    ...inst,
    price,
    high: Math.max(inst.high, price),
    low: Math.min(inst.low, price),
    volume: inst.volume + Math.round(Math.random() * inst.volume * 0.0005),
    buying: round(inst.buying + delta, inst.decimals),
    selling: round(inst.selling + delta, inst.decimals),
    spark: [...inst.spark.slice(1), price],
  };
}

export function buildCandles(inst: Instrument, tf: Timeframe, count = 120): Candle[] {
  const seconds = TIMEFRAMES.find((t) => t.value === tf)?.seconds ?? 3600;
  const rand = seededRandom(hashString(`${inst.symbol}:${tf}`));
  const vol = inst.price * 0.0025;
  const now = Math.floor(Date.now() / 1000);
  const candles: Candle[] = [];
  let prev = inst.price * 0.98;
  for (let i = 0; i < count; i++) {
    const open = prev;
    const close = open + (rand() - 0.5) * vol * 2;
    const high = Math.max(open, close) + rand() * vol * 0.5;
    const low = Math.min(open, close) - rand() * vol * 0.5;
    const volume = Math.round(1000 + rand() * 9000);
    candles.push({ time: now - (count - i) * seconds, open, high, low, close, volume });
    prev = close;
  }
  const last = candles[count - 1];
  last.close = inst.price;
  last.high = Math.max(last.high, inst.price);
  last.low = Math.min(last.low, inst.price);
  return candles;
}

export function computeFearGreed(instruments: Instrument[]): number {
  if (instruments.length === 0) return 50;
  const avg =
    instruments.reduce((sum, i) => sum + changePercent(i.price, i.prevPrice), 0) / instruments.length;
  return Math.round(Math.min(100, Math.max(0, 50 + avg * 12.5)));
}

export function fearGreedLabel(score: number): string {
  if (score < 25) return 'Extreme Fear';
  if (score < 45) return 'Fear';
  if (score < 55) return 'Neutral';
  if (score < 75) return 'Greed';
  return 'Extreme Greed';
}

export function fearGreedColor(score: number): string {
  if (score < 45) return '#ef4444';
  if (score < 55) return '#f59e0b';
  return '#22c55e';
}

export function generateOrderBook(inst: Instrument, levels = 8): OrderBook {
  const step = inst.spread || inst.price * 0.0001;
  const bids: OrderLevel[] = [];
  const asks: OrderLevel[] = [];
  for (let i = 0; i < levels; i++) {
    bids.push({ price: round(inst.buying - i * step, inst.decimals), size: round(Math.random() * 9 + 1, 2) });
    asks.push({ price: round(inst.selling + i * step, inst.decimals), size: round(Math.random() * 9 + 1, 2) });
  }
  return { bids, asks };
}

export function calculateEMA(values: number[], period: number): number[] {
  const k = 2 / (period + 1);
  const out: number[] = [];
  let ema = NaN;
  values.forEach((v, i) => {
    if (i < period - 1) {
      out.push(NaN);
      return;
    }
    if (i === period - 1) {
      ema = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
    } else {
      ema = v * k + ema * (1 - k);
    }
    out.push(ema);
  });
  return out;
}

export function calculateRSI(closes: number[], period = 14): number[] {
  const out: number[] = closes.map(() => NaN);
  if (closes.length <= period) return out;
  let gain = 0;
  let loss = 0;
  for (let i = 1; i <= period; i++) {
    const d = closes[i] - closes[i - 1];
    if (d >= 0) gain += d;
    else loss -= d;
  }
  gain /= period;
  loss /= period;
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  for (let i = period + 1; i < closes.length; i++) {
    const d = closes[i] - closes[i - 1];
    gain = (gain * (period - 1) + Math.max(d, 0)) / period;
    loss = (loss * (period - 1) + Math.max(-d, 0)) / period;
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  }
  return out;
}

export function calculateMACD(closes: number[], fast = 12, slow = 26, signalPeriod = 9) {
  const emaFast = calculateEMA(closes, fast);
  const emaSlow = calculateEMA(closes, slow);
  const macd = closes.map((_, i) => emaFast[i] - emaSlow[i]);
  const signal: number[] = closes.map(() => NaN);
  const start = macd.findIndex((v) => !Number.isNaN(v));
  if (start >= 0) {
    calculateEMA(macd.slice(start), signalPeriod).forEach((v, i) => {
      signal[start + i] = v;
    });
  }
  const histogram = macd.map((v, i) => v - signal[i]);
  return { macd, signal, histogram };
}

export function calculateBollinger(closes: number[], period = 20, multiplier = 2) {
  const upper: number[] = [];
  const middle: number[] = [];
  const lower: number[] = [];
  closes.forEach((_, i) => {
    if (i < period - 1) {
      upper.push(NaN);
      middle.push(NaN);
      lower.push(NaN);
      return;
    }
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const sd = Math.sqrt(slice.reduce((a, v) => a + (v - mean) ** 2, 0) / period);
    middle.push(mean);
    upper.push(mean + multiplier * sd);
    lower.push(mean - multiplier * sd);
  });
  return { upper, middle, lower };
}

export function calculateSupportResistance(candles: Candle[], window = 3): { support: number[]; resistance: number[] } {
  const highs: number[] = [];
  const lows: number[] = [];
  for (let i = window; i < candles.length - window; i++) {
    const neighbourhood = candles.slice(i - window, i + window + 1);
    if (candles[i].high === Math.max(...neighbourhood.map((c) => c.high))) highs.push(candles[i].high);
    if (candles[i].low === Math.min(...neighbourhood.map((c) => c.low))) lows.push(candles[i].low);
  }
  const last = candles.length ? candles[candles.length - 1].close : 0;
  return {
    resistance: highs.filter((h) => h > last).sort((a, b) => a - b).slice(0, 3),
    support: lows.filter((l) => l < last).sort((a, b) => b - a).slice(0, 3),
  };
}

export function getEconomicCalendar(now = Date.now()): EconomicEvent[] {
  const scheduled: { event: string; country: string; impact: ImpactLevel; hours: number; forecast: string; previous: string }[] = [
    { event: 'US Non-Farm Payrolls', country: 'US', impact: 'high', hours: 2, forecast: '180K', previous: '175K' },
    { event: 'ECB Interest Rate Decision', country: 'EU', impact: 'high', hours: 6, forecast: '4.00%', previous: '4.00%' },
    { event: 'UK CPI y/y', country: 'GB', impact: 'medium', hours: 9, forecast: '3.2%', previous: '3.4%' },
    { event: 'Japan Trade Balance', country: 'JP', impact: 'low', hours: 14, forecast: '-0.8T', previous: '-0.6T' },
    { event: 'Bank of Uganda Rate Review', country: 'UG', impact: 'medium', hours: 26, forecast: '9.75%', previous: '9.75%' },
    { event: 'Kenya CPI m/m', country: 'KE', impact: 'low', hours: 30, forecast: '0.5%', previous: '0.4%' },
  ];
  return scheduled.map((e, i) => ({
    id: `event-${i}`,
    time: now + e.hours * HOUR_MS,
    country: e.country,
    event: e.event,
    impact: e.impact,
    forecast: e.forecast,
    previous: e.previous,
  }));
}

export function getMarketNews(now = Date.now()): News[] {
  const items: Omit<News, 'time'>[] = [
    { id: 'news-1', title: 'Dollar firms as traders trim rate-cut bets', source: 'Rhino Desk', impact: 'high', asset: 'EUR/USD' },
    { id: 'news-2', title: 'Gold holds near highs as demand from central banks persists', source: 'Rhino Desk', impact: 'medium', asset: 'XAU/USD' },
    { id: 'news-3', title: 'Shilling steadies in Kampala interbank trading', source: 'Rhino Desk', impact: 'low', asset: 'USD/UGX' },
    { id: 'news-4', title: 'Bitcoin extends gains as spot inflows continue', source: 'Rhino Desk', impact: 'high', asset: 'BTC/USD' },
  ];
  return items.map((n, i) => ({ ...n, time: now - (i + 1) * HOUR_MS }));
}

export function generateDailyReport(instruments: Instrument[], date = new Date()): DailyReport {
  return {
    date: date.toISOString().slice(0, 10),
    rows: instruments.map((i) => ({
      symbol: i.symbol,
      name: i.name,
      flag: i.flag,
      currencyCode: i.currencyCode,
      buying: i.buying,
      selling: i.selling,
      middle: round((i.buying + i.selling) / 2, i.decimals),
      changePct: changePercent(i.price, i.prevPrice),
      high: i.high,
      low: i.low,
    })),
  };
}

export function calculateTransaction(amount: number, inst: Instrument, type: TransactionType) {
  const rate = type === 'buy' ? inst.selling : inst.buying;
  return {
    rate,
    total: amount * rate,
    profit: (amount * (inst.selling - inst.buying)) / 2,
  };
}
