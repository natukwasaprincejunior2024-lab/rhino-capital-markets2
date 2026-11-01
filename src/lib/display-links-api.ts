import { supabase } from '@/lib/supabase';
import { toText } from '@/lib/db-parse';
import type { BureauProfile } from '@/lib/bureau-api';

export interface DisplayLink {
  token: string;
  createdAt: string;
  revokedAt: string | null;
}

export interface PublicBoardRate {
  symbol: string;
  buying: number;
  selling: number;
}

export interface PublicBoard {
  profile: BureauProfile;
  rates: PublicBoardRate[];
  updatedAt: string | null;
}

interface DisplayLinkDbRow {
  token: unknown;
  created_at: unknown;
  revoked_at: unknown;
}

const BOARD_PATH_PATTERN = /^\/display\/([0-9a-f-]{36})\/?$/i;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseLink(row: DisplayLinkDbRow): DisplayLink {
  return {
    token: toText(row.token),
    createdAt: toText(row.created_at),
    revokedAt: typeof row.revoked_at === 'string' ? row.revoked_at : null,
  };
}

export function getBoardTokenFromPath(pathname: string): string | null {
  const match = BOARD_PATH_PATTERN.exec(pathname);
  return match ? match[1] : null;
}

export function buildBoardUrl(token: string): string {
  return `${window.location.origin}/display/${token}`;
}

export async function fetchDisplayLinks(): Promise<DisplayLink[]> {
  const { data, error } = await supabase
    .from('display_links')
    .select('token, created_at, revoked_at')
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(parseLink);
}

export async function createDisplayLink(): Promise<DisplayLink> {
  const { data, error } = await supabase
    .from('display_links')
    .insert({})
    .select('token, created_at, revoked_at')
    .single();
  if (error) throw new Error(error.message);
  return parseLink(data);
}

export async function revokeDisplayLink(token: string): Promise<void> {
  const { error } = await supabase
    .from('display_links')
    .update({ revoked_at: new Date().toISOString() })
    .eq('token', token);
  if (error) throw new Error(error.message);
}

function parseBoard(body: unknown): PublicBoard {
  if (!body || typeof body !== 'object') throw new Error('The board returned an unexpected response.');
  const data = body as Record<string, unknown>;
  const profile = data.profile as Record<string, unknown> | undefined;
  if (!profile || !Array.isArray(data.rates)) throw new Error('The board returned an unexpected response.');

  const rates = data.rates.map((item) => {
    const row = item as Record<string, unknown>;
    if (typeof row.symbol !== 'string' || typeof row.buying !== 'number' || typeof row.selling !== 'number') {
      throw new Error('The board returned an unexpected response.');
    }
    return { symbol: row.symbol, buying: row.buying, selling: row.selling };
  });

  return {
    profile: {
      name: toText(profile.name),
      address: toText(profile.address),
      phone: toText(profile.phone),
    },
    rates,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : null,
  };
}

export async function fetchPublicBoard(token: string): Promise<PublicBoard> {
  if (!UUID_PATTERN.test(token)) throw new Error('This display link is not valid.');
  const url = new URL(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/display-board`);
  url.searchParams.set('token', token);

  const response = await fetch(url.toString());
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(response.status === 404 ? 'This display link is no longer active.' : 'The board could not be loaded.');
  }
  return parseBoard(body);
}
