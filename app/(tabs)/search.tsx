import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, Linking, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker } from 'react-native-maps';
import { Stack, useRouter } from 'expo-router';
import { TabHeaderLogo } from '@/components/TabHeaderLogo';
import { SettingsHeaderButton } from '@/components/SettingsHeaderButton';
import { HEADING_HERO_TEXT, SCREEN_BACKGROUND } from '@/constants/theme';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { query, collection, getDocs } from "firebase/firestore"; // Firestore imports
import { db } from '../../firebaseConfig.js'; // Firebase Firestore config
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const REGION_DELTA = { latitudeDelta: 0.0922, longitudeDelta: 0.0421 };

type MapEstablishment = {
    id: string;
    name: string;
    image: string;
    location: string;
    cuisine: string;
    coordinates: { latitude: number; longitude: number };
};

const SearchPage = () => {
    const router = useRouter();
    const mapRef = useRef<MapView | null>(null);
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [selectedEstablishment, setSelectedEstablishment] = useState<string | null>(null);
    const [establishments, setEstablishments] = useState<MapEstablishment[]>([]);
    const [loading, setLoading] = useState(true);
    

    useEffect(() => {
        // Request tracking permission on app load
        const askForTrackingPermission = async () => {
            const { status: trackingStatus } = await requestTrackingPermissionsAsync();
            if (trackingStatus === 'granted') {
                console.log("Tracking permission granted.");
            } else {
                console.log("Tracking permission denied or restricted.");
            }
        };

        askForTrackingPermission(); // Call the permission request function

        // Request location permission and get current position
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setCurrentLocation(location.coords);
        })();

        // Fetch establishment data from Firestore
        const fetchEstablishments = async () => {
            try {
                const establishmentsRef = collection(db, "establishments");
                const q = query(establishmentsRef);
                const querySnapshot = await getDocs(q);
                const establishmentsArray: MapEstablishment[] = querySnapshot.docs.map((doc) => {
                    const d = doc.data();
                    return {
                        id: doc.id,
                        name: String(d.name ?? ''),
                        image: String(d.image ?? ''),
                        location: String(d.location ?? ''),
                        cuisine: String(d.cuisine ?? ''),
                        coordinates: {
                            latitude: parseFloat(d.latitude),
                            longitude: parseFloat(d.longitude),
                        },
                    };
                });
                setEstablishments(establishmentsArray);
            } catch (error) {
                console.error("Error fetching establishments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchEstablishments();
    }, []);

    const goToMyLocation = useCallback(async () => {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(
                'Location needed',
                'Allow location access to move the map to where you are.'
            );
            return;
        }
        try {
            const location = await Location.getCurrentPositionAsync({});
            const coords = location.coords;
            setCurrentLocation(coords);
            mapRef.current?.animateToRegion(
                {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    ...REGION_DELTA,
                },
                400
            );
        } catch {
            Alert.alert('Location', 'Could not get your current position.');
        }
    }, []);

    const handleMarkerPress = (id: string) => {
        setSelectedEstablishment(prev => (prev === id ? null : id));
    };
    const handleImagePress = (id: string) => {
        // Navigate to the details page with the establishment ID
        router.push(`/Establishments/${id}`);
    };

    const openMaps = (location: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
        Linking.openURL(url);
    };

    const renderExpandedView = (establishment: MapEstablishment) => (
        <TouchableOpacity onPress={() => handleImagePress(establishment.id)} style={styles.expandedView}>
            <Image
                source={{ uri: establishment.image }}
                style={styles.expandedImage}
            />
            <View style={styles.contentWrapper}>
                <Text style={styles.establishmentName}>{establishment.name}</Text>
                <View style={styles.highlightRow}>
                    <View style={styles.highlightWrapper}>
                        <View style={styles.highlightIcon}>
                            <Ionicons name="restaurant" size={18} color='#264117' />
                        </View>
                        <View>
                            <Text style={styles.HighlightText}>{establishment.cuisine}</Text>
                            <Text style={styles.HighlightTextVal}>Cuisine</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => openMaps(establishment.location)} style={styles.directionsWrapper}>
                        <View style={styles.highlightIcon}>
                            <Ionicons name="navigate" size={18} color='#264117' />
                        </View>
                        <View>
                            <Text style={styles.HighlightText}>Directions</Text>
                            <Text style={styles.HighlightTextVal}>Tap for directions</Text>
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );
    

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
                <Text style={styles.heroTitle}>Find Food</Text>
                <View style={styles.mapWrap}>
                    <MapView
                        ref={mapRef}
                        style={styles.map}
                        showsUserLocation={false}
                        initialRegion={{
                            latitude: currentLocation ? currentLocation.latitude : 43.0753,
                            longitude: currentLocation ? currentLocation.longitude : -89.3962,
                            ...REGION_DELTA,
                        }}
                    >
                    {currentLocation && (
                        <Marker
                            coordinate={{
                                latitude: currentLocation.latitude,
                                longitude: currentLocation.longitude,
                            }}
                        >
                            <View style={styles.currentLocationMarker}>
                                <View style={styles.outerCircle}>
                                    <View style={styles.innerCircle} />
                                </View>
                            </View>
                        </Marker>
                    )}

                    {establishments.map((establishment) => (
    <Marker
        key={establishment.id}
        coordinate={establishment.coordinates}
        onPress={() => handleMarkerPress(establishment.id)}
    >
        <View>
            {selectedEstablishment === establishment.id ? (
                renderExpandedView(establishment)
            ) : (
                <View style={styles.marker}>
                    <Image
                        source={{ uri: establishment.image }}
                        style={styles.markerImage}
                    />
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
    outerCircle: {
        width: 70,  // Outer blue glow size
        height: 70,
        borderRadius: 40, // Fully rounded
        backgroundColor: 'rgba(0,122,255,0.3)', // Light blue transparent color for outer glow
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerCircle: {
        width: 30,  // Inner solid blue circle size
        height: 30,
        borderRadius: 15, // Fully rounded
        backgroundColor: '#007AFF', // Solid blue color for inner dot
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
    currentLocationMarker: {
        width: 80,
        height: 80,
        borderRadius: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expandedView: {
        width: 190, // Ensure square size
        height: 175, // Ensure square size
        backgroundColor: '#ffffff',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
    },
    expandedImage: {
        width: 100,
        height: 100,
        borderRadius: 10,
    },
    contentWrapper: {
        alignItems: 'center',
    },
    establishmentName: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: 'bold',
        color: '#264117',
        textAlign: 'center',
    },
    highlightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 5,
    },
    highlightWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 2,
    },
    directionsWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 7, // Add padding to make the hitbox larger
        borderRadius: 5, // Add border radius for aesthetics
        backgroundColor: '#ffffff', // Add background color to make the hitbox visible
    },
    highlightIcon: {
        marginRight: 5,
    },
    HighlightText: {
        fontSize: 10,
        color: '#264117',
    },
    HighlightTextVal: {
        fontSize: 8,
        color: '#7a7a7a',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5'
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#264117'
    },
});
