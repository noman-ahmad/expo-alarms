# expo-alarms

A native iOS alarm module for Expo/React Native applications.

## Overview

`expo-alarms` allows you to create and manage native iOS alarms directly from your Expo or React Native application.

## Installation

```bash
npx expo install expo-alarms
```

## Features

- Create native iOS alarms
- Schedule alarms with custom times
- Set recurring alarms
- Manage and delete existing alarms

## Usage

```javascript
import * as ExpoAlarms from 'expo-alarms';

// Create an alarm
await ExpoAlarms.createAlarm({
  hour: 7,
  minute: 30,
  message: 'Wake up!',
});
```

## Requirements

- iOS 14.0+
- Expo SDK 50+

## License

MIT
