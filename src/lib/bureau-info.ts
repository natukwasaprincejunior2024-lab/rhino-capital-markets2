import type { BureauProfile } from '@/lib/bureau-api';

export const BUREAU_TIME_ZONE = 'Africa/Kampala';

export function bureauDisplayName(profile: BureauProfile): string {
  return profile.name.trim() || 'Your Forex Bureau';
}

export function bureauContactLine(profile: BureauProfile): string {
  return [profile.address.trim(), profile.phone.trim()].filter(Boolean).join(' · ');
}
