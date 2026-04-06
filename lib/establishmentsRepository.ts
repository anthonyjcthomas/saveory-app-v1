import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, query, type Timestamp } from 'firebase/firestore';
import { db, isFirebaseReady } from '../firebaseConfig.js';
import type { EstablishmentType, HappyHourDeal } from '@/types/establishmentType';

const CACHE_KEY = 'saveory_establishments_cache_v1';

export type EstablishmentsCachePayload = {
    version: 1;
    /** Max of per-doc `updated_at` in ms; 0 if timestamps missing. */
    maxUpdatedAtMs: number;
    /** Stable content fingerprint for invalidation when timestamps are absent. */
    fingerprint: string;
    establishments: EstablishmentType[];
    cachedAtMs: number;
};

function timestampToMs(value: unknown): number {
    if (value == null) return 0;
    if (
        typeof value === 'object' &&
        value !== null &&
        'toMillis' in value &&
        typeof (value as Timestamp).toMillis === 'function'
    ) {
        return (value as Timestamp).toMillis();
    }
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return 0;
}

function normalizeHappyHourDeals(raw: unknown): HappyHourDeal[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((d: Record<string, unknown>) => ({
        day: String(d?.day ?? ''),
        details: String(d?.details ?? ''),
        start_time: String(d?.start_time ?? ''),
        end_time: String(d?.end_time ?? ''),
        deal_list: Array.isArray(d?.deal_list) ? (d.deal_list as unknown[]).map((x) => String(x)) : [],
    }));
}

/**
 * Maps a Firestore `establishments` document to `EstablishmentType`.
 * Keeps V1 field shapes; strips non-JSON Firestore types.
 */
export function normalizeFirestoreEstablishment(docId: string, data: Record<string, unknown>): EstablishmentType {
    const cat = data.category;
    const category = Array.isArray(cat)
        ? (cat as unknown[]).map(String)
        : typeof cat === 'string'
          ? [cat]
          : [];
    const dotwRaw = data.dotw;
    const dotw = Array.isArray(dotwRaw) ? (dotwRaw as unknown[]).map(String) : [];

    const ua = timestampToMs(data.updated_at);
    const base: EstablishmentType = {
        id: docId,
        name: String(data.name ?? ''),
        image: String(data.image ?? ''),
        description: String(data.description ?? ''),
        rating: String(data.rating ?? ''),
        location: String(data.location ?? ''),
        happy_hour_deals: normalizeHappyHourDeals(data.happy_hour_deals),
        latitude: String(data.latitude ?? ''),
        longitude: String(data.longitude ?? ''),
        category,
        dotw,
        cuisine: String(data.cuisine ?? ''),
    };
    if (ua > 0) {
        return { ...base, updated_at_ms: ua };
    }
    return base;
}

export function stableEstablishmentsFingerprint(list: EstablishmentType[]): string {
    return list
        .map((e) => {
            const deals = JSON.stringify(e.happy_hour_deals ?? []);
            return `${e.id}|${e.name}|${deals}|${e.latitude}|${e.longitude}|${e.image}`;
        })
        .sort()
        .join('\n');
}

export async function readEstablishmentsCache(): Promise<EstablishmentsCachePayload | null> {
    try {
        const raw = await AsyncStorage.getItem(CACHE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as EstablishmentsCachePayload;
        if (parsed.version !== 1 || !Array.isArray(parsed.establishments)) return null;
        return parsed;
    } catch {
        return null;
    }
}

async function writeEstablishmentsCache(payload: Omit<EstablishmentsCachePayload, 'cachedAtMs'>): Promise<void> {
    const full: EstablishmentsCachePayload = {
        ...payload,
        cachedAtMs: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(full));
}

export async function getCachedEstablishmentById(id: string): Promise<EstablishmentType | null> {
    const cached = await readEstablishmentsCache();
    if (!cached?.establishments?.length) return null;
    return cached.establishments.find((e) => e.id === id) ?? null;
}

export type FetchEstablishmentsResult = {
    establishments: EstablishmentType[];
    maxUpdatedAtMs: number;
    fingerprint: string;
};

/**
 * Full collection read from Firestore (normalized, JSON-safe).
 */
export async function fetchEstablishmentsFromFirestore(): Promise<FetchEstablishmentsResult> {
    if (!isFirebaseReady() || !db) {
        throw new Error('Firebase is not configured');
    }
    const snap = await getDocs(query(collection(db, 'establishments')));
    let maxUpdatedAtMs = 0;
    const establishments: EstablishmentType[] = [];
    for (const docSnap of snap.docs) {
        const data = docSnap.data() as Record<string, unknown>;
        const ua = timestampToMs(data.updated_at);
        if (ua > maxUpdatedAtMs) maxUpdatedAtMs = ua;
        establishments.push(normalizeFirestoreEstablishment(docSnap.id, data));
    }
    const fingerprint = stableEstablishmentsFingerprint(establishments);
    return { establishments, maxUpdatedAtMs, fingerprint };
}

export async function persistEstablishmentsCacheIfChanged(
    previous: EstablishmentsCachePayload | null,
    fresh: FetchEstablishmentsResult
): Promise<void> {
    const shouldWrite =
        !previous ||
        fresh.maxUpdatedAtMs > previous.maxUpdatedAtMs ||
        fresh.fingerprint !== previous.fingerprint ||
        fresh.establishments.length !== previous.establishments.length;

    if (!shouldWrite) return;

    await writeEstablishmentsCache({
        version: 1,
        maxUpdatedAtMs: Math.max(fresh.maxUpdatedAtMs, previous?.maxUpdatedAtMs ?? 0),
        fingerprint: fresh.fingerprint,
        establishments: fresh.establishments,
    });
}

function isValidLatLng(lat: number, lng: number): boolean {
    return (
        Number.isFinite(lat) &&
        Number.isFinite(lng) &&
        Math.abs(lat) <= 90 &&
        Math.abs(lng) <= 180
    );
}

/** Map tab (native `react-native-maps`) marker list from cached/Firestore rows. */
export function toNativeMapEstablishments(list: EstablishmentType[]): Array<{
    id: string;
    name: string;
    image: string;
    location: string;
    cuisine: string;
    coordinates: { latitude: number; longitude: number };
}> {
    const out: Array<{
        id: string;
        name: string;
        image: string;
        location: string;
        cuisine: string;
        coordinates: { latitude: number; longitude: number };
    }> = [];
    for (const e of list) {
        const lat = parseFloat(String(e.latitude));
        const lng = parseFloat(String(e.longitude));
        if (!isValidLatLng(lat, lng)) continue;
        out.push({
            id: e.id,
            name: e.name,
            image: e.image,
            location: e.location,
            cuisine: e.cuisine,
            coordinates: { latitude: lat, longitude: lng },
        });
    }
    return out;
}

/** Map tab (web Google Maps) pins from cached/Firestore rows. */
export function toWebMapEstablishments(list: EstablishmentType[]): Array<{
    id: string;
    name: string;
    image: string;
    location: string;
    cuisine: string;
    coordinates: { lat: number; lng: number };
}> {
    return toNativeMapEstablishments(list).map((e) => ({
        ...e,
        coordinates: { lat: e.coordinates.latitude, lng: e.coordinates.longitude },
    }));
}

/** Call after owner updates Firestore so the next read is fresh. */
export async function clearEstablishmentsCache(): Promise<void> {
    await AsyncStorage.removeItem(CACHE_KEY);
}
