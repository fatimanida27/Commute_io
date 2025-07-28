import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Alert, Dimensions } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { Coordinates, LocationResult } from '../services/mapService';

const { width, height } = Dimensions.get('window');

interface MapComponentProps {
  initialRegion?: Region;
  markers?: MarkerData[];
  route?: {
    origin: Coordinates;
    destination: Coordinates;
    waypoints?: Coordinates[];
  };
  onMapPress?: (coordinate: Coordinates) => void;
  onMarkerPress?: (marker: MarkerData) => void;
  showUserLocation?: boolean;
  showDirections?: boolean;
  style?: any;
  // apiKey not needed for free version
  zoomToRoute?: boolean;
}

export interface MarkerData {
  id: string;
  coordinate: Coordinates;
  title?: string;
  description?: string;
  type?: 'pickup' | 'dropoff' | 'user' | 'driver' | 'waypoint';
  image?: any;
}

const MARKER_COLORS = {
  pickup: '#4ECDC4',
  dropoff: '#FF6B6B',
  user: '#4ECDC4',
  driver: '#45B7D1',
  waypoint: '#96CEB4',
};

export default function MapComponent({
  initialRegion,
  markers = [],
  route,
  onMapPress,
  onMarkerPress,
  showUserLocation = true,
  showDirections = true,
  style,
  zoomToRoute = true,
}: MapComponentProps) {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );

  // Auto-fit map to show route
  useEffect(() => {
    if (route && zoomToRoute && mapRef.current) {
      const coordinates = [route.origin, route.destination];
      if (route.waypoints) {
        coordinates.push(...route.waypoints);
      }
      
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [route, zoomToRoute]);

  // Auto-fit map to show all markers
  useEffect(() => {
    if (markers.length > 1 && mapRef.current && !route) {
      const coordinates = markers.map(marker => marker.coordinate);
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: true,
      });
    }
  }, [markers, route]);

  const handleMapPress = (event: any) => {
    if (onMapPress) {
      const coordinate = event.nativeEvent.coordinate;
      onMapPress(coordinate);
    }
  };

  const handleMarkerPress = (marker: MarkerData) => {
    if (onMarkerPress) {
      onMarkerPress(marker);
    }
  };

  const renderMarker = (marker: MarkerData) => {
    const color = MARKER_COLORS[marker.type || 'user'];
    
    return (
      <Marker
        key={marker.id}
        coordinate={marker.coordinate}
        title={marker.title}
        description={marker.description}
        pinColor={color}
        onPress={() => handleMarkerPress(marker)}
      >
        {marker.image && (
          <View style={[styles.customMarker, { backgroundColor: color }]}>
            {marker.image}
          </View>
        )}
      </Marker>
    );
  };

  const renderRoute = () => {
    if (!route || !showDirections) return null;

    // FREE routing: simple straight line between points
    const coordinates = [route.origin];
    if (route.waypoints) {
      coordinates.push(...route.waypoints);
    }
    coordinates.push(route.destination);

    return (
      <Polyline
        coordinates={coordinates}
        strokeColor="#4ECDC4"
        strokeWidth={4}
        lineDashPattern={[10, 5]} // Dashed line for visual appeal
      />
    );
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        ref={mapRef}
        provider={undefined} // Uses free OpenStreetMap on Android, Apple Maps on iOS
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        onPress={handleMapPress}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={true}
        showsTraffic={false}
        showsBuildings={true}
        showsIndoors={true}
        maxZoomLevel={18}
        minZoomLevel={3}
      >
        {markers.map(renderMarker)}
        {renderRoute()}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

// Helper function to create region from coordinates
export function createRegionFromCoordinates(coordinates: Coordinates[], padding: number = 0.01): Region {
  if (coordinates.length === 0) {
    return {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    };
  }

  if (coordinates.length === 1) {
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
  }

  const minLat = Math.min(...coordinates.map(c => c.latitude));
  const maxLat = Math.max(...coordinates.map(c => c.latitude));
  const minLng = Math.min(...coordinates.map(c => c.longitude));
  const maxLng = Math.max(...coordinates.map(c => c.longitude));

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const deltaLat = (maxLat - minLat) + padding;
  const deltaLng = (maxLng - minLng) + padding;

  return {
    latitude: centerLat,
    longitude: centerLng,
    latitudeDelta: Math.max(deltaLat, 0.01),
    longitudeDelta: Math.max(deltaLng, 0.01),
  };
}