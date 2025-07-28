import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator, Dimensions  } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Map, Navigation } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import {ridesAPI,usersAPI} from '../../services/api';
import MapComponent, { MarkerData } from '../../components/MapView';
import { Coordinates } from '../../services/mapService';

const { width, height } = Dimensions.get('window');

interface DriverDetails {
    name : string;
    rating: number;
    rides: number;
    image: string;
}
interface Rider {
  id: number;
  rider_id: number;
  name: string;
  rating: number;
  rides: number;
  image: string;
  pickup: string;
  dropoff: string;
  price: string;
  completed: boolean;
  request_id: number;
}
 
export default function RideInProgressScreen() {
    const params = useLocalSearchParams();
  const rideId = params.rideId as string;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverDetails, setDriverDetails] = useState<DriverDetails | null>(null);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [rideDetails, setRideDetails] = useState({
    start_location: '',
    end_location: '',
    start_time: '',
    start_latitude: null as number | null,
    start_longitude: null as number | null,
    end_latitude: null as number | null,
    end_longitude: null as number | null,
  });
  const [showMap, setShowMap] = useState(false);
    

const fetchData = async () => {
  try{
    setLoading(true);
    
    // Validate rideId before making API call
    if (!rideId || isNaN(Number(rideId))) {
      console.error('Invalid ride ID:', rideId);
      setLoading(false);
      return;
    }
    
    const rideResponse = await ridesAPI.getRideDetails(Number(rideId));
      setRideDetails({
        start_location: rideResponse.start_location,
        end_location: rideResponse.end_location,
        start_time: rideResponse.start_time,
        start_latitude: rideResponse.start_latitude,
        start_longitude: rideResponse.start_longitude,
        end_latitude: rideResponse.end_latitude,
        end_longitude: rideResponse.end_longitude,
      });
    const driver = rideResponse.driver;
      const driverProfile = await usersAPI.getUserProfileById(driver.id);
      setDriverDetails({
        name: driver.name,
        rating: driver.rating || 0.0,
        rides: driverProfile.rides_offered || 0,
        image: driver.photo_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
      });

    const requestsResponse = await ridesAPI.getAcceptedRideRequests(Number(rideId));
      const ridersData = await Promise.all(
        requestsResponse.map(async (req: any) => {
          const riderProfile = await usersAPI.getUserProfileById(req.rider_id);
          const rideHistory = await ridesAPI.getRiderRideHistory(req.rider_id, Number(rideId));
        const isCompleted = rideHistory.completed_at !== null;
          return {
            id: req.rider_id,
            rider_id: req.rider_id,
            name: riderProfile.name,
            rating: riderProfile.rating || 0.0,
            rides: riderProfile.rides_taken || 0,
            image: riderProfile.photo_url || 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg',
            pickup: rideResponse.start_location,
            dropoff: rideResponse.end_location,
            price: (rideResponse.total_fare / rideResponse.car.seats).toFixed(2),
            completed: isCompleted,
            request_id: req.id,
          };
        })
      );
      setRiders(ridersData);

   } catch (err) {
      console.error('Error fetching ride data:', err);
      setError('Failed to load ride data. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleBack = () => {
    router.push('/(tabs)/ride-request-screen');
  };

const handleCompleteRide = (riderId: number) => {
    try {
      // Find the rider to complete
      const rider = riders.find(r => r.id === riderId);
      if (!rider) return;

      // In a real app, you would call an API here to mark the ride as completed
      // await ridesAPI.completeRideRequest(rider.request_id);
      
      // Update local state to mark as completed
      setRiders(prev => prev.map(r => 
        r.id === riderId ? { ...r, completed: true } : r
      ));

      // Navigate to ride summary screen for this rider
      router.push({
        pathname: '/(tabs)/ride-summary',
        params: {
          driverName: rider.name,
          riderName: rider.name,
          userId: rider.id,
          rideId: rideId,
          distance: '12.5 mi',
          duration: '25 min',
          cost: `$${rider.price}`,
        }
      });
    } catch (err) {
      console.error('Error completing ride:', err);
      setError('Failed to complete ride. Please try again.');
    }
  };

  const handleEndAllRides = async () => {
    // Handle ending all rides
    try {
      // In a real app, you would call an API here to end all rides
      // await ridesAPI.endAllRides(Number(rideId));
      const hasPendingRides = riders.some(rider => !rider.completed);
    
    if (hasPendingRides) {
      setError('Please complete all rides before ending');
      return;
    }
      await ridesAPI.updateRide(parseInt(params.rideId as string), {
              status: "end"
            });
      // Navigate to ride summary screen
      router.push({
        pathname: '/(tabs)',
      });
    } catch (err) {
      console.error('Error ending all rides:', err);
      setError('Failed to end all rides. Please try again.');
    }
  };

  useEffect(() => {
    fetchData();
  }, [rideId]);

  useFocusEffect(
  React.useCallback(() => {
    fetchData();
  }, [rideId,params.refresh])
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
              fetchData();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const getMapMarkers = (): MarkerData[] => {
    const markers: MarkerData[] = [];

    // Add start location marker
    if (rideDetails.start_latitude && rideDetails.start_longitude) {
      markers.push({
        id: 'start',
        coordinate: {
          latitude: rideDetails.start_latitude,
          longitude: rideDetails.start_longitude,
        },
        title: 'Pickup Location',
        description: rideDetails.start_location,
        type: 'pickup',
      });
    }

    // Add end location marker
    if (rideDetails.end_latitude && rideDetails.end_longitude) {
      markers.push({
        id: 'end',
        coordinate: {
          latitude: rideDetails.end_latitude,
          longitude: rideDetails.end_longitude,
        },
        title: 'Destination',
        description: rideDetails.end_location,
        type: 'dropoff',
      });
    }

    // Add rider markers
    riders.forEach(rider => {
      // You might want to add rider pickup/dropoff locations if available
    });

    return markers;
  };

  const getRouteData = () => {
    if (rideDetails.start_latitude && rideDetails.start_longitude && 
        rideDetails.end_latitude && rideDetails.end_longitude) {
      return {
        origin: {
          latitude: rideDetails.start_latitude,
          longitude: rideDetails.start_longitude,
        },
        destination: {
          latitude: rideDetails.end_latitude,
          longitude: rideDetails.end_longitude,
        },
      };
    }
    return undefined;
  };
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="#2d3748" />
        </TouchableOpacity>
        <Text style={styles.title}>Ride in progress</Text>
        <TouchableOpacity 
          style={styles.mapToggleButton}
          onPress={() => setShowMap(!showMap)}
        >
          {showMap ? <Navigation size={24} color="#4ECDC4" /> : <Map size={24} color="#4ECDC4" />}
        </TouchableOpacity>
      </View>

      {/* Map Container */}
      <View style={styles.mapContainer}>
        {showMap && rideDetails.start_latitude && rideDetails.start_longitude ? (
          <MapComponent
            markers={getMapMarkers()}
            route={getRouteData()}
            showUserLocation={true}
            showDirections={true}
            style={styles.mapView}
          />
        ) : (
          <>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.mapImage}
              resizeMode="cover"
            />
            
            {/* Map Overlay with Location Marker */}
            <View style={styles.mapOverlay}>
              <View style={styles.locationMarker}>
                <View style={styles.markerDot} />
                <Text style={styles.locationText}>{rideDetails.start_location}</Text>
              </View>
            </View>
          </>
        )}
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar} />
          </View>

          {/* Time and Distance */}
          <View style={styles.timeContainer}>
            <Text style={styles.timeLeft}>24 Mins Left</Text>
            <Text style={styles.distance}>10 km</Text>
          </View>

          {/* Ride Details */}
          <View style={styles.rideDetails}>
            <Text style={styles.rideId}>Ride {rideId}</Text>
            <Text style={styles.location}>{rideDetails.start_location} → {rideDetails.end_location}</Text>
          </View>

          {/* Driver Info */}
          {driverDetails && (
            <View style={styles.driverInfo}>
              <Image
                source={{ uri: driverDetails.image }}
                style={styles.driverAvatar}
              />
              <View style={styles.driverDetails}>
                <Text style={styles.driverName}>{driverDetails.name}</Text>
                <View style={styles.ratingContainer}>
                  <Star size={16} color="#FFD700" fill="#FFD700" />
                  <Text style={styles.rating}>{driverDetails.rating}</Text>
                  <Text style={styles.rideCount}>• {driverDetails.rides} rides</Text>
                </View>
              </View>
            </View>
          )}

          {/* Riders List */}
          <View style={styles.ridersContainer}>
            <Text style={styles.ridersTitle}>Passengers ({riders.length})</Text>
            
            {riders.length > 0 ? (
              riders.map((rider) => (
                <View key={rider.id} style={[
                  styles.riderCard,
                  rider.completed && styles.completedRiderCard
                ]}>
                  <View style={styles.riderInfo}>
                    <Image
                      source={{ uri: rider.image }}
                      style={styles.riderAvatar}
                    />
                    <View style={styles.riderDetails}>
                      <Text style={styles.riderName}>{rider.name}</Text>
                      <View style={styles.ratingContainer}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text style={styles.riderRating}>{rider.rating}</Text>
                        <Text style={styles.riderRideCount}>• {rider.rides} rides</Text>
                      </View>
                      <Text style={styles.riderRoute}>{rider.pickup} → {rider.dropoff}</Text>
                    </View>
                  </View>
                  
                  <View style={styles.riderActions}>
                    <Text style={styles.riderPrice}>Rs {rider.price}</Text>
                    {!rider.completed && (
                      <TouchableOpacity 
                        style={styles.completeButton}
                        onPress={() => handleCompleteRide(rider.id)}
                      >
                        <Text style={styles.completeButtonText}>Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No passengers in this ride</Text>
              </View>
            )}
          </View>

          {/* End All Rides Button */}
{riders.length > 0 && (
  <>
    {error && (
      <View style={styles.errorMessageContainer}>
        <Text style={styles.errorMessageText}>{error}</Text>
      </View>
    )}
    <TouchableOpacity 
      style={[
        styles.endAllButton,
        riders.some(r => !r.completed) && styles.disabledButton
      ]} 
      onPress={handleEndAllRides}
      disabled={riders.some(r => !r.completed)}
    >
      <Text style={styles.endAllButtonText}>
        {riders.some(r => !r.completed) ? 'Complete All Rides First' : 'End Ride'}
      </Text>
    </TouchableOpacity>
  </>
)}
        </ScrollView>
      </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    zIndex: 10,
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
  mapToggleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  mapView: {
    flex: 1,
  },
  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationMarker: {
    alignItems: 'center',
    position: 'absolute',
    bottom: '30%',
    left: '20%',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#ff4444',
    marginBottom: 4,
  },
  locationText: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -40 }],
  },
  zoomButton: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  zoomText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
  },
  bottomSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  progressBar: {
    width: 40,
    height: 4,
    backgroundColor: '#2d3748',
    borderRadius: 2,
  },
  timeContainer: {
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  timeLeft: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  distance: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  rideDetails: {
    marginBottom: 24,
  },
  rideId: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginBottom: 4,
  },
  location: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  driverAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#4ECDC4',
  },
  rideCount: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4ECDC4',
  },
  priceContainer: {
    marginBottom: 32,
  },
  priceLabel: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  price: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
  },
  paymentMethod: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  endRideButton: {
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
  endRideButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  ridersContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  ridersTitle: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 16,
  },
  riderCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  riderAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  riderDetails: {
    flex: 1,
  },
  riderName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 2,
  },
  riderRating: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#4ECDC4',
    marginLeft: 4,
  },
  riderRideCount: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4ECDC4',
  },
  riderRoute: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  riderActions: {
    alignItems: 'flex-end',
    marginLeft: 12,
  },
  riderPrice: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginBottom: 8,
  },
  completeButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
  },
  endAllButton: {
    backgroundColor: '#2d3748',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  endAllButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
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
  completedRiderCard: {
    opacity: 0.6,
    backgroundColor: '#E5E7EB',
  },
  errorMessageContainer: {
  backgroundColor: '#FFF0F0',
  padding: 12,
  borderRadius: 8,
  marginBottom: 8,
},
errorMessageText: {
  color: '#EF4444',
  textAlign: 'center',
  fontFamily: 'Inter-Regular',
},
disabledButton: {
  backgroundColor: '#9CA3AF',
},
});