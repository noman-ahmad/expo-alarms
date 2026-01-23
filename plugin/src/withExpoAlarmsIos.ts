import type { ExpoConfig } from 'expo/config';
import {
  type ConfigPlugin,
  type InfoPlist,
  withInfoPlist,
  withPodfileProperties,
} from 'expo/config-plugins';

export type IosProps = {
  alarmKitUsageDescription?: string;
};

/**
 * Config plugin for iOS-specific modifications
 * - Adds NSAlarmKitUsageDescription to Info.plist
 * - Sets minimum iOS deployment target to 26.0 for AlarmKit support
 */
export const withExpoAlarmsIos: ConfigPlugin<IosProps> = (config, props) => {
  // Add Info.plist permissions
  config = withAlarmKitPermission(config, props?.alarmKitUsageDescription);

  // Set minimum iOS deployment target for AlarmKit
  config = withMinimumDeploymentTarget(config);

  return config;
};

/**
 * Adds NSAlarmKitUsageDescription to Info.plist
 */
function withAlarmKitPermission(
  config: ExpoConfig,
  customDescription?: string
): ExpoConfig {
  return withInfoPlist(config, (config) => {
    const infoPlist: InfoPlist = config.modResults;

    // Add AlarmKit usage description
    infoPlist.NSAlarmKitUsageDescription =
      customDescription ??
      'This app uses alarms to notify you at scheduled times.';

    return config;
  });
}

/**
 * Sets minimum iOS deployment target to 26.0 for AlarmKit support
 */
function withMinimumDeploymentTarget(config: ExpoConfig): ExpoConfig {
  return withPodfileProperties(config, (config) => {
    const podfileProps = config.modResults;

    // Set iOS deployment target to 26.0 for AlarmKit
    podfileProps['ios.deploymentTarget'] = '26.0';

    return config;
  });
}

export default withExpoAlarmsIos;
