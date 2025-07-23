import { useState, useEffect } from 'react';
import { ridesAPI } from '../services/api';
import { Alert } from 'react-native';

export interface Ride {
  id: number;
  driver_id: number;
  car_id: number;
  start_location: string;
  end_location: string;
  start_time: string;
  seats_available: number;
  total_fare: number;
  status: string;
  driver?: any;
  car?: any;
  created_at: string;
}

export interface RideRequest {
  id: number;
  rider_id: number;
  ride_id: number;
  status: string;
  requested_at: string;
  message?: string;
  rider?: any;
}

export interface CreateRideData {
  car_id: number;
  start_location: string;
  end_location: string;
  start_time: string;
  seats_available: number;
  total_fare: number;
}

export const useRides = () => {
  const [rides, setRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [myRequests, setMyRequests] = useState<RideRequest[]>([]);
  const [rideHistory, setRideHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchRides = async (limit: number = 50) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ridesAPI.searchRides(limit);
      setRides(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch rides');
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  const createRide = async (rideData: CreateRideData) => {
    setLoading(true);
    setError(null);
    try {
      const newRide = await ridesAPI.createRide(rideData);
      setMyRides(prev => [...prev, newRide]);
      Alert.alert('Success', 'Ride created successfully!');
      return newRide;
    } catch (err: any) {
      setError(err.message || 'Failed to create ride');
      Alert.alert('Error', err.message || 'Failed to create ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMyRides = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ridesAPI.getMyRides();
      setMyRides(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your rides');
      setMyRides([]);
    } finally {
      setLoading(false);
    }
  };

  const requestRide = async (rideId: number, message?: string) => {
    setLoading(true);
    setError(null);
    try {
      const request = await ridesAPI.requestRide(rideId, message);
      Alert.alert('Success', 'Ride request sent successfully!');
      return request;
    } catch (err: any) {
      setError(err.message || 'Failed to send ride request');
      Alert.alert('Error', err.message || 'Failed to send ride request');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getMyRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ridesAPI.getMyRideRequests();
      setMyRequests(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch your requests');
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const getRideHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ridesAPI.getRideHistory();
      setRideHistory(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ride history');
      setRideHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const updateRide = async (rideId: number, updateData: any) => {
    setLoading(true);
    setError(null);
    try {
      const updatedRide = await ridesAPI.updateRide(rideId, updateData);
      setMyRides(prev => prev.map(ride => ride.id === rideId ? updatedRide : ride));
      Alert.alert('Success', 'Ride updated successfully!');
      return updatedRide;
    } catch (err: any) {
      setError(err.message || 'Failed to update ride');
      Alert.alert('Error', err.message || 'Failed to update ride');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getRideDetails = async (rideId: number) => {
    setLoading(true);
    setError(null);
    try {
      const ride = await ridesAPI.getRideDetails(rideId);
      return ride;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ride details');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      full: date.toLocaleString(),
    };
  };

  const getTimeUntilRide = (startTime: string) => {
    const now = new Date();
    const rideTime = new Date(startTime);
    const diffMs = rideTime.getTime() - now.getTime();
    
    if (diffMs < 0) return 'Started';
    
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 24) {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    } else {
      return `${diffMinutes}m`;
    }
  };

  return {
    // Data
    rides,
    myRides,
    myRequests,
    rideHistory,
    
    // State
    loading,
    error,
    
    // Actions
    searchRides,
    createRide,
    getMyRides,
    requestRide,
    getMyRequests,
    getRideHistory,
    updateRide,
    getRideDetails,
    
    // Utilities
    formatDateTime,
    getTimeUntilRide,
  };
};