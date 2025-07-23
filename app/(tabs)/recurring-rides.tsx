import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Calendar, Clock, Users, MapPin, Car, Trash2, Edit3 } from 'lucide-react-native';
import { router } from 'expo-router';
import { useRecurringRides, RecurringRide } from '../../hooks/useRecurringRides';

export default function RecurringRidesScreen() {
  const {
    myRecurringRides,
    loading,
    getMyRecurringRides,
    deleteRecurringRide,
    getDayLabel,
    getScheduleTypeLabel,
  } = useRecurringRides();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadRecurringRides();
  }, []);

  const loadRecurringRides = async () => {
    try {
      await getMyRecurringRides();
    } catch (error) {
      console.error('Error loading recurring rides:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRecurringRides();
    setRefreshing(false);
  };

  const handleCreateNew = () => {
    router.push('/(tabs)/create-recurring-ride');
  };

  const handleDeleteRide = (rideId: number) => {
    Alert.alert(
      'Delete Recurring Ride',
      'Are you sure you want to delete this recurring ride? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteRecurringRide(rideId),
        },
      ]
    );
  };

  const formatTime = (time: string) => {
    const [hour, minute] = time.split(':');
    const hourNum = parseInt(hour);
    const ampm = hourNum >= 12 ? 'PM' : 'AM';
    const hour12 = hourNum === 0 ? 12 : hourNum > 12 ? hourNum - 12 : hourNum;
    return `${hour12}:${minute} ${ampm}`;
  };

  const renderRecurringRide = (ride: RecurringRide) => (
    <View key={ride.id} style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText} numberOfLines={1}>
            {ride.start_location} → {ride.end_location}
          </Text>
          <Text style={styles.scheduleText}>
            {getDayLabel(ride.day_of_week)} at {formatTime(ride.start_time)}
          </Text>
        </View>
        <View style={styles.fareContainer}>
          <Text style={styles.fareAmount}>${ride.total_fare.toFixed(2)}</Text>
        </View>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailItem}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.detailText}>{getScheduleTypeLabel(ride.schedule_type)}</Text>
        </View>
        
        <View style={styles.detailItem}>
          <Users size={16} color="#6B7280" />
          <Text style={styles.detailText}>{ride.seats_available} seats</Text>
        </View>
        
        <View style={styles.detailItem}>
          <View style={[styles.statusBadge, styles[`status${ride.status}`]]}>
            <Text style={[styles.statusText, styles[`statusText${ride.status}`]]}>
              {ride.status}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rideActions}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.editButton]}
          onPress={() => {
            // TODO: Navigate to edit screen
            Alert.alert('Edit', 'Edit functionality coming soon!');
          }}
        >
          <Edit3 size={16} color="#4ECDC4" />
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.deleteButton]}
          onPress={() => handleDeleteRide(ride.id)}
        >
          <Trash2 size={16} color="#EF4444" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Calendar size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No recurring rides yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first recurring ride to start sharing regular commutes with others
      </Text>
      <TouchableOpacity style={styles.createFirstButton} onPress={handleCreateNew}>
        <Text style={styles.createFirstButtonText}>Create your first ride</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recurring Rides</Text>
        <TouchableOpacity style={styles.addButton} onPress={handleCreateNew}>
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loading && myRecurringRides.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Loading your recurring rides...</Text>
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4ECDC4']}
              tintColor="#4ECDC4"
            />
          }
        >
          {myRecurringRides.length === 0 ? (
            renderEmptyState()
          ) : (
            <View style={styles.ridesContainer}>
              {myRecurringRides.map(renderRecurringRide)}
            </View>
          )}
        </ScrollView>
      )}
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
  title: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
  content: {
    flex: 1,
  },
  ridesContainer: {
    padding: 24,
  },
  rideCard: {
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
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  routeInfo: {
    flex: 1,
    marginRight: 16,
  },
  routeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  scheduleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  fareContainer: {
    alignItems: 'flex-end',
  },
  fareAmount: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4ECDC4',
  },
  rideDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusactive: {
    backgroundColor: '#D1FAE5',
  },
  statuspaused: {
    backgroundColor: '#FEF3C7',
  },
  statuscancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    textTransform: 'capitalize',
  },
  statusTextactive: {
    color: '#059669',
  },
  statusTextpaused: {
    color: '#D97706',
  },
  statusTextcancelled: {
    color: '#DC2626',
  },
  rideActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 0.48,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#4ECDC4',
  },
  deleteButton: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#4ECDC4',
    marginLeft: 6,
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#EF4444',
    marginLeft: 6,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createFirstButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createFirstButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});