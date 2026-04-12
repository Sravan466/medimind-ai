import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ImageSourcePropType,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, screenTypography } from '../../styles/theme';
import { ErrorBanner } from '../ui/ErrorBanner';

interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  logo?: ImageSourcePropType;
  errorMessage?: string;
  onDismissError?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthScaffold: React.FC<AuthScaffoldProps> = ({
  title,
  subtitle,
  logo,
  errorMessage,
  onDismissError,
  children,
  footer,
}) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            {logo ? <Image source={logo} style={styles.logo} resizeMode="contain" /> : null}
            <Text style={styles.title} accessibilityRole="header">{title}</Text>
            {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          </View>
          {errorMessage ? (
            <ErrorBanner message={errorMessage} onDismiss={onDismissError} />
          ) : null}
          <View style={styles.body}>{children}</View>
          {footer ? <View style={styles.footer}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    width: 56,
    height: 56,
    marginBottom: spacing.md,
  },
  title: {
    ...screenTypography.screenTitle,
    color: colors.neutral[900],
    textAlign: 'center',
  },
  subtitle: {
    ...screenTypography.screenSubtitle,
    color: colors.neutral[600],
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  body: {},
  footer: {
    marginTop: spacing.xl,
  },
});
