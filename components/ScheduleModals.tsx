import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';

interface ScheduleOption {
  value: string | number;
  label: string;
}

interface ScheduleModalProps {
  visible: boolean;
  title: string;
  options: ScheduleOption[];
  selectedValue: string | number;
  onSelect: (value: string | number) => void;
  onClose: () => void;
}

export const ScheduleModal: React.FC<ScheduleModalProps> = ({
  visible,
  title,
  options,
  selectedValue,
  onSelect,
  onClose,
}) => {
  const renderOption = ({ item }: { item: ScheduleOption }) => (
    <TouchableOpacity
      style={[
        styles.optionItem,
        selectedValue === item.value && styles.selectedOption,
      ]}
      onPress={() => {
        onSelect(item.value);
        onClose();
      }}
    >
      <Text
        style={[
          styles.optionText,
          selectedValue === item.value && styles.selectedOptionText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={options}
            renderItem={renderOption}
            keyExtractor={(item) => item.value.toString()}
            style={styles.optionsList}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
};

interface TimePickerModalProps {
  visible: boolean;
  onTimeSelect: (time: string) => void;
  onClose: () => void;
  initialTime?: string;
}

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  onTimeSelect,
  onClose,
  initialTime = '08:00',
}) => {
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const hourStr = hour.toString().padStart(2, '0');
        const minuteStr = minute.toString().padStart(2, '0');
        const time24 = `${hourStr}:${minuteStr}`;
        const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const time12 = `${hour12}:${minuteStr} ${ampm}`;
        
        times.push({
          value: time24,
          label: time12,
        });
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  return (
    <ScheduleModal
      visible={visible}
      title="Select Time"
      options={timeOptions}
      selectedValue={initialTime}
      onSelect={(time) => onTimeSelect(time as string)}
      onClose={onClose}
    />
  );
};

interface PassengerCountModalProps {
  visible: boolean;
  onPassengerSelect: (count: number) => void;
  onClose: () => void;
  maxPassengers?: number;
}

export const PassengerCountModal: React.FC<PassengerCountModalProps> = ({
  visible,
  onPassengerSelect,
  onClose,
  maxPassengers = 8,
}) => {
  const passengerOptions = Array.from({ length: maxPassengers }, (_, i) => ({
    value: i + 1,
    label: `${i + 1} passenger${i + 1 > 1 ? 's' : ''}`,
  }));

  return (
    <ScheduleModal
      visible={visible}
      title="Select Passenger Count"
      options={passengerOptions}
      selectedValue={1}
      onSelect={(count) => onPassengerSelect(count as number)}
      onClose={onClose}
    />
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: '#2d3748',
  },
  closeButton: {
    padding: 4,
  },
  optionsList: {
    flex: 1,
  },
  optionItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#F0FDFA',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-Medium',
    color: '#2d3748',
  },
  selectedOptionText: {
    color: '#4ECDC4',
    fontFamily: 'Inter-SemiBold',
  },
});