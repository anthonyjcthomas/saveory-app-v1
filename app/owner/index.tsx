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

    return (
            <View style={styles.container}>
                <Text style={HEADING_HERO_TEXT}>Your listing</Text>
                <Text style={styles.estName}>{profile.establishmentId}</Text>
                <Text style={styles.hint}>Update happy hours, photos, and details visible in the app.</Text>

                <TouchableOpacity
                    style={styles.primary}
                    onPress={() => router.push('/owner/edit')}
                    activeOpacity={0.88}
                >
                    <Text style={styles.primaryText}>Edit deals &amp; details</Text>
                </TouchableOpacity>
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
    estName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111',
        marginBottom: 8,
    },
    hint: {
        fontSize: 15,
        color: '#555',
        marginBottom: 24,
        lineHeight: 22,
    },
    primary: {
        backgroundColor: BRAND_GREEN,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    primaryText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
});
