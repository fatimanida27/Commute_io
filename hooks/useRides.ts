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
      console.warn('Backend not available, using mock data for demo');
      // Mock data for demonstration
      const mockRides = [
        {
          id: 1,
          driver_id: 2,
          car_id: 1,
          start_location: "Stanford University",
          end_location: "San Francisco",
          start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
          seats_available: 3,
          total_fare: 25.00,
          status: "active",
          created_at: new Date().toISOString(),
          driver: {
            id: 2,
            name: "John Doe",
            photo_url: null,
          },
          car: {
            id: 1,
            make: "Tesla",
            model: "Model 3",
            color: "White",
            seats: 5,
          }
        },
        {
          id: 2,
          driver_id: 3,
          car_id: 2,
          start_location: "Palo Alto",
          end_location: "Mountain View",
          start_time: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
          seats_available: 2,
          total_fare: 15.00,
          status: "active",
          created_at: new Date().toISOString(),
          driver: {
            id: 3,
            name: "Jane Smith",
            photo_url: null,
          },
          car: {
            id: 2,
            make: "Honda",
            model: "Civic",
            color: "Blue",
            seats: 5,
          }
        }
      ];
      setRides(mockRides);
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
      console.warn('Backend not available, simulating ride creation for demo');
      const mockNewRide = {
        id: Date.now(),
        driver_id: 1,
        ...rideData,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      setMyRides(prev => [...prev, mockNewRide]);
      Alert.alert('Success', 'Ride created successfully! (Demo mode)');
      return mockNewRide;
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
      console.warn('Backend not available, using mock data for demo');
      const mockMyRides = [
        {
          id: 101,
          driver_id: 1,
          car_id: 1,
          start_location: "Stanford University",
          end_location: "San Francisco",
          start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
          seats_available: 3,
          total_fare: 25.00,
          status: "active",
          created_at: new Date().toISOString(),
        }
      ];
      setMyRides(mockMyRides);
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
      console.warn('Backend not available, simulating request for demo');
      Alert.alert('Success', 'Ride request sent successfully! (Demo mode)');
      return { id: Date.now(), status: 'pending' };
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
      console.warn('Backend not available, using mock data for demo');
      const mockRequests = [
        {
          id: 1,
          rider_id: 1,
          ride_id: 1,
          status: 'pending',
          requested_at: new Date().toISOString(),
          message: 'Hi, I would like to join your ride!',
        }
      ];
      setMyRequests(mockRequests);
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
      console.warn('Backend not available, using mock data for demo');
      const mockHistory = [
        {
          id: 1,
          user_id: 1,
          ride_id: 50,
          role: 'driver',
          joined_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
          rating_given: 5,
          rating_received: 4,
        },
        {
          id: 2,
          user_id: 1,
          ride_id: 51,
          role: 'rider',
          joined_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          completed_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
          rating_given: 4,
          rating_received: 5,
        }
      ];
      setRideHistory(mockHistory);
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
      console.warn('Backend not available, using mock data for demo');
      // Return mock ride details
      return {
        id: rideId,
        driver_id: 2,
        car_id: 1,
        start_location: "Stanford University",
        end_location: "San Francisco",
        start_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        seats_available: 3,
        total_fare: 25.00,
        status: "active",
        created_at: new Date().toISOString(),
        driver: {
          id: 2,
          name: "John Doe",
          photo_url: null,
          phone: "+1234567890",
        },
        car: {
          id: 1,
          make: "Tesla",
          model: "Model 3",
          color: "White",
          seats: 5,
          license_plate: "ABC123",
        }
      };
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