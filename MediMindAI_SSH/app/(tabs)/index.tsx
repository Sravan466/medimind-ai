// Home/Dashboard Screen for MediMind AI - Inspired by MacroFactor's clean dashboard

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Image } from 'react-native';
import { Text, Surface, Card, Chip, ActivityIndicator, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { medicineService } from '../../src/services/supabase';
import { useNotifications } from '../../src/hooks/useNotifications';
import { useHealthTips } from '../../src/hooks/useHealthTips';
import { useTodayMedicines } from '../../src/hooks/useTodayMedicines';
import { healthTipsService } from '../../src/services/healthTips';
import { Medicine } from '../../src/types/database';
import { colors } from '../../src/styles/theme';
import { Button } from '../../src/components/ui/Button';
import { APP_CONFIG } from '../../src/utils/constants';

export default function HomeScreen() {
  const { user, profile } = useAuthContext();
  const { scheduleMedicineReminder } = useNotifications();
  const { currentTip, isHealthTipsEnabled } = useHealthTips();
  const { todayMedicines, markAsTaken, markAsSkipped, refresh: refreshTodayMedicines } = useTodayMedicines();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Today medicines loaded

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
      
      setMedicines(data || []);
    } catch (error) {
      console.error('Error loading medicines:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadMedicines(),
      refreshTodayMedicines()
    ]);
    setRefreshing(false);
  };

  const handleAddMedicine = () => {
    router.push('/(tabs)/add-medicine');
  };

  const handleViewMedicine = (medicine: Medicine) => {
    router.push(`/(tabs)/edit-medicine?medicine=${encodeURIComponent(JSON.stringify(medicine))}`);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getActiveMedicines = () => {
    return medicines.filter(medicine => medicine.is_active);
  };

  const getRecentMedicines = () => {
    return medicines
      .filter(medicine => medicine.is_active)
      .slice(0, 3);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
            {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <View style={styles.greetingContainer}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
                 {/* Overview Card */}
         <Card style={styles.overviewCard}>
           <Card.Content style={styles.overviewContent}>
             <View style={styles.overviewHeader}>
               <MaterialCommunityIcons 
                 name="pill" 
                 size={24} 
                 color={colors.primary[600]} 
               />
               <Text style={styles.overviewTitle}>Medicine Overview</Text>
             </View>
             
             <View style={styles.overviewStats}>
               <View style={styles.statItem}>
                 <Text style={styles.statNumber}>{getActiveMedicines().length}</Text>
                 <Text style={styles.statLabel}>Active</Text>
               </View>
               <View style={styles.statDivider} />
               <View style={styles.statItem}>
                 <Text style={styles.statNumber}>{medicines.length}</Text>
                 <Text style={styles.statLabel}>Total</Text>
               </View>
               <View style={styles.statDivider} />
               <View style={styles.statItem}>
                 <Text style={styles.statNumber}>
                   {medicines.filter(m => m.is_active && m.times && m.times.length > 0).length}
                 </Text>
                 <Text style={styles.statLabel}>Scheduled</Text>
               </View>
             </View>
           </Card.Content>
         </Card>

                   {/* Today Medicines */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today Medicines</Text>
              <Button
                variant="outline"
                onPress={refreshTodayMedicines}
                style={styles.refreshButton}
                labelStyle={styles.smallButtonText}
              >
                Refresh
              </Button>
            </View>
            
            {todayMedicines.filter(medicine => medicine.status === 'pending' || medicine.status === 'due').length > 0 ? (
              <View style={styles.todayMedicinesList}>
                {todayMedicines
                  .filter(medicine => medicine.status === 'pending' || medicine.status === 'due')
                  .map((medicine, index) => (
                  <Card key={medicine.id} style={styles.todayMedicineCard}>
                    <Card.Content style={styles.todayMedicineContent}>
                      <View style={styles.todayMedicineHeader}>
                        <View style={styles.medicineNumber}>
                          <Text style={styles.medicineNumberText}>{index + 1}.</Text>
                        </View>
                        <View style={styles.todayMedicineInfo}>
                          <Text style={styles.todayMedicineName}>{medicine.medicineName}</Text>
                          <Text style={styles.todayMedicineDosage}>{medicine.dosage}</Text>
                          <Text style={styles.todayMedicineTime}>Time: {medicine.scheduledTime}</Text>
                        </View>
                        <View style={styles.checkboxContainer}>
                          {medicine.status === 'taken' ? (
                            <MaterialCommunityIcons 
                              name="check-circle" 
                              size={32} 
                              color={colors.success[600]} 
                            />
                          ) : medicine.status === 'skipped' ? (
                            <MaterialCommunityIcons 
                              name="close-circle" 
                              size={32} 
                              color={colors.error[600]} 
                            />
                          ) : (
                            <View style={styles.checkboxActions}>
                              <IconButton
                                icon="check-circle-outline"
                                size={28}
                                iconColor={colors.success[600]}
                                onPress={() => markAsTaken(medicine.id)}
                                style={styles.checkboxButton}
                              />
                              <IconButton
                                icon="close-circle-outline"
                                size={28}
                                iconColor={colors.error[600]}
                                onPress={() => markAsSkipped(medicine.id)}
                                style={styles.checkboxButton}
                              />
                            </View>
                          )}
                        </View>
                      </View>
                      
                      {medicine.status === 'taken' && medicine.takenTime && (
                        <View style={styles.takenInfo}>
                          <Text style={styles.takenText}>
                            Taken at {new Date(medicine.takenTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                ))}
              </View>
            ) : (
              <View style={styles.emptyTodayContainer}>
                <MaterialCommunityIcons 
                  name="calendar-clock" 
                  size={48} 
                  color={colors.neutral[400]} 
                />
                                 <Text style={styles.emptyTodayTitle}>
                   {todayMedicines.filter(med => med.status === 'taken' || med.status === 'skipped').length > 0 ? 'All medicines completed for today!' : 'No medicines scheduled for today'}
                 </Text>
                                 <Text style={styles.emptyTodaySubtitle}>
                   {todayMedicines.filter(med => med.status === 'taken' || med.status === 'skipped').length > 0 
                     ? 'Great job! You\'ve taken all your scheduled medicines.'
                     : 'Add medicines with scheduled times to see them here'
                   }
                 </Text>
              </View>
            )}
            
            {/* Show completed medicines summary */}
            {todayMedicines.filter(medicine => medicine.status === 'taken' || medicine.status === 'skipped').length > 0 && (
              <View style={styles.completedSection}>
                <Text style={styles.completedTitle}>
                  Completed Today ({todayMedicines.filter(m => m.status === 'taken').length} taken, {todayMedicines.filter(m => m.status === 'skipped').length} skipped)
                </Text>
                <View style={styles.completedList}>
                  {todayMedicines
                    .filter(medicine => medicine.status === 'taken' || medicine.status === 'skipped')
                    .map((medicine) => (
                      <View key={medicine.id} style={styles.completedItem}>
                        <MaterialCommunityIcons 
                          name={medicine.status === 'taken' ? 'check-circle' : 'close-circle'} 
                          size={20} 
                          color={medicine.status === 'taken' ? colors.success[600] : colors.error[600]} 
                        />
                        <Text style={styles.completedText}>
                          {medicine.medicineName} - {medicine.scheduledTime}
                        </Text>
                      </View>
                    ))}
                </View>
              </View>
            )}
          </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <View style={styles.actionButton} onTouchEnd={handleAddMedicine}>
              <View style={styles.actionButtonContent}>
                <MaterialCommunityIcons 
                  name="plus-circle" 
                  size={32} 
                  color={colors.primary[500]} 
                />
                <Text style={styles.actionButtonText}>Add Medicine</Text>
              </View>
            </View>
            
            <View style={styles.actionButton} onTouchEnd={() => router.push('/(tabs)/medicines')}>
              <View style={styles.actionButtonContent}>
                <MaterialCommunityIcons 
                  name="pill" 
                  size={32} 
                  color={colors.info[500]} 
                />
                <Text style={styles.actionButtonText}>View All</Text>
              </View>
            </View>
            
            <View style={styles.actionButton} onTouchEnd={() => router.push('/(tabs)/chat')}>
              <View style={styles.actionButtonContent}>
                <MaterialCommunityIcons 
                  name="chat" 
                  size={32} 
                  color={colors.success[500]} 
                />
                <Text style={styles.actionButtonText}>Ask {APP_CONFIG.AI_ASSISTANT.NAME}</Text>
              </View>
            </View>
            
            <View style={styles.actionButton} onTouchEnd={() => router.push('/(tabs)/info')}>
              <View style={styles.actionButtonContent}>
                <MaterialCommunityIcons 
                  name="information" 
                  size={32} 
                  color={colors.warning[500]} 
                />
                <Text style={styles.actionButtonText}>Medicine Info</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Medicines */}
        {getRecentMedicines().length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Medicines</Text>
                             <Button
                 variant="outline"
                 onPress={() => router.push('/(tabs)/medicines')}
                 style={styles.viewAllButton}
                 labelStyle={styles.smallButtonText}
               >
                 View All
               </Button>
            </View>
            
            <View style={styles.medicinesList}>
              {getRecentMedicines().map((medicine) => (
                <Card
                  key={medicine.id}
                  style={styles.medicineCard}
                  onTouchEnd={() => handleViewMedicine(medicine)}
                >
                  <Card.Content style={styles.medicineContent}>
                    <View style={styles.medicineHeader}>
                      <View style={styles.medicineInfo}>
                        <Text style={styles.medicineName}>{medicine.name}</Text>
                        <Text style={styles.medicineDosage}>{medicine.dosage}</Text>
                      </View>
                      <Chip
                        mode="outlined"
                        style={styles.statusChip}
                        textStyle={styles.statusChipText}
                        selectedColor={medicine.is_active ? colors.success[600] : colors.neutral[500]}
                      >
                        {medicine.is_active ? 'Active' : 'Inactive'}
                      </Chip>
                    </View>
                    
                    <View style={styles.medicineDetails}>
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Frequency:</Text>
                        <Text style={styles.detailValue}>{medicine.frequency}</Text>
                      </View>
                      {medicine.times && medicine.times.length > 0 && (
                        <View style={styles.detailRow}>
                          <Text style={styles.detailLabel}>Times:</Text>
                          <Text style={styles.detailValue}>{medicine.times.join(', ')}</Text>
                        </View>
                      )}
                    </View>
                  </Card.Content>
                </Card>
              ))}
            </View>
          </View>
        )}

        {/* Daily Health Tip */}
        {isHealthTipsEnabled && currentTip && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Health Tip</Text>
              <View style={styles.healthTipActions}>
                <IconButton
                  icon="bell-outline"
                  size={20}
                  iconColor={colors.primary[600]}
                  onPress={() => {
                    // Send immediate health tip notification
                    healthTipsService.sendImmediateHealthTip(user?.id);
                  }}
                  style={styles.notificationButton}
                />
                                 <Button
                   variant="outline"
                   onPress={() => {
                     // Generate new tip
                     healthTipsService.generateDailyHealthTip(user?.id);
                   }}
                   style={styles.viewAllButton}
                   labelStyle={styles.smallButtonText}
                 >
                   New Tip
                 </Button>
              </View>
            </View>
            
            <Card style={styles.healthTipCard}>
              <Card.Content style={styles.healthTipContent}>
                <View style={styles.healthTipHeader}>
                  <MaterialCommunityIcons 
                    name="lightbulb" 
                    size={24} 
                    color={colors.warning[600]} 
                  />
                  <Text style={styles.healthTipTitle}>{currentTip.title}</Text>
                </View>
                <Text style={styles.healthTipText}>{currentTip.content}</Text>
                <View style={styles.healthTipFooter}>
                  <Chip
                    mode="outlined"
                    style={styles.categoryChip}
                    textStyle={styles.categoryChipText}
                  >
                    {currentTip.category.replace('_', ' ').toUpperCase()}
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Empty State */}
        {medicines.length === 0 && (
          <View style={styles.emptyContainer}>
                         <MaterialCommunityIcons 
               name="pill" 
               size={64} 
               color={colors.neutral[400]} 
             />
            <Text style={styles.emptyTitle}>No medicines yet</Text>
            <Text style={styles.emptySubtitle}>
              Start by adding your first medicine to track your health journey
            </Text>
            <Button
              variant="primary"
              onPress={handleAddMedicine}
              style={styles.addButton}
              labelStyle={styles.addButtonText}
              icon="plus"
            >
              Add Your First Medicine
            </Button>
          </View>
        )}
      </ScrollView>
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
  loadingText: {
    marginTop: 16,
    color: colors.neutral[600],
    fontSize: 16,
  },
  header: {
    backgroundColor: colors.neutral[50],
    paddingTop: 40, // Reduced from 50 to fix extra white spacing
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 2,
    borderBottomColor: colors.neutral[900],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greetingContainer: {
    marginBottom: 4,
  },
  greeting: {
    fontSize: 16,
    color: colors.neutral[600],
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  overviewCard: {
    marginBottom: 24,
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  overviewContent: {
    padding: 20,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  overviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginLeft: 12,
  },
  overviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary[700],
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.neutral[200],
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
  },
  viewAllButton: {
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: '48%',
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    padding: 16,
  },
  actionButtonContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
    textAlign: 'center',
  },
  medicinesList: {
    gap: 12,
  },
  medicineCard: {
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  medicineContent: {
    padding: 16,
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
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  medicineDosage: {
    fontSize: 14,
    color: colors.neutral[600],
  },
  statusChip: {
    marginLeft: 12,
  },
  statusChipText: {
    fontSize: 12,
  },
  medicineDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: colors.neutral[600],
    width: 80,
    marginRight: 8,
  },
  detailValue: {
    fontSize: 14,
    color: colors.neutral[800],
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 40,
  },
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
  addButton: {
    minWidth: 200,
    backgroundColor: colors.primary[500],
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  healthTipCard: {
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    backgroundColor: colors.warning[50],
    borderLeftWidth: 4,
    borderLeftColor: colors.warning[400],
  },
  healthTipContent: {
    padding: 16,
  },
  healthTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  healthTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginLeft: 8,
    flex: 1,
  },
  healthTipText: {
    fontSize: 14,
    color: colors.neutral[700],
    lineHeight: 20,
    marginBottom: 12,
  },
  healthTipFooter: {
    alignItems: 'flex-start',
  },
  categoryChip: {
    backgroundColor: colors.warning[100],
    borderColor: colors.warning[300],
  },
  categoryChipText: {
    fontSize: 10,
    color: colors.warning[700],
    fontWeight: '500',
  },
  healthTipActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
     notificationButton: {
     margin: 0,
     marginRight: 8,
   },
   // Today Medicines Styles
   refreshButton: {
     minWidth: 0,
     paddingHorizontal: 12,
   },
   smallButtonText: {
     fontSize: 12,
   },
   todayMedicinesList: {
     gap: 12,
   },
   todayMedicineCard: {
     borderRadius: 12,
     elevation: 1,
     shadowColor: colors.neutral[900],
     shadowOffset: { width: 0, height: 1 },
     shadowOpacity: 0.05,
     shadowRadius: 4,
   },
   todayMedicineContent: {
     padding: 16,
   },
   todayMedicineHeader: {
     flexDirection: 'row',
     alignItems: 'center',
   },
   medicineNumber: {
     width: 30,
     alignItems: 'center',
     marginRight: 12,
   },
   medicineNumberText: {
     fontSize: 16,
     fontWeight: 'bold',
     color: colors.neutral[700],
   },
   todayMedicineInfo: {
     flex: 1,
   },
   todayMedicineName: {
     fontSize: 16,
     fontWeight: 'bold',
     color: colors.neutral[900],
     marginBottom: 4,
   },
   todayMedicineDosage: {
     fontSize: 14,
     color: colors.neutral[600],
     marginBottom: 2,
   },
   todayMedicineTime: {
     fontSize: 14,
     color: colors.neutral[500],
     fontStyle: 'italic',
   },
   checkboxContainer: {
     marginLeft: 12,
   },
   checkboxActions: {
     flexDirection: 'row',
     gap: 4,
   },
   checkboxButton: {
     margin: 0,
   },
   takenInfo: {
     marginTop: 8,
     paddingTop: 8,
     borderTopWidth: 1,
     borderTopColor: colors.neutral[200],
   },
       takenText: {
      fontSize: 12,
      color: colors.success[600],
      fontStyle: 'italic',
    },
    emptyTodayContainer: {
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.neutral[50],
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral[200],
      borderStyle: 'dashed',
    },
    emptyTodayTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.neutral[700],
      marginTop: 12,
      marginBottom: 4,
    },
    emptyTodaySubtitle: {
      fontSize: 14,
      color: colors.neutral[600],
      textAlign: 'center',
      lineHeight: 20,
    },
    // Completed medicines styles
    completedSection: {
      marginTop: 16,
      padding: 16,
      backgroundColor: colors.neutral[50],
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.neutral[200],
    },
    completedTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.neutral[700],
      marginBottom: 8,
    },
    completedList: {
      gap: 6,
    },
    completedItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    completedText: {
      fontSize: 13,
      color: colors.neutral[600],
    },
  });
