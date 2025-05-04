import { bind } from "astal";
import { App, Gtk } from "astal/gtk3";
import { barWeather, weatherDescription, WeatherIcon } from "../../../service/Weather"; // Import the description variable
import BarButton from "../BarButton";
import { toggleWindow } from "../../../lib/utils";
import icons from "../../../lib/icons";

export default () => {
    const wthr = bind(barWeather).as((value) => {
        if (!value || value.includes("Unknown location;")) {
            return "loading...";
        }
        return value.trim();
    });
    const desc = bind(weatherDescription); // Bind the description variable

    // Debug: Log the weather description
    desc.subscribe((value) => {
        console.log("Weather Description:", value);
    });

    return (
        <revealer
            transitionType={Gtk.RevealerTransitionType.CROSSFADE}
            transitionDuration={300}
            revealChild={wthr.as(Boolean)}
        >
            <BarButton
                onClicked={() => {
                    toggleWindow("weather");
                }}
            >
                <box>
                    <icon icon={desc.as((value) => WeatherIcon(value))} size={20} /> {/* Pass the result of getWeatherIcon */}
                    <label label={wthr.as((value) => value || "Loading...")} />
                </box>
            </BarButton>
        </revealer>
    );
};
