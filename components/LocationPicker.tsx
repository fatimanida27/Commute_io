import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapPin, X, Search, Navigation, Clock } from 'lucide-react-native';
import MapComponent, { MarkerData, createRegionFromCoordinates } from './MapView';
import mapService, { Coordinates, LocationResult } from '../services/mapService';

interface LocationPickerProps {
  visible: boolean;
  onClose: () => void;
  onLocationSelect: (location: LocationResult) => void;
  title?: string;
  initialLocation?: LocationResult;
  showSearchHistory?: boolean;
}

export default function LocationPicker({
  visible,
  onClose,
  onLocationSelect,
  title = 'Select Location',
  initialLocation,
  showSearchHistory = true,
}: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(initialLocation || null);
  const [currentLocation, setCurrentLocation] = useState<LocationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<LocationResult[]>([]);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    if (visible) {
      getCurrentLocation();
      loadSearchHistory();
    }
  }, [visible]);

  const getCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await mapService.getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        if (!selectedLocation) {
          setSelectedLocation(location);
        }
      }
    } catch (error) {
      console.error('Error getting current location:', error);
      Alert.alert('Location Error', 'Unable to get your current location');
    } finally {
      setLoading(false);
    }
  };

  const loadSearchHistory = () => {
    // In a real app, you'd load this from AsyncStorage
    // For now, we'll use mock data
    const mockHistory: LocationResult[] = [
      {
        coordinates: { latitude: 37.7749, longitude: -122.4194 },
        address: 'San Francisco, CA',
        description: 'Recent search',
      },
      {
        coordinates: { latitude: 37.7849, longitude: -122.4094 },
        address: 'Downtown San Francisco',
        description: 'Frequent location',
      },
    ];
    setSearchHistory(mockHistory);
  };

  const searchLocations = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const result = await mapService.geocodeAddress(query);
      if (result) {
        setSearchResults([result]);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchSubmit = () => {
    searchLocations(searchQuery);
  };

  const handleLocationSelect = (location: LocationResult) => {
    setSelectedLocation(location);
    setSearchQuery(location.address);
    setSearchResults([]);
    
    // Add to search history
    const updatedHistory = [location, ...searchHistory.filter(h => h.address !== location.address)].slice(0, 5);
    setSearchHistory(updatedHistory);
  };

  const handleMapLocationSelect = (coordinate: Coordinates) => {
    // Reverse geocode the selected coordinate
    mapService.reverseGeocode(coordinate).then(address => {
      const location: LocationResult = {
        coordinates: coordinate,
        address: address || mapService.formatCoordinates(coordinate),
      };
      handleLocationSelect(location);
    });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect(selectedLocation);
      onClose();
    }
  };

  const renderSearchResult = (location: LocationResult, index: number) => (
    <TouchableOpacity
      key={index}
      style={styles.searchResultItem}
      onPress={() => handleLocationSelect(location)}
    >
      <MapPin size={20} color="#4ECDC4" style={styles.searchResultIcon} />
      <View style={styles.searchResultText}>
        <Text style={styles.searchResultAddress}>{location.address}</Text>
        {location.description && (
          <Text style={styles.searchResultDescription}>{location.description}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSearchHistory = () => (
    <View style={styles.searchHistoryContainer}>
      <Text style={styles.searchHistoryTitle}>Recent Searches</Text>
      {searchHistory.map((location, index) => (
        <TouchableOpacity
          key={index}
          style={styles.historyItem}
          onPress={() => handleLocationSelect(location)}
        >
          <Clock size={16} color="#666" style={styles.historyIcon} />
          <Text style={styles.historyText}>{location.address}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const getMapMarkers = (): MarkerData[] => {
    const markers: MarkerData[] = [];
    
    if (selectedLocation) {
      markers.push({
        id: 'selected',
        coordinate: selectedLocation.coordinates,
        title: 'Selected Location',
        description: selectedLocation.address,
        type: 'pickup',
      });
    }

    if (currentLocation && currentLocation !== selectedLocation) {
      markers.push({
        id: 'current',
        coordinate: currentLocation.coordinates,
        title: 'Current Location',
        description: currentLocation.address,
        type: 'user',
      });
    }

    return markers;
  };

  const getMapRegion = () => {
    const coordinates: Coordinates[] = [];
    if (selectedLocation) coordinates.push(selectedLocation.coordinates);
    if (currentLocation) coordinates.push(currentLocation.coordinates);
    
    if (coordinates.length > 0) {
      return createRegionFromCoordinates(coordinates);
    }
    
    return undefined;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search for a location..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {searchLoading && (
              <ActivityIndicator size="small" color="#4ECDC4" style={styles.searchLoader} />
            )}
          </View>
          
          {/* Current Location Button */}
          <TouchableOpacity
            style={styles.currentLocationButton}
            onPress={getCurrentLocation}
            disabled={loading}
          >
            <Navigation size={20} color={loading ? "#ccc" : "#4ECDC4"} />
          </TouchableOpacity>
        </View>

        {/* Toggle Map/List View */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleButton, !showMap && styles.toggleButtonActive]}
            onPress={() => setShowMap(false)}
          >
            <Text style={[styles.toggleText, !showMap && styles.toggleTextActive]}>List</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleButton, showMap && styles.toggleButtonActive]}
            onPress={() => setShowMap(true)}
          >
            <Text style={[styles.toggleText, showMap && styles.toggleTextActive]}>Map</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {showMap ? (
            /* Map View */
            <MapComponent
              initialRegion={getMapRegion()}
              markers={getMapMarkers()}
              onMapPress={handleMapLocationSelect}
              showUserLocation={true}
              showDirections={false}
              style={styles.map}
            />
          ) : (
            /* List View */
            <ScrollView style={styles.searchResults}>
              {/* Search Results */}
              {searchResults.length > 0 && (
                <View style={styles.searchResultsContainer}>
                  <Text style={styles.searchResultsTitle}>Search Results</Text>
                  {searchResults.map(renderSearchResult)}
                </View>
              )}

              {/* Current Location */}
              {currentLocation && (
                <TouchableOpacity
                  style={styles.currentLocationItem}
                  onPress={() => handleLocationSelect(currentLocation)}
                >
                  <Navigation size={20} color="#4ECDC4" style={styles.currentLocationIcon} />
                  <View style={styles.currentLocationText}>
                    <Text style={styles.currentLocationAddress}>Current Location</Text>
                    <Text style={styles.currentLocationDescription}>{currentLocation.address}</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Search History */}
              {showSearchHistory && searchQuery === '' && searchResults.length === 0 && renderSearchHistory()}
            </ScrollView>
          )}
        </View>

        {/* Selected Location Display */}
        {selectedLocation && (
          <View style={styles.selectedLocationContainer}>
            <View style={styles.selectedLocationInfo}>
              <MapPin size={20} color="#4ECDC4" />
              <Text style={styles.selectedLocationText}>{selectedLocation.address}</Text>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
              <Text style={styles.confirmButtonText}>Confirm Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginRight: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  searchLoader: {
    marginLeft: 10,
  },
  currentLocationButton: {
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#4ECDC4',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  toggleTextActive: {
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  searchResults: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchResultsContainer: {
    marginBottom: 20,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultIcon: {
    marginRight: 15,
  },
  searchResultText: {
    flex: 1,
  },
  searchResultAddress: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  searchResultDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  currentLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  currentLocationIcon: {
    marginRight: 15,
  },
  currentLocationText: {
    flex: 1,
  },
  currentLocationAddress: {
    fontSize: 16,
    color: '#4ECDC4',
    fontWeight: '600',
  },
  currentLocationDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  searchHistoryContainer: {
    marginTop: 20,
  },
  searchHistoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  historyIcon: {
    marginRight: 10,
  },
  historyText: {
    fontSize: 14,
    color: '#666',
  },
  selectedLocationContainer: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  selectedLocationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  selectedLocationText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  confirmButton: {
    backgroundColor: '#4ECDC4',
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});