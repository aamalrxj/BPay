import * as Notifications from "expo-notifications";

export async function scheduleEmiReminder(
    title,
    date
) {
    await Notifications.scheduleNotificationAsync(
        {
            content: {
                title: "EMI Reminder",
                body: `${title} EMI due soon`,
            },
            trigger: date,
        }
    );
}