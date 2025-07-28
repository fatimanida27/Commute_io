import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Car, Star, MessageCircle } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect  } from 'expo-router';
import {ridesAPI,usersAPI} from '../../services/api'

interface RideRequest {
  id: number;
  rider_id: number;
  name: string;
  rating: number;
  rides: number;
  image: string;
  bio: string;
}

interface RideInfo {
  start_time: string;
  start_location: string;
  end_location: string;
  seats_available: number;
  id: number;
  price: number;
}

export default function JoinRequestsScreen() {

  const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seats, setSeats] = useState(0);
  const { rideId, refresh } = useLocalSearchParams();

  const handleBack = () => {
    router.push('/(tabs)/create-recurring-ride');
  };

  const handleViewRequest = (request: any) => {
    if (!rideInfo) return;
    // Navigate to ride request screen with driver details
    console.log(rideInfo.id)
    router.push({
      pathname: '/(tabs)/ride-request-screen',
      params: {
        name: request.name,
        rating: request.rating,
        rides_taken: request.rides,
        photo_url: request.image,
        bio: request.bio,
        route: rideInfo.start_location + ' TO ' + rideInfo.end_location,
        time: new Date(rideInfo.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        seats: 1,
        price: rideInfo.price/seats,
        rideId: rideInfo.id,
        requestId: request.id,
        seats_available: rideInfo.seats_available,
        rider_id: request.rider_id,
      }
    });
  };

  const handleMessageUser = (request: any) => {
    if (!rideInfo) return;
    // Navigate to message inbox with ride context
    router.push({
      pathname: '/(tabs)/message_inbox',
      params: {
        userId: request.id,
        name: request.name,
        image: request.image,
        rideId: rideInfo.id,
        rideRoute: `${rideInfo.start_location} to ${rideInfo.end_location}`,
      }
    });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch ride details
      const rideIdNumber = Array.isArray(rideId) ? Number(rideId[0]) : Number(rideId);
      
      // Validate rideId before making API call
      if (!rideId || isNaN(rideIdNumber)) {
        console.error('Invalid ride ID:', rideId);
        setError('Invalid ride ID');
        setLoading(false);
        return;
      }
      
      const rideResponse = await ridesAPI.getRideDetails(rideIdNumber);
      setRideInfo({
        start_time: rideResponse.start_time,
        start_location: rideResponse.start_location,
        end_location: rideResponse.end_location,
        seats_available: rideResponse.seats_available,
        id: rideResponse.id,
        price: rideResponse.total_fare,
      });
      setSeats(rideResponse.car.seats);
      
      // Fetch ride requests
      const requestsResponse = await ridesAPI.getRideRequests(rideIdNumber);
      const users = await Promise.all(
        requestsResponse.map(async (req: { id: number, rider_id: number }) => {
          const user = await usersAPI.getUserProfileById(req.rider_id);
          return {
            id: req.id,
            rider_id: user.id,
            name: user.name,
            rating: user.rating || 0.0,
            rides: user.rides_taken || 0,
            image: user.photo_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150',
            bio: user.bio || 'No bio provided',
          };
        })
      );
      setPendingRequests(users);      
    } catch (err) {
      setError('Failed to load requests. Please try again.');
      console.error('Error fetching ride requests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [rideId,refresh]);

  useFocusEffect(
    React.useCallback(() => {
      fetchData();
    }, [rideId])
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              setError(null);
              setLoading(true);
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!rideInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ride information not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#2d3748" />
          </TouchableOpacity>
          <Text style={styles.title}>Join Requests</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Ride Info */}
          <View style={styles.rideInfoCard}>
            <View style={styles.rideIcon}>
              <Car size={24} color="#4ECDC4" />
            </View>
            <View style={styles.rideDetails}>
              <Text style={styles.routeText}>{rideInfo.start_location} TO {rideInfo.end_location}</Text>
              <Text style={styles.rideTimeText}>
                {new Date(rideInfo.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {rideInfo.seats_available} seats
              </Text>
            </View>
          </View>

          {/* Pending Requests Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pending Requests</Text>
            
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <View key={request.id} style={styles.requestCard}>
                  <View style={styles.requestInfo}>
                    <Image source={{ uri: request.image }} style={styles.avatar} />
                    <View style={styles.userDetails}>
                      <View style={styles.userHeader}>
                        <Text style={styles.userName}>{request.name}</Text>
                        <TouchableOpacity 
                          style={styles.messageButton}
                          onPress={() => handleMessageUser(request)}
                        >
                          <MessageCircle size={20} color="#4ECDC4" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.userStats}>
                        <View style={styles.ratingContainer}>
                          <Star size={14} color="#FFD700" fill="#FFD700" />
                          <Text style={styles.ratingText}>{request.rating}</Text>
                        </View>
                        <Text style={styles.ridesText}>• {request.rides} rides</Text>
                      </View>
                       <Text style={styles.bioPreview} numberOfLines={2}>
                        {request.bio}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    style={styles.viewButton}
                    onPress={() => handleViewRequest(request)}
                  >
                    <Text style={styles.viewButtonText}>View</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No pending requests yet</Text>
              </View>
            )}
          </View>
        </View>
         <View style={styles.startRideContainer}>
    <TouchableOpacity 
      style={styles.startRideButton}
      onPress={() => router.push({
        pathname: '/(tabs)/ride-in-progress',
        params: { rideId: rideInfo.id }
      })}
    >
      <Text style={styles.startRideButtonText}>View Ride</Text>
    </TouchableOpacity>
  </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  rideInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  rideIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rideDetails: {
    flex: 1,
  },
  routeText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  rideTimeText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4ECDC4',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 20,
  },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  requestInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  userDetails: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    flex: 1,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#4ECDC4',
  },
  ridesText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4ECDC4',
    marginLeft: 4,
  },
  bioPreview: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#718096',
    lineHeight: 16,
  },
  viewButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignSelf: 'flex-start',
  },
  viewButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyStateText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#718096',
  },
  startRideContainer: {
  paddingHorizontal: 24,
  paddingBottom: 24,
  marginTop: 16,
},
startRideButton: {
  backgroundColor: '#4ECDC4',
  borderRadius: 25,
  padding: 18,
  alignItems: 'center',
  shadowColor: '#4ECDC4',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 4,
},
startRideButtonText: {
  color: '#ffffff',
  fontSize: 16,
  fontFamily: 'Inter-SemiBold',
},
});