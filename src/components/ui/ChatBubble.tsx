import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../../styles/theme';

interface ChatBubbleProps {
  role: 'user' | 'bot';
  text: string;
  timestamp?: string;
}

const ChatBubbleImpl: React.FC<ChatBubbleProps> = ({ role, text, timestamp }) => {
  const isUser = role === 'user';
  return (
    <View style={[styles.row, isUser ? styles.rowEnd : styles.rowStart]}>
      <View
        style={[
          styles.bubble,
          isUser ? styles.user : styles.bot,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`${isUser ? 'You said' : 'Cura said'}: ${text}`}
      >
        <Text style={[styles.text, isUser ? styles.userText : styles.botText]}>
          {text}
        </Text>
        {timestamp ? (
          <Text style={[styles.time, isUser ? styles.userTime : styles.botTime]}>
            {timestamp}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

export const ChatBubble = React.memo(ChatBubbleImpl);

const styles = StyleSheet.create({
  row: {
    width: '100%',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm + 2,
    flexDirection: 'row',
  },
  rowStart: {
    justifyContent: 'flex-start',
  },
  rowEnd: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '82%',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderRadius: 16,
  },
  user: {
    backgroundColor: colors.primary[600],
    borderBottomRightRadius: 4,
  },
  bot: {
    backgroundColor: colors.neutral[100],
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: { color: '#FFFFFF' },
  botText: { color: colors.neutral[900] },
  time: {
    fontSize: 11,
    marginTop: 4,
  },
  userTime: { color: 'rgba(255,255,255,0.75)', textAlign: 'right' },
  botTime: { color: colors.neutral[500] },
});
