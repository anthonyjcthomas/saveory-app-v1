import React from 'react';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function Layout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#f5f5f5',
        },
        tabBarActiveTintColor: '#264117',
        tabBarInactiveTintColor: '#000000',
      }}
    >
      <Tabs.Screen
        name="index"  // This is the route you navigate to
        options={{
          tabBarIcon: ({ color }) => (
            <FontAwesome name="clock-o" size={28} color={color} />
          ),
          tabBarLabel: 'Live Deals',
        }}
      />
      <Tabs.Screen
        name="alldeals"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass" size={28} color={color} />
          ),
          tabBarLabel: 'All Deals',
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="map" size={28} color={color} />
          ),
          tabBarLabel: 'Map',
        }}
      />
      <Tabs.Screen
        name="bookmarks"
        options={{
          tabBarIcon: ({ color }) => (
            <Ionicons name="bookmark" size={28} color={color} />
          ),
          tabBarLabel: 'Bookmarks',
        }}
      />
    </Tabs>
  );
}
