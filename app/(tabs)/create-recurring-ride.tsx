import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, MapPin, Chrome as Home, ChevronRight, Car } from 'lucide-react-native';
import { router } from 'expo-router';
import { useRecurringRides } from '../../hooks/useRecurringRides';
import { carsAPI } from '../../services/api';
import { ScheduleModal, TimePickerModal, PassengerCountModal } from '../../components/ScheduleModals';

interface Car {
  id: number;
  make: string;
  model: string;
  year?: number;
  color?: string;
  seats: number;
}

export default function CreateRecurringRideScreen() {
  const {
    daysOfWeek,
    scheduleTypes,
    createRecurringRide,
    loading,
    getDayLabel,
    getScheduleTypeLabel,
  } = useRecurringRides();

  // Form state
  const [startLocation, setStartLocation] = useState('Stanford University');
  const [endLocation, setEndLocation] = useState('San Francisco');
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState(0); // Monday
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [selectedPassengers, setSelectedPassengers] = useState(1);
  const [selectedScheduleType, setSelectedScheduleType] = useState('weekly');
  const [selectedCarId, setSelectedCarId] = useState<number | null>(null);
  const [totalFare, setTotalFare] = useState('25.00');

  // Car data
  const [cars, setCars] = useState<Car[]>([]);
  const [loadingCars, setLoadingCars] = useState(true);

  // Modal visibility
  const [showDayModal, setShowDayModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showPassengerModal, setShowPassengerModal] = useState(false);
  const [showScheduleTypeModal, setShowScheduleTypeModal] = useState(false);
  const [showCarModal, setShowCarModal] = useState(false);

  useEffect(() => {
    loadUserCars();
  }, []);

  const loadUserCars = async () => {
    try {
      setLoadingCars(true);
      const userCars = await carsAPI.getMyCars();
      setCars(userCars || []);
      if (userCars && userCars.length > 0) {
        setSelectedCarId(userCars[0].id);
      }
    } catch (error) {
      console.warn('Backend not available, using mock car data for demo');
      // Provide mock car data for demonstration
      const mockCars = [
        {
          id: 1,
          make: "Tesla",
          model: "Model 3",
          year: 2022,
          color: "White",
          seats: 5,
        },
        {
          id: 2,
          make: "Honda",
          model: "Civic",
          year: 2021,
          color: "Blue",
          seats: 5,
        }
      ];
      setCars(mockCars);
      setSelectedCarId(mockCars[0].id);
    } finally {
      setLoadingCars(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleCreateRide = async () => {
    if (!selectedCarId) {
      Alert.alert('Error', 'Please select a car for your ride');
      return;
    }

    if (!startLocation.trim() || !endLocation.trim()) {
      Alert.alert('Error', 'Please enter both start and end locations');
      return;
    }

    try {
      await createRecurringRide({
        car_id: selectedCarId,
        start_location: startLocation,
        end_location: endLocation,
        day_of_week: selectedDayOfWeek,
        start_time: selectedTime,
        seats_available: selectedPassengers,
        total_fare: parseFloat(totalFare),
        schedule_type: selectedScheduleType,
      });
      router.push('/(tabs)/rides');
    } catch (error) {
      // Error already handled in hook
    }
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${hour12}:${minute} ${ampm}`;
  };

  const getSelectedCar = () => {
    return cars.find(car => car.id === selectedCarId);
  };

  if (loadingCars) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Loading your cars...</Text>
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
          <Text style={styles.title}>Create a recurring ride</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          {/* Route section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Route</Text>
            
            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <MapPin size={20} color="#4ECDC4" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>From</Text>
                <TextInput
                  style={styles.locationInput}
                  value={startLocation}
                  onChangeText={setStartLocation}
                  placeholder="Enter start location"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.locationCard}>
              <View style={styles.locationIcon}>
                <Home size={20} color="#4ECDC4" />
              </View>
              <View style={styles.locationInfo}>
                <Text style={styles.locationLabel}>To</Text>
                <TextInput
                  style={styles.locationInput}
                  value={endLocation}
                  onChangeText={setEndLocation}
                  placeholder="Enter destination"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* Car section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Vehicle</Text>
            
            <TouchableOpacity style={styles.scheduleItem} onPress={() => setShowCarModal(true)}>
              <View style={styles.carInfo}>
                <Car size={20} color="#4ECDC4" style={styles.carIcon} />
                <Text style={styles.scheduleText}>
                  {getSelectedCar() ? `${getSelectedCar()?.make} ${getSelectedCar()?.model}` : 'Select a car'}
                </Text>
              </View>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Schedule section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Schedule</Text>
            
            <TouchableOpacity style={styles.scheduleItem} onPress={() => setShowDayModal(true)}>
              <Text style={styles.scheduleText}>{getDayLabel(selectedDayOfWeek)}</Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.scheduleItem} onPress={() => setShowTimeModal(true)}>
              <Text style={styles.scheduleText}>{formatTime(selectedTime)}</Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.scheduleItem} onPress={() => setShowPassengerModal(true)}>
              <Text style={styles.scheduleText}>{selectedPassengers} passenger{selectedPassengers > 1 ? 's' : ''}</Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.scheduleItem} onPress={() => setShowScheduleTypeModal(true)}>
              <Text style={styles.scheduleText}>{getScheduleTypeLabel(selectedScheduleType)}</Text>
              <ChevronRight size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>

          {/* Fare section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fare per passenger</Text>
            
            <View style={styles.fareCard}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.fareInput}
                value={totalFare}
                onChangeText={setTotalFare}
                placeholder="0.00"
                keyboardType="decimal-pad"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* Create ride button */}
          <TouchableOpacity 
            style={[styles.createButton, loading && styles.createButtonDisabled]} 
            onPress={handleCreateRide}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.createButtonText}>Create recurring ride</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modals */}
      <ScheduleModal
        visible={showDayModal}
        title="Select Day"
        options={daysOfWeek}
        selectedValue={selectedDayOfWeek}
        onSelect={(value) => setSelectedDayOfWeek(value as number)}
        onClose={() => setShowDayModal(false)}
      />

      <TimePickerModal
        visible={showTimeModal}
        onTimeSelect={setSelectedTime}
        onClose={() => setShowTimeModal(false)}
        initialTime={selectedTime}
      />

      <PassengerCountModal
        visible={showPassengerModal}
        onPassengerSelect={setSelectedPassengers}
        onClose={() => setShowPassengerModal(false)}
        maxPassengers={getSelectedCar()?.seats || 8}
      />

      <ScheduleModal
        visible={showScheduleTypeModal}
        title="Schedule Type"
        options={scheduleTypes}
        selectedValue={selectedScheduleType}
        onSelect={(value) => setSelectedScheduleType(value as string)}
        onClose={() => setShowScheduleTypeModal(false)}
      />

      <ScheduleModal
        visible={showCarModal}
        title="Select Car"
        options={cars.map(car => ({
          value: car.id,
          label: `${car.make} ${car.model} (${car.seats} seats)`
        }))}
        selectedValue={selectedCarId || ''}
        onSelect={(value) => setSelectedCarId(value as number)}
        onClose={() => setShowCarModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 12,
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginBottom: 16,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  locationIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginBottom: 4,
  },
  locationInput: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2d3748',
    padding: 0,
  },
  fareCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  currencySymbol: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginRight: 8,
  },
  fareInput: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'Inter-Medium',
    color: '#2d3748',
    padding: 0,
  },
  scheduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  carInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  carIcon: {
    marginRight: 12,
  },
  scheduleText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2d3748',
  },
  createButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    marginTop: 40,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    backgroundColor: '#9CA3AF',
    shadowColor: '#9CA3AF',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
});