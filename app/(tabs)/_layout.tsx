import { Tabs } from 'expo-router';
import { Chrome as Home, Search, MessageCircle, User, Car } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Inter-Medium',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Find Rides',
          tabBarIcon: ({ size, color }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="driver-requests"
        options={{
          title: 'Requests',
          tabBarIcon: ({ size, color }) => (
            <Car size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ size, color }) => (
            <User size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="rides"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="ride-chat"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="ride-details"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="create-recurring-ride"
        options={{
          href: null, // Hide this tab
        }}
      />
    <Tabs.Screen
        name="setting"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="setting_screens/about"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="setting_screens/display"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="setting_screens/help"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="setting_screens/notification"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="profile_screens/edit"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="profile_screens/ride_history"
        options={{
          href: null, // Hide this tab
        }}
      />
       <Tabs.Screen
        name="offer-ride"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="join-requests"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="ride-request-screen"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="ride-in-progress"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="ride-summary"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="message_inbox"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="ride-message"
        options={{
          href: null, // Hide this tab
        }}
      />
      <Tabs.Screen
        name="ride-confirmed"
        options={{
          href: null, // Hide this tab
        }}
      />
    </Tabs>
  );
}