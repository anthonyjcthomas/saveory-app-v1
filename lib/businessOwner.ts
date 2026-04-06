import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseReady } from '../firebaseConfig.js';

/**
 * Maps a Firebase Auth UID to one Firestore `establishments` document ID.
 * Create `businessOwners/{uid}` in the console with field `establishmentId` = exact doc id (e.g. restaurant name).
 */
export type BusinessOwnerProfile = {
    establishmentId: string;
};

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
                const data = snap.data();
                const establishmentId = String(data?.establishmentId ?? '').trim();
                setProfile(establishmentId ? { establishmentId } : null);
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
        isOwner: !!profile?.establishmentId,
    };
}
