import { bind } from "astal";
import { Gtk } from "astal/gtk3";
import AstalWp from "gi://AstalWp?version=0.1";
import icons from "../../../lib/icons";

export default () => {
	const mic = AstalWp.get_default()?.audio.defaultMicrophone!;

	return (
		<button
			className={bind(mic, "mute").as((muted) =>
				muted ? "primary-button-inactive" : "primary-button",
			)}
			connection={[bind(mic, "mute"), () => !mic.mute]}
			onClick={() => (mic.mute = !mic.mute)}
			hexpand={true}
		>
			<box horizontal >

				<icon
					icon={bind(mic, "mute").as(
						(muted) => icons.audio.mic[muted ? "muted" : "high"],
					)}
					className="icon"
				/>
				<box vertical>
					<label label="Microphone" className="paragraph" halign={Gtk.Align.START} />
					<label
						label={bind(mic, "mute").as((muted) =>
							muted ? "Off" : "On",
						)}
						className="subtext"
						halign={Gtk.Align.START}
					/>
				</box>
			</box>
		</button>
	);
};
