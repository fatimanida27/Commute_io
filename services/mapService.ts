import * as Location from 'expo-location';
import { Platform } from 'react-native';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationResult {
  coordinates: Coordinates;
  address: string;
  description?: string;
}

export interface RouteInfo {
  distance: string;
  duration: string;
  polyline: string;
}

class MapService {
  private static instance: MapService;
  private hasLocationPermission = false;

  static getInstance(): MapService {
    if (!MapService.instance) {
      MapService.instance = new MapService();
    }
    return MapService.instance;
  }

  // Request location permissions
  async requestLocationPermission(): Promise<boolean> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      this.hasLocationPermission = status === 'granted';
      return this.hasLocationPermission;
    } catch (error) {
      console.error('Error requesting location permission:', error);
      return false;
    }
  }

  // Get current location
  async getCurrentLocation(): Promise<LocationResult | null> {
    try {
      if (!this.hasLocationPermission) {
        const granted = await this.requestLocationPermission();
        if (!granted) return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeout: 10000,
      });

      const address = await this.reverseGeocode({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      return {
        coordinates: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        address: address || 'Current Location',
      };
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  // Reverse geocoding - convert coordinates to address
  async reverseGeocode(coordinates: Coordinates): Promise<string | null> {
    try {
      const [result] = await Location.reverseGeocodeAsync(coordinates);
      if (result) {
        const parts = [
          result.name,
          result.street,
          result.city,
          result.region,
        ].filter(Boolean);
        return parts.join(', ');
      }
      return null;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      return null;
    }
  }

  // Forward geocoding - convert address to coordinates (FREE using Expo Location + Nominatim fallback)
  async geocodeAddress(address: string): Promise<LocationResult | null> {
    try {
      // Try Expo Location first (uses device's native geocoding)
      const results = await Location.geocodeAsync(address);
      if (results.length > 0) {
        const result = results[0];
        const reverseAddress = await this.reverseGeocode({
          latitude: result.latitude,
          longitude: result.longitude,
        });

        return {
          coordinates: {
            latitude: result.latitude,
            longitude: result.longitude,
          },
          address: reverseAddress || address,
        };
      }

      // Fallback to FREE Nominatim API if Expo fails
      const nominatimResult = await this.geocodeWithNominatim(address);
      return nominatimResult;
    } catch (error) {
      console.error('Error geocoding address:', error);
      // Try Nominatim as final fallback
      return await this.geocodeWithNominatim(address);
    }
  }

  // FREE Nominatim geocoding service
  private async geocodeWithNominatim(address: string): Promise<LocationResult | null> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        {
          headers: {
            'User-Agent': 'Commute.io App', // Required by Nominatim
          },
        }
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        return {
          coordinates: {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
          },
          address: result.display_name,
        };
      }
      return null;
    } catch (error) {
      console.error('Error with Nominatim geocoding:', error);
      return null;
    }
  }

  // Calculate distance between two points (in kilometers)
  calculateDistance(point1: Coordinates, point2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(point2.latitude - point1.latitude);
    const dLon = this.toRadians(point2.longitude - point1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.latitude)) *
        Math.cos(this.toRadians(point2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // FREE route calculation using distance calculation
  async getRouteInfo(origin: Coordinates, destination: Coordinates): Promise<RouteInfo | null> {
    try {
      // Calculate straight-line distance (FREE)
      const distance = this.calculateDistance(origin, destination);
      
      // Estimate duration based on average city driving speed (40 km/h)
      const duration = Math.round((distance / 40) * 60); // minutes
      
      return {
        distance: `${distance.toFixed(1)} km`,
        duration: `${duration} min`,
        polyline: '', // Simple straight line routing
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      return null;
    }
  }

  // Search for places near a location
  async searchNearbyPlaces(
    coordinates: Coordinates,
    query: string,
    radius: number = 5000
  ): Promise<LocationResult[]> {
    try {
      // This would typically use Google Places API
      // For now, we'll do a simple geocoding search
      const results = await Location.geocodeAsync(query);
      
      return results
        .filter(result => {
          const distance = this.calculateDistance(coordinates, {
            latitude: result.latitude,
            longitude: result.longitude,
          });
          return distance <= radius / 1000; // Convert radius to km
        })
        .map(result => ({
          coordinates: {
            latitude: result.latitude,
            longitude: result.longitude,
          },
          address: query,
        }));
    } catch (error) {
      console.error('Error searching nearby places:', error);
      return [];
    }
  }

  // Format coordinates for display
  formatCoordinates(coordinates: Coordinates): string {
    return `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}`;
  }

  // Check if location is within a region
  isLocationInRegion(
    location: Coordinates,
    region: {
      latitude: number;
      longitude: number;
      latitudeDelta: number;
      longitudeDelta: number;
    }
  ): boolean {
    return (
      location.latitude >= region.latitude - region.latitudeDelta / 2 &&
      location.latitude <= region.latitude + region.latitudeDelta / 2 &&
      location.longitude >= region.longitude - region.longitudeDelta / 2 &&
      location.longitude <= region.longitude + region.longitudeDelta / 2
    );
  }
}

export const mapService = MapService.getInstance();
export default mapService;