/**
 * Map tab on web: Google Maps JS + Firestore markers + search.
 * Requires EXPO_PUBLIC_GOOGLE_MAPS_API_KEY (Maps JavaScript API + Geocoding API).
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { GoogleMap, InfoWindow, LoadScript, Marker, OverlayView } from '@react-google-maps/api';
import { Stack, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { TabHeaderLogo } from '@/components/TabHeaderLogo';
import { SettingsHeaderButton } from '@/components/SettingsHeaderButton';
import { HEADING_HERO_TEXT, SCREEN_BACKGROUND, BRAND_GREEN } from '@/constants/theme';
import {
  readEstablishmentsCache,
  fetchEstablishmentsFromFirestore,
  persistEstablishmentsCacheIfChanged,
  toWebMapEstablishments,
} from '@/lib/establishmentsRepository';
import { geocodePlaceQuery, MADISON_CENTER, openGoogleDirections } from '@/lib/googleMapsHelpers';
import { getCurrentPositionOrFallback } from '@/lib/location';

const GOOGLE_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';

type MapEstablishment = {
  id: string;
  name: string;
  image: string;
  location: string;
  cuisine: string;
  coordinates: { lat: number; lng: number };
};

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: 14,
};

const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
  styles: [{ featureType: 'poi.business', stylers: [{ visibility: 'off' }] }],
};

const EstablishmentMapPin = React.memo(function EstablishmentMapPin({
  establishment,
  selected,
  onPress,
}: {
  establishment: MapEstablishment;
  selected: boolean;
  onPress: () => void;
}) {
  const hasValidImage =
    !!establishment.image?.trim() && /^https?:\/\//i.test(establishment.image.trim());

  return (
    <OverlayView
      position={establishment.coordinates}
      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
      zIndex={selected ? 300 : 20}
      getPixelPositionOffset={(w, h) => ({
        x: -(w / 2),
        y: -h,
      })}
    >
      <TouchableOpacity activeOpacity={0.88} onPress={onPress} style={styles.webMarkerRoot}>
        <View style={[styles.webMarkerImageRing, selected && styles.webMarkerImageRingSelected]}>
          {hasValidImage ? (
            <Image
              source={{ uri: establishment.image }}
              style={styles.webMarkerImage}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.webMarkerImage, styles.webMarkerPlaceholder]}>
              <Ionicons name="restaurant" size={22} color="#ffffff" />
            </View>
          )}
        </View>
        <Text style={styles.webMarkerLabel} numberOfLines={2}>
          {establishment.name}
        </Text>
      </TouchableOpacity>
    </OverlayView>
  );
});

export default function SearchPageWeb() {
  const { width: windowWidth } = useWindowDimensions();
  const contentMaxWidth = Math.min(920, windowWidth);

  const [establishments, setEstablishments] = useState<MapEstablishment[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searching, setSearching] = useState(false);
  const [mapCenter, setMapCenter] = useState(MADISON_CENTER);
  const [mapZoom, setMapZoom] = useState(12);
  const [searchPin, setSearchPin] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [loc, cached] = await Promise.all([
          getCurrentPositionOrFallback(),
          readEstablishmentsCache(),
        ]);
        if (cancelled) return;
        if (loc) {
          const p = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setUserPos(p);
          setMapCenter(p);
          setMapZoom(13);
        }
        if (cached?.establishments?.length) {
          setEstablishments(toWebMapEstablishments(cached.establishments));
        }
        const fresh = await fetchEstablishmentsFromFirestore();
        await persistEstablishmentsCacheIfChanged(cached, fresh);
        if (cancelled) return;
        setEstablishments(toWebMapEstablishments(fresh.establishments));
      } catch (e) {
        console.error(e);
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

  const onGo = useCallback(async () => {
    if (!GOOGLE_KEY) {
      Alert.alert(
        'Maps API key',
        'Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local and restart Expo.'
      );
      return;
    }
    const q = searchText.trim();
    if (!q) {
      Alert.alert('Search', 'Enter a place or address first.');
      return;
    }
    setSearching(true);
    try {
      const coords = await geocodePlaceQuery(q, GOOGLE_KEY);
      if (!coords) {
        Alert.alert('Not found', 'Try a different search or include Madison, WI.');
        return;
      }
      setSearchPin(coords);
      setMapCenter(coords);
      setMapZoom(15);
      setSelectedId(null);
      openGoogleDirections(coords, userPos);
    } finally {
      setSearching(false);
    }
  }, [searchText, userPos]);

  const goToMyLocation = useCallback(async () => {
    const loc = await getCurrentPositionOrFallback();
    if (!loc) {
      Alert.alert(
        'Location',
        'Allow location for Saveory, turn on Location in system settings, and try again.'
      );
      return;
    }
    const p = { lat: loc.coords.latitude, lng: loc.coords.longitude };
    setUserPos(p);
    setMapCenter(p);
    setMapZoom(14);
    setSearchPin(null);
  }, []);

  const selectedEstablishment = useMemo(
    () => establishments.find((e) => e.id === selectedId) ?? null,
    [establishments, selectedId]
  );

  const mapPins = useMemo(
    () =>
      establishments.filter(
        (e) =>
          Number.isFinite(e.coordinates.lat) &&
          Number.isFinite(e.coordinates.lng) &&
          Math.abs(e.coordinates.lat) <= 90 &&
          Math.abs(e.coordinates.lng) <= 180
      ),
    [establishments]
  );

  const mapSectionMinHeight = Math.max(380, Math.min(560, windowWidth * 0.55));

  if (loading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerTransparent: false,
            headerShadowVisible: false,
            headerTitleAlign: 'center',
            headerStyle: { backgroundColor: SCREEN_BACKGROUND },
            headerTintColor: BRAND_GREEN,
            headerTitle: () => <TabHeaderLogo />,
            headerRight: () => <SettingsHeaderButton />,
          }}
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={BRAND_GREEN} />
          <Text style={styles.loadingText}>Loading map…</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTransparent: false,
          headerShadowVisible: false,
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: SCREEN_BACKGROUND },
          headerTintColor: BRAND_GREEN,
          headerTitle: () => <TabHeaderLogo />,
          headerRight: () => <SettingsHeaderButton />,
        }}
      />

      <View style={[styles.screen, { backgroundColor: SCREEN_BACKGROUND }]}>
        <View style={[styles.content, { maxWidth: contentMaxWidth, width: '100%' }]}>
          <Text style={styles.heroTitle}>Find Food.</Text>

          <View style={styles.searchCard}>
            <Ionicons name="search" size={20} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search a place or address…"
              placeholderTextColor="#9ca3af"
              value={searchText}
              onChangeText={setSearchText}
              onSubmitEditing={onGo}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[styles.goButton, searching && styles.goButtonDisabled]}
              onPress={onGo}
              disabled={searching}
            >
              {searching ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.goButtonText}>Go</Text>
              )}
            </TouchableOpacity>
          </View>

          {!GOOGLE_KEY ? (
            <View style={[styles.noKeyCard, { minHeight: mapSectionMinHeight }]}>
              <Ionicons name="map-outline" size={48} color={BRAND_GREEN} />
              <Text style={styles.noKeyTitle}>Google Maps API key</Text>
              <Text style={styles.noKeyBody}>
                Add{' '}
                <Text style={styles.mono}>EXPO_PUBLIC_GOOGLE_MAPS_API_KEY</Text> to{' '}
                <Text style={styles.mono}>.env.local</Text>, enable Maps JavaScript API and
                Geocoding in Google Cloud, then restart Expo.
              </Text>
              <Text style={styles.dealCount}>
                {establishments.length} spots in the app — map unlocks with key.
              </Text>
            </View>
          ) : (
            <View style={[styles.mapShell, { minHeight: mapSectionMinHeight }]}>
              <LoadScript
                googleMapsApiKey={GOOGLE_KEY}
                loadingElement={
                  <View style={styles.mapLoading}>
                    <ActivityIndicator size="large" color={BRAND_GREEN} />
                  </View>
                }
              >
                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={mapCenter}
                  zoom={mapZoom}
                  options={mapOptions}
                >
                  {userPos && <Marker position={userPos} title="You are here" />}
                  {searchPin && (
                    <Marker
                      position={searchPin}
                      title="Search result"
                      icon={{ url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
                    />
                  )}
                  {mapPins.map((e) => (
                    <EstablishmentMapPin
                      key={e.id}
                      establishment={e}
                      selected={selectedId === e.id}
                      onPress={() => setSelectedId(e.id)}
                    />
                  ))}
                  {selectedEstablishment && (
                    <InfoWindow
                      position={selectedEstablishment.coordinates}
                      onCloseClick={() => setSelectedId(null)}
                    >
                      <View style={styles.infoInner}>
                        <Text style={styles.infoTitle}>{selectedEstablishment.name}</Text>
                        <Text style={styles.infoSub}>{selectedEstablishment.cuisine}</Text>
                        <View style={styles.infoActions}>
                          <Link href={`/Establishments/${selectedEstablishment.id}`} asChild>
                            <TouchableOpacity style={styles.infoLinkBtn}>
                              <Text style={styles.infoLinkText}>View deals</Text>
                            </TouchableOpacity>
                          </Link>
                          <TouchableOpacity
                            style={styles.infoDirBtn}
                            onPress={() =>
                              openGoogleDirections(selectedEstablishment.coordinates, userPos)
                            }
                          >
                            <Text style={styles.infoDirText}>Directions</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>

              <TouchableOpacity
                style={styles.locateFab}
                onPress={goToMyLocation}
                accessibilityLabel="My location"
              >
                <Ionicons name="locate" size={24} color={BRAND_GREEN} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footerHint}>
            {GOOGLE_KEY
              ? 'Search and tap Go to open turn-by-turn directions in Google Maps.'
              : 'With an API key, the map shows every deal location and live search.'}
          </Text>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  heroTitle: {
    ...HEADING_HERO_TEXT,
    marginBottom: 12,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    paddingVertical: 10,
  },
  goButton: {
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goButtonDisabled: {
    opacity: 0.7,
  },
  goButtonText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 16,
  },
  mapShell: {
    flex: 1,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: BRAND_GREEN,
    backgroundColor: '#e5e7eb',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  mapLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
  },
  locateFab: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BRAND_GREEN,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    zIndex: 2,
  },
  noKeyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  noKeyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: BRAND_GREEN,
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  noKeyBody: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 420,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: '#111827',
  },
  dealCount: {
    marginTop: 16,
    fontSize: 14,
    color: '#6b7280',
  },
  footerHint: {
    marginTop: 12,
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SCREEN_BACKGROUND,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: BRAND_GREEN,
    fontWeight: '600',
  },
  infoInner: {
    minWidth: 200,
    padding: 4,
  },
  infoTitle: {
    fontWeight: '800',
    fontSize: 15,
    color: '#111827',
    marginBottom: 4,
  },
  infoSub: {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 10,
  },
  infoActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  infoLinkBtn: {
    backgroundColor: BRAND_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoLinkText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  infoDirBtn: {
    borderWidth: 1,
    borderColor: BRAND_GREEN,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  infoDirText: {
    color: BRAND_GREEN,
    fontWeight: '700',
    fontSize: 13,
  },
  webMarkerRoot: {
    alignItems: 'center',
    maxWidth: 136,
    cursor: 'pointer',
  },
  webMarkerImageRing: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: '#ffffff',
    overflow: 'hidden',
    backgroundColor: '#e8e8e8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 8,
  },
  webMarkerImageRingSelected: {
    borderColor: BRAND_GREEN,
    borderWidth: 4,
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  webMarkerImage: {
    width: '100%',
    height: '100%',
  },
  webMarkerPlaceholder: {
    backgroundColor: BRAND_GREEN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webMarkerLabel: {
    marginTop: 5,
    fontSize: 9,
    lineHeight: 11,
    textAlign: 'center',
    backgroundColor: '#264117',
    color: '#ffffff',
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    maxWidth: 130,
    fontWeight: '600',
  },
});
