import React, { createContext, useContext, ReactNode } from 'react';
import { useAuthProvider, AuthContext } from '../hooks/useAuth';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const authContext = useAuthProvider();

  if (authContext.isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      {children}
    </AuthContext.Provider>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
  },
});