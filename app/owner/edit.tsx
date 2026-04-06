import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db, isFirebaseReady } from '@/firebaseConfig.js';
import { useBusinessOwner } from '@/lib/businessOwner';
import { clearEstablishmentsCache } from '@/lib/establishmentsRepository';
import type { EstablishmentType, HappyHourDeal } from '@/types/establishmentType';
import { SCREEN_BACKGROUND, BRAND_GREEN } from '@/constants/theme';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function computeDotwFromDeals(deals: HappyHourDeal[]): string[] {
    const s = new Set<string>();
    for (const d of deals) {
        for (const day of d.deal_list) {
            if (WEEKDAYS.includes(day)) s.add(day);
        }
    }
    return WEEKDAYS.filter((d) => s.has(d));
}

function parseCommaList(s: string): string[] {
    return s
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
}

function normalizeDayToken(raw: string): string {
    const t = raw.trim();
    if (!t) return '';
    const m = WEEKDAYS.find((d) => d.toLowerCase() === t.toLowerCase());
    return m ?? t;
}

function emptyDeal(): HappyHourDeal {
    return {
        day: '',
        details: '',
        start_time: '16:00',
        end_time: '18:00',
        deal_list: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    };
}

export default function OwnerEditScreen() {
    const router = useRouter();
    const { profile, loading: ownerLoading, isOwner } = useBusinessOwner();
    const establishmentId = profile?.establishmentId ?? '';

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState('');
    const [description, setDescription] = useState('');
    const [cuisine, setCuisine] = useState('');
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [rating, setRating] = useState('');
    const [categoryStr, setCategoryStr] = useState('');
    const [deals, setDeals] = useState<HappyHourDeal[]>([]);

    const load = useCallback(async () => {
        if (!isFirebaseReady() || !db || !establishmentId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const ref = doc(db, 'establishments', establishmentId);
            const snap = await getDoc(ref);
            if (!snap.exists()) {
                Alert.alert('Not found', 'This listing could not be loaded.');
                router.back();
                return;
            }
            const raw = snap.data() as Record<string, unknown>;
            const row = {
                id: snap.id,
                ...raw,
            } as EstablishmentType;
            setImage(String(row.image ?? ''));
            setDescription(String(row.description ?? ''));
            setCuisine(String(row.cuisine ?? ''));
            setLocation(String(row.location ?? ''));
            setLatitude(String(row.latitude ?? ''));
            setLongitude(String(row.longitude ?? ''));
            setRating(String(row.rating ?? ''));
            setCategoryStr(Array.isArray(row.category) ? row.category.join(', ') : '');
            const hh = row.happy_hour_deals;
            setDeals(Array.isArray(hh) && hh.length > 0 ? hh.map((d) => ({ ...d })) : [emptyDeal()]);
        } catch (e) {
            console.error(e);
            Alert.alert('Error', 'Failed to load your listing.');
        } finally {
            setLoading(false);
        }
    }, [establishmentId, router]);

    useEffect(() => {
        if (!ownerLoading && isOwner && establishmentId) {
            load();
        } else if (!ownerLoading && !isOwner) {
            setLoading(false);
        }
    }, [ownerLoading, isOwner, establishmentId, load]);

    const updateDeal = (index: number, patch: Partial<HappyHourDeal>) => {
        setDeals((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    const removeDeal = (index: number) => {
        setDeals((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
    };

    const addDeal = () => {
        setDeals((prev) => [...prev, emptyDeal()]);
    };

    const handleSave = async () => {
        if (!db || !establishmentId) return;
        const lat = parseFloat(latitude);
        const lng = parseFloat(longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
            Alert.alert('Coordinates', 'Enter valid latitude and longitude numbers.');
            return;
        }
        const category = parseCommaList(categoryStr);
        const normalizedDeals: HappyHourDeal[] = deals.map((d) => ({
            day: d.day.trim(),
            details: d.details.trim(),
            start_time: d.start_time.trim(),
            end_time: d.end_time.trim(),
            deal_list: d.deal_list.filter(Boolean),
        }));
        setSaving(true);
        try {
            const ref = doc(db, 'establishments', establishmentId);
            await updateDoc(ref, {
                image: image.trim(),
                description: description.trim(),
                cuisine: cuisine.trim(),
                location: location.trim(),
                latitude: String(lat),
                longitude: String(lng),
                rating: rating.trim(),
                category,
                happy_hour_deals: normalizedDeals,
                dotw: computeDotwFromDeals(normalizedDeals),
                updated_at: serverTimestamp(),
            });
            await clearEstablishmentsCache();
            Alert.alert('Saved', 'Your listing was updated.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (e: unknown) {
            const err = e as { message?: string };
            console.error(e);
            Alert.alert('Error', err.message ?? 'Could not save changes.');
        } finally {
            setSaving(false);
        }
    };

    if (ownerLoading || loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={BRAND_GREEN} />
            </View>
        );
    }

    if (!isOwner) {
        return (
            <View style={styles.container}>
                <Text style={styles.warn}>You do not have access to edit a listing.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Photo URL</Text>
            <TextInput
                style={styles.input}
                value={image}
                onChangeText={setImage}
                placeholder="https://..."
                placeholderTextColor="#888"
                autoCapitalize="none"
                autoCorrect={false}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.multiline]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your spot"
                placeholderTextColor="#888"
                multiline
            />

            <Text style={styles.label}>Cuisine</Text>
            <TextInput style={styles.input} value={cuisine} onChangeText={setCuisine} placeholderTextColor="#888" />

            <Text style={styles.label}>Address</Text>
            <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholderTextColor="#888" />

            <Text style={styles.label}>Latitude / Longitude</Text>
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, styles.half]}
                    value={latitude}
                    onChangeText={setLatitude}
                    keyboardType="numbers-and-punctuation"
                    placeholderTextColor="#888"
                />
                <TextInput
                    style={[styles.input, styles.half]}
                    value={longitude}
                    onChangeText={setLongitude}
                    keyboardType="numbers-and-punctuation"
                    placeholderTextColor="#888"
                />
            </View>

            <Text style={styles.label}>Rating (display)</Text>
            <TextInput style={styles.input} value={rating} onChangeText={setRating} placeholderTextColor="#888" />

            <Text style={styles.label}>Categories (comma-separated)</Text>
            <TextInput
                style={styles.input}
                value={categoryStr}
                onChangeText={setCategoryStr}
                placeholder="Drinks, Meals"
                placeholderTextColor="#888"
            />

            <Text style={styles.section}>Happy hour deals</Text>
            <Text style={styles.helper}>Times use 24h format (e.g. 16:00–18:00). Days: full names, comma-separated.</Text>

            {deals.map((deal, index) => (
                <View key={index} style={styles.dealCard}>
                    <Text style={styles.dealTitle}>Deal {index + 1}</Text>
                    <Text style={styles.label}>Label (e.g. Mon–Fri)</Text>
                    <TextInput
                        style={styles.input}
                        value={deal.day}
                        onChangeText={(t) => updateDeal(index, { day: t })}
                        placeholderTextColor="#888"
                    />
                    <Text style={styles.label}>Details</Text>
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        value={deal.details}
                        onChangeText={(t) => updateDeal(index, { details: t })}
                        multiline
                        placeholderTextColor="#888"
                    />
                    <View style={styles.row}>
                        <View style={styles.half}>
                            <Text style={styles.label}>Start</Text>
                            <TextInput
                                style={styles.input}
                                value={deal.start_time}
                                onChangeText={(t) => updateDeal(index, { start_time: t })}
                                placeholder="16:00"
                                placeholderTextColor="#888"
                            />
                        </View>
                        <View style={styles.half}>
                            <Text style={styles.label}>End</Text>
                            <TextInput
                                style={styles.input}
                                value={deal.end_time}
                                onChangeText={(t) => updateDeal(index, { end_time: t })}
                                placeholder="18:00"
                                placeholderTextColor="#888"
                            />
                        </View>
                    </View>
                    <Text style={styles.label}>Active days (comma-separated)</Text>
                    <TextInput
                        style={styles.input}
                        value={deal.deal_list.join(', ')}
                        onChangeText={(t) =>
                            updateDeal(index, {
                                deal_list: parseCommaList(t).map(normalizeDayToken).filter(Boolean),
                            })
                        }
                        placeholder="Monday, Tuesday, Wednesday"
                        placeholderTextColor="#888"
                    />
                    {deals.length > 1 ? (
                        <TouchableOpacity onPress={() => removeDeal(index)} style={styles.removeBtn}>
                            <Text style={styles.removeText}>Remove deal</Text>
                        </TouchableOpacity>
                    ) : null}
                </View>
            ))}

            <TouchableOpacity style={styles.secondary} onPress={addDeal}>
                <Text style={styles.secondaryText}>+ Add another deal</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[styles.save, saving && styles.saveDisabled]}
                onPress={handleSave}
                disabled={saving}
            >
                {saving ? (
                    <ActivityIndicator color="#fff" />
                ) : (
                    <Text style={styles.saveText}>Save changes</Text>
                )}
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    scroll: {
        flex: 1,
        backgroundColor: SCREEN_BACKGROUND,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 48,
    },
    centered: {
        flex: 1,
        backgroundColor: SCREEN_BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        flex: 1,
        backgroundColor: SCREEN_BACKGROUND,
        padding: 20,
    },
    warn: {
        fontSize: 16,
        color: '#444',
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#555',
        marginBottom: 6,
        marginTop: 10,
    },
    section: {
        fontSize: 18,
        fontWeight: '700',
        color: BRAND_GREEN,
        marginTop: 20,
        marginBottom: 6,
    },
    helper: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
        lineHeight: 20,
    },
    input: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#111',
    },
    multiline: {
        minHeight: 88,
        textAlignVertical: 'top',
    },
    row: {
        flexDirection: 'row',
        gap: 10,
    },
    half: {
        flex: 1,
    },
    dealCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 14,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#e5e5e5',
    },
    dealTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: BRAND_GREEN,
        marginBottom: 8,
    },
    removeBtn: {
        marginTop: 10,
        alignSelf: 'flex-start',
    },
    removeText: {
        color: '#a33',
        fontWeight: '600',
    },
    secondary: {
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 8,
    },
    secondaryText: {
        color: BRAND_GREEN,
        fontWeight: '700',
        fontSize: 16,
    },
    save: {
        backgroundColor: BRAND_GREEN,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 16,
    },
    saveDisabled: {
        opacity: 0.7,
    },
    saveText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
