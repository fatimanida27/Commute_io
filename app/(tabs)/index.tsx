import React, { useState } from 'react';
import { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Settings, Menu, MessageCircle, Car, Plus, Navigation } from 'lucide-react-native';
import { router } from 'expo-router';
import { ridesAPI, usersAPI } from '../../services/api';

interface Ride {
  id: number;
  start_time: string;
  seats_available: number;
  start_location: string;
  end_location: string;
}

export default function HomeScreen() {
  const [upcomingDriverRides, setUpcomingDriverRides] = useState<Ride[]>([]);
  const [selectedMode, setSelectedMode] = useState('Driver');
  const [searchText, setSearchText] = useState('');
  const [rides, setRides] = useState([]);
  type UserProfile = {
    is_driver: boolean;
    is_rider: boolean;
    // add other properties as needed
  };
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const handleSettings = () => {
    router.push('/(tabs)/setting');
  };

   const handleOfferRide = () => {
    router.push('/(tabs)/offer-ride');
  };

  const handleRideChat = () => {
    // Navigate to chat screen
    router.push('/(tabs)/ride-chat');
  };

  const handleEditProfile = () => {
    router.push('/(tabs)/profile');
  };

  useEffect(() => {
  const loadUserProfile = async () => {
    try {
      const profileData = await usersAPI.getProfile();
      setUserProfile(profileData);
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };
  loadUserProfile();
}, []); // load profile only once

useEffect(() => {
  const loadRides = async () => {
    if (!userProfile || !hasRequiredRole()) return;

    try {
      setLoading(true);

      if (selectedMode === 'Driver' && userProfile.is_driver) {
        const driverRides = await ridesAPI.getMyRides();
        setUpcomingDriverRides(driverRides);
        console.log('Driver rides received:', driverRides[0]);
      }

      if (selectedMode === 'Rider' && userProfile.is_rider) {
        const ridesData = await ridesAPI.searchRides(10);
        setRides(ridesData);
      }
    } catch (error) {
      console.error('Error loading rides:', error);
    } finally {
      setLoading(false);
    }
  };

  loadRides();
}, [selectedMode, userProfile]); // now this won't cause loop since userProfile is set only once


  const loadData = async () => {
  try {
    setLoading(true);
    console.log('Starting data loading...');
    
    const profileData = await usersAPI.getProfile();
    console.log('Profile data received:', profileData);
    setUserProfile(profileData);
    
    if (selectedMode === 'Driver' && profileData?.is_driver) {
      console.log('Fetching driver rides...');
      const driverRides = await ridesAPI.getMyRides();
      console.log('Driver rides received:', driverRides);
      setUpcomingDriverRides(driverRides);
    }
    
    if (selectedMode === 'Rider') {
      console.log('Fetching rides for rider...');
      const ridesData = await ridesAPI.searchRides(10);
      console.log('Rides data received:', ridesData);
      setRides(ridesData);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    console.log('Data loading completed');
    setLoading(false);
  }
};

  const suggestedRides = [
    {
      id: 101, // Changed from 1 to avoid conflict
      destination: 'To Downtown',
      time: '10:00 AM',
      image: 'https://images.pexels.com/photos/466685/pexels-photo-466685.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 102, // Changed from 2 to avoid conflict
      destination: 'To Airport',
      time: '11:30 AM',
      image: 'https://images.pexels.com/photos/378570/pexels-photo-378570.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
    {
      id: 103, // Changed from 3 to avoid conflict
      destination: 'To University',
      time: '1:00 PM',
      image: 'https://images.pexels.com/photos/1105766/pexels-photo-1105766.jpeg?auto=compress&cs=tinysrgb&w=400',
    },
  ];

  const upcomingRides = [
    {
      id: 201, // Changed from 1 to avoid conflict
      destination: 'To Downtown',
      time: '10:00 AM',
    },
    {
      id: 202, // Changed from 2 to avoid conflict
      destination: 'To Airport',
      time: '11:30 AM',
    },
  ];

  const driverStats = [
    {
      title: 'Rides Given',
      value: '5',
    },
    {
      title: 'Total Distance',
      value: '120 km',
    },
    {
      title: 'Avg. Rating',
      value: '4.8',
    },
  ];

   const hasRequiredRole = () => {
    if (!userProfile) return false;
    return selectedMode === 'Driver' ? userProfile.is_driver : userProfile.is_rider;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appTitle}>Commute_io</Text>
          <TouchableOpacity style={styles.settingsButton}
            onPress={handleSettings}
          >
            <Settings size={24} color="#2d3748" />
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Mode Toggle */}
        <View style={styles.modeToggleContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'Rider' && styles.activeModeButton
            ]}
            onPress={() => setSelectedMode('Rider')}
          >
            <Text style={[
              styles.modeButtonText,
              selectedMode === 'Rider' && styles.activeModeButtonText
            ]}>
              Rider
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.modeButton,
              selectedMode === 'Driver' && styles.activeModeButton
            ]}
            onPress={() => setSelectedMode('Driver')}
          >
            <Text style={[
              styles.modeButtonText,
              selectedMode === 'Driver' && styles.activeModeButtonText
            ]}>
              Driver
            </Text>
          </TouchableOpacity>
        </View>

{userProfile && !hasRequiredRole() ? (
          <View style={styles.roleWarningContainer}>
            <Text style={styles.roleWarningText}>
              {selectedMode === 'Driver'
                ? "You're not registered as a driver yet."
                : "You're not registered as a rider yet."}
            </Text>
            <Text style={styles.roleWarningSubtext}>
              Update your profile to access {selectedMode} features.
            </Text>
            <TouchableOpacity 
              style={styles.updateProfileButton}
              onPress={handleEditProfile}
            >
              <Text style={styles.updateProfileButtonText}>
                Update Profile
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
<>
              {/* Driver Mode Content */}
            {selectedMode === 'Driver' ? (
              <>
                {/* Offer a Ride Button */}
                <View style={styles.offerRideContainer}>
                  <TouchableOpacity style={styles.offerRideButton} onPress={handleOfferRide}>
                    <Text style={styles.offerRideButtonText}>Offer a Ride</Text>
                  </TouchableOpacity>
                </View>

                {/* Upcoming Rides */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Upcoming Rides</Text>
                  {upcomingDriverRides.length > 0 ? (
        upcomingDriverRides.map((ride) => (
          <TouchableOpacity 
            key={ride.id} 
            style={styles.upcomingRideCard}
          
            onPress={() => router.push({
              pathname: '/(tabs)/join-requests',
              params: { rideId: ride.id }
            })}
          >
            <View style={styles.upcomingRideIcon}>
              <Car size={20} color="#4ECDC4" />
            </View>
            <View style={styles.upcomingRideInfo}>
              <Text style={styles.upcomingRideDestination}>
                {ride.start_location} → {ride.end_location}
              </Text>
              <Text style={styles.upcomingRideTime}>
                {new Date(ride.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ride.seats_available} seats
              </Text>
            </View>
          </TouchableOpacity>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No upcoming rides scheduled</Text>
          <TouchableOpacity 
            style={styles.emptyStateButton}
            onPress={handleOfferRide}
          >
            <Text style={styles.emptyStateButtonText}>Create your first ride</Text>
          </TouchableOpacity>
        </View>
      )}
                </View>

                {/* Recent Activity */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Recent Activity</Text>
                  <View style={styles.statsContainer}>
                    <View style={styles.statsRow}>
                      <View style={styles.statCard}>
                        <Text style={styles.statTitle}>{driverStats[0].title}</Text>
                        <Text style={styles.statValue}>{driverStats[0].value}</Text>
                      </View>
                      <View style={styles.statCard}>
                        <Text style={styles.statTitle}>{driverStats[1].title}</Text>
                        <Text style={styles.statValue}>{driverStats[1].value}</Text>
                      </View>
                    </View>
                    <View style={styles.statCardFull}>
                      <Text style={styles.statTitle}>{driverStats[2].title}</Text>
                      <Text style={styles.statValue}>{driverStats[2].value}</Text>
                    </View>
                  </View>
                </View>
              </>
            ) : (
              <>
                {/* Search Bar */}
                <TouchableOpacity
                  style={styles.searchContainer}
                  activeOpacity={0.8}
                  onPress={() => router.push('/search')}
                >
                  <Search size={20} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Where to?"
                    placeholderTextColor="#9CA3AF"
                    editable={false}
                    pointerEvents="none"
                  />
                </TouchableOpacity>

                {/* Suggested Rides */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Suggested Rides</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestedRidesScroll}>
                    {suggestedRides.map((ride) => (
                      <TouchableOpacity key={ride.id} style={styles.suggestedRideCard}>
                        <Image source={{ uri: ride.image }} style={styles.suggestedRideImage} />
                        <View style={styles.suggestedRideInfo}>
                          <Text style={styles.suggestedRideDestination}>{ride.destination}</Text>
                          <Text style={styles.suggestedRideTime}>{ride.time}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Upcoming Rides */}
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Upcoming Rides</Text>
                  {upcomingRides.map((ride) => (
                    <View key={ride.id} style={styles.upcomingRideCard}>
                      <View style={styles.upcomingRideIcon}>
                        <Car size={20} color="#4ECDC4" />
                      </View>
                      <View style={styles.upcomingRideInfo}>
                        <Text style={styles.upcomingRideDestination}>{ride.destination}</Text>
                        <Text style={styles.upcomingRideTime}>{ride.time}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>

 
      {/* Floating Chat Button */}
      <TouchableOpacity style={styles.floatingChatButton} onPress={handleRideChat}>
        <MessageCircle size={24} color="#ffffff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },

  appTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    justifyContent: 'center',
    alignItems:'center',
    paddingLeft:90,
  },
  settingsButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeToggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: '#F3F4F6',
    borderRadius: 25,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 21,
  },
  activeModeButton: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeModeButtonText: {
    color: '#2d3748',
  },
  offerRideContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  offerRideButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  offerRideButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginHorizontal: 24,
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 12,
    marginBottom: 32,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2d3748',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 7,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  suggestedRidesScroll: {
    marginHorizontal: -24,
    paddingHorizontal: 24,
    paddingVertical:12,
  },
  emptyState: {
  backgroundColor: '#F9FAFB',
  borderRadius: 16,
  padding: 24,
  alignItems: 'center',
  justifyContent: 'center',
  marginTop: 8,
},
emptyStateText: {
  fontSize: 16,
  fontFamily: 'Inter-Regular',
  color: '#6B7280',
  marginBottom: 16,
  textAlign: 'center',
},
emptyStateButton: {
  backgroundColor: '#E5E7EB',
  paddingHorizontal: 24,
  paddingVertical: 12,
  borderRadius: 20,
},
emptyStateButtonText: {
  fontSize: 14,
  fontFamily: 'Inter-SemiBold',
  color: '#4B5563',
},
  suggestedRideCard: {
    width: 200,
    marginRight: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  suggestedRideImage: {
    width: '100%',
    height: 120,
  },
  suggestedRideInfo: {
    padding: 16,
  },
  suggestedRideDestination: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  suggestedRideTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  upcomingRideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  upcomingRideIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  upcomingRideInfo: {
    flex: 1,
  },
  upcomingRideDestination: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  upcomingRideTime: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  statsContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statCardFull: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
  },
  floatingChatButton: {
    position: 'absolute',
    bottom: 100,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontFamily: 'Inter-Regular',
  },
  roleWarningContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  roleWarningText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 8,
    textAlign: 'center',
  },
  roleWarningSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  updateProfileButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 25,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  updateProfileButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});