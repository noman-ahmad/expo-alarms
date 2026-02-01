package expo.modules.alarms

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoAlarmsModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoAlarms")

        Events("onAlarmTriggered", "onAlarmDismissed", "onAlarmSnoozed")

        // Stubbed functions - Android implementation coming later
        AsyncFunction("scheduleAlarm") { _: Map<String, Any?> -> null }
        AsyncFunction("getAlarmById") { _: String -> null }
        AsyncFunction("getScheduledAlarms") { emptyList<Any>() }
        AsyncFunction("updateAlarm") { _: String, _: Map<String, Any?> -> null }
        AsyncFunction("cancelAlarm") { _: String -> false }
        AsyncFunction("cancelAllAlarms") { }
        AsyncFunction("snoozeAlarm") { _: String, _: Int? -> }
        AsyncFunction("dismissAlarm") { _: String -> }
        AsyncFunction("requestPermissions") { mapOf("status" to "denied") }
        AsyncFunction("getPermissionsStatus") { mapOf("status" to "denied") }
    }
}
