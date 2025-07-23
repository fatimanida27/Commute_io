import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Plus, Calendar, Car, MapPin, Clock, User, MessageCircle } from 'lucide-react-native';
import { useAuth } from '../../hooks/useAuth';
import { useRides } from '../../hooks/useRides';
import { useRecurringRides } from '../../hooks/useRecurringRides';

export default function HomeScreen() {
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  
  const {
    rides,
    myRides,
    loading: ridesLoading,
    searchRides,
    getMyRides,
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
      await Promise.all([
        searchRides(3), // Get only 3 recent rides for home screen
        getMyRides(),
        getMyRecurringRides(),
      ]);
    } catch (error) {
      console.error('Error loading home data:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    {
      title: 'Find a Ride',
      subtitle: 'Search available rides',
      icon: Car,
      color: '#4ECDC4',
      onPress: () => router.push('/(tabs)/rides'),
    },
    {
      title: 'Offer a Ride',
      subtitle: 'Share your commute',
      icon: Plus,
      color: '#44A08D',
      onPress: () => router.push('/offer-ride'),
    },
    {
      title: 'Schedule Rides',
      subtitle: 'Set up recurring rides',
      icon: Calendar,
      color: '#6366F1',
      onPress: () => router.push('/create-recurring-ride'),
    },
    {
      title: 'Messages',
      subtitle: 'Chat with ride partners',
      icon: MessageCircle,
      color: '#EF4444',
      onPress: () => router.push('/(tabs)/messages'),
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4ECDC4']}
            tintColor="#4ECDC4"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.userName}>{user?.name || 'Rider'}!</Text>
          </View>
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <User size={24} color="#4ECDC4" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, { borderLeftColor: action.color }]}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Rides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Available Rides</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/rides')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {ridesLoading ? (
            <ActivityIndicator size="large" color="#4ECDC4" style={styles.loader} />
          ) : rides.length > 0 ? (
            <View style={styles.ridesContainer}>
              {rides.slice(0, 3).map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={styles.rideCard}
                  onPress={() => router.push(`/ride-details?id=${ride.id}`)}
                >
                  <View style={styles.rideRoute}>
                    <MapPin size={16} color="#4ECDC4" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.start_location} → {ride.end_location}
                    </Text>
                  </View>
                  <View style={styles.rideInfo}>
                    <View style={styles.rideTime}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.timeText}>
                        {formatDateTime(ride.start_time).time}
                      </Text>
                    </View>
                    <Text style={styles.fareText}>${ride.total_fare}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Car size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No rides available</Text>
              <Text style={styles.emptySubtext}>Be the first to offer a ride!</Text>
            </View>
          )}
        </View>

        {/* My Rides */}
        {myRides.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Your Rides</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/rides?tab=my-rides')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.ridesContainer}>
              {myRides.slice(0, 2).map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={[styles.rideCard, styles.myRideCard]}
                  onPress={() => router.push(`/ride-details?id=${ride.id}`)}
                >
                  <View style={styles.rideRoute}>
                    <MapPin size={16} color="#44A08D" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.start_location} → {ride.end_location}
                    </Text>
                  </View>
                  <View style={styles.rideInfo}>
                    <View style={styles.rideTime}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.timeText}>
                        {formatDateTime(ride.start_time).time}
                      </Text>
                    </View>
                    <Text style={styles.fareText}>${ride.total_fare}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Recurring Rides */}
        {myRecurringRides.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recurring Schedule</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/rides?tab=recurring')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.ridesContainer}>
              {myRecurringRides.slice(0, 2).map((ride) => (
                <TouchableOpacity
                  key={ride.id}
                  style={[styles.rideCard, styles.recurringRideCard]}
                >
                  <View style={styles.rideRoute}>
                    <Calendar size={16} color="#6366F1" />
                    <Text style={styles.routeText} numberOfLines={1}>
                      {ride.start_location} → {ride.end_location}
                    </Text>
                  </View>
                  <View style={styles.rideInfo}>
                    <Text style={styles.scheduleText}>
                      {getDayLabel(ride.day_of_week)} at {ride.start_time}
                    </Text>
                    <Text style={styles.fareText}>${ride.total_fare}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: '#ffffff',
    marginBottom: 8,
  },
  greetingContainer: {
    flex: 1,
  },
  greeting: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  userName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginTop: 4,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#ffffff',
    marginBottom: 8,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
  },
  seeAllText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#4ECDC4',
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fffe',
    borderLeftWidth: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  loader: {
    paddingVertical: 20,
  },
  ridesContainer: {
    gap: 12,
  },
  rideCard: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#f8fffe',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  myRideCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#44A08D',
  },
  recurringRideCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#6366F1',
  },
  rideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginLeft: 8,
    flex: 1,
  },
  rideInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rideTime: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    marginLeft: 4,
  },
  scheduleText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  fareText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#4ECDC4',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    marginTop: 12,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
});