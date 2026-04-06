import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, Image, FlatList, TouchableOpacity, Linking, Alert, ActivityIndicator } from 'react-native';
import { Stack, Link } from 'expo-router';
import { TabHeaderLogo } from '@/components/TabHeaderLogo';
import { HEADING_HERO_TEXT, SCREEN_BACKGROUND } from '@/constants/theme';
import { SettingsHeaderButton } from '@/components/SettingsHeaderButton';
import moment from 'moment-timezone';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { EstablishmentType, HappyHourDeal } from '@/types/establishmentType';
import Categories from "@/components/Categories";
import { db, trackEvent } from '../../firebaseConfig.js';
import { getCurrentPositionOrFallback } from '@/lib/location';
import { distanceKm, kmToMiles } from '@/lib/haversine';
import { collection, getDocs } from 'firebase/firestore';

const Live = () => {
    const [liveEstablishments, setLiveEstablishments] = useState<EstablishmentType[]>([]);
    /** Full list sorted by distance; category + time filtering applied into `liveEstablishments`. */
    const [establishmentsWithDistance, setEstablishmentsWithDistance] = useState<EstablishmentType[]>([]);
    const [category, setCategory] = useState<string>('All');
    const [loading, setLoading] = useState<boolean>(false); // Loading state for distance calculation
    const [initialLoading, setInitialLoading] = useState<boolean>(true); // Loading state for initial data fetch

    // Fetch establishments from Firestore
    const fetchEstablishments = async (): Promise<EstablishmentType[]> => {
        try {
            const establishmentsCollection = collection(db, 'establishments');
            const establishmentsSnapshot = await getDocs(establishmentsCollection);
            const establishmentsList = establishmentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            })) as EstablishmentType[];
            return establishmentsList;
        } catch (error) {
            console.error("Error fetching establishments from Firestore:", error);
            Alert.alert("Error", "Failed to fetch establishments. Please try again later.");
            return [];
        }
    };

    // Automatically sort by distance after fetching establishments and getting user location
    const fetchAndSortEstablishmentsByDistance = async () => {
        setLoading(true); // Show loading indicator
        try {
            const [location, establishments] = await Promise.all([
                getCurrentPositionOrFallback(),
                fetchEstablishments(),
            ]);
            if (!location) {
                Alert.alert(
                    "Location unavailable",
                    "Allow location access for Saveory and turn on Location in system settings to sort by distance."
                );
                setLoading(false);
                return;
            }
            const userLatitude = location.coords.latitude;
            const userLongitude = location.coords.longitude;
            const sortedEstablishments = establishments
                .map(establishment => {
                    const latitude = typeof establishment.latitude === 'string' ? parseFloat(establishment.latitude) : establishment.latitude;
                    const longitude = typeof establishment.longitude === 'string' ? parseFloat(establishment.longitude) : establishment.longitude;

                    if (isNaN(latitude) || isNaN(longitude)) {
                        console.warn(`Invalid coordinates for establishment ${establishment.id}: lat=${establishment.latitude}, lon=${establishment.longitude}`);
                        return { ...establishment, distance: Infinity }; // Assign a large distance if invalid
                    }

                    const distance = distanceKm(userLatitude, userLongitude, latitude, longitude);
                    return { ...establishment, distance };
                })
                .sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));

            setEstablishmentsWithDistance(sortedEstablishments);
        } catch (error) {
            console.error("Error sorting by distance:", error);
            Alert.alert("Error", "Failed to sort establishments by distance.");
        } finally {
            setLoading(false); // Hide loading indicator
        }
    };

    // Filter by selected category + deals active right now (Chicago time)
    const filterActiveDeals = useCallback((establishments: EstablishmentType[], now: moment.Moment) => {
        const currentDay = now.format('dddd');
        const currentTime = now.format('HH:mm');

        const activeDeals = establishments.filter((establishment: EstablishmentType) => {
            const cats = establishment.category;
            const categoryMatch =
                category === 'All' ||
                (Array.isArray(cats) && cats.includes(category)) ||
                (typeof cats === 'string' && cats === category);

            return (
                categoryMatch &&
                establishment.happy_hour_deals.some((deal: HappyHourDeal) => {
                    if (deal.deal_list.includes(currentDay)) {
                        const startTime = moment.tz(deal.start_time, 'HH:mm', 'America/Chicago');
                        const endTime = moment.tz(deal.end_time, 'HH:mm', 'America/Chicago');
                        const current = moment.tz(currentTime, 'HH:mm', 'America/Chicago');

                        // Adjust end time if it's the next day
                        if (endTime.isBefore(startTime)) {
                            endTime.add(1, 'day');
                        }

                        return current.isBetween(startTime, endTime);
                    }
                    return false;
                })
            );
        });

        setLiveEstablishments(activeDeals);
    }, [category]);

    // Load locations once; distance sort does not depend on category.
    useEffect(() => {
        const initialize = async () => {
            setInitialLoading(true);
            await fetchAndSortEstablishmentsByDistance();
            setInitialLoading(false);
        };

        initialize();
    }, []);

    const chicagoNowRef = useRef(moment.tz('America/Chicago'));

    // Re-apply time + category filter whenever category or the sorted source list changes.
    // useLayoutEffect avoids one frame where loading is done but the list is still empty.
    useLayoutEffect(() => {
        if (establishmentsWithDistance.length === 0) {
            setLiveEstablishments([]);
            return;
        }
        filterActiveDeals(establishmentsWithDistance, moment.tz('America/Chicago'));
    }, [category, establishmentsWithDistance, filterActiveDeals]);

    // Function to open maps for directions
    const openMaps = useCallback((location: string, name: string) => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(name + ', ' + location)}`;
        Linking.openURL(url).catch(err => {
            console.error("Error opening maps:", err);
            Alert.alert("Error", "Failed to open maps.");
        });
        trackEvent('click_open_maps', {
            establishment_name: name,
        });
    }, []);

    // Render individual establishment item (one Chicago "now" per screen render via ref — avoids N× moment() in FlatList)
    const renderEstablishment = useCallback(({ item }: { item: EstablishmentType }) => {
        const now = chicagoNowRef.current;
        const currentDay = now.format('dddd');
        const currentTime = now.format('HH:mm');

        // Get the deals for the current day that are ongoing at the current time
        const currentDeals = item.happy_hour_deals.filter(deal => {
            if (deal.deal_list.includes(currentDay)) {
                const dealStartTime = moment.tz(deal.start_time, 'HH:mm', 'America/Chicago');
                const dealEndTime = moment.tz(deal.end_time, 'HH:mm', 'America/Chicago');

                // Adjust end time if it's the next day
                if (dealEndTime.isBefore(dealStartTime)) {
                    dealEndTime.add(1, 'day');
                }

                const currentMoment = moment.tz(currentTime, 'HH:mm', 'America/Chicago');
                return currentMoment.isBetween(dealStartTime, dealEndTime);
            }
            return false;
        });

        if (currentDeals.length === 0) {
            return null; // Don't display anything if there are no deals going on
        }

        // Display the distance if available
        const distanceText = item.distance !== undefined && item.distance !== null && isFinite(item.distance)
            ? `${kmToMiles(item.distance).toFixed(2)} miles away`
            : '';

        return (
            <Link href={`/Establishments/${item.id}`} asChild>
                <TouchableOpacity style={styles.establishmentContainer} activeOpacity={0.85}>
                    <Image source={{ uri: item.image }} style={styles.establishmentImage} />
                    <Text style={styles.establishmentName}>{item.name}</Text>

                    {/* Display only the deal that is active at the current time */}
                    {currentDeals.map((deal, index) => (
                        <Text key={index} style={styles.happyHourDetails}>{deal.details}</Text>
                    ))}

                    <Text style={styles.establishmentCuisine}>{item.cuisine} Cuisine</Text>
                    <View style={styles.locationRow}>
                        <TouchableOpacity onPress={() => openMaps(item.location, item.name)} style={styles.locationButton}>
                            <FontAwesome5 name="map-marker-alt" size={18} color='#ffffff' />
                            <Text style={styles.locationText}>Directions</Text>
                        </TouchableOpacity>

                        <View style={styles.ratingWrapper}>
                            <Ionicons name="star" size={18} color={'#ffffff'} />
                            <Text style={styles.ratingText}>{item.rating}</Text>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        );
    }, [openMaps]);

    chicagoNowRef.current = moment.tz('America/Chicago');

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
                <Text style={styles.taglineTxt}>Deals. Near You. Right now.</Text>

                {/* Categories Component */}
                <Categories onCategoryChanged={setCategory} />

                

                {/* Initial Loading Indicator */}
                {initialLoading ? (
                    <View style={styles.initialLoadingContainer}>
                        <ActivityIndicator size="large" color="#264117" />
                        <Text style={styles.initialLoadingText}>Loading live deals closest to you!</Text>
                    </View>
                ) : liveEstablishments.length > 0 ? (
                    <FlatList
                        data={liveEstablishments}
                        keyExtractor={item => item.id}
                        renderItem={renderEstablishment}
                        contentContainerStyle={styles.list}
                        showsVerticalScrollIndicator={false}
                        initialNumToRender={8}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews
                    />
                ) : (
                    !loading && <Text style={styles.noDealsText}>No Live Deals Deals at the moment.</Text>
                )}
            </View>
        </>
    );
};

export default Live;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        paddingHorizontal: 16,
    },
    taglineTxt: {
        ...HEADING_HERO_TEXT,
        marginBottom: 6,
    },
    list: {
        marginTop: 0,
    },
    establishmentContainer: {
        marginBottom: 20,
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        width: '94.5%', // Shrink the width to 94.5% for better spacing
        alignSelf: 'center', // Center the container
    },
    establishmentImage: {
        width: '100%',
        height: 150,
        borderRadius: 10,
        marginBottom: 10,
    },
    establishmentName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#264117',
        marginBottom: 5,
    },
    happyHourDetails: {
        fontSize: 16,
        color: '#264117',
        marginBottom: 10,
    },
    establishmentCuisine: {
        fontSize: 14,
        color: '#7a7a7a',
        marginBottom: 10,
    },
    locationRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#264117',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    locationText: {
        color: '#ffffff',
        marginLeft: 8,
    },
    distanceWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#264117',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    distanceText: {
        color: '#ffffff',
        marginLeft: 8,
    },
    ratingWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#264117',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 5,
    },
    ratingText: {
        color: '#ffffff',
        marginLeft: 8,
    },
    noDealsText: {
        fontSize: 18,
        textAlign: 'center',
        marginTop: 350,
        color: '#555',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingText: {
        marginTop: 15,
        color: '#ffffff',
        fontSize: 18,
        fontWeight: '600',
    },
    initialLoadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    initialLoadingText: {
        marginTop: 15,
        color: '#264117',
        fontSize: 18,
        fontWeight: '600',
    },
});
