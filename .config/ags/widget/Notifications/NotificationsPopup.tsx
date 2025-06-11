import Notification from "./Notification";
import Notifd from "gi://AstalNotifd";
import { App, Gtk, Gdk, Widget, Astal } from "astal/gtk3";
import { Subscribable } from "astal/binding";
import { bind, timeout, Variable } from "astal";

const TIMEOUT_DELAY = 5000;

class PopupNotificationsMap implements Subscribable {
    private map: Map<number, Gtk.Widget> = new Map();
    private var: Variable<Array<Gtk.Widget>> = Variable([]);

    private notify() {
        this.var.set([...this.map.values()].reverse());
    }

    constructor() {
        const notifd = Notifd.get_default();

        notifd.connect("notified", (_, id) => {
            let timeoutId: number | null = null;
            const widget = Notification({
                notification: notifd.get_notification(id)!,
                onHoverLost: () => this.map.get(id)?.close(),
                setup: (self) => {
                    timeoutId = timeout(TIMEOUT_DELAY, () => {
                        this.map.get(id)?.close(() => this.delete(id));
                    });
                },
            });
            widget.onDestroy = () => {
                if (timeoutId !== null) {
                    GLib.source_remove(timeoutId);
                    timeoutId = null;
                }
            };
            this.set(id, widget);
        });

        notifd.connect("resolved", (_, id) => {
            this.map.get(id)?.close(() => this.delete(id));
        });
    }

    private set(key: number, value: Gtk.Widget) {
        const oldWidget = this.map.get(key);
        if (oldWidget && typeof oldWidget.destroy === "function") {
            oldWidget.destroy();
        }
        this.map.set(key, value);
        this.notify();
    }

    private delete(key: number) {
        const widget = this.map.get(key);
        if (widget && typeof widget.destroy === "function") {
            widget.destroy();
            this.map.delete(key);
        }
        this.notify();
    }

    get() {
        return this.var.get();
    }

    subscribe(callback: (list: Array<Gtk.Widget>) => void) {
        return this.var.subscribe(callback);
    }
}


class NotificationsMap implements Subscribable {
    private map: Map<number, Gtk.Widget> = new Map();
    private var: Variable<Array<Gtk.Widget>> = Variable([]);

    private notify() { // Fixed typo: notifiy -> notify
        this.var.set([...this.map.values()].reverse());
    }

    constructor() {
        const notifd = Notifd.get_default();
        notifd.set_ignore_timeout(true);

        notifd.connect("notified", (_, id) => {
            this.set(
                id,
                Notification({
                    notification: notifd.get_notification(id)!,
                    onHoverLost: () => {},
                    setup: (self) => {},
                }),
            );
        });
        notifd.connect("resolved", (_, id) => {
            this.map.get(id)?.close(() => this.delete(id));
        });
    }

    private set(key: number, value: Gtk.Widget) {
        const oldWidget = this.map.get(key);
        if (oldWidget) {
            if (typeof oldWidget.destroy === "function") oldWidget.destroy();
        }
        this.map.set(key, value);
        this.notify();
    }

    private delete(key: number) {
        const widget = this.map.get(key);
        if (widget) {
            if (typeof widget.destroy === "function") widget.destroy();
            this.map.delete(key);
        }
        this.notify();
    }

    get() {
        return this.var.get();
    }

    subscribe(callback: (list: Array<Gtk.Widget>) => void) {
        return this.var.subscribe(callback);
    }
}

export default (monitor: Gdk.Monitor) => {
	const notifs = new PopupNotificationsMap();

	return (
		<window
			layer={Astal.Layer.OVERLAY}
			marginTop={20}
			className="NotificationsPopup"
			namespace="notifications-popup"
			anchor={Astal.WindowAnchor.TOP}
			gdkmonitor={monitor}
		>
			<box className="notifications-popup" spacing={8} vertical={true}>
				{bind(notifs)}
			</box>
		</window>
	);
};
