import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    StyleSheet,
    Text,
    View,
    Image,
    TouchableOpacity,
    Linking,
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    Animated,
    Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Stack, useRouter } from 'expo-router';
import { TabHeaderLogo } from '@/components/TabHeaderLogo';
import { SettingsHeaderButton } from '@/components/SettingsHeaderButton';
import { HEADING_HERO_TEXT, SCREEN_BACKGROUND } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { query, collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebaseConfig.js';
import { requestTrackingPermissionsAsync } from '@/lib/trackingTransparency';
import { fetchDrivingRoute } from '@/lib/directionsRoute';
import { getCurrentPositionOrFallback } from '@/lib/location';

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

const REGION_DELTA = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 };
const LOCATE_ZOOM_DELTA = { latitudeDelta: 0.018, longitudeDelta: 0.014 };

type MapEstablishment = {
    id: string;
    name: string;
    image: string;
    location: string;
    cuisine: string;
    coordinates: { latitude: number; longitude: number };
};

function hasValidMarkerImage(uri: string | undefined): boolean {
    return !!uri?.trim() && /^https?:\/\//i.test(uri.trim());
}

function isValidCoordinate(lat: number, lng: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

async function loadEstablishmentsFromFirestore(): Promise<MapEstablishment[]> {
    const establishmentsRef = collection(db, 'establishments');
    const querySnapshot = await getDocs(query(establishmentsRef));
    const list: MapEstablishment[] = [];
    for (const docSnap of querySnapshot.docs) {
        const d = docSnap.data();
        const lat = parseFloat(String(d.latitude));
        const lng = parseFloat(String(d.longitude));
        if (!isValidCoordinate(lat, lng)) {
            console.warn(`Map: skip establishment ${docSnap.id} — invalid lat/lng`);
            continue;
        }
        list.push({
            id: docSnap.id,
            name: String(d.name ?? ''),
            image: String(d.image ?? ''),
            location: String(d.location ?? ''),
            cuisine: String(d.cuisine ?? ''),
            coordinates: { latitude: lat, longitude: lng },
        });
    }
    return list;
}

const SearchPage = () => {
    const router = useRouter();
    const mapRef = useRef<MapView | null>(null);
    const [currentLocation, setCurrentLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [selectedEstablishment, setSelectedEstablishment] = useState<string | null>(null);
    const [establishments, setEstablishments] = useState<MapEstablishment[]>([]);
    const [loading, setLoading] = useState(true);
    const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
    const [routeSteps, setRouteSteps] = useState<
        { instruction: string; distanceText: string; durationText: string }[]
    >([]);
    const [directionsModalVisible, setDirectionsModalVisible] = useState(false);
    const [directionsLoading, setDirectionsLoading] = useState(false);
    const [directionsDestinationName, setDirectionsDestinationName] = useState('');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const stepFade = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        let cancelled = false;

        const askForTrackingPermission = async () => {
            const { status } = await requestTrackingPermissionsAsync();
            if (status === 'granted') {
                console.log('Tracking permission granted.');
            }
        };

        (async () => {
            await askForTrackingPermission();
            try {
                const [location, establishmentsArray] = await Promise.all([
                    getCurrentPositionOrFallback(),
                    loadEstablishmentsFromFirestore(),
                ]);
                if (cancelled) return;
                if (location) {
                    setCurrentLocation(location.coords);
                }
                setEstablishments(establishmentsArray);
            } catch (e) {
                console.error('Error loading map data:', e);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!directionsModalVisible || routeSteps.length === 0) return;
        const id = setInterval(() => {
            setCurrentStepIndex((i) => (i + 1) % routeSteps.length);
        }, 5500);
        return () => clearInterval(id);
    }, [directionsModalVisible, routeSteps.length]);

    useEffect(() => {
        stepFade.setValue(0);
        Animated.timing(stepFade, {
            toValue: 1,
            duration: 380,
            useNativeDriver: true,
        }).start();
    }, [currentStepIndex, stepFade]);

    const closeDirectionsModal = useCallback(() => {
        setDirectionsModalVisible(false);
        setRouteCoords([]);
        setRouteSteps([]);
        setCurrentStepIndex(0);
    }, []);

    const goToMyLocation = useCallback(async () => {
        const location = await getCurrentPositionOrFallback();
        if (!location) {
            Alert.alert(
                'Location needed',
                'Allow location access for Saveory, turn on Location in system settings, and try again. On Android you may need to enable high-accuracy mode when prompted.'
            );
            return;
        }
        const coords = location.coords;
        setCurrentLocation(coords);
        mapRef.current?.animateToRegion(
            {
                latitude: coords.latitude,
                longitude: coords.longitude,
                ...LOCATE_ZOOM_DELTA,
            },
            450
        );
    }, []);

    const handleMarkerPress = (id: string) => {
        setSelectedEstablishment((prev) => {
            if (prev === id) {
                closeDirectionsModal();
                return null;
            }
            closeDirectionsModal();
            return id;
        });
    };

    const handleImagePress = (id: string) => {
        router.push(`/Establishments/${id}`);
    };

    const openMaps = (location: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        Linking.openURL(url);
    };

    const openDirections = useCallback(
        async (establishment: MapEstablishment) => {
            if (!currentLocation) {
                Alert.alert(
                    'Location needed',
                    'Allow location access so we can build a route from where you are.'
                );
                return;
            }
            if (!GOOGLE_KEY) {
                Alert.alert(
                    'API key',
                    'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY for in-app directions. Opening Maps instead.',
                    [{ text: 'OK', onPress: () => openMaps(establishment.location) }]
                );
                return;
            }
            setDirectionsLoading(true);
            setDirectionsDestinationName(establishment.name);
            try {
                const route = await fetchDrivingRoute(
                    {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                    },
                    establishment.coordinates,
                    GOOGLE_KEY
                );
                if (!route || route.coordinates.length < 2) {
                    Alert.alert(
                        'Directions',
                        'Could not load a driving route. Opening this place in Maps.',
                        [{ text: 'OK', onPress: () => openMaps(establishment.location) }]
                    );
                    return;
                }
                setRouteCoords(route.coordinates);
                setRouteSteps(route.steps);
                setCurrentStepIndex(0);
                setDirectionsModalVisible(true);
                setTimeout(() => {
                    mapRef.current?.fitToCoordinates(route.coordinates, {
                        edgePadding: { top: 72, right: 32, bottom: 300, left: 32 },
                        animated: true,
                    });
                }, 150);
            } catch (e) {
                console.error(e);
                Alert.alert('Directions', 'Something went wrong. Try again.');
            } finally {
                setDirectionsLoading(false);
            }
        },
        [currentLocation]
    );

    const renderExpandedView = (establishment: MapEstablishment) => (
        <View style={styles.expandedView}>
            <TouchableOpacity onPress={() => handleImagePress(establishment.id)} activeOpacity={0.85}>
                {hasValidMarkerImage(establishment.image) ? (
                    <Image
                        source={{ uri: establishment.image }}
                        style={styles.expandedImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.expandedImage, styles.expandedImagePlaceholder]}>
                        <Ionicons name="restaurant" size={40} color="#ffffff" />
                    </View>
                )}
            </TouchableOpacity>
            <View style={styles.expandedBody}>
                <TouchableOpacity onPress={() => handleImagePress(establishment.id)} activeOpacity={0.85}>
                    <Text style={styles.establishmentName}>{establishment.name}</Text>
                </TouchableOpacity>
                <Text style={styles.viewPlaceHint}>Tap photo or name to open</Text>
            </View>
            <View style={styles.expandedActionRow}>
                <View style={styles.expandedActionCell}>
                    <Ionicons name="restaurant" size={17} color="#264117" style={styles.expandedActionIcon} />
                    <View style={styles.expandedActionTextCol}>
                        <Text style={styles.expandedActionPrimary} numberOfLines={2}>
                            {establishment.cuisine || '—'}
                        </Text>
                        <Text style={styles.expandedActionSecondary}>Cuisine</Text>
                    </View>
                </View>
                <View style={styles.expandedActionDivider} />
                <TouchableOpacity
                    onPress={() => openDirections(establishment)}
                    style={styles.expandedActionCell}
                    disabled={directionsLoading}
                    activeOpacity={0.75}
                >
                    {directionsLoading ? (
                        <ActivityIndicator size="small" color="#264117" style={styles.expandedActionIcon} />
                    ) : (
                        <Ionicons name="navigate" size={17} color="#264117" style={styles.expandedActionIcon} />
                    )}
                    <View style={styles.expandedActionTextCol}>
                        <Text style={styles.expandedActionPrimary}>Directions</Text>
                        <Text style={styles.expandedActionSecondary}>Turn-by-turn</Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );

    const initialRegion = useMemo(
        () => ({
            latitude: currentLocation ? currentLocation.latitude : 43.0753,
            longitude: currentLocation ? currentLocation.longitude : -89.3962,
            ...REGION_DELTA,
        }),
        [currentLocation]
    );

    /** Android needs tracksViewChanges while remote marker images paint; iOS can keep it off for perf. */
    const markerTracksViewChanges = Platform.OS === 'android';

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#264117" />
                <Text style={styles.loadingText}>Loading map and establishments...</Text>
            </View>
        );
    }

    return (
        <>
            <Stack.Screen
                options={{
                    headerTransparent: false,
                    headerShadowVisible: false,
                    headerTitleAlign: 'center',
                    headerStyle: {
                        backgroundColor: SCREEN_BACKGROUND,
                    },
                    headerTintColor: '#264117',
                    headerTitle: () => <TabHeaderLogo />,
                    headerRight: () => <SettingsHeaderButton />,
                }}
            />
            <View style={styles.container}>
                <Text style={styles.heroTitle}>Find food.</Text>
                <View style={styles.mapWrap}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        showsUserLocation
                        initialRegion={initialRegion}
                    >
                        {routeCoords.length > 1 && (
                            <Polyline
                                coordinates={routeCoords}
                                strokeColor="#264117"
                                strokeWidth={5}
                                lineJoin="round"
                                lineCap="round"
                            />
                        )}
                        {establishments.map((establishment) => (
                            <Marker
                                key={establishment.id}
                                coordinate={establishment.coordinates}
                                onPress={() => handleMarkerPress(establishment.id)}
                                tracksViewChanges={markerTracksViewChanges}
                            >
                                <View>
                                    {selectedEstablishment === establishment.id ? (
                                        renderExpandedView(establishment)
                                    ) : (
                                        <View style={styles.marker}>
                                            {hasValidMarkerImage(establishment.image) ? (
                                                <Image
                                                    source={{ uri: establishment.image }}
                                                    style={styles.markerImage}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <View style={[styles.markerImage, styles.markerImagePlaceholder]}>
                                                    <Ionicons name="restaurant" size={22} color="#ffffff" />
                                                </View>
                                            )}
                                            <Text style={styles.markerText}>{establishment.name}</Text>
                                        </View>
                                    )}
                                </View>
                            </Marker>
                        ))}
                    </MapView>
                    <TouchableOpacity
                        style={styles.locateButton}
                        onPress={goToMyLocation}
                        accessibilityRole="button"
                        accessibilityLabel="Center map on my location"
                    >
                        <Ionicons name="locate" size={26} color="#264117" />
                    </TouchableOpacity>
                </View>

                <Modal
                    visible={directionsModalVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={closeDirectionsModal}
                >
                    <View style={styles.directionsModalRoot}>
                        <TouchableOpacity
                            style={styles.directionsModalScrim}
                            activeOpacity={1}
                            onPress={closeDirectionsModal}
                        />
                        <View style={styles.directionsModalSheet}>
                            <Text style={styles.directionsModalTitle} numberOfLines={2}>
                                Directions · {directionsDestinationName}
                            </Text>
                            {routeSteps[currentStepIndex] && (
                                <Animated.View style={{ opacity: stepFade }}>
                                    <Text style={styles.directionsCurrentLabel}>Current step</Text>
                                    <Text style={styles.directionsCurrentStep}>
                                        {routeSteps[currentStepIndex].instruction}
                                    </Text>
                                    <Text style={styles.directionsMeta}>
                                        {routeSteps[currentStepIndex].distanceText}
                                        {routeSteps[currentStepIndex].durationText
                                            ? ` · ${routeSteps[currentStepIndex].durationText}`
                                            : ''}
                                    </Text>
                                </Animated.View>
                            )}
                            <Text style={styles.directionsAllLabel}>Full route</Text>
                            <ScrollView
                                style={styles.directionsScroll}
                                nestedScrollEnabled
                                keyboardShouldPersistTaps="handled"
                            >
                                {routeSteps.map((s, i) => (
                                    <View
                                        key={`${i}-${s.instruction.slice(0, 24)}`}
                                        style={[
                                            styles.directionsStepRow,
                                            i === currentStepIndex && styles.directionsStepRowActive,
                                        ]}
                                    >
                                        <Text style={styles.directionsStepNum}>{i + 1}</Text>
                                        <Text style={styles.directionsStepText}>{s.instruction}</Text>
                                    </View>
                                ))}
                            </ScrollView>
                            <TouchableOpacity style={styles.directionsCloseBtn} onPress={closeDirectionsModal}>
                                <Text style={styles.directionsCloseText}>Done</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            </View>
        </>
    );
};

export default SearchPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BACKGROUND,
    },
    heroTitle: {
        ...HEADING_HERO_TEXT,
        marginBottom: 10,
        paddingHorizontal: 16,
    },
    mapWrap: {
        flex: 1,
        marginHorizontal: 10,
        marginBottom: 10,
        borderRadius: 10,
        overflow: 'hidden',
    },
    locateButton: {
        position: 'absolute',
        right: 14,
        bottom: 14,
        backgroundColor: '#ffffff',
        width: 52,
        height: 52,
        borderRadius: 26,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#264117',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    map: {
        ...StyleSheet.absoluteFillObject,
        borderColor: '#264117',
        borderWidth: 5,
        borderRadius: 10,
    },
    marker: {
        alignItems: 'center',
    },
    markerImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
    },
    markerImagePlaceholder: {
        backgroundColor: '#264117',
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerText: {
        marginTop: 5,
        fontSize: 8,
        textAlign: 'center',
        backgroundColor: '#264117',
        color: 'white',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
        overflow: 'hidden',
    },
    expandedView: {
        width: 224,
        backgroundColor: '#ffffff',
        borderRadius: 14,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 8,
        elevation: 8,
    },
    expandedImage: {
        width: 224,
        height: 118,
        backgroundColor: '#e8e8e8',
    },
    expandedImagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#264117',
    },
    expandedBody: {
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 4,
        alignItems: 'center',
    },
    establishmentName: {
        fontSize: 15,
        fontWeight: '700',
        color: '#264117',
        textAlign: 'center',
    },
    expandedActionRow: {
        flexDirection: 'row',
        alignItems: 'stretch',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: '#e2e2e2',
        backgroundColor: '#f4f6f4',
    },
    expandedActionCell: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 6,
    },
    expandedActionDivider: {
        width: StyleSheet.hairlineWidth,
        backgroundColor: '#d0d0d0',
        marginVertical: 8,
    },
    expandedActionIcon: {
        marginRight: 6,
    },
    expandedActionTextCol: {
        flex: 1,
    },
    expandedActionPrimary: {
        fontSize: 11,
        fontWeight: '600',
        color: '#264117',
        lineHeight: 14,
    },
    expandedActionSecondary: {
        fontSize: 9,
        color: '#7a7a7a',
        marginTop: 1,
    },
    viewPlaceHint: {
        fontSize: 9,
        color: '#7a7a7a',
        marginTop: 4,
        marginBottom: 2,
        textAlign: 'center',
    },
    directionsModalRoot: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    directionsModalScrim: {
        ...StyleSheet.absoluteFillObject,
    },
    directionsModalSheet: {
        backgroundColor: '#ffffff',
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        paddingHorizontal: 18,
        paddingTop: 14,
        paddingBottom: 28,
        maxHeight: '58%',
    },
    directionsModalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#264117',
        marginBottom: 12,
    },
    directionsCurrentLabel: {
        fontSize: 11,
        color: '#7a7a7a',
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: 4,
    },
    directionsCurrentStep: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        lineHeight: 22,
    },
    directionsMeta: {
        fontSize: 13,
        color: '#555',
        marginTop: 6,
        marginBottom: 12,
    },
    directionsAllLabel: {
        fontSize: 11,
        color: '#7a7a7a',
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    directionsScroll: {
        maxHeight: 220,
        marginBottom: 14,
    },
    directionsStepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 6,
        backgroundColor: '#f7f7f7',
    },
    directionsStepRowActive: {
        backgroundColor: 'rgba(38, 65, 23, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(38, 65, 23, 0.35)',
    },
    directionsStepNum: {
        fontSize: 12,
        fontWeight: '700',
        color: '#264117',
        width: 26,
        marginRight: 8,
    },
    directionsStepText: {
        flex: 1,
        fontSize: 13,
        color: '#333',
        lineHeight: 18,
    },
    directionsCloseBtn: {
        backgroundColor: '#264117',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    directionsCloseText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#264117',
    },
});
