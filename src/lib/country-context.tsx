import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getCountryDetails, type CountryDetails } from '@/lib/countries';
import { detectCountry, getStoredCountryCode, initialCountryCode, storeCountryCode } from '@/lib/geo';

interface CountryContextValue {
  country: CountryDetails;
  setCountryCode: (code: string) => void;
}

const CountryContext = createContext<CountryContextValue | null>(null);

export function CountryProvider({ children }: { children: ReactNode }) {
  const [code, setCode] = useState(initialCountryCode);

  useEffect(() => {
    if (getStoredCountryCode()) return;
    let cancelled = false;
    void detectCountry().then((detected) => {
      if (cancelled || !detected) return;
      storeCountryCode(detected);
      setCode(detected);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CountryContextValue>(
    () => ({
      country: getCountryDetails(code),
      setCountryCode: (next) => {
        storeCountryCode(next);
        setCode(next);
      },
    }),
    [code]
  );

  return <CountryContext.Provider value={value}>{children}</CountryContext.Provider>;
}

export function useCountry(): CountryContextValue {
  const value = useContext(CountryContext);
  if (!value) throw new Error('useCountry must be used inside CountryProvider');
  return value;
}
