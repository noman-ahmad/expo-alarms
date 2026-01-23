import { type ConfigPlugin, createRunOncePlugin } from 'expo/config-plugins';

import { withExpoAlarmsIos, type IosProps } from './withExpoAlarmsIos';

const pkg = require('../../package.json');

/**
 * Configuration options for the expo-alarms plugin
 */
export type ExpoAlarmsPluginProps = {
  /**
   * Custom description for the AlarmKit permission prompt on iOS.
   * This text is shown to the user when requesting alarm permissions.
   * @default "This app uses alarms to notify you at scheduled times."
   */
  alarmKitUsageDescription?: string;
};

/**
 * Expo Config Plugin for expo-alarms
 *
 * This plugin automatically configures your app for native alarm support:
 *
 * iOS (requires iOS 26+):
 * - Adds NSAlarmKitUsageDescription to Info.plist
 * - Sets minimum deployment target to iOS 26.0
 *
 * Usage in app.json:
 * ```json
 * {
 *   "plugins": [
 *     "expo-alarms"
 *   ]
 * }
 * ```
 *
 * Or with custom options:
 * ```json
 * {
 *   "plugins": [
 *     ["expo-alarms", {
 *       "alarmKitUsageDescription": "We need alarm access to wake you up!"
 *     }]
 *   ]
 * }
 * ```
 */
const withExpoAlarms: ConfigPlugin<ExpoAlarmsPluginProps | void> = (
  config,
  props
) => {
  const pluginProps = props ?? {};

  // Apply iOS-specific configurations
  config = withExpoAlarmsIos(config, {
    alarmKitUsageDescription: pluginProps.alarmKitUsageDescription,
  });

  // Android configuration will be added here when implemented
  // config = withExpoAlarmsAndroid(config, { ... });

  return config;
};

export default createRunOncePlugin(withExpoAlarms, pkg.name, pkg.version);
