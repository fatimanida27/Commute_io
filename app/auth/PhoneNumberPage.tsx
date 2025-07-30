import React, { useState } from "react";
import { View, ScrollView, Text, TextInput, TouchableOpacity, StyleSheet, Dimensions, Alert } from "react-native";
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { authAPI } from "../../services/api";

const { width } = Dimensions.get("window");

const PhoneNumberScreen = () => {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);


  const handleBack = () => {
    router.push('/auth/signup');

  };

  const handleNext = async () => {
  const cleaned = phone.replace(/\D/g, ''); // remove non-digit characters

  if (cleaned.length === 11 && cleaned.startsWith('03')) {
    const formattedPhone = `+92${cleaned.slice(1)}`; // convert 03XX to +923XX
    setLoading(true);
        const timeout = setTimeout(() => {
        setLoading(false);
        Alert.alert("Timeout", "Request took too long");
      }, 15000);
      try {
            await authAPI.sendMobileOTP(formattedPhone);
            console.log("OTP sent to:", formattedPhone);
            router.push({
              pathname: '/auth/PhoneOTP',
              params: { formattedPhone },
            });
          } catch (error) {
            Alert.alert("Error", error instanceof Error ? error.message : "Failed to send OTP");
          } finally {
                clearTimeout(timeout);
            setLoading(false);
          }
  } else {
    alert("Please enter a valid Pakistani phone number (e.g. 03XX-XXXXXXX)");
  }
};

  
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="#2d3748" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Verification</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title}>Enter your phone number</Text>
          <Text style={styles.subtitle}>
            We'll send a verification code via WhatsApp
          </Text>

          <TextInput
            style={styles.input}
            placeholder="03XX-XXXXXXX"
            placeholderTextColor="#9CA3AF"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />

          <TouchableOpacity 
            style={[styles.nextButton, loading && styles.nextButtonDisabled]} 
            onPress={handleNext}
            disabled={loading}
          >
            <Text style={styles.nextButtonText}>
              {loading ? "Sending..." : "Next"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PhoneNumberScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
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
  headerText: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#2d3748',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 24,
  },
  nextButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 25,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 32,
  },
  footerText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 21,
  },
});