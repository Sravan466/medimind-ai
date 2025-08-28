// Tabs Layout for MediMind AI

import React from 'react';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProtectedRoute } from '../../src/components/common/ProtectedRoute';
import { colors } from '../../src/styles/theme';

export default function TabsLayout() {
  return (
    <ProtectedRoute>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary[500],
          tabBarInactiveTintColor: colors.neutral[500],
          tabBarStyle: {
            backgroundColor: colors.neutral[200],
            borderTopWidth: 2,
            borderTopColor: colors.neutral[900],
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
            elevation: 4,
            shadowColor: colors.neutral[900],
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          },
          headerShown: false, // Hide the header/navbar
          headerStyle: {
            backgroundColor: colors.neutral[200],
            elevation: 0,
            shadowOpacity: 0,
          },
          headerTintColor: colors.neutral[900],
          headerTitleStyle: {
            fontWeight: 'bold',
            color: colors.neutral[900],
            fontSize: 18,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '500',
            marginTop: 2,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="home" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="medicines"
          options={{
            title: 'Medicines',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="pill" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: 'Info',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="information" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Cura',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="chat" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="account" size={size} color={color} />
            ),
          }}
        />
        
        {/* Hidden screens for medicine management */}
        <Tabs.Screen
          name="add-medicine"
          options={{
            href: null, // Hide from tab bar
            title: 'Add Medicine',
          }}
        />
        <Tabs.Screen
          name="edit-medicine"
          options={{
            href: null, // Hide from tab bar
            title: 'Edit Medicine',
          }}
        />
      </Tabs>
    </ProtectedRoute>
  );
}
