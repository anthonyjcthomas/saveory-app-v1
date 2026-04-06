import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { TabHeaderLogo } from '@/components/TabHeaderLogo';
import { SettingsHeaderButton } from '@/components/SettingsHeaderButton';
import { SCREEN_BACKGROUND } from '@/constants/theme';
import { useBookmarks } from '@/components/BookmarksContext';
import { EstablishmentType } from '@/types/establishmentType';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';

const { width } = Dimensions.get('window');

const BookmarksPage: React.FC = () => {
    const { bookmarks, removeBookmark } = useBookmarks();
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        (async () => {
            // Request tracking permission (iOS ATT)
            const { status: trackingStatus } = await requestTrackingPermissionsAsync();
            if (trackingStatus === 'granted') {
                console.log('Tracking permission granted.');
            } else {
                console.log('Tracking permission denied or restricted.');
            }

            // Request location permission
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});
            setUserLocation(location);
        })();
    }, []);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon1 - lon2);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    };

    const renderItems = ({ item }: { item: EstablishmentType }) => {
        let distanceText = 'Calculating Distance...';
        if (userLocation) {
            const distance = calculateDistance(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                parseFloat(item.latitude),
                parseFloat(item.longitude)
            );
            distanceText = `${(distance * 0.621371).toFixed(2)} miles away`; // Convert to miles
        }

        return (
            <Link href={`/Establishments/${item.id}`} asChild>
                <TouchableOpacity style={styles.itemWrapper}>
                    <View style={styles.item}>
                        <Image
                            source={{ uri: item.image }}
                            style={styles.image}
                        />
                        <TouchableOpacity
                            onPress={() => removeBookmark(item.id)}
                            style={styles.bookmark}
                        >
                            <Ionicons name="bookmark" size={20} color='#ffffff' />
                        </TouchableOpacity>
                        <Text
                            style={styles.ItemText}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {item.name.toString()}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome5
                                    name="map-marker-alt"
                                    size={18}
                                    color={'#264117'}
                                />
                                <Text style={styles.itemLocationText}> {distanceText} </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <FontAwesome5
                                    name="star"
                                    size={18}
                                    color={'#264117'}
                                />
                                <Text style={styles.itemRatingText}> {item.rating.toString()} </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        );
    };

    return (
        <View style={styles.container}>
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
            <View style={styles.contentContainer}>
                <FlatList
                    data={bookmarks}
                    renderItem={renderItems}
                    keyExtractor={(item) => item.id}
                    showsVerticalScrollIndicator={false}
                    numColumns={2}
                    columnWrapperStyle={styles.row}
                    contentContainerStyle={styles.flatListContainer} // Added this line
                />
            </View>
        </View>
    );
};

export default BookmarksPage;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    contentContainer: {
        paddingHorizontal: 10,
        paddingBottom: 10,
        flex: 1,
    },
    row: {
        justifyContent: 'space-between',
        marginBottom: 10, // Adjusted spacing between rows
    },
    flatListContainer: {
        paddingTop: 10, // Added padding to create space between header and FlatList
    },
    itemWrapper: {
        flex: 1,
        marginHorizontal: 5,
    },
    item: {
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 10,
        width: (width / 2) - 20, // Adjusted to fit two items per row
        marginBottom: 10, // Added spacing between items
    },
    image: {
        width: '100%',
        height: 120, // Adjusted height for better grid appearance
        borderRadius: 10,
        marginBottom: 10,
    },
    bookmark: {
        position: 'absolute',
        marginTop: 110,
        marginRight: 10,
        right: 10,
        backgroundColor: '#264117',
        padding: 5,
        borderRadius: 15, // Smaller size for better visual balance
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    ItemText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#264117',
        marginBottom: 10,
    },
    itemLocationText: {
        fontSize: 12,
        marginLeft: 5,
    },
    itemRatingText: {
        fontSize: 14,
        marginLeft: 5,
        color: '#264117',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#264117',
        marginBottom: 20,
        textAlign: 'center',
    },
});
