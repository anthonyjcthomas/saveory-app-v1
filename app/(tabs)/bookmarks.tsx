import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { TabHeaderLogo } from '@/components/TabHeaderLogo';
import { SettingsHeaderButton } from '@/components/SettingsHeaderButton';
import { HEADING_HERO_TEXT, SCREEN_BACKGROUND } from '@/constants/theme';
import { useBookmarks } from '@/components/BookmarksContext';
import { EstablishmentType } from '@/types/establishmentType';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Link } from 'expo-router';
import { requestTrackingPermissionsAsync } from '@/lib/trackingTransparency';
import { getCurrentPositionOrFallback } from '@/lib/location';
import { distanceMiles } from '@/lib/haversine';

const { width } = Dimensions.get('window');

const BookmarksPage: React.FC = () => {
    const { bookmarks, removeBookmark } = useBookmarks();
    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const [, location] = await Promise.all([
                requestTrackingPermissionsAsync().catch(() => ({ status: 'denied' as const })),
                getCurrentPositionOrFallback(),
            ]);
            if (cancelled) return;
            if (location) {
                setUserLocation(location);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const renderItems = useCallback(({ item }: { item: EstablishmentType }) => {
        let distanceText = 'Calculating Distance...';
        if (userLocation) {
            const miles = distanceMiles(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                parseFloat(String(item.latitude)),
                parseFloat(String(item.longitude))
            );
            distanceText = `${miles.toFixed(2)} miles away`;
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
    }, [userLocation, removeBookmark]);

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
                <Text style={styles.heroTitle}>Save For Later.</Text>
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
    heroTitle: {
        ...HEADING_HERO_TEXT,
        marginBottom: 12,
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
