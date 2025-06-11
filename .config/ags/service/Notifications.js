// NotificationsStore.js
import { Variable } from "astal";
import Notifd from "gi://AstalNotifd?version=0.1";

// Get the default Notifd instance.
const notifd = Notifd.get_default();
notifd.set_ignore_timeout(true); // This keeps notifications until explicitly dismissed

// When a new notification arrives…
notifd.connect("notified", (_, id) => {
  const notification = notifd.get_notification(id);
  if (!notification) return;
  // Append the new notification to the store.
  // Ensure no duplicates if 'notified' is emitted for existing ones on startup
  if (!notificationsStore.get().find(n => n.id === notification.id)) {
    notificationsStore.set([...notificationsStore.get(), notification]);
  }
});

// When a notification is resolved…
notifd.connect("resolved", (_, id) => {
  // Remove the notification with the matching id.
  notificationsStore.set(
    notificationsStore.get().filter((n) => n.id !== id)
  );
});

// Initialize the store with existing notifications
const initialNotifications = notifd.get_notifications() || [];
const notificationsStore = Variable(initialNotifications);


// Export an object with a getter and subscribe() for binding.
// Also expose a way to clear all notifications which should be called by your UI
export default {
  get notifications() {
    return notificationsStore.get();
  },
  subscribe: notificationsStore.subscribe.bind(notificationsStore),
  get notifdInstance() { // Expose notifd for direct calls if needed
    return notifd;
  },
  clearAll: () => {
    let clearedViaBulk = false;
    if (typeof notifd.resolve_all === 'function') {
      notifd.resolve_all();
      clearedViaBulk = true;
    } else if (typeof notifd.close_all_notifications === 'function') {
      notifd.close_all_notifications();
      clearedViaBulk = true;
    }

    if (clearedViaBulk) {
      // If a bulk clear method was called on the daemon,
      // we update our local store to an empty array.
      // The UI (Notifications/index.tsx) subscribes to this variable
      // and will call `close()` on individual widgets, handling animations.
      notificationsStore.set([]);
    } else {
      // Fallback: iterate over a copy of our current notifications and close them one by one.
      // This relies on `close_notification` emitting 'resolved' for each,
      // which in turn updates `notificationsStore`.
      [...notificationsStore.get()].forEach(n => notifd.close_notification(n.id));
    }
  }
};
