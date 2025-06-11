import { Gtk, Widget } from "astal/gtk3";
import { type EventBox } from "astal/gtk3/widget";
import { timeout, GLib, idle } from "astal";
import Notifd from "gi://AstalNotifd";
import icons from "../../lib/icons";

const transitionDuration = 300;

const time = (time: number, format = "%l:%M %p") =>
	GLib.DateTime.new_from_unix_local(time).format(format);

type NotificationIconProps = {
	notification: Notifd.Notification;
};

const NotificationIcon = ({ notification }: NotificationIconProps) => {
	var { appName, appIcon, image } = notification;
	if (image) {
		if (image.includes("file://")) image = image.replace("file://", "");

		if (appName == "Telegram Desktop" || appName == "") {
			return (
				<box
					valign={Gtk.Align.START}
					hexpand={false}
					className={"notification__icon telegram"}
					css={`
						background-image: url("file://${image}");
						background-size: cover;
						background-repeat: no-repeat;
						background-position: center;
						min-width: 48px;
						min-height: 48px;
					`}
				/>
			);
		} else {
			return (
				<box
					valign={Gtk.Align.START}
					hexpand={false}
					className="notification__icon"
					css={`
						background-image: url("file://${image}");
						background-size: cover;
						background-repeat: no-repeat;
						background-position: center;
						min-width: 18px;
						min-height: 18px;
					`}
				/>
			);
		}
	}

	let icon = icons.fallback.notification;

	return new Widget.Box({
		valign: Gtk.Align.START,
		hexpand: false,
		className: "notification__icon",
		child: new Widget.Icon({
			icon,
			iconSize: 18,
			halign: Gtk.Align.CENTER,
			valign: Gtk.Align.CENTER,
			hexpand: true,
		}),
	});
};

type NotificationsProps = {
	setup(self: EventBox): void;
	onHoverLost(self: EventBox): void;
	notification: Notifd.Notification;
	// Callback to notify parent to remove this widget from its layout
    _removeWidgetFromParent?: () => void;
};

export default function Notification(props: NotificationsProps) {
	const { notification, onHoverLost, setup, _removeWidgetFromParent } = props;
	
	const Content = () => (
		<box hexpand={true} className="content">
			<NotificationIcon notification={notification} />
			<box hexpand={true} vexpand={true} vertical={true}>
				<box
					className="notification__header"
					vexpand={true}
					valign={Gtk.Align.CENTER}
				>
					<box hexpand={true} spacing={6}>
						<label
							className="notification__title"
							maxWidthChars={14}
							wrap={true}
							justify={Gtk.Justification.LEFT}
							truncate={true}
							useMarkup={true}
							label={notification.summary.trim()}
						/>
						<label className="notification__dot" label={"•"} />
						{notification.appName != "" && (
							<label
								className="notification__app-name"
								justify={Gtk.Justification.LEFT}
								truncate={true}
								wrap={true}
								maxWidthChars={8}
								useMarkup={true}
								label={notification.app_name.trim()}
							/>
						)}
						{notification.appName != "" && (
							<label className="notification__dot" label={"•"} />
						)}
						<label
							className="notification__time"
							label={time(notification.time)?.toString()}
						/>
					</box>
				</box>
				<revealer
					visible={notification.body != ""}
					reveal_child={notification.body != ""}
				>
					<label
						className="notification__description"
						hexpand={true}
						useMarkup={true}
						xalign={0}
						lines={3}
						justify={Gtk.Justification.LEFT}
						truncate={true}
						maxWidthChars={24}
						wrap={true}
						label={notification.body.trim().toString()}
					/>
				</revealer>
			</box>
			<button
				vexpand={true}
				valign={Gtk.Align.START}
				className="notification__close-button"
				onClicked={() => {
					notification.dismiss();
				}}
			>
				<icon icon="window-close-symbolic" />
			</button>
		</box>
	);

	const ActionsBox = () =>
		notification.get_actions() && (
			<box className="notification__actions">
				{notification.get_actions().map((action) => (
					<button
						className="notification__action"
						on_clicked={() => notification.invoke(action.id)}
						hexpand={true}
					>
						<label label={action.label} />
					</button>
				))}
			</box>
		);

    const Eventbox = () => (
        <eventbox vexpand={false} on_hover_lost={onHoverLost} setup={setup}>
            <box vertical={true}>
                <Content />
                <ActionsBox />
            </box>
        </eventbox>
    );

	const revealer = new Widget.Revealer({
		transitionType: Gtk.RevealerTransitionType.SLIDE_DOWN,
		transitionDuration: 300,
		setup: (self) => {
			idle(() => {
				self.revealChild = true;
			});
		},
		child: (
			<box
				valign={Gtk.Align.START}
				className={`notification ${notification.urgency}`}
			>
				<Eventbox />
			</box>
		),
	});
	
	let isClosing = false;
	let timeoutId: number | null = null;
	
	return Object.assign(revealer, {
		close() {
			if (isClosing || !revealer) return; // Early exit if already closing or revealer is null
			isClosing = true;
			revealer.revealChild = false; // Start the hide animation
	
			timeoutId = timeout(transitionDuration, () => {
				timeoutId = null;
				// Check if revealer still exists and is in the widget tree
				if (!revealer || !revealer.get_parent()) {
					// Widget is already disposed; skip further action
					return;
				}
	
				// Safely update the child’s class before removal
				const child = revealer.get_child(); // Use modern GTK method
				if (child) {
					const currentClass = child.className || "";
					child.className = `${currentClass} resolved`.trim();
				}
	
				// Call the passed-in removal function which also handles destroy
                if (_removeWidgetFromParent) {
                    _removeWidgetFromParent();
                } else {
                    // Fallback if no callback, just destroy (less ideal for parent management)
                    if (revealer.get_parent()) revealer.get_parent().remove(revealer);
                    revealer.destroy();
                }
			});
		},
		onDestroy: () => {
			if (timeoutId !== null) GLib.source_remove(timeoutId);
			isClosing = true;
			(revealer as any)._destroyed = true; // Add a flag for external checks
		},
	});
}
