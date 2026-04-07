import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useBusinessOwner } from '@/lib/businessOwner';
import { SCREEN_BACKGROUND, BRAND_GREEN, HEADING_HERO_TEXT } from '@/constants/theme';

export default function OwnerPortalScreen() {
    const router = useRouter();
    const { profile, loading, isOwner } = useBusinessOwner();

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={BRAND_GREEN} />
            </View>
        );
    }

    if (!isOwner || !profile) {
        return (
            <View style={styles.container}>
                <Text style={styles.title}>No business access</Text>
                <Text style={styles.body}>
                    This account is not linked to a restaurant yet. Contact Saveory support to connect your
                    listing to your login.
                </Text>
            </View>
        );
    }

    const ids = profile.establishmentIds;

    return (
        <View style={styles.container}>
            <Text style={HEADING_HERO_TEXT}>{ids.length > 1 ? 'Your listings' : 'Your listing'}</Text>
            <Text style={styles.hint}>
                Update happy hours, photos, and details for each venue below.
            </Text>

            {ids.map((estId) => (
                <TouchableOpacity
                    key={estId}
                    style={styles.venueRow}
                    onPress={() =>
                        router.push({
                            pathname: '/owner/edit',
                            params: { establishmentId: estId },
                        })
                    }
                    activeOpacity={0.88}
                >
                    <Text style={styles.venueName} numberOfLines={2}>
                        {estId}
                    </Text>
                    <Text style={styles.venueCta}>Edit deals &amp; details →</Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BACKGROUND,
        padding: 20,
    },
    centered: {
        flex: 1,
        backgroundColor: SCREEN_BACKGROUND,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: BRAND_GREEN,
        marginBottom: 12,
    },
    body: {
        fontSize: 16,
        color: '#444',
        lineHeight: 22,
    },
    hint: {
        fontSize: 15,
        color: '#555',
        marginBottom: 16,
        lineHeight: 22,
    },
    venueRow: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    venueName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#111',
        marginBottom: 8,
    },
    venueCta: {
        fontSize: 15,
        fontWeight: '600',
        color: BRAND_GREEN,
    },
});
