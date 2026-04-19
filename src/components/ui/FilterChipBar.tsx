import React from 'react';
import { ScrollView, Pressable, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius } from '../../styles/theme';

export interface FilterChipItem {
  value: string;
  label: string;
}

interface FilterChipBarProps {
  items: Array<string | FilterChipItem>;
  value: string;
  onChange: (value: string) => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

const normalize = (item: string | FilterChipItem): FilterChipItem =>
  typeof item === 'string' ? { value: item, label: item } : item;

export const FilterChipBar: React.FC<FilterChipBarProps> = ({
  items,
  value,
  onChange,
  style,
  contentStyle,
}) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[styles.container, style]}
      contentContainerStyle={[styles.content, contentStyle]}
    >
      {items.map((raw) => {
        const item = normalize(raw);
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            onPress={() => onChange(item.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={item.label}
            style={({ pressed }) => [
              styles.chip,
              selected && styles.chipSelected,
              pressed && !selected && styles.chipPressed,
            ]}
          >
            <Text style={[styles.label, selected && styles.labelSelected]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  chip: {
    minHeight: 32,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: borderRadius.chip,
    backgroundColor: colors.neutral[100],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipSelected: {
    backgroundColor: colors.primary[600],
    borderColor: colors.primary[600],
  },
  chipPressed: {
    backgroundColor: colors.neutral[200],
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.neutral[700],
  },
  labelSelected: {
    color: '#FFFFFF',
  },
});
