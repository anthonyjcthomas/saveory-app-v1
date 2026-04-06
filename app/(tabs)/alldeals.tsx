import { StyleSheet, Text, TouchableOpacity, View, Modal, Alert, ActivityIndicator } from "react-native";
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import ModalDropdown from 'react-native-modal-dropdown';
import Categories from "@/components/Categories";
import Establishments from '@/components/Establishments';
import { TabHeaderLogo } from '@/components/TabHeaderLogo';
import { HEADING_HERO_TEXT, SCREEN_BACKGROUND } from '@/constants/theme';
import { SettingsHeaderButton } from '@/components/SettingsHeaderButton';
import { FontAwesome5 } from "@expo/vector-icons";
import type { LocationObjectCoords } from 'expo-location';
import { getCurrentPositionOrFallback } from '@/lib/location';

const availableHours = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM",
  "5:00 PM", "6:00 PM", "7:00 PM", "8:00 PM",
  "9:00 PM", "10:00 PM", "11:00 PM", "12:00 AM"
];

const Page = () => {
  const [dayOfWeek, setDayOfWeek] = useState("Select Day");
  const [selectedHour, setSelectedHour] = useState("Select Hour");
  const [category, setCategory] = useState("All");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sortedByDistance, setSortedByDistance] = useState(true); // Set initial state to true to sort automatically by distance
  const [userLocation, setUserLocation] = useState<LocationObjectCoords | null>(null);

  const availableDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const location = await getCurrentPositionOrFallback();
        if (!location) {
          Alert.alert(
            "Location unavailable",
            "Allow location access for Saveory and turn on Location in system settings to sort by distance."
          );
          return;
        }
        setUserLocation(location.coords);
      } catch (error) {
        console.error("Error fetching location:", error);
        Alert.alert("Error", "Failed to fetch location.");
      }
    };

    getLocation();
  }, []);

  // Reset filters
  const resetFilters = () => {
    setDayOfWeek("Select Day");
    setSelectedHour("Select Hour");
  };

  // Function to handle category change
  const handleCategoryChange = (selectedCategory: string) => {
    console.log("Category changed to:", selectedCategory);
    setCategory(selectedCategory);
    setSortedByDistance(true); // Ensure it sorts by distance on category change
  };

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
        <Text style={styles.headingTxt}>Food. Easier. Near You.</Text>

        {/* Filter Button Section */}
        <View style={styles.filterSection}>
          <TouchableOpacity
            style={styles.indexfilterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Text style={styles.filterButtonText}>Filters</Text>
          </TouchableOpacity>
        </View>

        {/* Modal for Day, Hour, and Reset */}
        <Modal
          transparent={true}
          animationType="slide"
          visible={filterModalVisible}
          onRequestClose={() => setFilterModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeading}>Select Filters</Text>

              {/* Day Selector */}
              <ModalDropdown
                key={`day-dropdown-${dayOfWeek}`}
                options={availableDays}
                defaultValue={dayOfWeek}
                onSelect={(index, value) => setDayOfWeek(value)}
                textStyle={styles.dropdownText}
                dropdownStyle={styles.dropdown}
                dropdownTextStyle={styles.dropdownItemText}
              />

              {/* Hour Selector */}
              <ModalDropdown
                key={`hour-dropdown-${selectedHour}`}
                options={availableHours}
                defaultValue={selectedHour}
                onSelect={(index, value) => setSelectedHour(value)}
                textStyle={styles.dropdownText}
                dropdownStyle={styles.dropdown}
                dropdownTextStyle={styles.dropdownItemText}
              />

              {/* Reset Button */}
              <TouchableOpacity onPress={resetFilters} style={[styles.filterButton, styles.buttonSpacing]}>
                <Text style={styles.filterButtonText}>Reset</Text>
              </TouchableOpacity>

              {/* Apply Filters Button */}
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)} // Close modal after applying filters
                style={[styles.filterButton, styles.buttonSpacing]}
              >
                <Text style={styles.filterButtonText}>Apply Filters</Text>
              </TouchableOpacity>

              {/* Close Modal Button */}
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={[styles.filterButton, styles.buttonSpacing]}
              >
                <Text style={styles.filterButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Categories Component */}
        <Categories onCategoryChanged={handleCategoryChange} />

        {/* Establishments filtered by day, hour, and category */}
        <Establishments
          selectedHour={selectedHour}
          category={category}
          dotw={dayOfWeek}
          sortedByDistance={sortedByDistance}
        />
      </View>

      {/* Loading Popup */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Finding happy hours near you!</Text>
        </View>
      )}
    </>
  );
};

export default Page;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  filterSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  },
  indexfilterButton: {
    backgroundColor: '#264117',
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 10,
    width: 90, // Ensure buttons are uniform in size
    alignItems: 'center',
  },
  filterButtonText: {
    color: '#ffffff',
    fontSize: 16,
  },
  headingTxt: {
    ...HEADING_HERO_TEXT,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    alignItems: 'center',
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  dropdownText: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#264117',
    borderRadius: 20,
    backgroundColor: '#264117',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },
  dropdown: {
    width: '100%',
    borderColor: '#264117',
    borderWidth: 1,
    borderRadius: 20,
    backgroundColor: '#264117',
    marginTop: 2,
  },
  dropdownItemText: {
    fontSize: 16,
    padding: 10,
    color: '#ffffff',
    backgroundColor: '#264117',
  },
  filterButton: {
    backgroundColor: '#264117',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    width: '70%',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonSpacing: {
    marginTop: 8,
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
  },
  loadingText: {
    marginTop: 15,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
