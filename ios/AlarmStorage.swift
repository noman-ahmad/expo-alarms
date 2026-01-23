import Foundation

/// Represents the stored alarm data that persists locally
struct StoredAlarm: Codable {
    let id: String
    let title: String
    let enabled: Bool
    let schedule: StoredSchedule
    let sound: StoredSound?
    let snoozeInterval: Int?
    let vibrate: Bool?
    let presentation: StoredAlarmPresentation?

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [
            "id": id,
            "title": title,
            "enabled": enabled,
            "schedule": schedule.toDictionary()
        ]

        if let sound = sound {
            dict["sound"] = sound.toDictionary()
        }
        if let snoozeInterval = snoozeInterval {
            dict["snoozeInterval"] = snoozeInterval
        }
        if let vibrate = vibrate {
            dict["vibrate"] = vibrate
        }
        if let presentation = presentation {
            dict["presentation"] = presentation.toDictionary()
        }

        return dict
    }
}

enum StoredSchedule: Codable {
    case simple(SimpleSchedule)
    case perDay(PerDaySchedule)
    case fixed(FixedSchedule)

    struct SimpleSchedule: Codable {
        let hour: Int
        let minute: Int
        let recurrence: StoredRecurrence?
    }

    struct FixedSchedule: Codable {
        let date: String // Full ISO 8601 datetime string
    }

    struct PerDaySchedule: Codable {
        let days: [DaySchedule]
    }

    struct DaySchedule: Codable {
        let dayOfWeek: Int
        let hour: Int
        let minute: Int
    }

    struct StoredRecurrence: Codable {
        let type: String // "daily", "weekly", "custom"
        let daysOfWeek: [Int]?
    }

    func toDictionary() -> [String: Any] {
        switch self {
        case .simple(let schedule):
            var dict: [String: Any] = [
                "type": "simple",
                "hour": schedule.hour,
                "minute": schedule.minute
            ]
            if let recurrence = schedule.recurrence {
                var recurrenceDict: [String: Any] = ["type": recurrence.type]
                if let days = recurrence.daysOfWeek {
                    recurrenceDict["daysOfWeek"] = days
                }
                dict["recurrence"] = recurrenceDict
            }
            return dict

        case .perDay(let schedule):
            return [
                "type": "perDay",
                "days": schedule.days.map { day in
                    [
                        "dayOfWeek": day.dayOfWeek,
                        "hour": day.hour,
                        "minute": day.minute
                    ]
                }
            ]

        case .fixed(let schedule):
            return [
                "type": "fixed",
                "date": schedule.date
            ]
        }
    }
}

struct StoredSound: Codable {
    let type: String // "default" or "custom"
    let uri: String?

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = ["type": type]
        if let uri = uri {
            dict["uri"] = uri
        }
        return dict
    }
}

// MARK: - Presentation Types

struct StoredAlarmButton: Codable {
    let text: String
    let textColor: String?
    let systemImageName: String?

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = ["text": text]
        if let textColor = textColor {
            dict["textColor"] = textColor
        }
        if let systemImageName = systemImageName {
            dict["systemImageName"] = systemImageName
        }
        return dict
    }
}

struct StoredAlertPresentation: Codable {
    let title: String
    let stopButton: StoredAlarmButton?
    let secondaryButton: StoredAlarmButton?
    let secondaryButtonBehavior: String? // "countdown" or "dismiss"

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = ["title": title]
        if let stopButton = stopButton {
            dict["stopButton"] = stopButton.toDictionary()
        }
        if let secondaryButton = secondaryButton {
            dict["secondaryButton"] = secondaryButton.toDictionary()
        }
        if let secondaryButtonBehavior = secondaryButtonBehavior {
            dict["secondaryButtonBehavior"] = secondaryButtonBehavior
        }
        return dict
    }
}

struct StoredCountdownPresentation: Codable {
    let title: String

    func toDictionary() -> [String: Any] {
        return ["title": title]
    }
}

struct StoredPausedPresentation: Codable {
    let title: String
    let resumeButton: StoredAlarmButton?

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = ["title": title]
        if let resumeButton = resumeButton {
            dict["resumeButton"] = resumeButton.toDictionary()
        }
        return dict
    }
}

struct StoredAlarmPresentation: Codable {
    let alert: StoredAlertPresentation?
    let countdown: StoredCountdownPresentation?
    let paused: StoredPausedPresentation?
    let tintColor: String?

    func toDictionary() -> [String: Any] {
        var dict: [String: Any] = [:]
        if let alert = alert {
            dict["alert"] = alert.toDictionary()
        }
        if let countdown = countdown {
            dict["countdown"] = countdown.toDictionary()
        }
        if let paused = paused {
            dict["paused"] = paused.toDictionary()
        }
        if let tintColor = tintColor {
            dict["tintColor"] = tintColor
        }
        return dict
    }
}

/// Manages local persistence of alarm data using UserDefaults
class AlarmStorage {
    static let shared = AlarmStorage()

    private let storageKey = "expo_alarms_stored_alarms"
    private let defaults = UserDefaults.standard

    private init() {}

    /// Save an alarm to storage
    func save(_ alarm: StoredAlarm) {
        var alarms = getAll()

        // Remove existing alarm with same ID if present
        alarms.removeAll { $0.id == alarm.id }

        // Add the new/updated alarm
        alarms.append(alarm)

        // Persist to UserDefaults
        saveAll(alarms)
    }

    /// Get all stored alarms
    func getAll() -> [StoredAlarm] {
        guard let data = defaults.data(forKey: storageKey) else {
            return []
        }

        do {
            let alarms = try JSONDecoder().decode([StoredAlarm].self, from: data)
            return alarms
        } catch {
            print("[ExpoAlarms] Failed to decode alarms: \(error)")
            return []
        }
    }

    /// Get a specific alarm by ID
    func getById(_ id: String) -> StoredAlarm? {
        return getAll().first { $0.id == id }
    }

    /// Delete an alarm by ID
    func delete(_ id: String) -> Bool {
        var alarms = getAll()
        let initialCount = alarms.count
        alarms.removeAll { $0.id == id }

        if alarms.count < initialCount {
            saveAll(alarms)
            return true
        }
        return false
    }

    /// Delete all alarms
    func deleteAll() {
        defaults.removeObject(forKey: storageKey)
    }

    /// Update an existing alarm
    func update(_ id: String, with updates: [String: Any]) -> StoredAlarm? {
        guard let alarm = getById(id) else {
            return nil
        }

        // Create updated alarm with new values
        let updatedAlarm = StoredAlarm(
            id: alarm.id,
            title: updates["title"] as? String ?? alarm.title,
            enabled: updates["enabled"] as? Bool ?? alarm.enabled,
            schedule: parseSchedule(from: updates["schedule"] as? [String: Any]) ?? alarm.schedule,
            sound: parseSound(from: updates["sound"] as? [String: Any]) ?? alarm.sound,
            snoozeInterval: updates["snoozeInterval"] as? Int ?? alarm.snoozeInterval,
            vibrate: updates["vibrate"] as? Bool ?? alarm.vibrate,
            presentation: parsePresentation(from: updates["presentation"] as? [String: Any]) ?? alarm.presentation
        )

        save(updatedAlarm)
        return updatedAlarm
    }

    // MARK: - Private Helpers

    private func saveAll(_ alarms: [StoredAlarm]) {
        do {
            let data = try JSONEncoder().encode(alarms)
            defaults.set(data, forKey: storageKey)
        } catch {
            print("[ExpoAlarms] Failed to encode alarms: \(error)")
        }
    }

    /// Parse schedule from JS params
    func parseSchedule(from dict: [String: Any]?) -> StoredSchedule? {
        guard let dict = dict,
              let type = dict["type"] as? String else {
            return nil
        }

        if type == "simple" {
            guard let hour = dict["hour"] as? Int,
                  let minute = dict["minute"] as? Int else {
                return nil
            }

            var recurrence: StoredSchedule.StoredRecurrence? = nil
            if let recurrenceDict = dict["recurrence"] as? [String: Any],
               let recurrenceType = recurrenceDict["type"] as? String {
                recurrence = StoredSchedule.StoredRecurrence(
                    type: recurrenceType,
                    daysOfWeek: recurrenceDict["daysOfWeek"] as? [Int]
                )
            }

            return .simple(StoredSchedule.SimpleSchedule(
                hour: hour,
                minute: minute,
                recurrence: recurrence
            ))
        } else if type == "fixed" {
            guard let date = dict["date"] as? String else {
                return nil
            }

            return .fixed(StoredSchedule.FixedSchedule(date: date))
        } else if type == "perDay" {
            guard let daysArray = dict["days"] as? [[String: Any]] else {
                return nil
            }

            let days = daysArray.compactMap { dayDict -> StoredSchedule.DaySchedule? in
                guard let dayOfWeek = dayDict["dayOfWeek"] as? Int,
                      let hour = dayDict["hour"] as? Int,
                      let minute = dayDict["minute"] as? Int else {
                    return nil
                }
                return StoredSchedule.DaySchedule(dayOfWeek: dayOfWeek, hour: hour, minute: minute)
            }

            return .perDay(StoredSchedule.PerDaySchedule(days: days))
        }

        return nil
    }

    /// Parse sound from JS params
    func parseSound(from dict: [String: Any]?) -> StoredSound? {
        guard let dict = dict,
              let type = dict["type"] as? String else {
            return nil
        }

        return StoredSound(type: type, uri: dict["uri"] as? String)
    }

    /// Parse presentation from JS params
    func parsePresentation(from dict: [String: Any]?) -> StoredAlarmPresentation? {
        guard let dict = dict else {
            return nil
        }

        var alert: StoredAlertPresentation? = nil
        if let alertDict = dict["alert"] as? [String: Any],
           let title = alertDict["title"] as? String {
            alert = StoredAlertPresentation(
                title: title,
                stopButton: parseButton(from: alertDict["stopButton"] as? [String: Any]),
                secondaryButton: parseButton(from: alertDict["secondaryButton"] as? [String: Any]),
                secondaryButtonBehavior: alertDict["secondaryButtonBehavior"] as? String
            )
        }

        var countdown: StoredCountdownPresentation? = nil
        if let countdownDict = dict["countdown"] as? [String: Any],
           let title = countdownDict["title"] as? String {
            countdown = StoredCountdownPresentation(title: title)
        }

        var paused: StoredPausedPresentation? = nil
        if let pausedDict = dict["paused"] as? [String: Any],
           let title = pausedDict["title"] as? String {
            paused = StoredPausedPresentation(
                title: title,
                resumeButton: parseButton(from: pausedDict["resumeButton"] as? [String: Any])
            )
        }

        let tintColor = dict["tintColor"] as? String

        // Return nil if no presentation options were provided
        if alert == nil && countdown == nil && paused == nil && tintColor == nil {
            return nil
        }

        return StoredAlarmPresentation(
            alert: alert,
            countdown: countdown,
            paused: paused,
            tintColor: tintColor
        )
    }

    /// Parse button from JS params
    private func parseButton(from dict: [String: Any]?) -> StoredAlarmButton? {
        guard let dict = dict,
              let text = dict["text"] as? String else {
            return nil
        }

        return StoredAlarmButton(
            text: text,
            textColor: dict["textColor"] as? String,
            systemImageName: dict["systemImageName"] as? String
        )
    }
}
