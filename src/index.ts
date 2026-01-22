import { EventSubscription } from 'expo-modules-core';

import ExpoAlarmsModule from './ExpoAlarmsModule';
import {
  Alarm,
  AlarmTriggeredEvent,
  AlarmDismissedEvent,
  AlarmSnoozedEvent,
  PermissionsResponse,
  ScheduleAlarmParams,
  UpdateAlarmParams,
} from './ExpoAlarms.types';

// ============================================================================
// Alarm CRUD Operations
// ============================================================================

export async function scheduleAlarm(params: ScheduleAlarmParams): Promise<Alarm> {
  return ExpoAlarmsModule.scheduleAlarm(params);
}

export async function getAlarmById(id: string): Promise<Alarm | null> {
  return ExpoAlarmsModule.getAlarmById(id);
}

export async function getScheduledAlarms(): Promise<Alarm[]> {
  return ExpoAlarmsModule.getScheduledAlarms();
}

export async function updateAlarm(id: string, params: UpdateAlarmParams): Promise<Alarm> {
  return ExpoAlarmsModule.updateAlarm(id, params);
}

export async function cancelAlarm(id: string): Promise<boolean> {
  return ExpoAlarmsModule.cancelAlarm(id);
}

export async function cancelAllAlarms(): Promise<void> {
  return ExpoAlarmsModule.cancelAllAlarms();
}

// ============================================================================
// Alarm Actions
// ============================================================================

export async function snoozeAlarm(id: string, duration?: number): Promise<void> {
  return ExpoAlarmsModule.snoozeAlarm(id, duration);
}

export async function dismissAlarm(id: string): Promise<void> {
  return ExpoAlarmsModule.dismissAlarm(id);
}

// ============================================================================
// Permissions
// ============================================================================

export async function requestPermissions(): Promise<PermissionsResponse> {
  return ExpoAlarmsModule.requestPermissions();
}

export async function getPermissionsStatus(): Promise<PermissionsResponse> {
  return ExpoAlarmsModule.getPermissionsStatus();
}

// ============================================================================
// Event Subscription
// ============================================================================

export function addAlarmTriggeredListener(
  listener: (event: AlarmTriggeredEvent) => void
): EventSubscription {
  return ExpoAlarmsModule.addListener('onAlarmTriggered', listener);
}

export function addAlarmDismissedListener(
  listener: (event: AlarmDismissedEvent) => void
): EventSubscription {
  return ExpoAlarmsModule.addListener('onAlarmDismissed', listener);
}

export function addAlarmSnoozedListener(
  listener: (event: AlarmSnoozedEvent) => void
): EventSubscription {
  return ExpoAlarmsModule.addListener('onAlarmSnoozed', listener);
}

// ============================================================================
// Exports
// ============================================================================

export * from './ExpoAlarms.types';
export default ExpoAlarmsModule;
