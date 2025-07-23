import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '../hooks/useAuth';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  if (isAuthenticated && user) {
    // Check if user has completed profile setup
    if (user.name && (user.email || user.phone)) {
      return <Redirect href="/(tabs)/" />;
    } else {
      return <Redirect href="/auth/profile-setup" />;
    }
  }

  // Not authenticated, show onboarding
  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fffe',
  },
});