// MyOrbitWidget.swift
// iOS WidgetKit Extension — MyOrbit
//
// Reads shared data from App Group UserDefaults (set by the main app via
// expo-secure-store's App Group key or a native module).
// Supports Small, Medium, and Large widget families.

import WidgetKit
import SwiftUI

// ── Shared data model ─────────────────────────────────────────────────────────

struct WidgetEntry: TimelineEntry {
    let date: Date
    let greeting: String
    let habitsDone: Int
    let habitsTotal: Int
    let overdueTasks: Int
    let taskCount: Int
    let balance: Double
    let balanceLabel: String
    let goalsActive: Int
    let nearestGoal: String?
    let lastUpdated: String
    let habits: [HabitItem]
    let tasks: [TaskItem]
}

struct HabitItem: Codable {
    let id: String
    let name: String
    let emoji: String
    let done: Bool
}

struct TaskItem: Codable {
    let id: String
    let title: String
    let priority: String
    let overdue: Bool
}

// ── App Group key (must match main app's group ID in entitlements) ────────────

private let kAppGroup  = "group.com.myorbit.app"
private let kDataKey   = "myorbit_widget_data"

// ── Data loader ───────────────────────────────────────────────────────────────

struct WidgetDataLoader {
    static func load() -> WidgetEntry {
        let defaults = UserDefaults(suiteName: kAppGroup)
        guard
            let raw  = defaults?.string(forKey: kDataKey),
            let data = raw.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
        else {
            return placeholder()
        }

        let greeting     = json["greeting"]     as? String ?? "Good morning"
        let lastUpdated  = json["lastUpdated"]  as? String ?? ""
        let habitsJson   = json["habits"]       as? [String: Any] ?? [:]
        let tasksJson    = json["tasks"]        as? [String: Any] ?? [:]
        let financeJson  = json["finance"]      as? [String: Any] ?? [:]
        let goalsJson    = json["goals"]        as? [String: Any] ?? [:]

        let habitsDone   = habitsJson["done"]   as? Int ?? 0
        let habitsTotal  = habitsJson["total"]  as? Int ?? 0
        let taskCount    = tasksJson["total"]   as? Int ?? 0
        let overdue      = tasksJson["overdue"] as? Int ?? 0
        let balance      = financeJson["balance"]      as? Double ?? 0
        let balanceLabel = financeJson["balanceLabel"] as? String ?? ""
        let goalsActive  = goalsJson["active"]  as? Int ?? 0
        let nearest      = goalsJson["nearest"] as? String

        var habits: [HabitItem] = []
        if let list = habitsJson["list"] as? [[String: Any]] {
            habits = list.prefix(6).compactMap {
                guard let id = $0["id"] as? String,
                      let name = $0["name"] as? String else { return nil }
                return HabitItem(
                    id: id, name: name,
                    emoji: $0["emoji"] as? String ?? "✅",
                    done: $0["done"] as? Bool ?? false
                )
            }
        }

        var tasks: [TaskItem] = []
        if let list = tasksJson["list"] as? [[String: Any]] {
            tasks = list.prefix(5).compactMap {
                guard let id = $0["id"] as? String,
                      let title = $0["title"] as? String else { return nil }
                return TaskItem(
                    id: id, title: title,
                    priority: $0["priority"] as? String ?? "none",
                    overdue: $0["overdue"] as? Bool ?? false
                )
            }
        }

        return WidgetEntry(
            date: Date(),
            greeting: greeting,
            habitsDone: habitsDone,
            habitsTotal: habitsTotal,
            overdueTasks: overdue,
            taskCount: taskCount,
            balance: balance,
            balanceLabel: balanceLabel,
            goalsActive: goalsActive,
            nearestGoal: nearest,
            lastUpdated: lastUpdated,
            habits: habits,
            tasks: tasks
        )
    }

    static func placeholder() -> WidgetEntry {
        WidgetEntry(
            date: Date(),
            greeting: "Good morning",
            habitsDone: 2, habitsTotal: 5,
            overdueTasks: 1, taskCount: 4,
            balance: 0, balanceLabel: "—",
            goalsActive: 2, nearestGoal: nil,
            lastUpdated: "",
            habits: [], tasks: []
        )
    }
}

// ── Timeline provider ─────────────────────────────────────────────────────────

struct MyOrbitProvider: TimelineProvider {
    func placeholder(in context: Context) -> WidgetEntry {
        WidgetDataLoader.placeholder()
    }

    func getSnapshot(in context: Context, completion: @escaping (WidgetEntry) -> Void) {
        completion(WidgetDataLoader.load())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WidgetEntry>) -> Void) {
        let entry    = WidgetDataLoader.load()
        let refresh  = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(refresh))
        completion(timeline)
    }
}

// ── Small widget view ─────────────────────────────────────────────────────────

struct SmallWidgetView: View {
    let entry: WidgetEntry

    var progress: Double {
        entry.habitsTotal > 0 ? Double(entry.habitsDone) / Double(entry.habitsTotal) : 0
    }
    var progressColor: Color {
        progress >= 0.8 ? .green : progress >= 0.4 ? .orange : .red
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack(spacing: 4) {
                Text("🪐").font(.system(size: 12))
                Text("MyOrbit")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
            }

            Text(entry.greeting)
                .font(.system(size: 10))
                .foregroundColor(.secondary)
                .lineLimit(1)

            Spacer()

            VStack(alignment: .leading, spacing: 2) {
                Text("Habits \(entry.habitsDone)/\(entry.habitsTotal)")
                    .font(.system(size: 10, weight: .semibold))
                ProgressView(value: progress)
                    .tint(progressColor)
                    .scaleEffect(x: 1, y: 0.7)
            }

            if entry.overdueTasks > 0 {
                Text("⚠ \(entry.overdueTasks) overdue")
                    .font(.system(size: 9))
                    .foregroundColor(.red)
            }
        }
        .padding(10)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
        .background(Color(.systemBackground))
    }
}

// ── Medium widget view ────────────────────────────────────────────────────────

struct MediumWidgetView: View {
    let entry: WidgetEntry

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Left — habits
            VStack(alignment: .leading, spacing: 3) {
                HStack(spacing: 3) {
                    Text("🪐").font(.system(size: 12))
                    Text("MyOrbit")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
                }
                Text(entry.greeting)
                    .font(.system(size: 9))
                    .foregroundColor(.secondary)
                    .lineLimit(1)

                Spacer(minLength: 4)

                Text("Habits · \(entry.habitsDone)/\(entry.habitsTotal)")
                    .font(.system(size: 9, weight: .bold))

                ForEach(entry.habits.prefix(4), id: \.id) { h in
                    HStack(spacing: 3) {
                        Text(h.done ? "✅" : "⬜").font(.system(size: 9))
                        Text("\(h.emoji) \(h.name)")
                            .font(.system(size: 9))
                            .foregroundColor(h.done ? .secondary : .primary)
                            .strikethrough(h.done)
                            .lineLimit(1)
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)

            Divider()

            // Right — tasks
            VStack(alignment: .leading, spacing: 3) {
                Text("Tasks")
                    .font(.system(size: 9, weight: .bold))

                if entry.tasks.isEmpty {
                    Text("All clear! 🎉")
                        .font(.system(size: 9))
                        .foregroundColor(.secondary)
                } else {
                    ForEach(entry.tasks.prefix(4), id: \.id) { t in
                        HStack(spacing: 3) {
                            Circle()
                                .fill(t.overdue ? Color.red : Color.blue)
                                .frame(width: 5, height: 5)
                            Text(t.title)
                                .font(.system(size: 9))
                                .foregroundColor(t.overdue ? .red : .primary)
                                .lineLimit(1)
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(12)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
        .background(Color(.systemBackground))
    }
}

// ── Large widget view ─────────────────────────────────────────────────────────

struct LargeWidgetView: View {
    let entry: WidgetEntry

    var balance: String {
        let f = NumberFormatter()
        f.numberStyle = .currency; f.maximumFractionDigits = 0
        return f.string(from: NSNumber(value: entry.balance)) ?? "$0"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            // Header
            HStack {
                HStack(spacing: 4) {
                    Text("🪐").font(.system(size: 16))
                    Text("MyOrbit")
                        .font(.system(size: 14, weight: .bold))
                        .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
                }
                Spacer()
                Text(entry.greeting)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }

            Divider()

            // Habits
            VStack(alignment: .leading, spacing: 2) {
                Text("Habits · \(entry.habitsDone)/\(entry.habitsTotal) done")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))

                let progress = entry.habitsTotal > 0 ? Double(entry.habitsDone) / Double(entry.habitsTotal) : 0
                ProgressView(value: progress)
                    .tint(progress >= 0.8 ? .green : progress >= 0.4 ? .orange : .red)
                    .scaleEffect(x: 1, y: 0.6)

                LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 2) {
                    ForEach(entry.habits.prefix(6), id: \.id) { h in
                        HStack(spacing: 2) {
                            Text(h.done ? "✅" : "⬜").font(.system(size: 9))
                            Text("\(h.emoji) \(h.name)")
                                .font(.system(size: 9))
                                .strikethrough(h.done)
                                .foregroundColor(h.done ? .secondary : .primary)
                                .lineLimit(1)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }
            }

            Divider()

            // Tasks
            VStack(alignment: .leading, spacing: 2) {
                Text("Tasks · \(entry.taskCount)\(entry.overdueTasks > 0 ? " · \(entry.overdueTasks) overdue" : "")")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))

                if entry.tasks.isEmpty {
                    Text("All done! 🎉").font(.system(size: 10)).foregroundColor(.secondary)
                } else {
                    ForEach(entry.tasks.prefix(3), id: \.id) { t in
                        HStack(spacing: 4) {
                            Circle()
                                .fill(t.overdue ? Color.red : Color.blue)
                                .frame(width: 6, height: 6)
                            Text(t.title)
                                .font(.system(size: 10))
                                .foregroundColor(t.overdue ? .red : .primary)
                                .lineLimit(1)
                        }
                    }
                }
            }

            Divider()

            // Finance + Goals
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 1) {
                    Text("💰 Finance")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
                    Text(balance)
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(entry.balance < 0 ? .red : .primary)
                    Text(entry.balanceLabel)
                        .font(.system(size: 8))
                        .foregroundColor(.secondary)
                }
                Spacer()
                VStack(alignment: .trailing, spacing: 1) {
                    Text("🎯 Goals")
                        .font(.system(size: 9, weight: .bold))
                        .foregroundColor(Color(red: 0.063, green: 0.725, blue: 0.506))
                    Text("\(entry.goalsActive) active")
                        .font(.system(size: 13, weight: .bold))
                    if let nearest = entry.nearestGoal {
                        Text(nearest)
                            .font(.system(size: 8))
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }
            }

            Spacer(minLength: 0)

            Text("Updated \(entry.lastUpdated.isEmpty ? "—" : String(entry.lastUpdated.prefix(16)))")
                .font(.system(size: 7))
                .foregroundColor(Color(.tertiaryLabel))
                .frame(maxWidth: .infinity, alignment: .trailing)
        }
        .padding(14)
        .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        .background(Color(.systemBackground))
    }
}

// ── Widget definition ─────────────────────────────────────────────────────────

struct MyOrbitWidget: Widget {
    let kind: String = "MyOrbitWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: MyOrbitProvider()) { entry in
            MyOrbitWidgetEntryView(entry: entry)
                .widgetURL(URL(string: "myorbit://orbit"))
        }
        .configurationDisplayName("MyOrbit")
        .description("Your daily orbit at a glance.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct MyOrbitWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    let entry: WidgetEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(entry: entry)
        case .systemMedium:
            MediumWidgetView(entry: entry)
        case .systemLarge:
            LargeWidgetView(entry: entry)
        default:
            SmallWidgetView(entry: entry)
        }
    }
}

// ── Entry point ───────────────────────────────────────────────────────────────

@main
struct MyOrbitWidgetBundle: WidgetBundle {
    var body: some Widget {
        MyOrbitWidget()
    }
}
