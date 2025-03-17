import FanProfilesService, { profileName } from "../../../service/FanProfiles";
import { spacing } from "../../../lib/variables";
import { bind } from "astal";
import icons from "../../../lib/icons";
import Bluetooth from "gi://AstalBluetooth?version=0.1";
import { controlCenterPage } from "../index";

export default () => {
  const bluetooth = Bluetooth.get_default();
	if (FanProfilesService) {
		const profile = bind(FanProfilesService, "profile");
		const menuName = "profiles";

		const buttonClassName = bind(bluetooth, "isPowered").as((p) =>
			p ? "primary-button-circular active" : "primary-button-circular",
		);
		return (
			<box spacing={spacing}>
				<button
					onClickRelease={() => {
						if (FanProfilesService) FanProfilesService.nextProfile();
					}}
					// Use the derived buttonClassName here
					className={bind(buttonClassName)}
				// Remove the setup function as it's no longer needed
				>
					<icon icon={profile.as((p) => icons.powerprofile[p])} className="h1" />
				</button>
				<box className="control-center-label-container">
					<label label={profile.as((p) => profileName(p))} className="h2" />
				</box>
				<button
					onClickRelease={(_, event: Astal.ClickEvent) => {
						if (event.button == 1 && menuName) {
							controlCenterPage.set(menuName);
						}
					}}
				>
					<icon icon={icons.ui.arrow.right} className="h1" />
				</button>
			</box>
		);
	}
};