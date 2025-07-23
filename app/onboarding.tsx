import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Image } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../hooks/useAuth';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to the main app
    if (isAuthenticated && user) {
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, user]);

  const handleGetStarted = () => {
    router.push('/auth/signup');
  };

  return (
    <SafeAreaView style={styles.container}>
     
      <LinearGradient
        colors={['#f8fffe', '#e6f9f7']}
        style={styles.gradient}
      >
        <View style={styles.content}>
           <View>
                    <Text style={styles.title}>Commute_io</Text>

      </View>
          <View style={styles.illustrationContainer}>
            <Image
              source={ require('../assets/images/logo.png')}
              style={styles.illustration}
              resizeMode="cover"
            />
            <View style={styles.overlay} />
            <View style={styles.carIllustration}>
              <View style={styles.car} />
              <View style={styles.person1} />
              <View style={styles.person2} />
              <View style={styles.person3} />
            </View>
          </View>
          
          <View style={styles.textContainer}>
            <Text style={styles.title}>Carpooling made easy</Text>
            <Text style={styles.subtitle}>
              Join a community of commuters and share rides to save money and reduce your carbon footprint.
            </Text>
          </View>
          
          <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingVertical: 40,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 40,
  },
  illustration: {
    width: width * 0.8,
    height: height * 0.35,
    borderRadius: 20,
    opacity: 0.8,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
    borderRadius: 20,
  },
  carIllustration: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    height: 100,
  },
  car: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: 120,
    height: 50,
    backgroundColor: '#5a7d7c',
    borderRadius: 25,
  },
  person1: {
    position: 'absolute',
    bottom: 40,
    left: 140,
    width: 30,
    height: 40,
    backgroundColor: '#f4a261',
    borderRadius: 15,
  },
  person2: {
    position: 'absolute',
    bottom: 40,
    left: 180,
    width: 30,
    height: 40,
    backgroundColor: '#5a7d7c',
    borderRadius: 15,
  },
  person3: {
    position: 'absolute',
    bottom: 40,
    right: 40,
    width: 30,
    height: 40,
    backgroundColor: '#2a9d8f',
    borderRadius: 15,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Inter-Regular',
    color: '#718096',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: 8,
  },
  getStartedButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 40,
    alignItems: 'center',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
  },
});