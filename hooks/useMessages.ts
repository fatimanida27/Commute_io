import { useState, useEffect } from 'react';
import { messagesAPI } from '../services/api';
import { Alert } from 'react-native';

export interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  ride_id?: number;
  created_at: string;
  sender?: any;
  receiver?: any;
}

export interface Conversation {
  id: number;
  user: any;
  lastMessage: Message;
  unreadCount: number;
  ride_id?: number;
}

export const useMessages = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getConversations = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await messagesAPI.getConversations();
      setConversations(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conversations');
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const getConversationWithUser = async (userId: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await messagesAPI.getConversationWithUser(userId);
      setCurrentConversation(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch conversation');
      setCurrentConversation([]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (receiverId: number, content: string, rideId?: number) => {
    if (!content.trim()) return;

    const optimisticMessage: Message = {
      id: Date.now(),
      sender_id: 1, // Current user ID
      receiver_id: receiverId,
      content: content.trim(),
      ride_id: rideId,
      created_at: new Date().toISOString(),
      sender: {
        id: 1,
        name: "You",
        photo_url: null,
      }
    };

    // Optimistic update
    setCurrentConversation(prev => [...prev, optimisticMessage]);

    try {
      const message = await messagesAPI.sendMessage(receiverId, content, rideId);
      // Replace optimistic message with real one
      setCurrentConversation(prev => 
        prev.map(msg => msg.id === optimisticMessage.id ? message : msg)
      );
      
      // Update conversations list
      setConversations(prev => {
        const existingConvIndex = prev.findIndex(conv => conv.user.id === receiverId);
        if (existingConvIndex >= 0) {
          const updatedConversations = [...prev];
          updatedConversations[existingConvIndex] = {
            ...updatedConversations[existingConvIndex],
            lastMessage: message,
          };
          return updatedConversations;
        } else {
          // Create new conversation
          return [{
            id: Date.now(),
            user: { id: receiverId, name: "User", photo_url: null },
            lastMessage: message,
            unreadCount: 0,
            ride_id: rideId,
          }, ...prev];
        }
      });

    } catch (err: any) {
      // Remove the optimistic message on error
      setCurrentConversation(prev => prev.filter(msg => msg.id !== optimisticMessage.id));
      Alert.alert('Error', err.message || 'Failed to send message');
    }
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatConversationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const markConversationAsRead = (userId: number) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.user.id === userId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );
  };

  const getTotalUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  return {
    // Data
    conversations,
    currentConversation,
    
    // State
    loading,
    error,
    
    // Actions
    getConversations,
    getConversationWithUser,
    sendMessage,
    markConversationAsRead,
    
    // Utilities
    formatMessageTime,
    formatConversationTime,
    getTotalUnreadCount,
  };
};