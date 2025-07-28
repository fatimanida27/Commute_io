import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle, MessageCircle, Phone, Navigation, Car } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function RideConfirmedScreen() {
  const params = useLocalSearchParams();
  const {
    driverName,
    driverImage,
    driverPhone,
    riderName,
    riderImage,
    riderPhone,
    startLocation,
    endLocation,
    startTime,
    totalFare,
    userRole, // 'driver' or 'rider'
  } = params;

  useEffect(() => {
    // Auto-dismiss after 5 seconds or show until user takes action
  }, []);

  const handleMessageContact = () => {
    const contactId = userRole === 'driver' ? 'rider' : 'driver';
    const contactName = userRole === 'driver' ? riderName : driverName;
    const contactImage = userRole === 'driver' ? riderImage : driverImage;
    
    router.push({
      pathname: '/(tabs)/message_inbox',
      params: {
        userId: contactId,
        name: contactName,
        image: contactImage,
        rideRoute: `${startLocation} to ${endLocation}`,
      },
    });
  };

  const handleCallContact = () => {
    const contactPhone = userRole === 'driver' ? riderPhone : driverPhone;
    const contactName = userRole === 'driver' ? riderName : driverName;
    
    Alert.alert(
      `Call ${contactName}`,
      `Would you like to call ${contactPhone}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Call', onPress: () => {
          // In a real app, this would open the phone dialer
          Alert.alert('Calling...', `This would call ${contactPhone}`);
        }},
      ]
    );
  };

  const handleViewRideDetails = () => {
    const rideId = params.rideId || params.id;
    if (rideId) {
      router.push(`/(tabs)/ride-in-progress?rideId=${rideId}`);
    } else {
      Alert.alert('Error', 'No ride ID available');
    }
  };

  const handleGoHome = () => {
    router.push('/(tabs)');
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const contactName = userRole === 'driver' ? riderName : driverName;
  const contactImage = userRole === 'driver' ? riderImage : driverImage;
  const isDriver = userRole === 'driver';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Success Icon */}
        <View style={styles.successSection}>
          <CheckCircle size={80} color="#4ECDC4" />
          <Text style={styles.successTitle}>
            {isDriver ? 'Rider Added!' : 'Ride Confirmed!'}
          </Text>
          <Text style={styles.successSubtitle}>
            {isDriver 
              ? `${riderName} has been added to your ride`
              : `${driverName} has accepted your ride request`
            }
          </Text>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <Image
            source={{ uri: Array.isArray(contactImage) ? contactImage[0] : contactImage }}
            style={styles.contactImage}
          />
          <Text style={styles.contactName}>{contactName}</Text>
          <Text style={styles.contactRole}>
            {isDriver ? 'Your Rider' : 'Your Driver'}
          </Text>
        </View>

        {/* Ride Details */}
        <View style={styles.rideDetailsSection}>
          <View style={styles.detailRow}>
            <Navigation size={20} color="#4ECDC4" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Route</Text>
              <Text style={styles.detailValue}>
                {startLocation} → {endLocation}
              </Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Car size={20} color="#4ECDC4" />
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>Departure Time</Text>
              <Text style={styles.detailValue}>{formatTime(startTime as string)}</Text>
            </View>
          </View>

          {totalFare && (
            <View style={styles.detailRow}>
              <Text style={styles.fareIcon}>💰</Text>
              <View style={styles.detailText}>
                <Text style={styles.detailLabel}>Total Fare</Text>
                <Text style={styles.detailValue}>${totalFare}</Text>
              </View>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.messageButton]}
            onPress={handleMessageContact}
          >
            <MessageCircle size={20} color="#4ECDC4" />
            <Text style={styles.messageButtonText}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.callButton]}
            onPress={handleCallContact}
          >
            <Phone size={20} color="#FFFFFF" />
            <Text style={styles.callButtonText}>Call</Text>
          </TouchableOpacity>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleViewRideDetails}
          >
            <Text style={styles.primaryButtonText}>View Ride Details</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoHome}
          >
            <Text style={styles.secondaryButtonText}>Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fffe',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 40,
    justifyContent: 'center',
  },
  successSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  successTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#2d3748',
    marginTop: 20,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  contactSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  contactImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 16,
  },
  contactName: {
    fontSize: 24,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    marginBottom: 4,
  },
  contactRole: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#4ECDC4',
  },
  rideDetailsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 16,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
  },
  fareIcon: {
    fontSize: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  messageButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#4ECDC4',
  },
  messageButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#4ECDC4',
  },
  callButton: {
    backgroundColor: '#4ECDC4',
  },
  callButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  navigationButtons: {
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#4ECDC4',
  },
});