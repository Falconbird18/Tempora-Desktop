import Notification from "./Notification";
import Notifd from "gi://AstalNotifd";
import { App, Gtk, Gdk, Widget, Astal } from "astal/gtk3";
import { Subscribable } from "astal/binding";
import { bind, timeout, Variable } from "astal";

// Variable to control Do Not Disturb mode for popups
const doNotDisturb = new Variable(false);

// Helper function to dismiss a notification by ID immediately
const dismissNotificationImmediately = async (id: number) => {
  try {
    await Promise.resolve(Notifd.get_default().dismiss_notification(id));
  } catch (e) {
    console.error(
      `Error dismissing notification immediately for ID ${id}: ${e}`,
    );
  }
};

class PopupNotificationsMap implements Subscribable {
  private map: Map<number, Gtk.Widget> = new Map();
  private var: Variable<Array<Gtk.Widget>> = new Variable([]);

  private notify() {
    this.var.set([...this.map.values()].reverse());
  }

  constructor() {
    const notifd = Notifd.get_default();

    notifd.connect("notified", (_: any, id: any) => {
      // If Do Not Disturb is active, immediately dismiss the notification
      if (doNotDisturb.value) {
        dismissNotificationImmediately(id).catch((error) => {
          console.error(`Failed to dismiss notification ${id}:`, error);
        });
        return;
      }

      const notification = notifd.get_notification(id);
      if (!notification) return; // Should not happen if 'notified' signal is reliable

      const widget = Notification({
        notification: notification,
        onHoverLost: () => {}, // Handled internally by Notification widget now for auto-dismissal
        setup: (self) => {
          // Notification widget now manages its own auto-dismiss timeout and hover logic.
          // No separate timeout needed here.
        },
        _removeWidgetFromParent: () => {
          try {
            // This callback is invoked by Notification.close() after its hide animation
            if (widget["get_parent"]()) {
              widget["get_parent"]().remove(widget);
            }
            if (
              typeof (widget as any)._destroyed === "boolean" &&
              !(widget as any)._destroyed
            ) {
              widget.destroy();
            }
            this.delete(id); // Remove from THIS map
          } catch (error) {
            console.error(
              `Error removing widget from parent for notification ${id}:`,
              error,
            );
          }
        },
      });
      this.set(id, widget);
    });

    notifd.connect("resolved", (_: any, id: any) => {
      try {
        // When a notification is resolved (e.g., dismissed by source), close it with animation
        // The _removeWidgetFromParent callback will handle deletion from the map.
        const widget = this.map.get(id);
        if (widget && typeof widget["close"] === "function") {
          widget["close"]();
        }
      } catch (error) {
        console.error(`Error resolving notification ${id}:`, error);
      }
    });

    // Listen to DND changes: if DND is enabled, dismiss all existing popups
    doNotDisturb.subscribe((isDND: any) => {
      if (isDND) {
        this.clear(); // Dismiss all existing popups
      }
    });
  }

  private set(key: number, value: Gtk.Widget) {
    try {
      const oldWidget = this.map.get(key);
      if (oldWidget) {
        // Explicitly destroy old widget to prevent memory leaks if replaced
        if (
          typeof oldWidget.destroy === "function" &&
          !(oldWidget as any)._destroyed
        ) {
          oldWidget.destroy();
        }
      }
      this.map.set(key, value);
      this.notify();
    } catch (error) {
      console.error(`Error setting notification widget ${key}:`, error);
    }
  }

  private delete(key: number) {
    try {
      const widget = this.map.get(key);
      if (widget) {
        // Only destroy if it hasn't been destroyed by Notification's close callback
        if (
          typeof widget.destroy === "function" &&
          !(widget as any)._destroyed
        ) {
          widget.destroy();
        } else if (typeof (widget as any)._destroyed === "undefined") {
          // Fallback for widgets not yet having the _destroyed flag (e.g. initial setup)
          if (typeof widget.destroy === "function") widget.destroy();
        }
        this.map.delete(key);
      }
      this.notify();
    } catch (error) {
      console.error(`Error deleting notification widget ${key}:`, error);
    }
  }

  get() {
    return this.var.get();
  }

  subscribe(callback: (list: Array<Gtk.Widget>) => void) {
    return this.var.subscribe(callback);
  }

  // Method to clear all currently displayed popup notifications
  clear() {
    try {
      this.map.forEach((widget, id) => {
        try {
          // Calling close will trigger _removeWidgetFromParent which handles removal from map.
          if (widget && typeof widget["close"] === "function") {
            widget["close"]();
          }
        } catch (error) {
          console.error(`Error closing notification widget ${id}:`, error);
        }
      });
    } catch (error) {
      console.error("Error clearing popup notifications:", error);
    }
  }
}

class NotificationsMap implements Subscribable {
  // This class is for the persistent notification list (e.g., in a notification center)
  private map: Map<number, Gtk.Widget> = new Map();
  private var: Variable<Array<Gtk.Widget>> = new Variable([]);

  private notify() {
    // Fixed typo: notifiy -> notify
    this.var.set([...this.map.values()].reverse());
  }

  constructor() {
    const notifd = Notifd.get_default();
    notifd.set_ignore_timeout(true); // Notifications in the persistent list should not auto-timeout

    notifd.connect("notified", (_: any, id: any) => {
      try {
        this.set(
          id,
          Notification({
            notification: notifd.get_notification(id)!,
            onHoverLost: () => {}, // No hover behavior needed for persistent list
            setup: (self) => {}, // No specific setup for persistent list items
          }),
        );
      } catch (error) {
        console.error(`Error creating notification widget ${id}:`, error);
      }
    });
    notifd.connect("resolved", (_: any, id: any) => {
      try {
        const widget = this.map.get(id);
        if (widget && typeof widget["close"] === "function") {
          widget["close"](() => this.delete(id));
        }
      } catch (error) {
        console.error(`Error resolving notification ${id}:`, error);
      }
    });
  }

  private set(key: number, value: Gtk.Widget) {
    try {
      const oldWidget = this.map.get(key);
      if (oldWidget) {
        if (
          typeof oldWidget.destroy === "function" &&
          !(oldWidget as any)._destroyed
        )
          oldWidget.destroy();
      }
      this.map.set(key, value);
      this.notify();
    } catch (error) {
      console.error(`Error setting notification widget ${key}:`, error);
    }
  }

  private delete(key: number) {
    try {
      const widget = this.map.get(key);
      if (widget) {
        if (typeof widget.destroy === "function" && !(widget as any)._destroyed)
          widget.destroy();
        this.map.delete(key);
      }
      this.notify();
    } catch (error) {
      console.error(`Error deleting notification widget ${key}:`, error);
    }
  }

  get() {
    return this.var.get();
  }

  subscribe(callback: (list: Array<Gtk.Widget>) => void) {
    return this.var.subscribe(callback);
  }
  // No clear method needed here as this is for the permanent notification list
}

// Global instance for popup notifications
const popupNotifs = new PopupNotificationsMap();

export default (monitor: Gdk.Monitor) => {
  return (
    <window
      layer={Astal.Layer.OVERLAY}
      marginTop={20}
      className="NotificationsPopup"
      namespace="notifications-popup"
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT} // Positioned to top-right
      gdkmonitor={monitor}
      // Window visibility depends on DND and if there are any notifications to show
      visible={bind(doNotDisturb).as((isDND: any) => {
        // Only show if DND is OFF and there are notifications in the popup list
        return !isDND && popupNotifs.get().length > 0;
      })}
    >
      <box
        className="notifications-popup"
        spacing={8}
        vertical={true}
        setup={(self) => {
          // Manually update visibility when related variables change, as `bind` might not be enough
          // for dynamic length updates for a Gtk.Window
          popupNotifs.subscribe((notifs) => {
            self.visible = !doNotDisturb.value && notifs.length > 0;
          });
          doNotDisturb.subscribe((isDND: any) => {
            self.visible = !isDND && popupNotifs.get().length > 0;
          });
        }}
      >
        {/* Button to toggle Do Not Disturb mode for testing/user control */}
        <button
          setup={(self: any) => {
            doNotDisturb.subscribe((isDND: any) => {
              self.className = isDND
                ? "primary-button active"
                : "primary-button";
            });
          }}
          onClicked={() => {
            doNotDisturb.value = !doNotDisturb.value;
            console.log(`Do Not Disturb: ${doNotDisturb.value ? "On" : "Off"}`);
          }}
        >
          <label
            setup={(self: any) => {
              doNotDisturb.subscribe((v: any) => {
                self.label = `Toggle DND: ${v ? "On" : "Off"}`;
              });
            }}
          />
        </button>
        {bind(popupNotifs).as((notifs: any) => notifs)}
      </box>
    </window>
  );
};
