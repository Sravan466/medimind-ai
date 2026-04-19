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
            backgroundColor: colors.neutral[50],
            borderTopWidth: 1,
            borderTopColor: colors.neutral[200],
            paddingBottom: 8,
            paddingTop: 8,
            height: 70,
            elevation: 4,
            shadowColor: colors.neutral[900],
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: 0.08,
            shadowRadius: 4,
          },
          freezeOnBlur: true, // Freeze inactive tabs to prevent screen readers from reading hidden content
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
            fontSize: 16, // Reduced from 18
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
            tabBarAccessibilityLabel: 'Home tab',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="medicines"
          options={{
            title: 'Medicines',
            tabBarAccessibilityLabel: 'Medicines tab',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name="pill-multiple" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="info"
          options={{
            title: 'Info',
            tabBarAccessibilityLabel: 'Info tab',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'information' : 'information-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="chat"
          options={{
            title: 'Cura',
            tabBarAccessibilityLabel: 'Cura chat tab',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'chat' : 'chat-outline'} size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarAccessibilityLabel: 'Profile tab',
            tabBarIcon: ({ color, size, focused }) => (
              <MaterialCommunityIcons name={focused ? 'account' : 'account-outline'} size={size} color={color} />
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
