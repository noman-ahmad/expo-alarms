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
  presentation?: AlarmPresentation; // iOS only - customize alarm UI
}

// ============================================================================
// Schedule Types
// ============================================================================

export type AlarmSchedule = SimpleSchedule | PerDaySchedule | FixedSchedule;

export interface SimpleSchedule {
  type: 'simple';
  hour: number; // 0-23
  minute: number; // 0-59
  recurrence?: RecurrenceRule;
}

export interface FixedSchedule {
  type: 'fixed';
  date: string; // Full ISO 8601 datetime string (e.g., '2026-01-25T08:30:00')
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
// Presentation Types (iOS only)
// ============================================================================

export interface AlarmButton {
  text: string;
  textColor?: string; // Color name: 'blue', 'red', 'green', 'white', 'black', 'gray', 'orange', 'yellow', 'purple', 'pink', 'cyan'
  systemImageName?: string; // SF Symbol name, e.g., 'stop.circle', 'repeat', 'play.circle'
}

export interface AlertPresentation {
  title: string;
  stopButton?: AlarmButton;
  secondaryButton?: AlarmButton;
  secondaryButtonBehavior?: 'countdown' | 'dismiss'; // 'countdown' continues timer, 'dismiss' stops it
}

export interface CountdownPresentation {
  title: string;
}

export interface PausedPresentation {
  title: string;
  resumeButton?: AlarmButton;
}

export interface AlarmPresentation {
  alert?: AlertPresentation;
  countdown?: CountdownPresentation;
  paused?: PausedPresentation;
  tintColor?: string; // Color name for the overall tint
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
