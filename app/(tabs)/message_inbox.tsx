import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Phone, Send } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { messagesAPI, usersAPI } from '../../services/api';
import webSocketService from '../../services/websocket-mock';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  sent_at: string;
  ride_id?: number;
}

export default function MessagesChatScreen() {
  const { name, image, userId, rideId, rideRoute } = useLocalSearchParams();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUserId && userId) {
      loadMessages();
    }
  }, [currentUserId, userId]);

  useEffect(() => {
    // Set up WebSocket listener for real-time messages
    const handleNewMessage = (data: any) => {
      console.log('New message received:', data);
      // Check if the message is for this conversation
      if (data.sender_id === Number(userId) || data.receiver_id === Number(userId)) {
        loadMessages(); // Refresh messages
      }
    };

    webSocketService.onNewMessage(handleNewMessage);

    // Cleanup on unmount
    return () => {
      webSocketService.off('new_message', handleNewMessage);
    };
  }, [userId]);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const initializeUser = async () => {
    try {
      const profile = await usersAPI.getProfile();
      setCurrentUserId(profile.id);
    } catch (error) {
      console.error('Error getting user profile:', error);
      // Fallback to user ID 1 for development
      setCurrentUserId(1);
    }
  };

  const loadMessages = async () => {
    try {
      setLoading(true);
      const data = await messagesAPI.getConversationWithUser(Number(userId));
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      Alert.alert('Error', 'Failed to load messages. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || !currentUserId) return;

    try {
      setSending(true);
      
      // Parse ride ID properly
      const rideIdNum = rideId && rideId !== '' ? Number(rideId) : undefined;
      
      // Optimistically add message to UI
      const tempMessage: Message = {
        id: Date.now(),
        sender_id: currentUserId,
        receiver_id: Number(userId),
        content: trimmedInput,
        sent_at: new Date().toISOString(),
        ride_id: rideIdNum,
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setInput('');

      // Send to backend
      await messagesAPI.sendMessage(
        Number(userId), 
        trimmedInput, 
        rideIdNum
      );

      // Reload messages to get the actual message from server
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Remove the optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== Date.now()));
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    router.push('/(tabs)/messages');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMyMessage = (message: Message) => {
    return currentUserId && message.sender_id === currentUserId;
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>{name}</Text>
            {rideRoute && (
              <Text style={styles.rideRoute} numberOfLines={1}>
                {rideRoute}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Phone size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#14B8A6" />
            <Text style={styles.loadingText}>Loading conversation...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingVertical: 16 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  Start the conversation{rideRoute ? ' about your ride!' : '!'}
                </Text>
              </View>
            ) : (
              messages.map((message, index) => {
                const isMe = isMyMessage(message);
                const avatarUri = Array.isArray(image) ? image[0] : image;

                return (
                  <View
                    key={message.id || index}
                    style={[
                      styles.messageContainer,
                      isMe ? styles.messageRight : styles.messageLeft,
                    ]}
                  >
                    {!isMe && (
                      <Image 
                        source={{ 
                          uri: (Array.isArray(image) ? image[0] : image) || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150'
                        }} 
                        style={styles.avatar} 
                      />
                    )}
                    <View
                      style={[
                        styles.bubble,
                        isMe ? styles.bubbleMe : styles.bubbleThem,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          isMe ? styles.textMe : styles.textThem,
                        ]}
                      >
                        {message.content}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          isMe ? styles.timeMe : styles.timeThem,
                        ]}
                      >
                        {formatTime(message.sent_at)}
                      </Text>
                    </View>
                    {isMe && (
                      <Image 
                        source={{ uri: 'https://randomuser.me/api/portraits/men/1.jpg' }} 
                        style={styles.avatar} 
                      />
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            placeholder={rideRoute ? "Message about the ride..." : "Type a message..."}
            style={styles.input}
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!input.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  title: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: '#1F2937' },
  rideRoute: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#14B8A6',
    marginTop: 2,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  messagesContainer: { flex: 1, paddingHorizontal: 16 },
  messageContainer: { flexDirection: 'row', alignItems: 'flex-end', marginVertical: 4 },
  messageLeft: { justifyContent: 'flex-start' },
  messageRight: { justifyContent: 'flex-end', alignSelf: 'flex-end' },

  avatar: { width: 32, height: 32, borderRadius: 16, marginHorizontal: 8 },
  bubble: { maxWidth: '70%', padding: 12, borderRadius: 16 },
  bubbleThem: { backgroundColor: '#F1F5F9', borderTopLeftRadius: 0 },
  bubbleMe: { backgroundColor: '#14B8A6', borderTopRightRadius: 0 },
  messageText: { fontSize: 16, fontFamily: 'Inter-Regular' },
  textThem: { color: '#1F2937' },
  textMe: { color: '#FFFFFF' },
  messageTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    marginTop: 4,
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  timeThem: {
    color: '#9CA3AF',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  input: { 
    flex: 1, 
    fontSize: 16, 
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#14B8A6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});
