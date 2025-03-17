import { exec, execAsync, GObject, Variable } from "astal";
import { dependencies } from "../lib/utils";

export enum FanProfile {
    Silent = "power-saver",    // Maps to battery saver
    Standart = "balanced",     // Maps to balanced
    Performance = "performance", // Maps to performance
}

const profileBinding = {
    "power-saver": "battery",
    "balanced": "balanced",
    "performance": "performance",
};

const available = dependencies(["powerprofilesctl"]);

export const profileName = (profile: string) => {
    const profileName = profileBinding[profile];
    return profileName.charAt(0).toUpperCase() + profileName.slice(1);
};

class FanProfileService extends GObject.Object {
    getProfile = () => {
        const result = exec(`powerprofilesctl get`);
        return result.trim() as FanProfile;
    };

    #profile: string = this.getProfile();

    get profile() {
        return this.#profile;
    }

    get profiles(): string[] {
        return ["power-saver", "balanced", "performance"];
    }

    async nextProfile() {
        const profiles = this.profiles;
        const currentIndex = profiles.indexOf(this.#profile);
        this.#profile = profiles[(currentIndex + 1) % profiles.length];
        exec(`powerprofilesctl set ${this.#profile}`);
        this.notify("profile");
    }

    async prevProfile() {
        const profiles = this.profiles;
        const currentIndex = profiles.indexOf(this.#profile);
        this.#profile = profiles[(currentIndex - 1 + profiles.length) % profiles.length];
        exec(`powerprofilesctl set ${this.#profile}`);
        this.notify("profile");
    }

    async setProfile(profile: string) {
        exec(`powerprofilesctl set ${profile}`);
        this.#profile = profile;
        this.notify("profile");
    }
}

const FanProfileServiceRegister = GObject.registerClass(
    {
        GTypeName: "FanProfileService",
        Properties: {
            profile: GObject.ParamSpec.string(
                "profile",
                "Profile",
                "A fan-profile property",
                GObject.ParamFlags.READWRITE,
                "balanced",
            ),
        },
        Signals: {},
    },
    FanProfileService,
);

var service: FanProfileService | null = null;

if (available) {
    service = new FanProfileServiceRegister();
}

export default service;