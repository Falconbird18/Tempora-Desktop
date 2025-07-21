// NotificationsStore.js
import { Variable } from "astal";
import Notifd from "gi://AstalNotifd?version=0.1";

// Get the default Notifd instance.
const notifd = Notifd.get_default();
notifd.set_ignore_timeout(true); // This keeps notifications until explicitly dismissed

// When a new notification arrives…
notifd.connect("notified", (_, id) => {
  try {
    const notification = notifd.get_notification(id);
    if (!notification) return;
    // Append the new notification to the store.
    // Ensure no duplicates if 'notified' is emitted for existing ones on startup
    if (!notificationsStore.get().find((n) => n.id === notification.id)) {
      notificationsStore.set([...notificationsStore.get(), notification]);
    }
  } catch (error) {
    console.error(
      `Error handling notified signal for notification ${id}:`,
      error,
    );
  }
});

// When a notification is resolved…
notifd.connect("resolved", (_, id) => {
  try {
    // Remove the notification with the matching id.
    notificationsStore.set(notificationsStore.get().filter((n) => n.id !== id));
  } catch (error) {
    console.error(
      `Error handling resolved signal for notification ${id}:`,
      error,
    );
  }
});

// Initialize the store with existing notifications
let initialNotifications = [];
try {
  initialNotifications = notifd.get_notifications() || [];
} catch (error) {
  console.error("Error getting initial notifications:", error);
}
const notificationsStore = Variable(initialNotifications);

// Export an object with a getter and subscribe() for binding.
// Also expose a way to clear all notifications which should be called by your UI
export default {
  get notifications() {
    return notificationsStore.get();
  },
  subscribe: notificationsStore.subscribe.bind(notificationsStore),
  get notifdInstance() {
    // Expose notifd for direct calls if needed
    return notifd;
  },
  clearAll: () => {
    try {
      // Always dismiss notifications one by one.
      // This will trigger "resolved" signals for each.
      const currentNotifications = [...notificationsStore.get()];
      currentNotifications.forEach((n) => {
        // 'n' is an AstalNotifd.Notification instance
        try {
          if (typeof n.dismiss === "function") {
            n.dismiss(); // Call dismiss on the notification object itself
          } else {
            // This would be unexpected if AstalNotifd.Notification conforms to the provided docs
            // and 'n' is indeed a valid notification object.
            console.error(
              `Notification object (id: ${n.id}) does not have a 'dismiss' method.`,
            );
          }
        } catch (error) {
          console.error(`Error dismissing notification ${n.id}:`, error);
        }
      });
    } catch (error) {
      console.error("Error clearing all notifications:", error);
    }
  },
  update: (data) => {
    try {
      // Force trigger subscriptions for UI updates
      notificationsStore.set([...notificationsStore.get()]);
    } catch (error) {
      console.error("Error updating notifications store:", error);
    }
  },
};
// which in turn updates `notificationsStore`.
