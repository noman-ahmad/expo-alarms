import { NativeModule, requireNativeModule } from 'expo';

import {
  Alarm,
  ExpoAlarmsModuleEvents,
  PermissionsResponse,
  ScheduleAlarmParams,
  UpdateAlarmParams,
} from './ExpoAlarms.types';

declare class ExpoAlarmsModule extends NativeModule<ExpoAlarmsModuleEvents> {
  // Alarm CRUD operations
  scheduleAlarm(params: ScheduleAlarmParams): Promise<Alarm>;
  getAlarmById(id: string): Promise<Alarm | null>;
  getScheduledAlarms(): Promise<Alarm[]>;
  updateAlarm(id: string, params: UpdateAlarmParams): Promise<Alarm>;
  cancelAlarm(id: string): Promise<boolean>;
  cancelAllAlarms(): Promise<void>;

  // Alarm actions
  snoozeAlarm(id: string, duration?: number): Promise<void>;
  dismissAlarm(id: string): Promise<void>;

  // Permissions
  requestPermissions(): Promise<PermissionsResponse>;
  getPermissionsStatus(): Promise<PermissionsResponse>;
}

export default requireNativeModule<ExpoAlarmsModule>('ExpoAlarms');
