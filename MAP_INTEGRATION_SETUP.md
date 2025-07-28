# 🗺️ Map Integration Setup Guide

## Overview
Commute.io now includes comprehensive map integration with location services, route visualization, and interactive ride management. This guide will help you set up and configure all the mapping features.

## 📦 Dependencies Installed

The following packages have been added to support map functionality:

```json
{
  "react-native-maps": "Latest",
  "expo-location": "Latest", 
  "react-native-maps-directions": "Latest"
}
```

## 🔧 Platform Configuration

### iOS Configuration

Add the following to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "This app needs access to location when open and in the background.",
          "isIosBackgroundLocationEnabled": true
        }
      ]
    ],
    "ios": {
      "config": {
        "googleMapsApiKey": "YOUR_IOS_GOOGLE_MAPS_API_KEY"
      }
    }
  }
}
```

### Android Configuration

Add to `app.json`:

```json
{
  "expo": {
    "android": {
      "config": {
        "googleMaps": {
          "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
        }
      },
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION"
      ]
    }
  }
}
```

## 🔑 Google Maps API Setup

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Directions API
   - Geocoding API
   - Places API (optional for enhanced search)

### 2. Configure API Key

Replace the placeholder in `services/mapService.ts`:

```typescript
// In mapService.ts
const GOOGLE_MAPS_API_KEY = 'YOUR_ACTUAL_GOOGLE_MAPS_API_KEY';
```

And in `components/MapView.tsx`:

```typescript
// In MapView.tsx
apiKey = 'YOUR_ACTUAL_GOOGLE_MAPS_API_KEY'
```

### 3. Restrict API Key (Recommended)

In Google Cloud Console:
- Set application restrictions (iOS/Android bundle IDs)
- Set API restrictions to only enabled APIs
- Monitor usage to prevent quota overuse

## 🗺️ Features Integrated

### 1. **MapService** (`services/mapService.ts`)
- **Location Permissions**: Automatic permission requests
- **Current Location**: GPS-based user location
- **Geocoding**: Address → Coordinates conversion
- **Reverse Geocoding**: Coordinates → Address conversion  
- **Distance Calculation**: Haversine formula for accurate distances
- **Route Information**: Google Directions API integration

### 2. **MapComponent** (`components/MapView.tsx`)
- **Interactive Maps**: Pan, zoom, marker interaction
- **Route Visualization**: Polylines with Google Directions
- **Multiple Markers**: Different types (pickup, dropoff, user, driver)
- **Auto-Fit**: Automatically fit map to show all markers/routes
- **Customizable**: Configurable appearance and behavior

### 3. **LocationPicker** (`components/LocationPicker.tsx`)
- **Dual Interface**: List view and map view toggle
- **Search Functionality**: Address search with autocomplete
- **Location History**: Recently searched locations
- **Current Location**: Quick access to GPS location
- **Map Selection**: Tap-to-select locations on map

## 🚗 Updated Screens

### 1. **Offer Ride** (`app/(tabs)/offer-ride.tsx`)
- **Interactive Location Selection**: Tap to open location picker
- **Route Calculation**: Automatic distance and duration calculation
- **Fare Estimation**: Dynamic pricing based on calculated distance
- **Visual Feedback**: Shows estimated route information

### 2. **Map Search** (`app/(tabs)/map-search.tsx`) - NEW
- **Visual Ride Discovery**: See all available rides on map
- **Location-Based Filtering**: Filter rides by proximity
- **Hybrid View**: Map + list combination
- **Interactive Markers**: Tap markers to see ride details

### 3. **Ride In Progress** (`app/(tabs)/ride-in-progress.tsx`)
- **Live Map Toggle**: Switch between static and interactive map
- **Route Visualization**: Complete route with start/end markers
- **Real-Time Tracking**: Support for live location updates
- **Driver/Rider Context**: Different views for different user types

### 4. **Tab Navigation**
- **New Map Tab**: Dedicated map search tab in bottom navigation
- **Consistent Icons**: Lucide icons for all map-related features

## 📊 Database Updates

### New Fields in Rides Table:
```sql
ALTER TABLE rides ADD COLUMN start_latitude FLOAT;
ALTER TABLE rides ADD COLUMN start_longitude FLOAT;
ALTER TABLE rides ADD COLUMN end_latitude FLOAT;
ALTER TABLE rides ADD COLUMN end_longitude FLOAT;
ALTER TABLE rides ADD COLUMN distance_km FLOAT;
ALTER TABLE rides ADD COLUMN estimated_duration INTEGER;
```

### Backend Schema Updates:
- `backend/app/db/models/ride.py` - Added coordinate fields
- `backend/app/schema/ride.py` - Updated Pydantic models
- API endpoints now accept and return coordinate data

## 🔄 User Flow Integration

### 1. **Ride Creation Flow**
```
1. User taps "From" location → LocationPicker opens
2. User searches/selects pickup location
3. User taps "To" location → LocationPicker opens  
4. User searches/selects destination
5. App calculates route and shows distance/duration
6. User sets other ride details (time, seats, etc.)
7. Ride created with full coordinate data
```

### 2. **Ride Search Flow**
```
1. User opens Map tab
2. App shows current location and nearby rides
3. User can filter by locations using LocationPicker
4. Map updates to show filtered rides
5. User taps marker or list item to view ride details
6. User can request to join ride
```

### 3. **Active Ride Flow**
```
1. Ride starts → Navigate to ride-in-progress
2. Static map shows by default
3. User can toggle to interactive map
4. Real-time route and location tracking
5. Driver can see all rider locations
6. Riders can track progress to destination
```

## 🎨 UI/UX Features

### Visual Design
- **Consistent Color Scheme**: Teal (#4ECDC4) for primary, Red (#FF6B6B) for destinations
- **Intuitive Icons**: Map, Navigation, MapPin icons throughout
- **Loading States**: Smooth transitions and loading indicators
- **Error Handling**: Graceful fallbacks when location services unavailable

### Interactive Elements
- **Touch Targets**: Properly sized for mobile interaction
- **Gesture Support**: Pan, zoom, tap gestures on maps
- **Feedback**: Visual feedback for user actions
- **Accessibility**: Screen reader support for map interactions

## 🔧 Configuration Options

### MapService Configuration
```typescript
// Customize in services/mapService.ts
const CONFIG = {
  DEFAULT_RADIUS: 10000, // Search radius in meters
  LOCATION_TIMEOUT: 10000, // GPS timeout in ms
  GEOCODING_LANGUAGE: 'en', // Language for address results
  HIGH_ACCURACY: true, // GPS accuracy setting
};
```

### MapComponent Options
```typescript
<MapComponent
  showUserLocation={true}      // Show user's current location
  showDirections={true}        // Show route lines
  zoomToRoute={true}          // Auto-fit map to route
  apiKey="YOUR_API_KEY"       // Google Maps API key
  style={customStyles}        // Custom styling
/>
```

## 📱 Testing & Development

### Development Testing
1. **Simulator**: Basic functionality (limited GPS)
2. **Physical Device**: Full GPS and location testing
3. **Different Locations**: Test geocoding accuracy
4. **Network Conditions**: Test with poor connectivity

### Production Checklist
- [ ] Google Maps API key configured
- [ ] Location permissions properly requested
- [ ] API rate limits and billing set up
- [ ] Error handling for all location scenarios
- [ ] Performance testing with many markers
- [ ] Accessibility testing completed

## 🚀 Deployment Notes

### Environment Variables
Create environment-specific API keys:
```
DEVELOPMENT_GOOGLE_MAPS_API_KEY=dev_key_here
PRODUCTION_GOOGLE_MAPS_API_KEY=prod_key_here
```

### Build Configuration
- Ensure proper API keys in build configuration
- Test on both iOS and Android before release
- Monitor API usage after deployment

## 🛠️ Troubleshooting

### Common Issues

1. **Maps Not Loading**
   - Check API key configuration
   - Verify Google Maps APIs are enabled
   - Check network connectivity

2. **Location Not Working**
   - Ensure location permissions granted
   - Test on physical device (not simulator)
   - Check device location services enabled

3. **Geocoding Errors**
   - Verify Geocoding API enabled
   - Check API key restrictions
   - Test with different address formats

4. **Route Calculation Failing**
   - Ensure Directions API enabled
   - Check API quota and billing
   - Implement fallback distance calculation

### Performance Optimization
- **Marker Clustering**: For screens with many rides
- **Lazy Loading**: Load map components only when needed
- **Caching**: Cache frequent geocoding results
- **Debouncing**: Debounce search queries

## 🔄 Future Enhancements

### Planned Features
- **Real-Time Tracking**: Live GPS updates during rides
- **Offline Maps**: Cached map data for poor connectivity
- **Custom Map Styles**: Dark mode and branded map themes
- **Advanced Search**: Filter by distance, time, price
- **Route Optimization**: Multiple pickup/dropoff optimization

### API Integration Opportunities
- **Places API**: Enhanced location search and suggestions
- **Traffic API**: Real-time traffic-aware routing
- **Street View**: Visual context for pickup locations
- **Geofencing**: Automatic ride start/end detection

---

## 📞 Support

For issues with map integration:
1. Check this documentation first
2. Verify API key and permissions
3. Test on physical device
4. Check console logs for specific errors

The map integration provides a complete, production-ready mapping solution for the Commute.io rideshare application with comprehensive location services, route visualization, and interactive user experiences.