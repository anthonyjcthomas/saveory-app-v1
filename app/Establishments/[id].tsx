import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity, Linking, Dimensions, Alert, ScrollView, ActivityIndicator, Share } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { query, collection, where, getDocs } from "firebase/firestore";
import { db, trackEvent } from '../../firebaseConfig.js';
import { EstablishmentType } from '@/types/establishmentType';
import CommentsSection from './CommentsSection';

const { width } = Dimensions.get('window');
const IMG_HEIGHT = 300;

const EstablishmentDetails: React.FC = () => {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const [establishment, setEstablishment] = useState<EstablishmentType | null>(null);
    const [loading, setLoading] = useState(true);
    const startTimeRef = useRef<number | null>(null);
    const auth = getAuth();
    const user = auth.currentUser;

    // Fetch establishment details from Firestore
    const fetchEstablishment = async () => {
        console.log("Fetching establishment details...");
        if (!id) {
            Alert.alert("Error", "No establishment ID provided.");
            router.back();
            return;
        }

        try {
            const establishmentsRef = collection(db, "establishments");
            const q = query(establishmentsRef, where("id", "==", id));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const establishmentData = querySnapshot.docs[0].data();
                const establishmentId = querySnapshot.docs[0].id;

                setEstablishment({ ...establishmentData, id: establishmentId } as EstablishmentType);

                console.log("Establishment fetched:", establishmentData.name);

                // Track view event after fetching
                trackEvent('view_establishment', {
                    establishment_id: establishmentId,
                    establishment_name: establishmentData.name,
                });
            } else {
                Alert.alert("Error", "Establishment not found.");
                setEstablishment(null);
                router.back();
            }
        } catch (error) {
            console.error("Error fetching establishment details:", error);
            Alert.alert("Error", "Failed to fetch establishment details.");
            setEstablishment(null);
            router.back();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        console.log("Component mounted, starting timer...");
        startTimeRef.current = Date.now(); // Store the start time in a ref
        fetchEstablishment();  // Fetch establishment details when component mounts

        return () => {
            const endTime = Date.now();
            const timeSpent = (endTime - startTimeRef.current!) / 1000; // Time spent in seconds
            console.log(`Component unmounted, time spent: ${timeSpent} seconds`);

            if (establishment) {
                trackEvent('time_spent_on_page', {
                    establishment_name: establishment.name,
                    time_spent: timeSpent,
                });
            }
        };
    }, [id]);

    if (loading) {
        console.log("Loading establishment...");
        return (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#264117" />
            <Text>Loading establishment details...</Text>
          </View>
        );
    }

    if (!establishment) {
        console.log("No establishment found.");
        return (
          <View style={styles.container}>
            <Text>Establishment not found.</Text>
          </View>
        );
    }

    // Handle sharing the happy hour details
    const handleShare = async () => {
        try {
            const message = `Check out the happy hour at ${establishment.name} located at ${establishment.location}.\n\nHappy Hour Details:\n${establishment.happy_hour_deals.map(deal => `${deal.day}: ${deal.details}`).join('\n\n')}`;
            await Share.share({
                message,
            });

            trackEvent('share_establishment', {
                establishment_id: establishment.id,
                establishment_name: establishment.name,
            });
        } catch (error) {
            Alert.alert('Error', 'Failed to share the establishment.');
        }
    };
      
    const openMaps = () => {
        const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(establishment.name + ', ' + establishment.location)}`;
        Linking.openURL(url).catch(err => {
            Alert.alert("Error", "Failed to open maps.");
        });

        trackEvent('click_open_maps', {
            establishment_id: establishment.id,
            establishment_name: establishment.name,
        });
    };
    const handleReportOutdatedHappyHour = () => {
        if (user && user.email) {
            const subject = encodeURIComponent(`Incorrect happy hour for ${establishment.name}`);
            const body = encodeURIComponent(`Dear Support,\n\nI noticed that the happy hour details for ${establishment.name} seem to be incorrect. Please review and update them if necessary.\n\nThank you,\n${user.email}`);
            const emailUrl = `mailto:saveoryapp@gmail.com?subject=${subject}&body=${body}`;
            Linking.openURL(emailUrl).catch(err => {
                Alert.alert("Error", "Failed to open email client.");
                console.error("Error sending email: ", err);
            });
        } else {
            Alert.alert("Error", "You need to be logged in to report.");
        }
    };

    return (
        <>
            <Stack.Screen options={{
                headerTransparent: true,
                headerTitle: "",
                headerLeft: () => (
                    <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
                        <View style={styles.iconWrapper}>
                            <Feather name='arrow-left' size={20} color="#264117" />
                        </View>
                    </TouchableOpacity>
                )
            }} />
            <View style={styles.container2}>
                <TouchableOpacity onPress={() => router.back()} style={styles.customBackButton}>
                    <Feather name='arrow-left' size={20} color="#fff" />
                    <Text style={styles.customBackButtonText}>Back</Text>
                </TouchableOpacity>

                <Image source={{ uri: establishment.image }} style={styles.image} />
                <ScrollView
                    contentContainerStyle={styles.scrollViewContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.contentWrapper}>
                        <View style={styles.titleRow}>
                            <Text style={styles.establishmentName}>{establishment.name}</Text>
                            <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
                                <Feather name="share-2" size={24} color="#264117" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.establishmentLocationWrapper}>
                            <FontAwesome5 name="map-marker-alt" size={18} color='#264117' />
                            <Text style={styles.establishmentLocationText}> {establishment.location}</Text>
                        </View>

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
                            <TouchableOpacity onPress={openMaps} style={styles.highlightWrapper}>
                                <View style={styles.highlightIcon}>
                                    <Ionicons name="navigate" size={18} color='#264117' />
                                </View>
                                <View>
                                    <Text style={styles.HighlightText}>Directions</Text>
                                    <Text style={styles.HighlightTextVal}>Tap for directions</Text>
                                </View>
                            </TouchableOpacity>
                            <View style={styles.highlightWrapper}>
                                <View style={styles.highlightIcon}>
                                    <Ionicons name="star" size={18} color='#264117' />
                                </View>
                                <View>
                                    <Text style={styles.HighlightText}>Rating</Text>
                                    <Text style={styles.HighlightTextVal}>{establishment.rating}</Text>
                                </View>
                            </View>
                        </View>
                        <Text style={styles.establishmentDetails}>{establishment.description}</Text>
                    </View>

                    {/* Outdated Button and Happy Hour Details */}
                    <View style={styles.footer}>
                    <Text style={styles.footerTitle}>Happy Hours</Text>
                    {establishment.happy_hour_deals.map((deal, index) => (
                        <View key={index} style={styles.happyHourDeal}>
                            <Text style={styles.happyHourDay}>{deal.day}:</Text>
                            <Text style={styles.happyHourText}>{deal.details}</Text>
                        </View>
                    ))}
                </View>

                    {/* Comments Section */}
                    <TouchableOpacity style={styles.outdatedButton} onPress={handleReportOutdatedHappyHour}>
                            <Text style={styles.outdatedButtonText}>Outdated?</Text>
                    </TouchableOpacity>
                    <CommentsSection establishmentId={id} />
                </ScrollView>
            </View>
        </>
    );
};

export default EstablishmentDetails;


const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerButton: {
        padding: 8,
    },
    iconWrapper: {
        backgroundColor: '#ffffff',
        borderRadius: 20,
        padding: 6,
    },
    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#dcdcdc',
        width: '100%',
        backgroundColor: '#f5f5f5',
    },
    establishmentDetails: {
        fontSize: 15,
        color: '#555555',
        lineHeight: 22,
        marginBottom: 10,
    },
    footerTitle: {
        alignItems: 'center',
        fontSize: 28,
        fontWeight: 'bold',
        color: '#264117',
        marginBottom: 20,
        marginLeft: 100,
    },
    happyHourDeal: {
        marginBottom: 15,  // Space between deals
        alignItems: 'flex-start',  // Align all text to the left
    },
    happyHourDay: {
        fontSize: 18,
        marginLeft: 10,
        fontWeight: 'bold',
        color: '#264117',
        marginBottom: 5,  // Add space below the day label
    },
    happyHourText: {
        fontSize: 16,
        color: '#264117',
        marginLeft: 10,  // Add a small indentation for the details
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: IMG_HEIGHT,
    },
    scrollViewContent: {
        backgroundColor: '#f5f5f5',
        paddingBottom: 150,
        alignItems: 'center',
    },
    contentWrapper: {
        padding: 20,
        width: '100%',
        backgroundColor: '#ffffff',
    },
    container2: {
        flex: 1,
        backgroundColor: "#f5f5f5",
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
    },
    shareButton: {
        padding: 8,
        backgroundColor: '#f0f0f0',
        borderRadius: 10,
    },
    establishmentName: {
        fontSize: 24,
        fontWeight: '500',
        color: '#264117',
        letterSpacing: 0.5,
    },
    happyHourRow: {
        flexDirection: 'row',
        alignItems: 'center', 
    },
    establishmentLocationWrapper: {
        flexDirection: 'row',
        marginTop: 5,
        marginBottom: 0,
        alignItems: 'center',
    },
    establishmentLocationText: {
        fontSize: 14,
        marginLeft: 5,
        color: '#264117',
    },
    highlightRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 20,
    },
    highlightWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    highlightIcon: {
        marginRight: 10,
    },
    HighlightText: {
        fontSize: 16,
        color: '#264117',
    },
    HighlightTextVal: {
        fontSize: 14,
        color: '#7a7a7a',
    },
    outdatedButton: {
        backgroundColor: '#264117',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 20,
        width: '40%',
        alignItems: 'center',
        marginBottom: 12,
    },
    outdatedButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    customBackButton: {
        position: 'absolute',
        top: 40,
        left: 20,
        backgroundColor: '#264117',
        padding: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 1,
    },
    customBackButtonText: {
        color: '#fff',
        marginLeft: 8,
        fontSize: 16,
    },
});
