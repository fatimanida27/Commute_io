import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Calendar, Clock, Users, DollarSign, Map } from 'lucide-react-native';
import { router } from 'expo-router';
import { ridesAPI, carsAPI } from '../../services/api';
import LocationPicker from '../../components/LocationPicker';
import { LocationResult } from '../../services/mapService';

export default function OfferRideScreen() {
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');
  const [fromLocationData, setFromLocationData] = useState<LocationResult | null>(null);
  const [toLocationData, setToLocationData] = useState<LocationResult | null>(null);
  const [date, setDate] = useState<Date | undefined>();
  const [time, setTime] = useState<Date | undefined>();
  const [seats, setSeats] = useState('');
  const [costPerMile, setCostPerMile] = useState('0.5'); // default cost per mile
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showFromLocationPicker, setShowFromLocationPicker] = useState(false);
  const [showToLocationPicker, setShowToLocationPicker] = useState(false);
  const [estimatedDistance, setEstimatedDistance] = useState<string>('');
  const [estimatedDuration, setEstimatedDuration] = useState<string>('');

  const handleBack = () => {
    router.back();
  };

  const handleFromLocationSelect = (location: LocationResult) => {
    setFromLocationData(location);
    setFromLocation(location.address);
    setShowFromLocationPicker(false);
    calculateRouteInfo(location, toLocationData);
  };

  const handleToLocationSelect = (location: LocationResult) => {
    setToLocationData(location);
    setToLocation(location.address);
    setShowToLocationPicker(false);
    calculateRouteInfo(fromLocationData, location);
  };

  const calculateRouteInfo = async (from: LocationResult | null, to: LocationResult | null) => {
    if (from && to) {
      try {
        const { mapService } = await import('../../services/mapService');
        const routeInfo = await mapService.getRouteInfo(from.coordinates, to.coordinates);
        if (routeInfo) {
          setEstimatedDistance(routeInfo.distance);
          setEstimatedDuration(routeInfo.duration);
          
          // Calculate total fare based on distance
          const distanceInKm = parseFloat(routeInfo.distance.replace(' km', ''));
          if (!isNaN(distanceInKm)) {
            const calculatedFare = (distanceInKm * parseFloat(costPerMile)).toFixed(2);
            // You might want to update a fare state here
          }
        }
      } catch (error) {
        console.error('Error calculating route:', error);
      }
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!fromLocation.trim()) errors.fromLocation = 'Pickup location is required.';
    if (!toLocation.trim()) errors.toLocation = 'Destination is required.';
    if (!date) errors.date = 'Date is required.';
    if (!time) errors.time = 'Time is required.';
    if (!seats.trim() || isNaN(Number(seats)) || Number(seats) <= 0)
      errors.seats = 'Valid number of seats is required.';
    if (!costPerMile.trim() || isNaN(Number(costPerMile)) || Number(costPerMile) <= 0)
      errors.costPerMile = 'Cost per mile must be a positive number.';

    return errors;
  };

  const handleOfferRide = async () =>  {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});  
    try {
    // 1. Get user's default car
    const carsResponse = await carsAPI.getMyCars();
    if (!carsResponse.length) {
      Alert.alert("Error", "You need to register a car first");
      return;
    }
    if (!date || !time) {
      Alert.alert("Error", "Date and time are required");
      return;
    }

    // 2. Combine date and time
    const combinedDateTime = new Date(
      date!.getFullYear(),
      date!.getMonth(),
      date!.getDate(),
      time!.getHours(),
      time!.getMinutes()
    );

    // 3. Prepare ride data with coordinates
    const rideData = {
      car_id: carsResponse[0].id,
      start_location: fromLocation,
      end_location: toLocation,
      start_latitude: fromLocationData?.coordinates.latitude,
      start_longitude: fromLocationData?.coordinates.longitude,
      end_latitude: toLocationData?.coordinates.latitude,
      end_longitude: toLocationData?.coordinates.longitude,
      distance_km: estimatedDistance ? parseFloat(estimatedDistance.replace(' km', '')) : undefined,
      estimated_duration: estimatedDuration ? parseInt(estimatedDuration.replace(' min', '')) : undefined,
      start_time: combinedDateTime.toISOString(),
      seats_available: parseInt(seats),
      total_fare: parseFloat(totalFare), // Example fare calculation
    };

    // 4. Create ride
    const response = await ridesAPI.createRide(rideData);
    
    // 5. Navigate to join requests
    router.push({
      pathname: '/(tabs)/join-requests',
      params: { rideId: response.id }
    });
  } catch (error) {
    console.error('Ride creation failed:', error);
    Alert.alert(
      "Error", 
      error instanceof Error ? error.message : "Failed to create ride"
    );
  }
  };

  // Simulated distance
  const totalDistance = 10; // For example purposes (miles)

  const numericSeats = parseInt(seats) || 1;
  const numericCostPerMile = parseFloat(costPerMile) || 0.5;

  const farePerSeat = (totalDistance * numericCostPerMile).toFixed(2);
  const totalFare = (numericSeats * totalDistance * numericCostPerMile).toFixed(2);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#2d3748" />
          </TouchableOpacity>
          <Text style={styles.title}>Offer a Ride</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Route */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>From</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowFromLocationPicker(true)}
              >
                <MapPin size={20} color="#9CA3AF" />
                <Text style={[styles.input, styles.inputText, !fromLocation && styles.placeholderText]}>
                  {fromLocation || 'Select pickup location'}
                </Text>
                <Map size={20} color="#4ECDC4" />
              </TouchableOpacity>
              {formErrors.fromLocation && (
                <Text style={styles.errorText}>{formErrors.fromLocation}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>To</Text>
              <TouchableOpacity 
                style={styles.inputContainer}
                onPress={() => setShowToLocationPicker(true)}
              >
                <MapPin size={20} color="#9CA3AF" />
                <Text style={[styles.input, styles.inputText, !toLocation && styles.placeholderText]}>
                  {toLocation || 'Select destination'}
                </Text>
                <Map size={20} color="#4ECDC4" />
              </TouchableOpacity>
              {formErrors.toLocation && (
                <Text style={styles.errorText}>{formErrors.toLocation}</Text>
              )}
            </View>

            {/* Route Information */}
            {estimatedDistance && estimatedDuration && (
              <View style={styles.routeInfo}>
                <View style={styles.routeInfoItem}>
                  <Text style={styles.routeInfoLabel}>Distance:</Text>
                  <Text style={styles.routeInfoValue}>{estimatedDistance}</Text>
                </View>
                <View style={styles.routeInfoItem}>
                  <Text style={styles.routeInfoLabel}>Duration:</Text>
                  <Text style={styles.routeInfoValue}>{estimatedDuration}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Date & Time */}
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.halfInputGroup}>
                <Text style={styles.label}>Date</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={20} color="#9CA3AF" />
                  <Text style={[styles.input, styles.inputText]}>
                    {date ? date.toDateString() : 'Select date'}
                  </Text>
                </TouchableOpacity>
                {formErrors.date && (
                  <Text style={styles.errorText}>{formErrors.date}</Text>
                )}
              </View>

              <View style={styles.halfInputGroup}>
                <Text style={styles.label}>Time</Text>
                <TouchableOpacity
                  style={styles.inputContainer}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={20} color="#9CA3AF" />
                  <Text style={[styles.input, styles.inputText]}>
                    {time
                      ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : 'Select time'}
                  </Text>
                </TouchableOpacity>
                {formErrors.time && (
                  <Text style={styles.errorText}>{formErrors.time}</Text>
                )}
              </View>
            </View>
          </View>

          {showDatePicker && (
            <DateTimePicker
              mode="date"
              value={date || new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selected) setDate(selected);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              mode="time"
              value={time || new Date()}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={(event, selected) => {
                setShowTimePicker(Platform.OS === 'ios');
                if (selected) setTime(selected);
              }}
            />
          )}

          {/* Seats */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Seats</Text>
              <View style={styles.inputContainer}>
                <Users size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={seats}
                  onChangeText={setSeats}
                  placeholder="Number of available seats"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              {formErrors.seats && (
                <Text style={styles.errorText}>{formErrors.seats}</Text>
              )}
            </View>
          </View>

          {/* Cost per Mile */}
          <View style={styles.section}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Cost per Mile (PKR)</Text>
              <View style={styles.inputContainer}>
                <DollarSign size={20} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  value={costPerMile}
                  onChangeText={setCostPerMile}
                  placeholder="e.g., 0.5"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="numeric"
                />
              </View>
              {formErrors.costPerMile && (
                <Text style={styles.errorText}>{formErrors.costPerMile}</Text>
              )}
            </View>
          </View>

          {/* Ride Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Fare per seat</Text>
                <Text style={styles.summaryValue}>PKR {farePerSeat}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Total estimated fare</Text>
                <Text style={styles.summaryValue}>PKR {totalFare}</Text>
              </View>
            </View>

            <View style={styles.summaryItemFull}>
              <Text style={styles.summaryLabel}>Seats available</Text>
              <Text style={styles.summaryValue}>{seats || '1'}</Text>
            </View>
          </View>

          {/* Offer Ride */}
          <TouchableOpacity style={styles.offerButton} onPress={handleOfferRide}>
            <Text style={styles.offerButtonText}>Offer Ride</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Location Pickers */}
      <LocationPicker
        visible={showFromLocationPicker}
        onClose={() => setShowFromLocationPicker(false)}
        onLocationSelect={handleFromLocationSelect}
        title="Select Pickup Location"
        initialLocation={fromLocationData}
      />

      <LocationPicker
        visible={showToLocationPicker}
        onClose={() => setShowToLocationPicker(false)}
        onLocationSelect={handleToLocationSelect}
        title="Select Destination"
        initialLocation={toLocationData}
      />
    </SafeAreaView>
  );
}

// Reuse your existing styles


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
    errorText: { color: 'red', fontSize: 12, marginTop: 4 },

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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  halfInputGroup: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2d3748',
  },
  inputText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2d3748',
    paddingVertical: 14,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  routeInfo: {
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
  },
  routeInfoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeInfoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#374151',
  },
  routeInfoValue: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#4ECDC4',
  },
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  distanceText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#718096',
    marginBottom: 16,
  },
  suggestedText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#4ECDC4',
    marginBottom: 16,
    marginTop: 8,
  },
  summaryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
    paddingVertical:34,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryItemFull: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#718096',
    marginBottom: 8,
    textAlign: 'center',
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
  },
  offerButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  offerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});