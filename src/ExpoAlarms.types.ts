// ============================================================================
// Alarm Types
// ============================================================================

export interface Alarm {
  id: string;
  title: string;
  enabled: boolean;
  schedule: AlarmSchedule;
  sound?: AlarmSound;
  snoozeInterval?: number; // minutes, default: 5
  vibrate?: boolean;
}

// ============================================================================
// Schedule Types
// ============================================================================

export type AlarmSchedule = SimpleSchedule | PerDaySchedule;

export interface SimpleSchedule {
  type: 'simple';
  hour: number; // 0-23
  minute: number; // 0-59
  date?: string; // ISO date string for one-time alarms (e.g., '2026-01-25')
  recurrence?: RecurrenceRule;
}

export interface PerDaySchedule {
  type: 'perDay';
  days: DaySchedule[];
}

export interface DaySchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, 2=Tuesday, etc.
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[]; // 0=Sunday, 1=Monday, etc. Used for 'weekly' and 'custom'
}

// ============================================================================
// Sound Types
// ============================================================================

export interface AlarmSound {
  type: 'default' | 'custom';
  uri?: string; // Required when type is 'custom'
}

// ============================================================================
// Permission Types
// ============================================================================

export type PermissionStatus = 'granted' | 'denied' | 'undetermined';

export interface PermissionsResponse {
  status: PermissionStatus;
  canScheduleExactAlarms?: boolean; // Android 12+ specific
}

// ============================================================================
// Event Types
// ============================================================================

export interface AlarmTriggeredEvent {
  alarmId: string;
  title: string;
}

export interface AlarmDismissedEvent {
  alarmId: string;
}

export interface AlarmSnoozedEvent {
  alarmId: string;
  snoozeUntil: string; // ISO date string
}

export type ExpoAlarmsModuleEvents = {
  onAlarmTriggered: (event: AlarmTriggeredEvent) => void;
  onAlarmDismissed: (event: AlarmDismissedEvent) => void;
  onAlarmSnoozed: (event: AlarmSnoozedEvent) => void;
};

// ============================================================================
// Function Parameter Types
// ============================================================================

export type ScheduleAlarmParams = Omit<Alarm, 'id'> & { id?: string };

export type UpdateAlarmParams = Partial<Omit<Alarm, 'id'>>;
