// Medicine Information Screen for MediMind AI

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Text, Card, TextInput, IconButton, ActivityIndicator, Chip, Divider } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAI } from '../../src/hooks/useAI';
import { colors } from '../../src/styles/theme';
import { Button } from '../../src/components/ui/Button';

// Sample medicine database for autocomplete
const MEDICINE_DATABASE = [
  'Paracetamol', 'Paracip', 'Paracetamol 500mg', 'Paracetamol 650mg',
  'Ibuprofen', 'Brufen', 'Advil', 'Motrin',
  'Aspirin', 'Disprin', 'Ecosprin',
  'Omeprazole', 'Pantoprazole', 'Esomeprazole',
  'Cetirizine', 'Zyrtec', 'Allertec',
  'Amoxicillin', 'Azithromycin', 'Ciprofloxacin',
  'Metformin', 'Glimepiride', 'Insulin',
  'Atorvastatin', 'Simvastatin', 'Rosuvastatin',
  'Amlodipine', 'Losartan', 'Enalapril',
  'Diclofenac', 'Naproxen', 'Celecoxib',
  'Loratadine', 'Fexofenadine', 'Desloratadine',
  'Ranitidine', 'Famotidine', 'Cimetidine',
  'Dextromethorphan', 'Guaifenesin', 'Pseudoephedrine',
  'Diphenhydramine', 'Doxylamine', 'Melatonin',
  'Vitamin D', 'Vitamin C', 'Calcium',
  'Iron', 'Folic Acid', 'B12',
  'Probiotics', 'Omega-3', 'Magnesium'
];

export default function InfoScreen() {
  const { medicineInfo, loading, error, getMedicineInfo, clearError, clearMedicineInfo } = useAI();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isVoiceSearching, setIsVoiceSearching] = useState(false);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches();
  }, []);

  // Generate search suggestions
  useEffect(() => {
    if (searchQuery.trim().length > 2) {
      const filtered = MEDICINE_DATABASE.filter(medicine =>
        medicine.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  const loadRecentSearches = async () => {
    try {
      const recent = await AsyncStorage.getItem('recentMedicineSearches');
      if (recent) {
        setRecentSearches(JSON.parse(recent));
      }
    } catch (error) {
      console.error('Error loading recent searches:', error);
    }
  };

  const saveRecentSearch = async (search: string) => {
    try {
      const updated = [search, ...recentSearches.filter(s => s !== search)].slice(0, 5);
      setRecentSearches(updated);
      await AsyncStorage.setItem('recentMedicineSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving recent search:', error);
    }
  };

  const handleSearch = async (query?: string) => {
    const searchTerm = query || searchQuery.trim();
    if (searchTerm) {
      await saveRecentSearch(searchTerm);
      await getMedicineInfo(searchTerm);
      setShowSuggestions(false);
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setSearchQuery(suggestion);
    handleSearch(suggestion);
  };

  const handleRecentSearch = (search: string) => {
    setSearchQuery(search);
    handleSearch(search);
  };

  const handleVoiceSearch = () => {
    // TODO: Implement voice search functionality
    setIsVoiceSearching(true);
    // Simulate voice search
    setTimeout(() => {
      setIsVoiceSearching(false);
      // For now, just show an alert
      Alert.alert('Voice Search', 'Voice search functionality will be implemented soon!');
    }, 2000);
  };

  const handleClear = () => {
    setSearchQuery('');
    clearMedicineInfo();
    setShowSuggestions(false);
  };

  const formatInfo = (info: string) => {
    return info.split('\n').map((line, index) => (
      <Text key={index} style={styles.infoText}>
        {line}
      </Text>
    ));
  };

  return (
    <View style={styles.container}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Medicine Information</Text>
            <Text style={styles.headerSubtitle}>
              Search for detailed medicine information and safety data
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Section */}
        <Card style={styles.searchCard}>
          <Card.Content style={styles.searchContent}>
            <View style={styles.searchHeader}>
              <MaterialCommunityIcons 
                name="magnify" 
                size={24} 
                color={colors.primary[600]} 
              />
              <Text style={styles.searchTitle}>Search Medicine</Text>
            </View>
            
            <View style={styles.searchInputContainer}>
              <TextInput
                mode="outlined"
                placeholder="Enter medicine name..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onSubmitEditing={() => handleSearch()}
                style={styles.searchInput}
                outlineColor={colors.neutral[300]}
                activeOutlineColor={colors.primary[500]}
                right={
                  <View style={styles.searchInputIcons}>
                    <TextInput.Icon
                      icon={isVoiceSearching ? "loading" : "microphone"}
                      onPress={handleVoiceSearch}
                    />
                    <TextInput.Icon
                      icon={loading ? "loading" : "magnify"}
                      onPress={() => handleSearch()}
                      disabled={!searchQuery.trim() || loading}
                    />
                  </View>
                }
              />
            </View>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionItem}
                    onPress={() => handleSuggestion(suggestion)}
                  >
                    <MaterialCommunityIcons 
                      name="pill" 
                      size={16} 
                      color={colors.neutral[500]} 
                    />
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Recent Searches */}
            {!showSuggestions && recentSearches.length > 0 && !medicineInfo && (
              <View style={styles.recentSearchesContainer}>
                <View style={styles.recentHeader}>
                  <MaterialCommunityIcons 
                    name="history" 
                    size={16} 
                    color={colors.neutral[600]} 
                  />
                  <Text style={styles.recentTitle}>Recent Searches</Text>
                </View>
                <View style={styles.recentItems}>
                  {recentSearches.slice(0, 3).map((search, index) => (
                    <Chip
                      key={index}
                      mode="outlined"
                      onPress={() => handleRecentSearch(search)}
                      style={styles.recentChip}
                      textStyle={styles.recentChipText}
                      selectedColor={colors.primary[600]}
                    >
                      {search}
                    </Chip>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.searchActions}>
              <Button
                variant="primary"
                onPress={() => handleSearch()}
                disabled={!searchQuery.trim() || loading}
                style={styles.searchButton}
                loading={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </Button>
              <Button
                variant="outline"
                onPress={handleClear}
                disabled={loading}
                style={styles.clearButton}
              >
                Clear
              </Button>
            </View>
          </Card.Content>
        </Card>

        {/* Error Display */}
        {error && (
          <Card style={styles.errorCard}>
            <Card.Content style={styles.errorContent}>
              <MaterialCommunityIcons 
                name="alert-circle" 
                size={24} 
                color={colors.error[500]} 
              />
              <Text style={styles.errorText}>{error}</Text>
              <IconButton
                icon="close"
                size={16}
                onPress={clearError}
                iconColor={colors.error[500]}
              />
            </Card.Content>
          </Card>
        )}

        {/* Loading State */}
        {loading && (
          <Card style={styles.loadingCard}>
            <Card.Content style={styles.loadingContent}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
              <Text style={styles.loadingText}>Searching for medicine information...</Text>
              <Text style={styles.loadingSubtext}>This may take a few seconds</Text>
            </Card.Content>
          </Card>
        )}

        {/* Medicine Information Display */}
        {medicineInfo && !loading && (
          <View style={styles.infoSection}>
            <Card style={styles.infoCard}>
              <Card.Content style={styles.infoContent}>
                <View style={styles.infoHeader}>
                  <MaterialCommunityIcons 
                    name="pill" 
                    size={24} 
                    color={colors.primary[600]} 
                  />
                  <Text style={styles.infoTitle}>{medicineInfo.medicineName}</Text>
                </View>
                
                <View style={styles.infoDivider} />
                
                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="information" 
                      size={20} 
                      color={colors.info[600]} 
                    />
                    <Text style={styles.sectionTitle}>Description</Text>
                  </View>
                  <Text style={styles.sectionText}>{medicineInfo.description}</Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="target" 
                      size={20} 
                      color={colors.success[600]} 
                    />
                    <Text style={styles.sectionTitle}>Uses</Text>
                  </View>
                  <Text style={styles.sectionText}>{medicineInfo.uses}</Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="alert" 
                      size={20} 
                      color={colors.warning[600]} 
                    />
                    <Text style={styles.sectionTitle}>Side Effects</Text>
                  </View>
                  <Text style={styles.sectionText}>{medicineInfo.sideEffects}</Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="scale-balance" 
                      size={20} 
                      color={colors.primary[600]} 
                    />
                    <Text style={styles.sectionTitle}>Dosage Information</Text>
                  </View>
                  <Text style={styles.sectionText}>{medicineInfo.dosageInfo}</Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="link-variant" 
                      size={20} 
                      color={colors.error[600]} 
                    />
                    <Text style={styles.sectionTitle}>Drug Interactions</Text>
                  </View>
                  <Text style={styles.sectionText}>{medicineInfo.interactions}</Text>
                </View>

                <View style={styles.infoSection}>
                  <View style={styles.sectionHeader}>
                    <MaterialCommunityIcons 
                      name="exclamation" 
                      size={20} 
                      color={colors.error[600]} 
                    />
                    <Text style={styles.sectionTitle}>Warnings</Text>
                  </View>
                  <Text style={styles.sectionText}>{medicineInfo.warnings}</Text>
                </View>

                <View style={styles.disclaimer}>
                  <Chip
                    mode="outlined"
                    icon="medical-bag"
                    style={styles.disclaimerChip}
                    textStyle={styles.disclaimerText}
                    selectedColor={colors.neutral[700]}
                  >
                    Always consult your healthcare provider for medical advice
                  </Chip>
                </View>
              </Card.Content>
            </Card>
          </View>
        )}

        {/* Empty State */}
        {!medicineInfo && !loading && !error && (
          <Card style={styles.emptyCard}>
            <Card.Content style={styles.emptyContent}>
              <View style={styles.emptyImageContainer}>
                <Image
                  source={require('../../assets/medicine-search-empty.png')}
                  style={styles.emptyImage}
                  resizeMode="contain"
                />
              </View>
              <Text style={styles.emptyTitle}>Search for Medicine Information</Text>
              <Text style={styles.emptySubtitle}>
                Enter a medicine name above to get detailed information about uses, side effects, dosage, and interactions.
              </Text>
            </Card.Content>
          </Card>
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
  header: {
    backgroundColor: colors.neutral[50],
    paddingTop: 50, // Safe area for status bar
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  searchCard: {
    marginBottom: 20,
    borderRadius: 16,
    elevation: 4,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  searchContent: {
    padding: 20,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  searchTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginLeft: 12,
  },
  searchInputContainer: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: colors.neutral[50],
    borderColor: colors.primary[200],
    borderWidth: 2,
    borderRadius: 12,
    elevation: 2,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  searchInputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionsContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: 12,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    elevation: 2,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  suggestionText: {
    marginLeft: 12,
    fontSize: 16,
    color: colors.neutral[700],
    fontWeight: '500',
  },
  recentSearchesContainer: {
    marginTop: 16,
  },
  recentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.neutral[600],
    marginLeft: 8,
  },
  recentItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recentChip: {
    backgroundColor: colors.neutral[100],
  },
  recentChipText: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  searchActions: {
    flexDirection: 'row',
    gap: 12,
  },
  searchButton: {
    flex: 1,
  },
  clearButton: {
    borderColor: colors.neutral[300],
  },
  errorCard: {
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.error[200],
    backgroundColor: colors.error[50],
  },
  errorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  errorText: {
    flex: 1,
    marginLeft: 12,
    color: colors.error[700],
    fontSize: 14,
  },
  loadingCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginTop: 16,
    color: colors.neutral[600],
    fontSize: 16,
  },
  loadingSubtext: {
    marginTop: 8,
    color: colors.neutral[500],
    fontSize: 14,
  },
  infoSection: {
    marginBottom: 20,
  },
  infoCard: {
    borderRadius: 16,
    elevation: 4,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  infoContent: {
    padding: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginLeft: 12,
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.neutral[200],
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.neutral[900],
    marginLeft: 8,
  },
  sectionText: {
    fontSize: 16,
    color: colors.neutral[700],
    lineHeight: 24,
  },
  disclaimer: {
    marginTop: 24,
    alignItems: 'center',
  },
  disclaimerChip: {
    backgroundColor: colors.neutral[50],
  },
  disclaimerText: {
    fontSize: 14,
    color: colors.neutral[700],
  },
  emptyCard: {
    borderRadius: 16,
    elevation: 2,
    shadowColor: colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyImageContainer: {
    width: 120,
    height: 120,
    marginBottom: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyImage: {
    width: '100%',
    height: '100%',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.neutral[700],
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    textAlign: 'center',
    lineHeight: 24,
  },
  infoText: {
    fontSize: 14,
    color: colors.neutral[700],
    lineHeight: 20,
    marginBottom: 8,
  },
});
