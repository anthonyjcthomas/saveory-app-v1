import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../firebaseConfig.js';

/**
 * Firestore `businessOwners/{uid}`:
 * - Preferred: `establishmentIds` (array of `establishments` document IDs, e.g. venue names).
 * - Legacy: single `establishmentId` (string) — still supported in app and rules.
 */
export type BusinessOwnerProfile = {
    establishmentIds: string[];
};

function normalizeOwnerEstablishmentIds(data: Record<string, unknown> | undefined): string[] {
    if (!data) return [];
    const multi = data.establishmentIds;
    if (Array.isArray(multi)) {
        const ids = multi.map((x) => String(x).trim()).filter(Boolean);
        return [...new Set(ids)];
    }
    const single = data.establishmentId;
    if (typeof single === 'string' && single.trim()) {
        return [single.trim()];
    }
    return [];
}

export function useBusinessOwner(): {
    profile: BusinessOwnerProfile | null;
    loading: boolean;
    isOwner: boolean;
} {
    const [profile, setProfile] = useState<BusinessOwnerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const uid = auth?.currentUser?.uid;
    const isAnon = auth?.currentUser?.isAnonymous ?? false;

    useEffect(() => {
        if (!isFirebaseReady() || !db || !uid || isAnon) {
            setProfile(null);
            setLoading(false);
            return;
        }

        const ref = doc(db, 'businessOwners', uid);
        const unsub = onSnapshot(
            ref,
            (snap) => {
                if (!snap.exists()) {
                    console.warn(
                        `[Saveory] businessOwners: no document at businessOwners/${uid}. Create it in the same Firebase project as the app.`
                    );
                    setProfile(null);
                    setLoading(false);
                    return;
                }
                const ids = normalizeOwnerEstablishmentIds(snap.data() as Record<string, unknown>);
                setProfile(ids.length ? { establishmentIds: ids } : null);
                setLoading(false);
            },
            (err) => {
                console.warn(
                    '[Saveory] businessOwners listener error:',
                    err?.code ?? err,
                    err?.message ?? ''
                );
                if (err?.code === 'permission-denied') {
                    console.warn(
                        '[Saveory] Firestore denied read on businessOwners. Deploy firestore.rules (firebase deploy --only firestore:rules) and ensure the document ID equals this signed-in UID exactly:',
                        uid
                    );
                }
                setProfile(null);
                setLoading(false);
            }
        );
        return () => unsub();
    }, [uid, isAnon]);

    return {
        profile,
        loading,
        isOwner: (profile?.establishmentIds?.length ?? 0) > 0,
    };
}
