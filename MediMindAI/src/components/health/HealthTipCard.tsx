import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { HealthTip } from '../../services/healthTips';

interface HealthTipCardProps {
  tip: HealthTip;
  onPress?: () => void;
  showCategory?: boolean;
  compact?: boolean;
}

export const HealthTipCard: React.FC<HealthTipCardProps> = ({
  tip,
  onPress,
  showCategory = true,
  compact = false,
}) => {
  const getCategoryEmoji = (category: string): string => {
    switch (category) {
      case 'nutrition':
        return '🥗';
      case 'exercise':
        return '🏃‍♂️';
      case 'mental_health':
        return '🧘‍♀️';
      case 'medication':
        return '💊';
      case 'general':
        return '💪';
      default:
        return '💡';
    }
  };

  const getCategoryName = (category: string): string => {
    switch (category) {
      case 'nutrition':
        return 'Nutrition';
      case 'exercise':
        return 'Exercise';
      case 'mental_health':
        return 'Mental Health';
      case 'medication':
        return 'Medication';
      case 'general':
        return 'General Wellness';
      default:
        return 'Health Tip';
    }
  };

  const getCategoryColor = (category: string): string => {
    switch (category) {
      case 'nutrition':
        return '#4CAF50';
      case 'exercise':
        return '#2196F3';
      case 'mental_health':
        return '#9C27B0';
      case 'medication':
        return '#FF9800';
      case 'general':
        return '#607D8B';
      default:
        return '#757575';
    }
  };

  const CardContent = () => (
    <View style={[styles.container, compact && styles.compactContainer]}>
      <View style={styles.header}>
        <Text style={[styles.title, compact && styles.compactTitle]}>
          {tip.title}
        </Text>
        {showCategory && (
          <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(tip.category) }]}>
            <Text style={styles.categoryEmoji}>{getCategoryEmoji(tip.category)}</Text>
            <Text style={styles.categoryText}>{getCategoryName(tip.category)}</Text>
          </View>
        )}
      </View>
      
      <Text style={[styles.content, compact && styles.compactContent]}>
        {tip.content}
      </Text>
      
      {!compact && (
        <Text style={styles.timestamp}>
          {tip.timestamp.toLocaleDateString()} at {tip.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        style={[styles.touchable, compact && styles.compactTouchable]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <CardContent />
      </TouchableOpacity>
    );
  }

  return <CardContent />;
};

const styles = StyleSheet.create({
  touchable: {
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  compactTouchable: {
    marginVertical: 4,
    marginHorizontal: 8,
  },
  container: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  compactContainer: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  compactTitle: {
    fontSize: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 80,
    justifyContent: 'center',
  },
  categoryEmoji: {
    fontSize: 12,
    marginRight: 4,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#fff',
  },
  content: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  compactContent: {
    fontSize: 13,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default HealthTipCard;
