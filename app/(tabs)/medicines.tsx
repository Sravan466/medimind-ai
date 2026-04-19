// Medicines Screen for MediMind AI

import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Surface, FAB, Card, Chip, IconButton, Menu, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { medicineService } from '../../src/services/supabase';
import { useNotifications } from '../../src/hooks/useNotifications';
import { Medicine } from '../../src/types/database';
import { colors } from '../../src/styles/theme';
import { Button } from '../../src/components/ui/Button';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { FilterChipBar } from '../../src/components/ui/FilterChipBar';
import { MedicineCard } from '../../src/components/ui/MedicineCard';

export default function MedicinesScreen() {
  const { user } = useAuthContext();
  const { cancelMedicineNotifications } = useNotifications();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [filter, setFilter] = useState('All');

  const FILTER_ITEMS = ['All', 'Morning', 'Afternoon', 'Evening', 'Night', 'As needed'];

  const filteredMedicines = useMemo(() => {
    if (filter === 'All') return medicines;
    if (filter === 'As needed') return medicines.filter(m => m.frequency?.toLowerCase() === 'as needed');
    // Filter by time-of-day bucket
    return medicines.filter(m => {
      if (!m.times || m.times.length === 0) return false;
      return m.times.some(t => {
        const h = parseInt(t.split(':')[0], 10);
        if (filter === 'Morning') return h >= 5 && h < 12;
        if (filter === 'Afternoon') return h >= 12 && h < 17;
        if (filter === 'Evening') return h >= 17 && h < 21;
        if (filter === 'Night') return h >= 21 || h < 5;
        return false;
      });
    });
  }, [medicines, filter]);

  useEffect(() => {
    loadMedicines();
  }, []);

  // Reload medicines when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMedicines();
    }, [])
  );

  const loadMedicines = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await medicineService.getMedicines(user.id);
      
      if (error) {
        console.error('Error loading medicines:', error);
        return;
      }
      
      const medicines = data || [];
      setMedicines(medicines);
      
      // Schedule notifications for all active medicines
      // This ensures notifications work after app restart or migration
      const activeMedicines = medicines.filter(m => m.is_active);
      if (activeMedicines.length > 0) {
        console.log(`[MEDICINES] Scheduling notifications for ${activeMedicines.length} active medicines`);
        
        // Import the fixed notification service
        const { fixedNotificationService } = await import('../../src/services/notifications_fixed');
        
        // Schedule notifications for each active medicine with a small delay
        for (const medicine of activeMedicines) {
          try {
            await fixedNotificationService.scheduleMedicineReminder(medicine);
            console.log(`[MEDICINES] Scheduled notifications for medicine ID: ${medicine.id}`);
            // Small delay to prevent overwhelming the system
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (notificationError) {
            console.error(`[MEDICINES] Error scheduling notifications for medicine ID: ${medicine.id}`, notificationError);
          }
        }
      }
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMedicines();
    setRefreshing(false);
  };

  const handleAddMedicine = () => {
    router.push('/(tabs)/add-medicine');
  };

  const handleEditMedicine = (medicine: Medicine) => {
    router.push(`/(tabs)/edit-medicine?medicine=${encodeURIComponent(JSON.stringify(medicine))}`);
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    try {
      const { error } = await medicineService.deleteMedicine(medicineId);
      if (error) {
        console.error('Error deleting medicine:', error);
        return;
      }
      
      // Cancel notifications for this medicine
      await cancelMedicineNotifications(medicineId);
      
      // Remove from local state
      setMedicines(prev => prev.filter(m => m.id !== medicineId));
    } catch (error) {
      console.error('Error deleting medicine:', error);
    }
  };

  const getStatusColor = (isActive: boolean) => {
    return isActive ? colors.success[500] : colors.neutral[400];
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const formatTimes = (times: string[]) => {
    if (!times || times.length === 0) return 'No times set';
    return times.map(time => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const minute = parseInt(minutes);
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }).join(', ');
  };

  const formatDays = (days: string[]) => {
    if (!days || days.length === 0) return 'Every day';
    return days.join(', ');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading medicines...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
      <ScreenHeader
        title="My medicines"
        subtitle="Track your daily medications"
        right={
          <Button size="sm" icon="plus" onPress={handleAddMedicine}>
            Add
          </Button>
        }
      />

      <FilterChipBar items={FILTER_ITEMS} value={filter} onChange={setFilter} />

        {filteredMedicines.length === 0 ? (
          <EmptyState
            illustration="pill"
            title={filter === 'All' ? 'No medicines yet' : `No ${filter.toLowerCase()} medicines`}
            description={filter === 'All' ? 'Start by adding your first medicine to track your health journey' : 'Try a different filter or add a medicine'}
            action={filter === 'All' ? (
              <Button variant="primary" size="lg" onPress={handleAddMedicine} icon="plus">
                Add Your First Medicine
              </Button>
            ) : undefined}
          />
        ) : (
          <View style={styles.medicinesList}>
            {filteredMedicines.map((medicine) => (
              <Card key={medicine.id} style={styles.medicineCard} accessibilityLabel={`${medicine.name}, ${medicine.dosage}, ${medicine.is_active ? 'Active' : 'Inactive'}`}>
                <Card.Content style={styles.medicineContent}>
                  <View style={styles.medicineHeader}>
                    <View style={styles.medicineInfo}>
                      <Text style={styles.medicineName}>{medicine.name}</Text>
                      <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
                    </View>
                    <View style={styles.medicineActions}>
                      <Chip
                        mode="outlined"
                        style={styles.statusChip}
                        textStyle={styles.statusChip}
                        selectedColor={medicine.is_active ? colors.success[600] : colors.neutral[500]}
                      >
                        {getStatusText(medicine.is_active)}
                      </Chip>
                      <Menu
                        visible={menuVisible === medicine.id}
                        onDismiss={() => setMenuVisible(null)}
                        anchor={
                          <IconButton
                            icon="dots-vertical"
                            size={20}
                            onPress={() => setMenuVisible(medicine.id)}
                            iconColor={colors.neutral[600]}
                            accessibilityLabel="Medicine options"
                          />
                        }
                      >
                        <Menu.Item
                          onPress={() => {
                            setMenuVisible(null);
                            handleEditMedicine(medicine);
                          }}
                          title="Edit"
                          leadingIcon="pencil"
                        />
                        <Divider />
                        <Menu.Item
                          onPress={() => {
                            setMenuVisible(null);
                            handleDeleteMedicine(medicine.id);
                          }}
                          title="Delete"
                          leadingIcon="delete"
                          titleStyle={{ color: colors.error[500] }}
                        />
                      </Menu>
                    </View>
                  </View>
                  
                  <View style={styles.medicineDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Frequency:</Text>
                      <Text style={styles.detailValue}>{medicine.frequency}</Text>
                    </View>
                    {medicine.times && medicine.times.length > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Times:</Text>
                        <Text style={styles.detailValue}>{formatTimes(medicine.times)}</Text>
                      </View>
                    )}
                    {medicine.days && medicine.days.length > 0 && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Days:</Text>
                        <Text style={styles.detailValue}>{formatDays(medicine.days)}</Text>
                      </View>
                    )}
                    {medicine.notes && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Notes:</Text>
                        <Text style={styles.detailValue}>{medicine.notes}</Text>
                      </View>
                    )}
                  </View>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {medicines.length > 0 && (
        <FAB
          icon="plus"
          style={styles.fab}
          onPress={handleAddMedicine}
          label="Add Medicine"
          color={colors.neutral[50]}
          accessibilityLabel="Add Medicine"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[50],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  header: {
    backgroundColor: colors.neutral[50],
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[200],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.neutral[900],
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: colors.neutral[500],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAddButton: {
    margin: 0,
  },
  addButton: {},
  addButtonText: {},
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconContainer: {
    backgroundColor: colors.primary[100],
    borderRadius: 20,
    padding: 10,
    marginBottom: 16,
  },
  emptyIcon: {},
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.neutral[600],
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  medicinesList: {
    padding: 16,
  },
  medicineCard: {
    marginBottom: 12,
    borderRadius: 16,
  },
  medicineContent: {
    padding: 20,
  },
  medicineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  medicineInfo: {
    flex: 1,
  },
  medicineName: {
    color: colors.primary[700],
    marginBottom: 4,
  },
  medicineDosage: {
    color: colors.neutral[600],
  },
  medicineActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusChip: {
    marginRight: 8,
  },
  medicineDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    color: colors.neutral[600],
    width: 80,
    marginRight: 8,
  },
  detailValue: {
    color: colors.neutral[800],
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: colors.primary[500],
  },
});
