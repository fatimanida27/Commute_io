import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Filter, MapPin, Users, Clock, Navigation } from 'lucide-react-native';
import { router } from 'expo-router';
import MapComponent, { MarkerData, createRegionFromCoordinates } from '../../components/MapView';
import LocationPicker from '../../components/LocationPicker';
import { ridesAPI } from '../../services/api';
import mapService, { Coordinates, LocationResult } from '../../services/mapService';

const { width, height } = Dimensions.get('window');

interface Ride {
  id: number;
  start_location: string;
  end_location: string;
  start_latitude?: number;
  start_longitude?: number;
  end_latitude?: number;
  end_longitude?: number;
  start_time: string;
  seats_available: number;
  total_fare?: number;
  distance_km?: number;
  estimated_duration?: number;
  driver: {
    id: number;
    name: string;
    photo_url?: string;
    rating?: number;
  };
  car: {
    id: number;
    make: string;
    model: string;
    seats: number;
  };
}

export default function MapSearchScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null);
  const [fromLocation, setFromLocation] = useState<LocationResult | null>(null);
  const [toLocation, setToLocation] = useState<LocationResult | null>(null);
  const [showFromLocationPicker, setShowFromLocationPicker] = useState(false);
  const [showToLocationPicker, setShowToLocationPicker] = useState(false);
  const [mapHeight, setMapHeight] = useState(height * 0.6);
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);

  useEffect(() => {
    getCurrentLocation();
    loadRides();
  }, []);

  useEffect(() => {
    if (fromLocation || toLocation) {
      searchRides();
    }
  }, [fromLocation, toLocation]);

  const getCurrentLocation = async () => {
    try {
      const location = await mapService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setFromLocation(location);
      }
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const loadRides = async () => {
    setLoading(true);
    try {
      const response = await ridesAPI.getRides();
      setRides(response || []);
    } catch (error) {
      console.error('Error loading rides:', error);
      Alert.alert('Error', 'Failed to load rides');
    } finally {
      setLoading(false);
    }
  };

  const searchRides = async () => {
    if (!fromLocation && !toLocation) {
      loadRides();
      return;
    }

    setLoading(true);
    try {
      const response = await ridesAPI.getRides();
      let filteredRides = response || [];

      // Filter rides based on proximity to selected locations
      if (fromLocation || toLocation) {
        filteredRides = filteredRides.filter(ride => {
          let matchesFrom = true;
          let matchesTo = true;

          if (fromLocation && ride.start_latitude && ride.start_longitude) {
            const distance = mapService.calculateDistance(
              fromLocation.coordinates,
              { latitude: ride.start_latitude, longitude: ride.start_longitude }
            );
            matchesFrom = distance <= 10; // Within 10km
          }

          if (toLocation && ride.end_latitude && ride.end_longitude) {
            const distance = mapService.calculateDistance(
              toLocation.coordinates,
              { latitude: ride.end_latitude, longitude: ride.end_longitude }
            );
            matchesTo = distance <= 10; // Within 10km
          }

          return matchesFrom && matchesTo;
        });
      }

      setRides(filteredRides);
    } catch (error) {
      console.error('Error searching rides:', error);
      Alert.alert('Error', 'Failed to search rides');
    } finally {
      setLoading(false);
    }
  };

  const handleFromLocationSelect = (location: LocationResult) => {
    setFromLocation(location);
    setShowFromLocationPicker(false);
  };

  const handleToLocationSelect = (location: LocationResult) => {
    setToLocation(location);
    setShowToLocationPicker(false);
  };

  const handleMarkerPress = (marker: MarkerData) => {
    const ride = rides.find(r => r.id.toString() === marker.id);
    if (ride) {
      setSelectedRide(ride);
      setShowRideDetails(true);
    }
  };

  const handleRideSelect = (ride: Ride) => {
    router.push({
      pathname: '/(tabs)/ride-details',
      params: { rideId: ride.id },
    });
  };

  const getMapMarkers = (): MarkerData[] => {
    const markers: MarkerData[] = [];

    // Add ride markers
    rides.forEach(ride => {
      if (ride.start_latitude && ride.start_longitude) {
        markers.push({
          id: ride.id.toString(),
          coordinate: {
            latitude: ride.start_latitude,
            longitude: ride.start_longitude,
          },
          title: `${ride.driver.name}'s Ride`,
          description: `${ride.start_location} → ${ride.end_location}`,
          type: 'pickup',
        });
      }
    });

    // Add user location
    if (currentLocation) {
      markers.push({
        id: 'current',
        coordinate: currentLocation.coordinates,
        title: 'Your Location',
        description: currentLocation.address,
        type: 'user',
      });
    }

    // Add search locations
    if (fromLocation && fromLocation !== currentLocation) {
      markers.push({
        id: 'from',
        coordinate: fromLocation.coordinates,
        title: 'From',
        description: fromLocation.address,
        type: 'pickup',
      });
    }

    if (toLocation) {
      markers.push({
        id: 'to',
        coordinate: toLocation.coordinates,
        title: 'To',
        description: toLocation.address,
        type: 'dropoff',
      });
    }

    return markers;
  };

  const getMapRegion = () => {
    const coordinates: Coordinates[] = [];
    
    rides.forEach(ride => {
      if (ride.start_latitude && ride.start_longitude) {
        coordinates.push({ latitude: ride.start_latitude, longitude: ride.start_longitude });
      }
    });

    if (fromLocation) coordinates.push(fromLocation.coordinates);
    if (toLocation) coordinates.push(toLocation.coordinates);
    if (currentLocation) coordinates.push(currentLocation.coordinates);

    if (coordinates.length > 0) {
      return createRegionFromCoordinates(coordinates, 0.05);
    }

    return undefined;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Find Rides</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#4ECDC4" />
        </TouchableOpacity>
      </View>

      {/* Search Section */}
      <View style={styles.searchSection}>
        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => setShowFromLocationPicker(true)}
        >
          <MapPin size={20} color="#4ECDC4" />
          <Text style={[styles.locationText, !fromLocation && styles.placeholder]}>
            {fromLocation?.address || 'From where?'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.locationInput}
          onPress={() => setShowToLocationPicker(true)}
        >
          <MapPin size={20} color="#FF6B6B" />
          <Text style={[styles.locationText, !toLocation && styles.placeholder]}>
            {toLocation?.address || 'Where to?'}
          </Text>
        </TouchableOpacity>

        {(fromLocation || toLocation) && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setFromLocation(currentLocation);
              setToLocation(null);
              loadRides();
            }}
          >
            <Text style={styles.clearButtonText}>Clear Search</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Map */}
      <View style={[styles.mapContainer, { height: mapHeight }]}>
        <MapComponent
          initialRegion={getMapRegion()}
          markers={getMapMarkers()}
          onMarkerPress={handleMarkerPress}
          showUserLocation={true}
          showDirections={false}
        />
        
        {/* Resize Handle */}
        <TouchableOpacity
          style={styles.resizeHandle}
          onPressIn={() => {
            // Start drag gesture for resizing map
          }}
        >
          <View style={styles.resizeBar} />
        </TouchableOpacity>
      </View>

      {/* Ride List */}
      <ScrollView style={styles.rideList} showsVerticalScrollIndicator={false}>
        <View style={styles.rideListHeader}>
          <Text style={styles.rideListTitle}>
            {rides.length} ride{rides.length !== 1 ? 's' : ''} found
          </Text>
          {loading && <Text style={styles.loadingText}>Loading...</Text>}
        </View>

        {rides.map(ride => (
          <TouchableOpacity
            key={ride.id}
            style={styles.rideCard}
            onPress={() => handleRideSelect(ride)}
          >
            <View style={styles.rideHeader}>
              <View style={styles.driverInfo}>
                <Text style={styles.driverName}>{ride.driver.name}</Text>
                <Text style={styles.carInfo}>
                  {ride.car.make} {ride.car.model}
                </Text>
              </View>
              <View style={styles.ridePrice}>
                {ride.total_fare && (
                  <Text style={styles.priceText}>${ride.total_fare}</Text>
                )}
              </View>
            </View>

            <View style={styles.rideRoute}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#4ECDC4' }]} />
                <Text style={styles.routeText}>{ride.start_location}</Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: '#FF6B6B' }]} />
                <Text style={styles.routeText}>{ride.end_location}</Text>
              </View>
            </View>

            <View style={styles.rideFooter}>
              <View style={styles.rideTime}>
                <Clock size={16} color="#666" />
                <Text style={styles.timeText}>
                  {formatDate(ride.start_time)} at {formatTime(ride.start_time)}
                </Text>
              </View>
              <View style={styles.rideSeats}>
                <Users size={16} color="#666" />
                <Text style={styles.seatsText}>{ride.seats_available} seats</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {rides.length === 0 && !loading && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No rides found</Text>
            <Text style={styles.emptyStateSubtext}>
              Try adjusting your search criteria
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Location Pickers */}
      <LocationPicker
        visible={showFromLocationPicker}
        onClose={() => setShowFromLocationPicker(false)}
        onLocationSelect={handleFromLocationSelect}
        title="Select Pickup Location"
        initialLocation={fromLocation}
      />

      <LocationPicker
        visible={showToLocationPicker}
        onClose={() => setShowToLocationPicker(false)}
        onLocationSelect={handleToLocationSelect}
        title="Select Destination"
        initialLocation={toLocation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  filterButton: {
    padding: 5,
  },
  searchSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  locationText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholder: {
    color: '#999',
  },
  clearButton: {
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#4ECDC4',
    borderRadius: 15,
    marginTop: 5,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  mapContainer: {
    position: 'relative',
  },
  resizeHandle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  resizeBar: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
  },
  rideList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  rideListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rideListTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  loadingText: {
    fontSize: 14,
    color: '#4ECDC4',
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  carInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  ridePrice: {
    alignItems: 'flex-end',
  },
  priceText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  rideRoute: {
    marginBottom: 10,
  },
  routePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  routeLine: {
    width: 2,
    height: 15,
    backgroundColor: '#ddd',
    marginLeft: 3,
    marginVertical: 2,
  },
  routeText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  rideSeats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  seatsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#666',
  },
});