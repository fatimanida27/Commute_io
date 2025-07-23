import { useState, useEffect, createContext, useContext } from 'react';
import { authAPI, tokenManager } from '../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { router } from 'expo-router';

export interface User {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  is_driver: boolean;
  is_rider: boolean;
  photo_url?: string;
  gender?: string;
  preferences?: any;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string) => Promise<void>;
  register: (userData: any) => Promise<void>;
  sendOTP: (email: string) => Promise<void>;
  sendMobileOTP: (phone: string) => Promise<void>;
  verifyOTP: (email: string, otp: string) => Promise<void>;
  verifyMobileOTP: (phone: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthProvider = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsLoading(true);
      const token = await tokenManager.getToken();
      
      if (token) {
        try {
          const userData = await authAPI.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, remove it
          await tokenManager.removeToken();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email);
      setUser(response.user);
      setIsAuthenticated(true);
      
      // Navigate based on profile completion
      if (response.needs_profile_setup) {
        router.replace('/auth/profile-setup');
      } else {
        router.replace('/(tabs)/');
      }
    } catch (error: any) {
      Alert.alert('Login Failed', error.message || 'Please check your email');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: any) => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(userData);
      setUser(response.user);
      setIsAuthenticated(true);
      router.replace('/(tabs)/');
    } catch (error: any) {
      Alert.alert('Registration Failed', error.message || 'Please try again');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const sendOTP = async (email: string) => {
    try {
      await authAPI.sendOTP(email);
      // Store email for OTP verification
      await AsyncStorage.setItem('pending_email', email);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
      throw error;
    }
  };

  const sendMobileOTP = async (phone: string) => {
    try {
      await authAPI.sendMobileOTP(phone);
      // Store phone for OTP verification
      await AsyncStorage.setItem('pending_phone', phone);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
      throw error;
    }
  };

  const verifyOTP = async (email: string, otp: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.verifyOTP(email, otp);
      setUser(response.user);
      setIsAuthenticated(true);
      await AsyncStorage.removeItem('pending_email');
      
      // Navigate based on profile completion
      if (response.user.name && response.user.preferences) {
        router.replace('/(tabs)/');
      } else {
        router.replace('/auth/profile-setup');
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyMobileOTP = async (phone: string, otp: string) => {
    try {
      setIsLoading(true);
      const response = await authAPI.verifyMobileOTP(phone, otp);
      setUser(response.user);
      setIsAuthenticated(true);
      await AsyncStorage.removeItem('pending_phone');
      
      // Navigate based on profile completion
      if (response.user.name && response.user.preferences) {
        router.replace('/(tabs)/');
      } else {
        router.replace('/auth/profile-setup');
      }
    } catch (error: any) {
      Alert.alert('Verification Failed', error.message || 'Invalid OTP');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await authAPI.logout();
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/auth/signup');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      setUser(null);
      setIsAuthenticated(false);
      router.replace('/auth/signup');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (userData: Partial<User>) => {
    try {
      setIsLoading(true);
      const updatedUser = await authAPI.updateProfile(userData);
      setUser(updatedUser);
    } catch (error: any) {
      Alert.alert('Update Failed', error.message || 'Failed to update profile');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    sendOTP,
    sendMobileOTP,
    verifyOTP,
    verifyMobileOTP,
    logout,
    updateProfile,
    checkAuthStatus,
  };
};