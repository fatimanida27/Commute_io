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
      console.warn('Backend not available, using mock data for demo');
      // Mock conversations data
      const mockConversations = [
        {
          id: 1,
          user: {
            id: 2,
            name: "John Doe",
            photo_url: null,
          },
          lastMessage: {
            id: 1,
            sender_id: 2,
            receiver_id: 1,
            content: "Hey! Are you ready for the ride tomorrow?",
            created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
          },
          unreadCount: 2,
          ride_id: 1,
        },
        {
          id: 2,
          user: {
            id: 3,
            name: "Jane Smith",
            photo_url: null,
          },
          lastMessage: {
            id: 2,
            sender_id: 1,
            receiver_id: 3,
            content: "Thanks for the ride yesterday!",
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
          },
          unreadCount: 0,
          ride_id: 2,
        }
      ];
      setConversations(mockConversations);
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
      console.warn('Backend not available, using mock data for demo');
      // Mock conversation messages
      const mockMessages = [
        {
          id: 1,
          sender_id: userId,
          receiver_id: 1,
          content: "Hi! I saw your ride request. What time should we meet?",
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          sender: {
            id: userId,
            name: userId === 2 ? "John Doe" : "Jane Smith",
            photo_url: null,
          }
        },
        {
          id: 2,
          sender_id: 1,
          receiver_id: userId,
          content: "Great! How about 8:00 AM at the main entrance?",
          created_at: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
          sender: {
            id: 1,
            name: "You",
            photo_url: null,
          }
        },
        {
          id: 3,
          sender_id: userId,
          receiver_id: 1,
          content: "Perfect! See you then. I'll be driving a white Tesla Model 3.",
          created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          sender: {
            id: userId,
            name: userId === 2 ? "John Doe" : "Jane Smith",
            photo_url: null,
          }
        },
        {
          id: 4,
          sender_id: 1,
          receiver_id: userId,
          content: "Sounds good! Looking forward to it.",
          created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          sender: {
            id: 1,
            name: "You",
            photo_url: null,
          }
        }
      ];
      setCurrentConversation(mockMessages);
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
      console.warn('Backend not available, keeping optimistic update for demo');
      // In demo mode, keep the optimistic update
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