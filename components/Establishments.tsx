import { trackEvent } from '../firebaseConfig.js';
import {
  readEstablishmentsCache,
  fetchEstablishmentsFromFirestore,
  persistEstablishmentsCacheIfChanged,
} from '@/lib/establishmentsRepository';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, ListRenderItem, Dimensions, ActivityIndicator } from "react-native";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesome5, Ionicons } from "@expo/vector-icons";
import { getCurrentPositionOrFallback } from '@/lib/location';
import type { LocationObject } from 'expo-location';
import { distanceKm } from '@/lib/haversine';
import { EstablishmentType } from '@/types/establishmentType';
import { Link } from "expo-router";
import { useBookmarks } from '@/components/BookmarksContext';
import moment from 'moment';
import { requestTrackingPermissionsAsync } from '@/lib/trackingTransparency';

type Props = {
  category: string;
  dotw: string;
  selectedHour: string; // Add selectedHour prop
  sortedByDistance: boolean;
};

const Establishments = ({ category, dotw, selectedHour, sortedByDistance }: Props) => {
  const [loading, setLoading] = useState(true);
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks();
  const [establishments, setEstablishments] = useState<EstablishmentType[]>([]);

  // Calculate distances for all establishments
  const calculateDistances = (location: LocationObject, establishments: EstablishmentType[]) => {
    return establishments.map(establishment => {
      const lat = typeof establishment.latitude === 'string' ? parseFloat(establishment.latitude) : establishment.latitude;
      const lon = typeof establishment.longitude === 'string' ? parseFloat(establishment.longitude) : establishment.longitude;

      if (isNaN(lat) || isNaN(lon)) {
        console.warn(`Invalid coordinates for establishment ${establishment.id}: lat=${establishment.latitude}, lon=${establishment.longitude}`);
        return { ...establishment, distance: null };
      }

      const distance = distanceKm(
        location.coords.latitude,
        location.coords.longitude,
        lat,
        lon
      );
      return { ...establishment, distance: parseFloat((distance * 0.621371).toFixed(2)) }; // distance in miles
    });
  };

  // Parallel: ATT prompt, Firestore, and location (independent I/O) to cut time-to-interactive.
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);

        const [, cached, location] = await Promise.all([
          requestTrackingPermissionsAsync().catch(() => ({ status: 'denied' as const })),
          readEstablishmentsCache(),
          getCurrentPositionOrFallback(),
        ]);

        if (cached?.establishments?.length) {
          if (location) {
            setEstablishments(calculateDistances(location, cached.establishments));
          } else {
            setEstablishments(cached.establishments);
          }
          setLoading(false);
        }

        try {
          const fresh = await fetchEstablishmentsFromFirestore();
          await persistEstablishmentsCacheIfChanged(cached, fresh);
          if (location) {
            setEstablishments(calculateDistances(location, fresh.establishments));
          } else {
            setEstablishments(fresh.establishments);
          }
        } catch (error) {
          console.error('Error fetching establishments:', error);
          if (!cached?.establishments?.length) {
            setEstablishments([]);
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  const filteredEstablishments = useMemo(() => {
    let updatedEstablishments = [...establishments];

    const normalizeDropdownTime = (time: string): string => {
      if (time === "12:00 AM") return "00:00";
      return moment(time, 'h:mm A').format('HH:mm');
    };

    if (category !== "All") {
      updatedEstablishments = updatedEstablishments.filter(establishment =>
        Array.isArray(establishment.category)
          ? establishment.category.includes(category)
          : establishment.category === category
      );
    }

    if (dotw !== "Select Day" && selectedHour !== "Select Hour") {
      const selectedTimeMoment = moment(normalizeDropdownTime(selectedHour), 'HH:mm');

      updatedEstablishments = updatedEstablishments.filter(establishment =>
        establishment.happy_hour_deals.some(deal => {
          const dayMatch = deal.deal_list.includes(dotw);
          if (!dayMatch) return false;

          const startTimeMoment = moment(deal.start_time, 'HH:mm', true);
          let endTimeMoment = moment(deal.end_time, 'HH:mm', true);

          if (!startTimeMoment.isValid() || !endTimeMoment.isValid()) return false;

          if (endTimeMoment.isBefore(startTimeMoment)) {
            endTimeMoment.add(1, 'day');
          }

          return selectedTimeMoment.isBetween(startTimeMoment, endTimeMoment, null, '[]');
        })
      );
    }

    if (sortedByDistance) {
      updatedEstablishments.sort((a, b) =>
        a.distance != null && b.distance != null ? a.distance - b.distance : 0
      );
    }

    return updatedEstablishments;
  }, [category, dotw, selectedHour, establishments, sortedByDistance]);
  
  const handleBookmark = useCallback((establishment: EstablishmentType) => {
    if (isBookmarked(establishment.id)) {
      removeBookmark(establishment.id);
    } else {
      addBookmark(establishment);
      trackEvent('bookmarked', {
        establishment_id: establishment.id,
        establishment_name: establishment.name,
      });
    }
  }, [addBookmark, removeBookmark, isBookmarked]);

  const renderItems: ListRenderItem<EstablishmentType> = useCallback(({ item }) => {
    const distanceText = item.distance != null ? `${item.distance} miles away` : 'Calculating Distance...';

    return (
      <Link href={`/Establishments/${item.id}`} asChild>
        <TouchableOpacity style={styles.itemWrapper}>
          <View style={styles.item}>
            <Image source={{ uri: item.image }} style={styles.image} />
            <TouchableOpacity
              onPress={() => handleBookmark(item)}
              style={styles.bookmark}
            >
              <Ionicons
                name={isBookmarked(item.id) ? "bookmark" : "bookmark-outline"}
                size={20}
                color='#ffffff'
              />
            </TouchableOpacity>
            <Text
              style={styles.ItemText}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {item.name.toString()}
            </Text>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <FontAwesome5
                  name="map-marker-alt"
                  size={18}
                  color={'#264117'}
                />
                <Text style={styles.itemLocationText}> {distanceText} </Text>
              </View>
              <View style={styles.infoItem}>
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
  }, [handleBookmark, isBookmarked]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#264117" />
        <Text style={styles.loadingText} >Loading establishments...</Text>
      </View>
    );
  }

  return (
    <View style={styles.listContainer}>
      <FlatList
        data={filteredEstablishments}
        renderItem={renderItems}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={filteredEstablishments.length === 0 && styles.emptyContainer}
        ListEmptyComponent={<Text style={styles.emptyText}>No establishments found.</Text>}
        initialNumToRender={8}
        maxToRenderPerBatch={12}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  );
};

export default Establishments;

const styles = StyleSheet.create({
  listContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#264117',
  },
  itemWrapper: {
    flex: 1,
    margin: 5,
  },
  item: {
    marginLeft: 2.5,
    marginTop: 0,
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 5,
    width: (Dimensions.get('window').width / 2) - 15,
  },
  image: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  bookmark: {
    position: 'absolute',
    top: 140,
    right: 30,
    backgroundColor: '#264117',
    padding: 7,
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
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#555',
  },
});
