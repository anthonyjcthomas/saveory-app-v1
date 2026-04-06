import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, ListRenderItem } from "react-native";
import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { getCurrentPositionOrFallback } from '@/lib/location';
import { EstablishmentType } from '@/types/establishmentType';
import { Link } from "expo-router";

type Props = {
    establishments: EstablishmentType[];
    dotw: string;
}

const Establishments = ({ establishments, dotw }: Props) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        console.log('Update Establishment');
        setLoading(true);

        setTimeout(() => {
            setLoading(false)
        }, 200);
    }, [dotw]);

    const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);

    useEffect(() => {
        (async () => {
            const location = await getCurrentPositionOrFallback();
            if (location) {
                setUserLocation(location);
            }
        })();
    }, []);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (value: number) => (value * Math.PI) / 180;
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c; // Distance in kilometers
        return distance;
    };

    const filteredEstablishments = establishments.filter((establishment) =>
        dotw === "All" || establishment.dotw.includes(dotw)
    );

    const renderItems: ListRenderItem<EstablishmentType> = ({ item }) => {
        let distanceText = '';
        if (userLocation) {
            const distance = calculateDistance(
                userLocation.coords.latitude,
                userLocation.coords.longitude,
                parseFloat(item.latitude), // Assuming you have latitude and longitude in your data
                parseFloat(item.longitude)
            );
            distanceText = `${(distance * 0.621371).toFixed(2)} miles away`; // Convert to miles
        }

        return (
            <Link href={`/Establishments/${item.id}`} asChild>
                <TouchableOpacity>
                    <View style={styles.item}>
                        <Image
                            source={{ uri: item.image }}
                            style={styles.image}
                        />
                        <View style={styles.bookmark}>
                            <Ionicons name="bookmark-outline" size={20} color='#ffffff' />
                        </View>
                        <Text
                            style={styles.ItemText}
                            numberOfLines={1}
                            ellipsizeMode="tail">
                            {item.name}
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
                                <Text style={styles.itemRatingText}> {item.rating} </Text>
                            </View>
                        </View>
                    </View>
                </TouchableOpacity>
            </Link>
        );
    };

    return (
        <View>
            <FlatList
                data={loading ? [] : filteredEstablishments}
                renderItem={renderItems}
                horizontal
                showsHorizontalScrollIndicator={false}
            />
        </View>
    );
};

export default Establishments;

const styles = StyleSheet.create({
    item: {
        marginLeft: 10,
        marginTop: 0,
        backgroundColor: '#ffffff',
        padding: 10,
        borderRadius: 10,
        marginRight: 20,
        width: 220,
    },
    image: {
        marginTop: 0,
        width: 200,
        height: 200,
        borderRadius: 10,
        marginBottom: 10,
    },
    bookmark: {
        position: 'absolute',
        top: 185,
        right: 30,
        backgroundColor: '#264117',
        padding: 10,
        borderRadius: 30,
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
        color: '#264117'
    }
});
