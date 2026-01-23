import { useState, useEffect } from 'react';
import {
  scheduleAlarm,
  cancelAlarm,
  getScheduledAlarms,
  requestPermissions,
  getPermissionsStatus,
  addAlarmTriggeredListener,
  addAlarmDismissedListener,
  type Alarm,
  type PermissionStatus,
} from 'expo-alarms';
import {
  Button,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

export default function App() {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [lastEvent, setLastEvent] = useState<string>('None');
  const [fixedAlarmDate, setFixedAlarmDate] = useState<Date>(new Date(Date.now() + 5 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  useEffect(() => {
    // Check permission status on mount
    checkPermissions();
    loadAlarms();

    // Set up event listeners
    const triggeredSub = addAlarmTriggeredListener((event) => {
      setLastEvent(`Triggered: ${event.title} (${event.alarmId})`);
      Alert.alert('Alarm Triggered!', event.title);
    });

    const dismissedSub = addAlarmDismissedListener((event) => {
      setLastEvent(`Dismissed: ${event.alarmId}`);
    });

    return () => {
      triggeredSub.remove();
      dismissedSub.remove();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const result = await getPermissionsStatus();
      setPermissionStatus(result.status);
    } catch (error) {
      console.error('Failed to check permissions:', error);
    }
  };

  const handleRequestPermissions = async () => {
    try {
      const result = await requestPermissions();
      setPermissionStatus(result.status);
      Alert.alert('Permission Result', `Status: ${result.status}`);
    } catch (error) {
      console.error('Failed to request permissions:', error);
      Alert.alert('Error', 'Failed to request permissions');
    }
  };

  const loadAlarms = async () => {
    try {
      const scheduledAlarms = await getScheduledAlarms();
      setAlarms(scheduledAlarms);
    } catch (error) {
      console.error('Failed to load alarms:', error);
    }
  };

  const handleScheduleAlarm = async () => {
    try {
      // Schedule an alarm for 1 minute from now
      const now = new Date();
      const alarmTime = new Date(now.getTime() + 60 * 1000); // 1 minute from now

      const alarm = await scheduleAlarm({
        title: 'Test Alarm',
        enabled: true,
        schedule: {
          type: 'simple',
          hour: alarmTime.getHours(),
          minute: alarmTime.getMinutes(),
        },
        snoozeInterval: 5,
        vibrate: true,
      });

      Alert.alert(
        'Alarm Scheduled!',
        `Alarm "${alarm.title}" scheduled for ${alarmTime.getHours()}:${String(alarmTime.getMinutes()).padStart(2, '0')}`
      );
      loadAlarms();
    } catch (error) {
      console.error('Failed to schedule alarm:', error);
      Alert.alert('Error', `Failed to schedule alarm: ${error}`);
    }
  };

  const handleScheduleRecurringAlarm = async () => {
    try {
      const alarm = await scheduleAlarm({
        title: 'Daily Alarm',
        enabled: true,
        schedule: {
          type: 'simple',
          hour: 8,
          minute: 0,
          recurrence: {
            type: 'daily',
          },
        },
        snoozeInterval: 10,
        vibrate: true,
      });

      Alert.alert('Recurring Alarm Scheduled!', `Alarm "${alarm.title}" set for 8:00 AM daily`);
      loadAlarms();
    } catch (error) {
      console.error('Failed to schedule recurring alarm:', error);
      Alert.alert('Error', `Failed to schedule alarm: ${error}`);
    }
  };

  const handleScheduleCustomPresentationAlarm = async () => {
    try {
      const now = new Date();
      const alarmTime = new Date(now.getTime() + 2 * 60 * 1000); // 2 minutes from now

      const alarm = await scheduleAlarm({
        title: 'Custom Presentation Alarm',
        enabled: true,
        schedule: {
          type: 'simple',
          hour: alarmTime.getHours(),
          minute: alarmTime.getMinutes(),
        },
        snoozeInterval: 5,
        vibrate: true,
        presentation: {
          alert: {
            title: 'Time to wake up!',
            stopButton: {
              text: 'Stop',
              textColor: 'red',
              systemImageName: 'stop.circle.fill',
            },
            secondaryButton: {
              text: 'Snooze',
              textColor: 'blue',
              systemImageName: 'zzz',
            },
            secondaryButtonBehavior: 'countdown',
          },
          countdown: {
            title: 'Alarm in progress...',
          },
          paused: {
            title: 'Alarm paused',
            resumeButton: {
              text: 'Resume',
              textColor: 'green',
              systemImageName: 'play.circle.fill',
            },
          },
          tintColor: 'orange',
        },
      });

      Alert.alert(
        'Custom Alarm Scheduled!',
        `"${alarm.title}" set for ${alarmTime.getHours()}:${String(alarmTime.getMinutes()).padStart(2, '0')}`
      );
      loadAlarms();
    } catch (error) {
      console.error('Failed to schedule custom alarm:', error);
      Alert.alert('Error', `Failed to schedule alarm: ${error}`);
    }
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(fixedAlarmDate);
      newDate.setFullYear(selectedDate.getFullYear());
      newDate.setMonth(selectedDate.getMonth());
      newDate.setDate(selectedDate.getDate());
      setFixedAlarmDate(newDate);
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(fixedAlarmDate);
      newDate.setHours(selectedTime.getHours());
      newDate.setMinutes(selectedTime.getMinutes());
      setFixedAlarmDate(newDate);
    }
  };

  const handleScheduleFixedAlarm = async () => {
    try {
      if (fixedAlarmDate <= new Date()) {
        Alert.alert('Invalid Date', 'Please select a future date and time');
        return;
      }

      const alarm = await scheduleAlarm({
        title: 'Fixed Date Alarm',
        enabled: true,
        schedule: {
          type: 'fixed',
          date: fixedAlarmDate.toISOString(),
        },
        snoozeInterval: 5,
        vibrate: true,
      });

      Alert.alert(
        'Fixed Alarm Scheduled!',
        `Alarm "${alarm.title}" set for ${fixedAlarmDate.toLocaleString()}`
      );
      loadAlarms();
    } catch (error) {
      console.error('Failed to schedule fixed alarm:', error);
      Alert.alert('Error', `Failed to schedule alarm: ${error}`);
    }
  };

  const handleCancelAlarm = async (id: string) => {
    try {
      const success = await cancelAlarm(id);
      if (success) {
        Alert.alert('Success', 'Alarm cancelled');
        loadAlarms();
      } else {
        Alert.alert('Error', 'Failed to cancel alarm');
      }
    } catch (error) {
      console.error('Failed to cancel alarm:', error);
      Alert.alert('Error', `Failed to cancel alarm: ${error}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.container}>
        <Text style={styles.header}>Expo Alarms Example</Text>

        <Group name="Permissions">
          <Text style={styles.statusText}>Status: {permissionStatus}</Text>
          <Button title="Request Permissions" onPress={handleRequestPermissions} />
        </Group>

        <Group name="Schedule Alarms">
          <View style={styles.buttonRow}>
            <Button title="Schedule in 1 min" onPress={handleScheduleAlarm} />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Schedule Daily 8 AM" onPress={handleScheduleRecurringAlarm} />
          </View>
          <View style={styles.buttonRow}>
            <Button title="Custom Presentation (2 min)" onPress={handleScheduleCustomPresentationAlarm} />
          </View>
        </Group>

        <Group name="Fixed Date Alarm">
          <View style={styles.pickerRow}>
            <Text style={styles.pickerLabel}>Date:</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {fixedAlarmDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerRow}>
            <Text style={styles.pickerLabel}>Time:</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {fixedAlarmDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>
          {showDatePicker && (
            <DateTimePicker
              value={fixedAlarmDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onDateChange}
              minimumDate={new Date()}
            />
          )}
          {showTimePicker && (
            <DateTimePicker
              value={fixedAlarmDate}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onTimeChange}
            />
          )}
          <View style={styles.buttonRow}>
            <Button title="Schedule Fixed Alarm" onPress={handleScheduleFixedAlarm} />
          </View>
        </Group>

        <Group name="Events">
          <Text style={styles.eventText}>Last Event: {lastEvent}</Text>
        </Group>

        <Group name={`Scheduled Alarms (${alarms.length})`}>
          <Button title="Refresh" onPress={loadAlarms} />
          {alarms.length === 0 ? (
            <Text style={styles.emptyText}>No alarms scheduled</Text>
          ) : (
            alarms.map((alarm) => (
              <View key={alarm.id} style={styles.alarmItem}>
                <View style={styles.alarmInfo}>
                  <Text style={styles.alarmTitle}>{alarm.title}</Text>
                  <Text style={styles.alarmDetails}>
                    {alarm.schedule.type === 'simple'
                      ? `${alarm.schedule.hour}:${String(alarm.schedule.minute).padStart(2, '0')}${alarm.schedule.recurrence ? ` (${alarm.schedule.recurrence.type})` : ''}`
                      : alarm.schedule.type === 'fixed'
                        ? `Fixed: ${new Date(alarm.schedule.date).toLocaleString()}`
                        : 'Per-day schedule'}
                  </Text>
                  <Text style={styles.alarmId}>ID: {alarm.id.substring(0, 8)}...</Text>
                </View>
                <Button title="Cancel" onPress={() => handleCancelAlarm(alarm.id)} color="red" />
              </View>
            ))
          )}
        </Group>
      </ScrollView>
    </SafeAreaView>
  );
}

function Group(props: { name: string; children: React.ReactNode }) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupHeader}>{props.name}</Text>
      {props.children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 28,
    fontWeight: 'bold',
    margin: 20,
    textAlign: 'center',
  },
  groupHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  group: {
    margin: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  statusText: {
    fontSize: 16,
    marginBottom: 12,
    color: '#333',
  },
  eventText: {
    fontSize: 14,
    color: '#666',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  buttonRow: {
    marginVertical: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  pickerLabel: {
    fontSize: 16,
    width: 50,
    color: '#333',
  },
  pickerButton: {
    flex: 1,
    backgroundColor: '#e8e8e8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  alarmItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
  },
  alarmInfo: {
    flex: 1,
  },
  alarmTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  alarmDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  alarmId: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
