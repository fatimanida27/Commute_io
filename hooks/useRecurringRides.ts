import { useState, useEffect } from 'react';
import { recurringRidesAPI } from '../services/api';
import { Alert } from 'react-native';

export interface RecurringRide {
  id: number;
  driver_id: number;
  car_id: number;
  start_location: string;
  end_location: string;
  day_of_week: number;
  start_time: string;
  seats_available: number;
  total_fare: number;
  schedule_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  driver?: any;
  car?: any;
}

export interface DayOfWeekOption {
  value: number;
  label: string;
}

export interface ScheduleOption {
  value: string;
  label: string;
}

export interface CreateRecurringRideData {
  car_id: number;
  start_location: string;
  end_location: string;
  day_of_week: number;
  start_time: string;
  seats_available: number;
  total_fare: number;
  schedule_type?: string;
}

export const useRecurringRides = () => {
  const [recurringRides, setRecurringRides] = useState<RecurringRide[]>([]);
  const [myRecurringRides, setMyRecurringRides] = useState<RecurringRide[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [daysOfWeek, setDaysOfWeek] = useState<DayOfWeekOption[]>([]);
  const [scheduleTypes, setScheduleTypes] = useState<ScheduleOption[]>([]);

  // Load options data
  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      const [daysData, scheduleData] = await Promise.all([
        recurringRidesAPI.getDaysOfWeekOptions(),
        recurringRidesAPI.getScheduleTypeOptions()
      ]);
      setDaysOfWeek(daysData);
      setScheduleTypes(scheduleData);
    } catch (err) {
      console.error('Error loading options:', err);
    }
  };

  const searchRecurringRides = async (dayOfWeek?: number) => {
    setLoading(true);
    setError(null);
    try {
      const data = await recurringRidesAPI.getRecurringRides(dayOfWeek);
      setRecurringRides(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch recurring rides');
      setRecurringRides([]);
    } finally {
      setLoading(false);
    }
  };

  const getMyRecurringRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recurringRidesAPI.getMyRecurringRides();
      setMyRecurringRides(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your recurring rides');
      setMyRecurringRides([]);
    } finally {
      setLoading(false);
    }
  };

  const createRecurringRide = async (recurringRideData: CreateRecurringRideData) => {
    setLoading(true);
    setError(null);
    try {
      const newRide = await recurringRidesAPI.createRecurringRide(recurringRideData);
      setMyRecurringRides(prev => [...prev, newRide]);
      Alert.alert('Success', 'Recurring ride created successfully!');
      return newRide;
    } catch (err: any) {
      setError(err.message || 'Failed to create recurring ride');
      Alert.alert('Error', err.message || 'Failed to create recurring ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRecurringRide = async (
    recurringRideId: number, 
    updateData: Partial<CreateRecurringRideData> & { status?: string }
  ) => {
    setLoading(true);
    setError(null);
    try {
      const updatedRide = await recurringRidesAPI.updateRecurringRide(recurringRideId, updateData);
      setMyRecurringRides(prev => 
        prev.map(ride => ride.id === recurringRideId ? updatedRide : ride)
      );
      Alert.alert('Success', 'Recurring ride updated successfully!');
      return updatedRide;
    } catch (err: any) {
      setError(err.message || 'Failed to update recurring ride');
      Alert.alert('Error', err.message || 'Failed to update recurring ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecurringRide = async (recurringRideId: number) => {
    setLoading(true);
    setError(null);
    try {
      await recurringRidesAPI.deleteRecurringRide(recurringRideId);
      setMyRecurringRides(prev => prev.filter(ride => ride.id !== recurringRideId));
      Alert.alert('Success', 'Recurring ride deleted successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to delete recurring ride');
      Alert.alert('Error', err.message || 'Failed to delete recurring ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getDayLabel = (dayOfWeek: number): string => {
    const day = daysOfWeek.find(d => d.value === dayOfWeek);
    return day?.label || 'Unknown';
  };

  const getScheduleTypeLabel = (scheduleType: string): string => {
    const type = scheduleTypes.find(t => t.value === scheduleType);
    return type?.label || scheduleType;
  };

  return {
    // Data
    recurringRides,
    myRecurringRides,
    daysOfWeek,
    scheduleTypes,
    
    // State
    loading,
    error,
    
    // Actions
    searchRecurringRides,
    getMyRecurringRides,
    createRecurringRide,
    updateRecurringRide,
    deleteRecurringRide,
    
    // Utilities
    getDayLabel,
    getScheduleTypeLabel,
  };
};