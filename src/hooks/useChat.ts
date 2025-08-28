import React, { useState, useCallback, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { chatHistoryService } from '../services/supabase';
import { aiService } from '../services/ai';
import { ChatHistory } from '../types/database';

export interface ChatMessage {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  loading?: boolean;
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  chatHistory: ChatHistory | null;
}

export const useChat = () => {
  const { user } = useAuthContext();
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    chatHistory: null,
  });

  // Load chat history on mount
  useEffect(() => {
    if (user) {
      loadChatHistory();
    }
  }, [user]);

  const loadChatHistory = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await chatHistoryService.getUserChatHistory(user.id);
      if (error) {
        console.error('Error loading chat history:', error);
        // If it's a table doesn't exist error, just show welcome message
        if (error.message?.includes('does not exist') || error.code === '42703') {
          console.log('Chat history table not set up yet, showing welcome message');
        }
        // Don't show error for new users, just create welcome message
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: `👋 Hello! I'm Cura, your AI health companion.\n\nI'm here to help you manage your medicines, understand their uses, and answer your health-related questions. 💊✨`,
          isUser: false,
          timestamp: new Date(),
        };
        setState(prev => ({ ...prev, messages: [welcomeMessage] }));
        return;
      }

      if (data && data.length > 0) {
        // Use the most recent chat session
        const latestChat = data[0];
        setState(prev => ({ ...prev, chatHistory: latestChat }));
        
        // Convert chat messages to UI format
        const uiMessages: ChatMessage[] = latestChat.messages?.map((msg: any) => ({
          id: msg.id || Math.random().toString(),
          content: msg.content,
          isUser: msg.role === 'user',
          timestamp: new Date(msg.timestamp || Date.now()),
        })) || [];
        
        if (uiMessages.length > 0) {
          setState(prev => ({ ...prev, messages: uiMessages }));
        } else {
          // Create welcome message if no messages
          const welcomeMessage: ChatMessage = {
            id: 'welcome',
            content: `👋 Hello! I'm Cura, your AI health companion.\n\nI'm here to help you manage your medicines, understand their uses, and answer your health-related questions. 💊✨`,
            isUser: false,
            timestamp: new Date(),
          };
          setState(prev => ({ ...prev, messages: [welcomeMessage] }));
        }
      } else {
        // Create welcome message for new users
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: `👋 Hello! I'm Cura, your AI health companion.\n\nI'm here to help you manage your medicines, understand their uses, and answer your health-related questions. 💊✨`,
          isUser: false,
          timestamp: new Date(),
        };
        setState(prev => ({ ...prev, messages: [welcomeMessage] }));
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      // Create welcome message even if there's an error
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        content: `👋 Hello! I'm Cura, your AI health companion.\n\nI'm here to help you manage your medicines, understand their uses, and answer your health-related questions. 💊✨`,
        isUser: false,
        timestamp: new Date(),
      };
      setState(prev => ({ ...prev, messages: [welcomeMessage] }));
    }
  }, [user]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: content.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    const aiMessage: ChatMessage = {
      id: (Date.now() + 1).toString(),
      content: '',
      isUser: false,
      timestamp: new Date(),
      loading: true,
    };

    setState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage, aiMessage],
      isLoading: true,
      error: null,
    }));

    try {
      // Get AI response
      const aiResponse = await aiService.getChatResponse(content, user.id);
      
      // Update AI message with response
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, content: aiResponse, loading: false }
            : msg
        ),
        isLoading: false,
      }));

      // Save to database
      await saveChatMessage(userMessage, aiResponse);
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Update AI message with error
      setState(prev => ({
        ...prev,
        messages: prev.messages.map(msg => 
          msg.id === aiMessage.id 
            ? { 
                ...msg, 
                content: 'Sorry, I encountered an error. Please try again.',
                loading: false 
              }
            : msg
        ),
        isLoading: false,
        error: 'Failed to send message',
      }));
    }
  }, [user]);

    const saveChatMessage = useCallback(async (userMessage: ChatMessage, aiResponse: string) => {
    if (!user) return;

    try {
      const messages = [
        { role: 'user', content: userMessage.content, timestamp: userMessage.timestamp },
        { role: 'assistant', content: aiResponse, timestamp: new Date() },
      ];

      if (state.chatHistory) {
        // Update existing chat history
        const { error } = await chatHistoryService.updateChatHistory(state.chatHistory.id, {
          messages: [...(state.chatHistory.messages || []), ...messages],
        });
        if (error) {
          console.error('Error updating chat history:', error);
          // Continue without saving to database if there's an error
        }
      } else {
        // Create new chat history
        const { data, error } = await chatHistoryService.createChatHistory(user.id);
        if (error) {
          console.error('Error creating chat history:', error);
          // Continue without saving to database if there's an error
          return;
        }
        if (data) {
          setState(prev => ({ ...prev, chatHistory: data }));
          // Update the new chat history with messages
          const { error: updateError } = await chatHistoryService.updateChatHistory(data.id, {
            messages,
          });
          if (updateError) {
            console.error('Error updating new chat history:', updateError);
          }
        }
      }
    } catch (error) {
      console.error('Error saving chat message:', error);
      // Continue without saving to database if there's an error
    }
  }, [user, state.chatHistory]);

  const clearChat = useCallback(async () => {
    if (!user) return;

    try {
      setState({
        messages: [],
        isLoading: false,
        error: null,
        chatHistory: null,
      });

      // Create new chat session
      const { data, error } = await chatHistoryService.createChatHistory(user.id);
      if (error) {
        console.error('Error creating new chat history:', error);
        return;
      }

      if (data) {
        setState(prev => ({ ...prev, chatHistory: data }));
      }
    } catch (error) {
      console.error('Error clearing chat:', error);
      setState(prev => ({ ...prev, error: 'Failed to clear chat' }));
    }
  }, [user]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    sendMessage,
    clearChat,
    clearError,
    loadChatHistory,
  };
};
