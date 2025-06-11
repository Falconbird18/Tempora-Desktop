import { App, Gtk, Gdk, Widget, Astal } from "astal/gtk3";
import { bind, timeout, Variable, GLib } from "astal";
// import Notifd from "gi://AstalNotifd?version=0.1"; // No longer directly used here
import NotificationWidget from "./Notification"; // Renamed import
import { spacing } from "../../lib/variables";
import PopupWindow from "../../common/PopupWindow";
// import { Subscribable } from "astal/binding"; // No longer needed
import notificationsStore from "../../service/Notifications"; // Import central store

// Remove NotificationsMap and createNotificationWidget as logic is now centralized

export default () => {
    return (
        <PopupWindow
            scrimType="transparent"
            layer={Astal.Layer.OVERLAY}
            visible={false}
            margin={12}
            vexpand={true}
            keymode={Astal.Keymode.EXCLUSIVE}
            name="Notifications"
            namespace="Notifications"
            className="Notifications"
            exclusivity={Astal.Exclusivity.NORMAL}
            anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
            application={App}
            onKeyPressEvent={(self, event) => {
                const [keyEvent, keyCode] = event.get_keycode();
                if (keyEvent && keyCode == 9) {
                    console.log("Toggling notifications window");
                    App.toggle_window(self.name);
                }
            }}
        >
            <box vertical className="notifications-window" spacing={spacing}>
                <box halign={Gtk.Align.FILL} spacing={6} hexpand={true}>
                    <box halign={Gtk.Align.START} hexpand={true}>
                        <label halign={Gtk.Align.START} label="Notifications" className="h1" />
                    </box>
                    <box halign={Gtk.Align.END} hexpand={true}>
                        <button
                            className="primary-button"
                            halign={Gtk.Align.END}
                            onClicked={() => {
                                notificationsStore.clearAll();
                            }}
                        >
                            <label label="Clear All" />
                        </button>
                    </box>
                </box>
            <scrollable vexpand>
                <box
                    className="notifications-window__list"
                    visible={true}
                    orientation={Gtk.Orientation.VERTICAL}
                    spacing={6}
                    vexpand={true}
                    hexpand={true}
                    setup={(self: Widget.Box) => {
                        const widgetMap = new Map<number, Widget.Revealer>(); // Store Gtk.Widget (Revealer)

                        const updateList = (currentNotifications: Notifd.Notification[]) => {
                            const newIds = new Set(currentNotifications.map(n => n.id));

                            // Remove widgets for notifications that no longer exist
                            widgetMap.forEach((widgetInstance, id) => {
                                if (!newIds.has(id)) {
                                    if (widgetInstance && !(widgetInstance as any)._destroyed) {
                                        widgetInstance.close(); // Triggers animation and removal via callback
                                    } else {
                                        widgetMap.delete(id); // Clean up map if already gone
                                    }
                                }
                            });

                            // Add new widgets (newest on top)
                            // Iterate normal order and prepend, or reverse and add
                            [...currentNotifications].reverse().forEach(notification => {
                                if (!widgetMap.has(notification.id)) {
                                    const newWidget = NotificationWidget({
                                        notification: notification,
                                        onHoverLost: () => {}, // Adapt if needed
                                        setup: () => {},       // Adapt if needed
                                        _removeWidgetFromParent: () => {
                                            if (newWidget.get_parent() === self) {
                                                self.remove(newWidget);
                                            }
                                            newWidget.destroy();
                                            widgetMap.delete(notification.id);
                                        }
                                    });
                                    (newWidget as any)._destroyed = false; // Initialize flag
                                    self.add(newWidget); // Adds to the end, results in newest on top due to reversed list
                                    newWidget.show_all();
                                    widgetMap.set(notification.id, newWidget);
                                }
                            });
                        };

                        // Initial population and subscription
                        updateList(notificationsStore.notifications);
                        notificationsStore.subscribe(updateList);
                    }}
                />
            </scrollable>
        </box>
        </PopupWindow >
    );
};
