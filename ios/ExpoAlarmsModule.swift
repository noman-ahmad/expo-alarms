import ExpoModulesCore
import AlarmKit
import SwiftUI

public class ExpoAlarmsModule: Module {
    private let storage = AlarmStorage.shared

    public func definition() -> ModuleDefinition {
        Name("ExpoAlarms")

        // Define events that can be sent to JavaScript
        Events("onAlarmTriggered", "onAlarmDismissed", "onAlarmSnoozed")

        // MARK: - Permission Functions

        AsyncFunction("requestPermissions") { () async throws -> [String: Any] in
            let status = try await AlarmManager.shared.requestAuthorization()
            return self.permissionStatusToDict(status)
        }

        AsyncFunction("getPermissionsStatus") { () async -> [String: Any] in
            let status = AlarmManager.shared.authorizationState
            return self.permissionStatusToDict(status)
        }

        // MARK: - Alarm CRUD Operations

        AsyncFunction("scheduleAlarm") { (params: [String: Any]) async throws -> [String: Any] in
            // Parse required parameters
            guard let title = params["title"] as? String,
                  let enabled = params["enabled"] as? Bool,
                  let scheduleDict = params["schedule"] as? [String: Any],
                  let schedule = self.storage.parseSchedule(from: scheduleDict) else {
                throw AlarmError.invalidParameters("Missing required parameters: title, enabled, schedule")
            }

            // Generate or use provided ID
            let id = params["id"] as? String ?? UUID().uuidString

            // Parse optional parameters
            let sound = self.storage.parseSound(from: params["sound"] as? [String: Any])
            let snoozeInterval = params["snoozeInterval"] as? Int
            let vibrate = params["vibrate"] as? Bool
            let presentation = self.storage.parsePresentation(from: params["presentation"] as? [String: Any])

            // Create stored alarm
            let storedAlarm = StoredAlarm(
                id: id,
                title: title,
                enabled: enabled,
                schedule: schedule,
                sound: sound,
                snoozeInterval: snoozeInterval,
                vibrate: vibrate,
                presentation: presentation
            )

            // Only schedule with AlarmKit if enabled
            if enabled {
                try await self.scheduleWithAlarmKit(storedAlarm)
            }

            // Persist to local storage
            self.storage.save(storedAlarm)

            return storedAlarm.toDictionary()
        }

        AsyncFunction("getAlarmById") { (id: String) -> [String: Any]? in
            guard let alarm = self.storage.getById(id) else {
                return nil
            }
            return alarm.toDictionary()
        }

        AsyncFunction("getScheduledAlarms") { () -> [[String: Any]] in
            return self.storage.getAll().map { $0.toDictionary() }
        }

        AsyncFunction("updateAlarm") { (id: String, params: [String: Any]) async throws -> [String: Any] in
            guard let existingAlarm = self.storage.getById(id) else {
                throw AlarmError.alarmNotFound(id)
            }

            // Cancel existing alarm in AlarmKit
            try await AlarmManager.shared.cancel(id: UUID(uuidString: id) ?? UUID())

            // Update in storage
            guard let updatedAlarm = self.storage.update(id, with: params) else {
                throw AlarmError.updateFailed(id)
            }

            // Reschedule if enabled
            if updatedAlarm.enabled {
                try await self.scheduleWithAlarmKit(updatedAlarm)
            }

            return updatedAlarm.toDictionary()
        }

        AsyncFunction("cancelAlarm") { (id: String) async -> Bool in
            // Cancel in AlarmKit
            if let uuid = UUID(uuidString: id) {
                do {
                    try await AlarmManager.shared.cancel(id: uuid)
                } catch {
                    
                }
            }

            // Remove from local storage
            return self.storage.delete(id)
        }

        AsyncFunction("cancelAllAlarms") { () async in
            // Get all alarms and cancel each one
            let alarms = self.storage.getAll()
            for alarm in alarms {
                if let uuid = UUID(uuidString: alarm.id) {
                    do {
                        try await AlarmManager.shared.cancel(id: uuid)
                    } catch {
                        
                    }
                }
            }

            // Clear local storage
            self.storage.deleteAll()
        }

        // MARK: - Alarm Actions

        AsyncFunction("snoozeAlarm") { (id: String, duration: Int?) async throws in
            // AlarmKit handles snooze through its native UI
            // This function is provided for programmatic control if needed
            guard let uuid = UUID(uuidString: id) else {
                throw AlarmError.invalidAlarmId(id)
            }

            // The snooze behavior is controlled by countdownDuration.postAlert in AlarmConfiguration
            // Users can snooze via the native UI - this event will be sent when we detect it

            // Send event to JS
            self.sendEvent("onAlarmSnoozed", [
                "alarmId": id,
                "snoozeUntil": ISO8601DateFormatter().string(from: Date().addingTimeInterval(Double((duration ?? 5) * 60)))
            ])
        }

        AsyncFunction("dismissAlarm") { (id: String) async throws in
            guard let uuid = UUID(uuidString: id) else {
                throw AlarmError.invalidAlarmId(id)
            }

            // Cancel the alarm in AlarmKit
            try await AlarmManager.shared.cancel(id: uuid)

            // Send event to JS
            self.sendEvent("onAlarmDismissed", [
                "alarmId": id
            ])
        }
    }

    // MARK: - Private Helpers

    private func permissionStatusToDict(_ status: AlarmManager.AuthorizationState) -> [String: Any] {
        let statusString: String
        switch status {
        case .authorized:
            statusString = "granted"
        case .denied:
            statusString = "denied"
        case .notDetermined:
            statusString = "undetermined"
        @unknown default:
            statusString = "undetermined"
        }

        return ["status": statusString]
    }

    private func scheduleWithAlarmKit(_ alarm: StoredAlarm) async throws {
        guard let uuid = UUID(uuidString: alarm.id) else {
            throw AlarmError.invalidAlarmId(alarm.id)
        }

        // Build presentation from stored data or use defaults
        let presentation = buildAlarmPresentation(from: alarm)

        // Create attributes with tint color
        let tintColor = colorFromString(alarm.presentation?.tintColor) ?? .blue
        let attributes = AlarmAttributes<EmptyAlarmMetadata>(
            presentation: presentation,
            tintColor: tintColor
        )

        // Calculate countdown durations
        let snoozeMinutes = alarm.snoozeInterval ?? 5
        let countdownDuration = Alarm.CountdownDuration(
            preAlert: 60, // 1 minute countdown before alarm
            postAlert: TimeInterval(snoozeMinutes * 60) // Snooze duration in seconds
        )

        // Create schedule based on alarm type
        let alarmSchedule = try createAlarmSchedule(from: alarm.schedule)

        // Create configuration
        let configuration = AlarmManager.AlarmConfiguration(
            countdownDuration: countdownDuration,
            schedule: alarmSchedule,
            attributes: attributes,
            secondaryIntent: nil,
        )

        // Schedule with AlarmKit
        try await AlarmManager.shared.schedule(id: uuid, configuration: configuration)
    }

    private func buildAlarmPresentation(from alarm: StoredAlarm) -> AlarmPresentation {
        // Build alert presentation
        let alertPresentation: AlarmPresentation.Alert
        if let storedAlert = alarm.presentation?.alert {
            let stopButton = buildAlarmButton(from: storedAlert.stopButton) ?? AlarmButton(
                text: "Stop",
                textColor: .white,
                systemImageName: "stop.circle"
            )

            var secondaryButton: AlarmButton? = nil
            var secondaryButtonBehavior: AlarmPresentation.Alert.SecondaryButtonBehavior? = nil

            if let storedSecondary = storedAlert.secondaryButton {
                secondaryButton = buildAlarmButton(from: storedSecondary)
                if let behavior = storedAlert.secondaryButtonBehavior {
                    secondaryButtonBehavior = behavior == "countdown" ? .countdown : .custom
                }
            }

            if let secondaryButton = secondaryButton, let behavior = secondaryButtonBehavior {
                alertPresentation = AlarmPresentation.Alert(
                    title: LocalizedStringResource(stringLiteral: storedAlert.title),
                    stopButton: stopButton,
                    secondaryButton: secondaryButton,
                    secondaryButtonBehavior: behavior
                )
            } else {
                alertPresentation = AlarmPresentation.Alert(
                    title: LocalizedStringResource(stringLiteral: storedAlert.title),
                    stopButton: stopButton
                )
            }
        } else {
            // Default alert presentation using alarm title
            alertPresentation = AlarmPresentation.Alert(
                title: LocalizedStringResource(stringLiteral: alarm.title),
                stopButton: AlarmButton(text: "Dismiss", textColor: .white, systemImageName: "stop.circle")
            )
        }

        // Build countdown presentation
        var countdownPresentation: AlarmPresentation.Countdown? = nil
        if let storedCountdown = alarm.presentation?.countdown {
            countdownPresentation = AlarmPresentation.Countdown(
                title: LocalizedStringResource(stringLiteral: storedCountdown.title)
            )
        }

        // Build paused presentation
        var pausedPresentation: AlarmPresentation.Paused? = nil
        if let storedPaused = alarm.presentation?.paused {
            let resumeButton = buildAlarmButton(from: storedPaused.resumeButton) ?? AlarmButton(
                text: "Resume",
                textColor: .blue,
                systemImageName: "play.circle"
            )
            pausedPresentation = AlarmPresentation.Paused(
                title: LocalizedStringResource(stringLiteral: storedPaused.title),
                resumeButton: resumeButton
            )
        }

        // Construct the full presentation
        if let countdown = countdownPresentation, let paused = pausedPresentation {
            return AlarmPresentation(alert: alertPresentation, countdown: countdown, paused: paused)
        } else if let countdown = countdownPresentation {
            return AlarmPresentation(alert: alertPresentation, countdown: countdown)
        } else if let paused = pausedPresentation {
            return AlarmPresentation(alert: alertPresentation, paused: paused)
        } else {
            return AlarmPresentation(alert: alertPresentation)
        }
    }

    private func buildAlarmButton(from stored: StoredAlarmButton?) -> AlarmButton? {
        guard let stored = stored else { return nil }

        let color = colorFromString(stored.textColor) ?? .blue

        if let systemImageName = stored.systemImageName {
            return AlarmButton(text: LocalizedStringResource(stringLiteral: stored.text), textColor: color, systemImageName: systemImageName)
        } else {
            return AlarmButton(text: LocalizedStringResource(stringLiteral: stored.text), textColor: color, systemImageName: "play.circle")
        }
    }

    private func colorFromString(_ colorName: String?) -> Color? {
        guard let colorName = colorName?.lowercased() else { return nil }

        switch colorName {
        case "blue": return .blue
        case "red": return .red
        case "green": return .green
        case "white": return .white
        case "black": return .black
        case "gray", "grey": return .gray
        case "orange": return .orange
        case "yellow": return .yellow
        case "purple": return .purple
        case "pink": return .pink
        case "cyan": return .cyan
        case "mint": return .mint
        case "teal": return .teal
        case "indigo": return .indigo
        case "brown": return .brown
        case "primary": return .primary
        case "secondary": return .secondary
        default: return nil
        }
    }

    private func createAlarmSchedule(from schedule: StoredSchedule) throws -> Alarm.Schedule {
        switch schedule {
        case .simple(let simple):
            if let recurrence = simple.recurrence {
                // Recurring alarm
                let time = Alarm.Schedule.Relative.Time(hour: simple.hour, minute: simple.minute)

                switch recurrence.type {
                case "daily":
                    // Daily recurrence = all days of week
                    let allDays: [Locale.Weekday] = [
                        .sunday, .monday, .tuesday, .wednesday, .thursday, .friday, .saturday
                    ]
                    return .relative(Alarm.Schedule.Relative(
                        time: time,
                        repeats: .weekly(allDays)
                    ))

                case "weekly", "custom":
                    // Weekly on specific days
                    let weekdays = (recurrence.daysOfWeek ?? []).compactMap { dayNumber -> Locale.Weekday in
                        return self.numberToWeekday(dayNumber) ?? .sunday
                    }
                    return .relative(Alarm.Schedule.Relative(
                        time: time,
                        repeats: .weekly(weekdays)
                    ))

                default:
                    // Default to non-repeating
                    return .relative(Alarm.Schedule.Relative(time: time, repeats: .never))
                }
            } else {
                // Simple alarm with just time (next occurrence)
                let time = Alarm.Schedule.Relative.Time(hour: simple.hour, minute: simple.minute)
                return .relative(Alarm.Schedule.Relative(time: time, repeats: .never))
            }

        case .fixed(let fixed):
            // One-time alarm at a specific date and time
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]

            // Try parsing with fractional seconds first, then without
            var date = formatter.date(from: fixed.date)
            if date == nil {
                formatter.formatOptions = [.withInternetDateTime]
                date = formatter.date(from: fixed.date)
            }

            guard let alarmDate = date else {
                throw AlarmError.invalidDate(fixed.date)
            }

            return .fixed(alarmDate)

        case .perDay(let perDay):
            // PerDay schedules need special handling - we'll use the first day's schedule
            // In a full implementation, you might want to create multiple alarms
            guard let firstDay = perDay.days.first else {
                throw AlarmError.invalidParameters("PerDaySchedule must have at least one day")
            }

            let time = Alarm.Schedule.Relative.Time(hour: firstDay.hour, minute: firstDay.minute)
            let weekday = numberToWeekday(firstDay.dayOfWeek)

            if let weekday = weekday {
                return .relative(Alarm.Schedule.Relative(
                    time: time,
                    repeats: .weekly([weekday])
                ))
            } else {
                return .relative(Alarm.Schedule.Relative(time: time, repeats: .never))
            }
        }
    }

    private func numberToWeekday(_ number: Int) -> Locale.Weekday? {
        switch number {
        case 0: return .sunday
        case 1: return .monday
        case 2: return .tuesday
        case 3: return .wednesday
        case 4: return .thursday
        case 5: return .friday
        case 6: return .saturday
        default: return nil
        }
    }
}

// MARK: - Empty Metadata for basic alarms

struct EmptyAlarmMetadata: AlarmMetadata {
    // No custom metadata needed for basic alarms
}

// MARK: - Custom Errors

enum AlarmError: Error, LocalizedError {
    case invalidParameters(String)
    case alarmNotFound(String)
    case updateFailed(String)
    case invalidAlarmId(String)
    case invalidDate(String)

    var errorDescription: String? {
        switch self {
        case .invalidParameters(let message):
            return "Invalid parameters: \(message)"
        case .alarmNotFound(let id):
            return "Alarm not found with id: \(id)"
        case .updateFailed(let id):
            return "Failed to update alarm with id: \(id)"
        case .invalidAlarmId(let id):
            return "Invalid alarm ID format: \(id)"
        case .invalidDate(let date):
            return "Invalid date format: \(date)"
        }
    }
}
