import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar, MapPin, Clock, User, MessageCircle, Star, Plus, Car } from 'lucide-react-native';
import { router } from 'expo-router';
import { useRides } from '../../hooks/useRides';
import { useRecurringRides } from '../../hooks/useRecurringRides';

export default function RidesScreen() {
  const [activeTab, setActiveTab] = useState<'available' | 'my-rides' | 'requests' | 'recurring'>('available');
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    rides,
    myRides,
    myRequests,
    rideHistory,
    loading,
    error,
    searchRides,
    getMyRides,
    getMyRequests,
    getRideHistory,
    requestRide,
    formatDateTime,
    getTimeUntilRide,
  } = useRides();

  const {
    myRecurringRides,
    loading: recurringLoading,
    getMyRecurringRides,
    getDayLabel,
  } = useRecurringRides();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await searchRides();
      await getMyRides();
      await getMyRequests();
      await getMyRecurringRides();
    } catch (error) {
      console.error('Error loading ride data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRequestRide = async (rideId: number) => {
    try {
      await requestRide(rideId, "Hi, I'd like to join your ride!");
      await loadData();
    } catch (error) {
      // Error already handled in hook
    }
  };

  const renderRideCard = (ride: any, type: 'available' | 'my-ride' | 'request') => (
    <TouchableOpacity 
      key={ride.id} 
      style={styles.rideCard}
      onPress={() => router.push(`/ride-details?id=${ride.id}`)}
    >
      <View style={styles.rideHeader}>
        <View style={styles.routeInfo}>
          <View style={styles.routeRow}>
            <MapPin size={16} color="#4ECDC4" />
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.start_location}
            </Text>
          </View>
          <View style={styles.routeArrow}>
            <Text style={styles.arrowText}>→</Text>
          </View>
          <View style={styles.routeRow}>
            <MapPin size={16} color="#EF4444" />
            <Text style={styles.locationText} numberOfLines={1}>
              {ride.end_location}
            </Text>
          </View>
        </View>
        <Text style={styles.fareText}>${ride.total_fare}</Text>
      </View>

      <View style={styles.rideDetails}>
        <View style={styles.detailRow}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {formatDateTime(ride.start_time).time} • {getTimeUntilRide(ride.start_time)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <User size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {ride.seats_available} seats • {ride.driver?.name || 'Driver'}
          </Text>
        </View>
      </View>

      {type === 'available' && (
        <TouchableOpacity 
          style={styles.requestButton}
          onPress={(e) => {
            e.stopPropagation();
            handleRequestRide(ride.id);
          }}
        >
          <Text style={styles.requestButtonText}>Request Ride</Text>
        </TouchableOpacity>
      )}

      {type === 'request' && (
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, styles[`status${ride.status}`]]}>
            {ride.status.toUpperCase()}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderRecurringRideCard = (ride: any) => (
    <TouchableOpacity key={ride.id} style={styles.rideCard}>
      <View style={styles.rideHeader}>
        <View style={styles.routeInfo}>
          <Text style={styles.routeText} numberOfLines={1}>
            {ride.start_location} → {ride.end_location}
          </Text>
          <Text style={styles.scheduleText}>
            {getDayLabel(ride.day_of_week)} at {ride.start_time}
          </Text>
        </View>
        <Text style={styles.fareText}>${ride.total_fare}</Text>
      </View>
      <View style={styles.statusContainer}>
        <Text style={[styles.statusText, styles[`status${ride.status}`]]}>
          {ride.status.toUpperCase()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderTabContent = () => {
    if (loading || recurringLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ECDC4" />
          <Text style={styles.loadingText}>Loading rides...</Text>
        </View>
      );
    }

    switch (activeTab) {
      case 'available':
        return (
          <View style={styles.contentContainer}>
            {rides.length === 0 ? (
              <View style={styles.emptyState}>
                <Car size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No rides available</Text>
                <Text style={styles.emptySubtitle}>
                  Check back later or create your own ride
                </Text>
              </View>
            ) : (
              rides.map(ride => renderRideCard(ride, 'available'))
            )}
          </View>
        );

      case 'my-rides':
        return (
          <View style={styles.contentContainer}>
            {myRides.length === 0 ? (
              <View style={styles.emptyState}>
                <Car size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No rides created</Text>
                <Text style={styles.emptySubtitle}>
                  Create your first ride to start sharing
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/offer-ride')}
                >
                  <Text style={styles.createButtonText}>Create Ride</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myRides.map(ride => renderRideCard(ride, 'my-ride'))
            )}
          </View>
        );

      case 'requests':
        return (
          <View style={styles.contentContainer}>
            {myRequests.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageCircle size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No ride requests</Text>
                <Text style={styles.emptySubtitle}>
                  Your ride requests will appear here
                </Text>
              </View>
            ) : (
              myRequests.map(request => renderRideCard(request, 'request'))
            )}
          </View>
        );

      case 'recurring':
        return (
          <View style={styles.contentContainer}>
            {myRecurringRides.length === 0 ? (
              <View style={styles.emptyState}>
                <Calendar size={64} color="#D1D5DB" />
                <Text style={styles.emptyTitle}>No recurring rides</Text>
                <Text style={styles.emptySubtitle}>
                  Set up recurring rides for regular commutes
                </Text>
                <TouchableOpacity 
                  style={styles.createButton}
                  onPress={() => router.push('/create-recurring-ride')}
                >
                  <Text style={styles.createButtonText}>Create Schedule</Text>
                </TouchableOpacity>
              </View>
            ) : (
              myRecurringRides.map(ride => renderRecurringRideCard(ride))
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Rides</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/offer-ride')}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'available', label: 'Available' },
            { key: 'my-rides', label: 'My Rides' },
            { key: 'requests', label: 'Requests' },
            { key: 'recurring', label: 'Recurring' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab.key && styles.activeTabText,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4ECDC4']}
            tintColor="#4ECDC4"
          />
        }
      >
        {renderTabContent()}
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
  tabContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginHorizontal: 4,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4ECDC4',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginTop: 12,
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
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
    marginRight: 16,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeArrow: {
    alignItems: 'center',
    marginVertical: 4,
  },
  arrowText: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter-Medium',
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#2d3748',
    marginLeft: 8,
    flex: 1,
  },
  fareText: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#4ECDC4',
  },
  rideDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginLeft: 8,
  },
  requestButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  requestButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
  statusContainer: {
    alignItems: 'flex-end',
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statuspending: {
    backgroundColor: '#FEF3C7',
    color: '#D97706',
  },
  statusaccepted: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
  },
  statusrejected: {
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
  },
  statusactive: {
    backgroundColor: '#D1FAE5',
    color: '#059669',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#ffffff',
  },
});