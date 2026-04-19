// Chat Screen for MediMind AI - Inspired by Lemonade's clean chat interface

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import {
  Text,
  TextInput,
  IconButton,
  Card,
  Avatar,
  Chip,
  ActivityIndicator,
  Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useChat, ChatMessage } from '../../src/hooks/useChat';
import { useAuthContext } from '../../src/contexts/AuthContext';
import { medicineService } from '../../src/services/supabase';
import { Medicine } from '../../src/types/database';
import { colors } from '../../src/styles/theme';
import { APP_CONFIG } from '../../src/utils/constants';
import { ScreenHeader } from '../../src/components/ui/ScreenHeader';

export default function ChatScreen() {
  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
    clearError,
  } = useChat();
  const { user } = useAuthContext();
  const [inputText, setInputText] = useState('');
  const [userMedicines, setUserMedicines] = useState<Medicine[]>([]);
  const [loadingMedicines, setLoadingMedicines] = useState(true);
  const [showMedicineBanner, setShowMedicineBanner] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load user's medicines for context
  useEffect(() => {
    if (user) {
      loadUserMedicines();
    }
  }, [user]);

  // Auto-hide medicine banner after 3 seconds
  useEffect(() => {
    if (userMedicines.length > 0 && showMedicineBanner) {
      const timer = setTimeout(() => {
        setShowMedicineBanner(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [userMedicines, showMedicineBanner]);

  const loadUserMedicines = async () => {
    if (!user) return;
    
    try {
      setLoadingMedicines(true);
      const { data, error } = await medicineService.getMedicines(user.id);
      if (error) {
        console.error('Error loading medicines for chat context:', error);
        return;
      }
      setUserMedicines(data || []);
    } catch (error) {
      console.error('Error loading medicines for chat context:', error);
    } finally {
      setLoadingMedicines(false);
    }
  };

  // Dynamic quick suggestions based on user's medicines
  const getQuickSuggestions = () => {
    const baseSuggestions = [
      'Medicine side effects',
      'Drug interactions',
      'Dosage timing',
      'Storage instructions',
      'Missed dose advice',
    ];

    // Add personalized suggestions based on user's medicines
    if (userMedicines.length > 0) {
      const medicineNames = userMedicines.map(m => m.name);
      const personalizedSuggestions = [
        `Side effects of ${medicineNames[0]}`,
        `Interactions with ${medicineNames.join(' and ')}`,
        `Dosage for ${medicineNames[0]}`,
      ];
      
      return [...personalizedSuggestions, ...baseSuggestions];
    }

    return baseSuggestions;
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = () => {
    if (inputText.trim() && !isLoading) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  const handleSuggestion = (suggestion: string) => {
    setInputText(suggestion);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Chat',
      'Are you sure you want to clear all messages?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearChat,
        },
      ]
    );
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format AI response text with proper line breaks and styling
  const formatAIResponse = (text: string) => {
    // Split by double line breaks to preserve paragraphs
    const paragraphs = text.split('\n\n');
    
    return paragraphs.map((paragraph, index) => {
      // Handle bullet points and lists
      if (paragraph.trim().startsWith('-') || paragraph.trim().startsWith('•')) {
        const lines = paragraph.split('\n');
        return (
          <View key={index} style={styles.paragraphContainer}>
            {lines.map((line, lineIndex) => (
              <View key={lineIndex} style={styles.bulletPoint}>
                <Text style={styles.bullet}>•</Text>
                <Text style={[styles.aiMessageText, styles.bulletText]}>
                  {line.replace(/^[-•]\s*/, '')}
                </Text>
              </View>
            ))}
          </View>
        );
      }
      
      // Handle bold text (text between **)
      if (paragraph.includes('**')) {
        const parts = paragraph.split(/(\*\*.*?\*\*)/g);
        return (
          <View key={index} style={styles.paragraphContainer}>
            <Text style={styles.aiMessageText}>
              {parts.map((part, partIndex) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <Text key={partIndex} style={[styles.aiMessageText, styles.boldText]}>
                      {part.slice(2, -2)}
                    </Text>
                  );
                }
                return part;
              })}
            </Text>
          </View>
        );
      }
      
      // Regular paragraph
      return (
        <View key={index} style={styles.paragraphContainer}>
          <Text style={styles.aiMessageText}>{paragraph}</Text>
        </View>
      );
    });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title={APP_CONFIG.AI_ASSISTANT.NAME}
        subtitle={APP_CONFIG.AI_ASSISTANT.TAGLINE}
        left={
          <Image
            source={require('../../assets/ai-avatar.png')}
            style={{ width: 40, height: 40, borderRadius: 20 }}
            accessibilityLabel="Cura avatar"
          />
        }
        right={
          <IconButton
            icon="dots-horizontal"
            size={24}
            onPress={handleClearChat}
            iconColor={colors.neutral[600]}
            accessibilityLabel="Chat options"
          />
        }
      />

      {/* Medicine Context Banner - Auto-hide after 3 seconds */}
      {userMedicines.length > 0 && showMedicineBanner && (
        <Card style={styles.medicineContextCard}>
          <Card.Content style={styles.medicineContextContent}>
            <MaterialCommunityIcons 
              name="pill" 
              size={20} 
              color={colors.primary[600]} 
            />
            <Text style={styles.medicineContextText}>
              {APP_CONFIG.AI_ASSISTANT.NAME} is aware of your medicines: {userMedicines.map(m => m.name).join(', ')}
            </Text>
            <IconButton
              icon="close"
              size={16}
              onPress={() => setShowMedicineBanner(false)}
              iconColor={colors.neutral[500]}
              accessibilityLabel="Dismiss medicine context"
            />
          </Card.Content>
        </Card>
      )}

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          accessibilityLiveRegion="polite"
          accessibilityLabel="Chat messages"
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={[
                styles.messageContainer,
                message.isUser ? styles.userMessageContainer : styles.aiMessageContainer,
              ]}
            >
              {!message.isUser && (
                <Avatar.Image
                  size={32}
                  source={require('../../assets/ai-avatar.png')}
                  style={styles.messageAvatar}
                />
              )}
              
              <View
                style={[
                  styles.messageBubble,
                  message.isUser ? styles.userMessageBubble : styles.aiMessageBubble,
                ]}
              >
                {message.loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={colors.primary[500]} />
                    <Text style={styles.loadingText}>{APP_CONFIG.AI_ASSISTANT.NAME} is thinking...</Text>
                  </View>
                ) : (
                  <View style={styles.messageContent}>
                    {message.isUser ? (
                      <Text style={styles.userMessageText}>{message.content}</Text>
                    ) : (
                      formatAIResponse(message.content)
                    )}
                  </View>
                )}
                
                <Text
                  style={[
                    styles.messageTime,
                    message.isUser ? styles.userMessageTime : styles.aiMessageTime,
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </View>
          ))}
          
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <IconButton
                icon="close"
                size={16}
                onPress={clearError}
                iconColor={colors.error[500]}
                accessibilityLabel="Dismiss error"
              />
            </View>
          )}
        </ScrollView>

        {/* Quick Suggestions */}
        {!isLoading && messages.length > 1 && (
          <View style={styles.suggestionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.suggestionsContent}
            >
              {getQuickSuggestions().map((suggestion, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  onPress={() => handleSuggestion(suggestion)}
                  style={styles.suggestionChip}
                  textStyle={styles.suggestionText}
                  selectedColor={colors.primary[600]}
                  accessibilityRole="button"
                  accessibilityLabel={suggestion}
                >
                  {suggestion}
                </Chip>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Input Section — pill input + circular send */}
        <View style={styles.inputContainer}>
          <View style={styles.inputContent}>
            <TextInput
              mode="outlined"
              placeholder="Ask about your medicines..."
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={handleSend}
              multiline={false}
              maxLength={500}
              style={[styles.input, { borderRadius: 24 }]}
              contentStyle={styles.inputContentStyle}
              outlineStyle={{ borderRadius: 24 }}
            />
            <IconButton
              icon={isLoading ? 'loading' : 'send'}
              size={22}
              onPress={handleSend}
              disabled={!inputText.trim() || isLoading}
              iconColor={inputText.trim() ? '#FFFFFF' : colors.neutral[400]}
              containerColor={inputText.trim() ? colors.primary[600] : colors.neutral[200]}
              style={{ width: 40, height: 40, borderRadius: 20 }}
              accessibilityLabel="Send message"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral[100],
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
  },
  headerText: {
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
  medicineContextCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: colors.primary[50],
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  medicineContextContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  medicineContextText: {
    flex: 1,
    marginLeft: 12,
    color: colors.primary[700],
    fontSize: 14,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 20,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageAvatarLabel: {
    color: colors.primary[100],
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  aiMessageBubble: {
    backgroundColor: colors.neutral[100],
    borderBottomLeftRadius: 4,
  },
  userMessageBubble: {
    backgroundColor: colors.primary[500],
    borderBottomRightRadius: 4,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  aiMessageText: {
    color: colors.neutral[900],
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.neutral[50],
    fontSize: 16,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  paragraphContainer: {
    marginBottom: 8,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  bullet: {
    color: colors.primary[600],
    fontSize: 16,
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    marginLeft: 8,
    color: colors.neutral[600],
  },
  messageTime: {
    fontSize: 12,
    color: colors.neutral[500],
    marginTop: 4,
  },
  userMessageTime: {
    textAlign: 'right',
  },
  aiMessageTime: {
    textAlign: 'left',
  },
  // Quick Suggestions
  suggestionsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  suggestionsContent: {
    paddingLeft: 0,
    paddingRight: 20,
  },
  suggestionChip: {
    marginRight: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  suggestionText: {
    color: colors.neutral[900],
    fontWeight: '500',
  },
  // Input Section
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.neutral[100],
  },
  inputContent: {
    backgroundColor: colors.neutral[50],
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  inputContentStyle: {
    paddingVertical: 0,
    height: 48,
    justifyContent: 'center',
  },
  input: {
    backgroundColor: colors.neutral[50],
    borderRadius: 20,
    margin: 0,
    textAlignVertical: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error[50],
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    color: colors.error[700],
    fontSize: 14,
  },
});
