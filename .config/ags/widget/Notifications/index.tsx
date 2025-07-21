import { App, Gtk, Gdk, Widget, Astal } from "astal/gtk3";
import { bind, timeout, Variable, GLib } from "astal";
// import Notifd from "gi://AstalNotifd?version=0.1"; // No longer directly used here
import NotificationWidget from "./Notification"; // Renamed import
import { spacing } from "../../lib/variables";
import PopupWindow from "../../common/PopupWindow";
// import { Subscribable } from "astal/binding"; // No longer needed
import notificationsStore from "../../service/Notifications"; // Import central store

// Remove NotificationsMap and createNotificationWidget as logic is now centralized

// Local Do Not Disturb state for demonstration purposes in this window
const doNotDisturb = Variable(false);

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
            <label
              halign={Gtk.Align.START}
              label="Notifications"
              className="h1"
            />
          </box>
          <box halign={Gtk.Align.END} hexpand={true}>
            {/* Do Not Disturb Toggle Button */}
            <button
              setup={(self) =>
                bind(
                  doNotDisturb,
                  "value",
                  (isDND) =>
                    (self.className = isDND
                      ? "primary-button active"
                      : "primary-button"),
                )
              }
              onClicked={() => {
                try {
                  doNotDisturb.value = !doNotDisturb.value;
                  console.log(
                    `Do Not Disturb (Main Window): ${
                      doNotDisturb.value ? "On" : "Off"
                    }`,
                  );
                  // Trigger update to re-render list based on DND state
                  // by forcing a notificationsStore subscription update
                  notificationsStore.update({});
                } catch (error) {
                  console.error("Error toggling DND:", error);
                }
              }}
            >
              <label
                setup={(self) =>
                  bind(
                    doNotDisturb,
                    "value",
                    (v) => (self.label = `DND ${v ? "On" : "Off"}`),
                  )
                }
              />
            </button>
            <button
              className="primary-button"
              halign={Gtk.Align.END}
              on_clicked={() => {
                try {
                  notificationsStore.clearAll();
                } catch (error) {
                  console.error("Error clearing all notifications:", error);
                }
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

              const updateList = (
                currentNotifications: Notifd.Notification[],
              ) => {
                try {
                  // Clear all existing children from the Gtk.Box to re-render based on DND state
                  self.get_children().forEach((child) => {
                    try {
                      self.remove(child);
                      child.destroy();
                    } catch (error) {
                      console.error("Error removing child widget:", error);
                    }
                  });
                  widgetMap.clear(); // Clear the map as well

                  if (doNotDisturb.value) {
                    // If DND is active, display a message
                    self.add(
                      new Widget.Label({
                        label: "Do Not Disturb is On",
                        className: "placeholder",
                        halign: Gtk.Align.CENTER,
                        valign: Gtk.Align.CENTER,
                        hexpand: true,
                        vexpand: true,
                      }),
                    );
                    self.show_all();
                    return; // Exit as DND is on, no notifications to display
                  }

                  // If DND is off, proceed to display notifications
                  const newIds = new Set(currentNotifications.map((n) => n.id));

                  // Remove widgets for notifications that no longer exist (already cleared above, but good for robustness)
                  widgetMap.forEach((widgetInstance, id) => {
                    try {
                      if (!newIds.has(id)) {
                        if (
                          widgetInstance &&
                          !(widgetInstance as any)._destroyed
                        ) {
                          if (typeof widgetInstance.close === "function") {
                            widgetInstance.close();
                          }
                        } else {
                          widgetMap.delete(id);
                        }
                      }
                    } catch (error) {
                      console.error(
                        `Error removing widget for notification ${id}:`,
                        error,
                      );
                    }
                  });

                  // Add new widgets (newest on top)
                  // Filter notifications if needed based on DND, but for persistent list, we usually show all
                  // For this implementation, DND just replaces the list with a message.
                  [...currentNotifications]
                    .reverse()
                    .forEach((notification) => {
                      try {
                        if (!widgetMap.has(notification.id)) {
                          const newWidget = NotificationWidget({
                            notification: notification,
                            onHoverLost: () => {},
                            setup: () => {},
                            _removeWidgetFromParent: () => {
                              try {
                                if (newWidget.get_parent() === self) {
                                  self.remove(newWidget);
                                }
                                newWidget.destroy();
                                widgetMap.delete(notification.id);
                              } catch (error) {
                                console.error(
                                  `Error removing widget from parent for notification ${notification.id}:`,
                                  error,
                                );
                              }
                            },
                          });
                          (newWidget as any)._destroyed = false;
                          self.add(newWidget);
                          newWidget.show_all();
                          widgetMap.set(notification.id, newWidget);
                        }
                      } catch (error) {
                        console.error(
                          `Error creating widget for notification ${notification.id}:`,
                          error,
                        );
                      }
                    });
                } catch (error) {
                  console.error("Error updating notifications list:", error);
                }
              };

              // Initial population and subscription
              // Subscribe to DND changes and notifications store
              try {
                doNotDisturb.subscribe(() => {
                  try {
                    updateList(notificationsStore.notifications);
                  } catch (error) {
                    console.error("Error in DND subscription callback:", error);
                  }
                });
                notificationsStore.subscribe((notifications) => {
                  try {
                    updateList(notifications);
                  } catch (error) {
                    console.error(
                      "Error in notifications store subscription callback:",
                      error,
                    );
                  }
                });
                updateList(notificationsStore.notifications); // Initial call to populate
              } catch (error) {
                console.error(
                  "Error setting up notifications subscriptions:",
                  error,
                );
              }
            }}
          />
        </scrollable>
      </box>
    </PopupWindow>
  );
};
