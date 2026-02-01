# expo-alarms

A native iOS alarm module for Expo/React Native applications using Apple's AlarmKit framework.

## Overview

`expo-alarms` allows you to create and manage native iOS alarms directly from your Expo or React Native application. It leverages Apple's AlarmKit framework to provide reliable, system-level alarm functionality.

## Requirements

- **iOS 26.0+** (AlarmKit is only available on iOS 26 and later)
- **Expo SDK 51+**
- **Development build** (not compatible with Expo Go)

## Installation

### 1. Install the package

```bash
npx expo install expo-alarms
```

### 2. Configure the Expo plugin

- Add the plugin to your `app.json` or `app.config.js`:
- Add the minimum ios deployment target to ios 26 
- Important: Add your Dev Team ID 

```json
{
  "expo": {
    "plugins": [
      "expo-alarms",
      [
      "expo-build-properties",
      {
        "ios": {
          "deploymentTarget": "26.0"
        }
      }
      ]
    ],
    "ios": {
      "appleTeamId": "<YOUR_DEV_TEAM_ID"
    },
  }
}
```

### 3. Build your development client

Since this module uses native iOS APIs, you need to create a development build:

```bash
npx expo prebuild
npx expo run:ios
```

Or using EAS Build:

```bash
eas build --profile development --platform ios
```

## Permissions

The module automatically handles permission requests. AlarmKit requires user authorization before scheduling alarms.

```typescript
import { requestPermissions, getPermissionsStatus } from 'expo-alarms';

// Check current permission status
const status = await getPermissionsStatus();
console.log(status.status); // 'granted' | 'denied' | 'undetermined'

// Request permissions
const result = await requestPermissions();
if (result.status === 'granted') {
  // Ready to schedule alarms
}
```

## Basic Usage

### Scheduling a Simple Alarm

```typescript
import { scheduleAlarm } from 'expo-alarms';

// Schedule an alarm for 7:30 AM
const alarm = await scheduleAlarm({
  title: 'Wake Up',
  enabled: true,
  schedule: {
    type: 'simple',
    hour: 7,
    minute: 30,
  },
});
```

### Scheduling a Recurring Alarm

```typescript
// Daily alarm at 8:00 AM
const dailyAlarm = await scheduleAlarm({
  title: 'Daily Standup',
  enabled: true,
  schedule: {
    type: 'simple',
    hour: 8,
    minute: 0,
    recurrence: {
      type: 'daily',
    },
  },
});

// Weekly alarm on specific days
const weeklyAlarm = await scheduleAlarm({
  title: 'Gym Time',
  enabled: true,
  schedule: {
    type: 'simple',
    hour: 6,
    minute: 0,
    recurrence: {
      type: 'weekly',
      daysOfWeek: [1, 3, 5], // Monday, Wednesday, Friday (0=Sunday)
    },
  },
});
```

### Scheduling a Fixed Date Alarm

```typescript
// One-time alarm at a specific date and time
const appointmentAlarm = await scheduleAlarm({
  title: 'Doctor Appointment',
  enabled: true,
  schedule: {
    type: 'fixed',
    date: '2026-01-25T14:30:00.000Z', // ISO 8601 format
  },
});
```

### Scheduling with Per-Day Times

```typescript
// Different times for different days
const perDayAlarm = await scheduleAlarm({
  title: 'Work Alarm',
  enabled: true,
  schedule: {
    type: 'perDay',
    days: [
      { dayOfWeek: 1, hour: 7, minute: 0 },  // Monday
      { dayOfWeek: 2, hour: 7, minute: 30 }, // Tuesday
      { dayOfWeek: 3, hour: 7, minute: 0 },  // Wednesday
      { dayOfWeek: 4, hour: 7, minute: 30 }, // Thursday
      { dayOfWeek: 5, hour: 8, minute: 0 },  // Friday
    ],
  },
});
```

## API Reference

### Functions

#### `scheduleAlarm(params: ScheduleAlarmParams): Promise<Alarm>`

Schedules a new alarm.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `title` | `string` | Yes | Display title for the alarm |
| `enabled` | `boolean` | Yes | Whether the alarm is active |
| `schedule` | `AlarmSchedule` | Yes | When the alarm should trigger |
| `id` | `string` | No | Custom ID (auto-generated if not provided) |
| `sound` | `AlarmSound` | No | Custom alarm sound |
| `snoozeInterval` | `number` | No | Snooze duration in minutes (default: 5) |
| `vibrate` | `boolean` | No | Enable vibration |
| `presentation` | `AlarmPresentation` | No | Customize alarm UI (iOS only) |

#### `getScheduledAlarms(): Promise<Alarm[]>`

Returns all scheduled alarms.

#### `getAlarmById(id: string): Promise<Alarm | null>`

Returns a specific alarm by ID.

#### `updateAlarm(id: string, params: UpdateAlarmParams): Promise<Alarm>`

Updates an existing alarm.

#### `cancelAlarm(id: string): Promise<boolean>`

Cancels and removes an alarm. Returns `true` if successful.

#### `cancelAllAlarms(): Promise<void>`

Cancels and removes all alarms.

#### `snoozeAlarm(id: string, duration?: number): Promise<void>`

Programmatically snoozes an alarm.

#### `dismissAlarm(id: string): Promise<void>`

Programmatically dismisses an alarm.

#### `requestPermissions(): Promise<PermissionsResponse>`

Requests alarm permissions from the user.

#### `getPermissionsStatus(): Promise<PermissionsResponse>`

Gets the current permission status.

### Event Listeners

```typescript
import {
  addAlarmTriggeredListener,
  addAlarmDismissedListener,
  addAlarmSnoozedListener,
} from 'expo-alarms';

// Listen for alarm triggers
const triggeredSub = addAlarmTriggeredListener((event) => {
  console.log('Alarm triggered:', event.alarmId, event.title);
});

// Listen for alarm dismissals
const dismissedSub = addAlarmDismissedListener((event) => {
  console.log('Alarm dismissed:', event.alarmId);
});

// Listen for alarm snoozes
const snoozedSub = addAlarmSnoozedListener((event) => {
  console.log('Alarm snoozed until:', event.snoozeUntil);
});

// Clean up listeners when done
triggeredSub.remove();
dismissedSub.remove();
snoozedSub.remove();
```

## Customizing Alarm Presentation (iOS)

You can customize the alarm UI that appears when the alarm triggers:

```typescript
const alarm = await scheduleAlarm({
  title: 'Custom Alarm',
  enabled: true,
  schedule: {
    type: 'simple',
    hour: 7,
    minute: 0,
  },
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
      title: 'Alarm starting...',
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
```

### Supported Colors

For `textColor` and `tintColor`, use these color names:
- `blue`, `red`, `green`, `white`, `black`, `gray`
- `orange`, `yellow`, `purple`, `pink`, `cyan`
- `mint`, `teal`, `indigo`, `brown`
- `primary`, `secondary`

### System Image Names

Use [SF Symbols](https://developer.apple.com/sf-symbols/) names for button icons:
- `stop.circle`, `stop.circle.fill`
- `play.circle`, `play.circle.fill`
- `zzz`, `repeat`, `bell`, `bell.fill`
- And many more from the SF Symbols catalog

## Types

### AlarmSchedule

```typescript
type AlarmSchedule = SimpleSchedule | PerDaySchedule | FixedSchedule;

interface SimpleSchedule {
  type: 'simple';
  hour: number;      // 0-23
  minute: number;    // 0-59
  recurrence?: RecurrenceRule;
}

interface FixedSchedule {
  type: 'fixed';
  date: string;      // ISO 8601 datetime string
}

interface PerDaySchedule {
  type: 'perDay';
  days: DaySchedule[];
}

interface DaySchedule {
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  hour: number;
  minute: number;
}

interface RecurrenceRule {
  type: 'daily' | 'weekly' | 'custom';
  daysOfWeek?: number[]; // For 'weekly' and 'custom'
}
```

### AlarmPresentation

```typescript
interface AlarmPresentation {
  alert?: AlertPresentation;
  countdown?: CountdownPresentation;
  paused?: PausedPresentation;
  tintColor?: string;
}

interface AlertPresentation {
  title: string;
  stopButton?: AlarmButton;
  secondaryButton?: AlarmButton;
  secondaryButtonBehavior?: 'countdown' | 'dismiss';
}

interface CountdownPresentation {
  title: string;
}

interface PausedPresentation {
  title: string;
  resumeButton?: AlarmButton;
}

interface AlarmButton {
  text: string;
  textColor?: string;
  systemImageName?: string;
}
```

## Example App

See the [example](./example) directory for a complete working example demonstrating all features.

```bash
cd example
npm install
npx expo run:ios
```

## Troubleshooting

### "AlarmKit is not available"

Make sure you're running on iOS 26.0 or later. AlarmKit was introduced in iOS 26.

### "Permission denied"

Ensure you've called `requestPermissions()` and the user has granted access. Check Settings > Privacy & Security > Alarms on the device.

### Alarms not triggering

- Verify the alarm is enabled (`enabled: true`)
- Check that the scheduled time is in the future
- Ensure the app has proper permissions
- For fixed alarms, verify the date string is valid ISO 8601 format

## License

MIT
