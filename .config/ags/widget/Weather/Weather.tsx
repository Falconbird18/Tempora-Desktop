import { bind, exec, Variable } from "astal";
import { App, Gtk, Astal, Widget } from "astal/gtk3"; // Import Cairo
import Cairo from "cairo";
const { GLib, Gio } = imports.gi; // Import Pango for text layout
import { spacing } from "../../lib/variables";
import PopupWindow from "../../common/PopupWindow";
import {
  feelsTemp,
  humidity,
  location,
  precipitation,
  pressure,
  realTemp,
  updateWeatherCommands,
  uvIndex,
  wind,
  loadLocation,
  setLocation,
  weatherDescription,
  WeatherIcon,
  forecast, // Import the new forecast variable
  ForecastDay, // Import @agsthe forecast type
  hourlyForecast, // Import hourly forecast data
  HourlyDataPoint, // Import hourly data type
} from "../../service/Weather";
import icons from "../../lib/icons";

const settingsFile = `${GLib.get_home_dir()}/.config/ags/service/weather-location.json`;

const saveLocation = (location: string) => {
  try {
    // Remove spaces between city and state (e.g., "Richland, Wa" -> "Richland,Wa")
    const formattedLocation = location.replace(/, /g, ",");

    const file = Gio.File.new_for_path(settingsFile);
    const contents = JSON.stringify({ location: formattedLocation });
    file.replace_contents(
      contents,
      null,
      false,
      Gio.FileCreateFlags.NONE,
      null,
    );

    // Call the functions to update the weather data
    setLocation(loadLocation());
    updateWeatherCommands();
  } catch (e) {
    console.error("Failed to save location:", e);
  }
};

// Add a space between city and state when displaying the location (e.g., "Richland,Wa" -> "Richland, Wa")
const displayLocation = bind(location).as((value) => {
  if (!value) return "N/A";
  return value.replace(/,/g, ", "); // Add a space after the comma
});

const temperature = bind(realTemp).as((value) => {
  if (!value || value.includes("Unknown location;")) {
    return "loading...";
  }
  return value.trim();
});

const feelsTemperature = bind(feelsTemp).as((value) => {
  if (!value || value.includes("Unknown location;")) {
    return "N/A";
  }
  return value.trim();
});
const uv = bind(uvIndex).as((value) => {
  if (!value || value.includes("Unknown location;")) {
    return "N/A";
  }
  return value.trim();
});
const Wind = bind(wind).as((value) => {
  if (!value || value.includes("Unknown location;")) {
    return "N/A";
  }
  return value.trim();
});
const Precipitation = bind(precipitation).as((value) => {
  if (!value || value.includes("Unknown location;")) {
    return "N/A";
  }
  return value.trim();
});
const Pressure = bind(pressure).as((value) => {
  if (!value || value.includes("Unknown location;")) {
    return "N/A";
  }
  return value.trim();
});
const Humidity = bind(humidity).as((value) => {
  if (!value || value.includes("Unknown location;")) {
    return "N/A";
  }
  return value.trim();
});

const icon = icons.ui.edit;

// Create a Variable to control the visibility of the Entry widget
const isEntryVisible = new Variable(false);

const Entry = new Widget.Entry({
  placeholder_text: bind(location).as((value) =>
    value ? value.replace(/,/g, ", ") : "N/A",
  ), // Bind placeholder to the current location
  canFocus: true,
  className: "location_input",
  visible: bind(isEntryVisible).as((value) => value), // Bind visibility to the Variable
  onActivate: (self) => {
    const newLocation = self.get_text();
    saveLocation(newLocation);
    isEntryVisible.set(false); // Hide the Entry after saving the location
  },
  onFocusInEvent: (self) => {
    // Clear the placeholder text when the Entry gains focus
    if (self.get_text() === self.placeholder_text) {
      self.set_text("");
    }
  },
});

const desc = bind(weatherDescription); // Bind the description variable

// Function to map weather description to an icon
const getWeatherIcon = (description: string | undefined) => {
  if (!description) {
    return icons.weather.unknown; // Fallback for undefined/null
  }

  switch (description.toLowerCase()) {
    case "clear":
    case "sunny":
      return icons.weather.clear;
    case "cloudy":
      return icons.weather.cloudy;
    case "rain":
    case "rainy":
      return icons.weather.rain;
    case "snow":
    case "snowy":
      return icons.weather.snow;
    case "thunderstorm":
      return icons.weather.thunderstorm;
    case "mist":
      return icons.weather.fog;
    case "haze":
      return icons.weather.fog;
    case "partly cloudy":
      return icons.weather.partlyCloudy;
    default:
      return icons.weather.unknown; // Fallback for unknown descriptions
  }
};

// Helper function to determine temperature unit (simple check based on realTemp format)
const getTemperatureUnit = () => {
  const temp = realTemp.value || "";
  return temp.includes("F") ? "F" : "C";
};

// Widget to display a single day's forecast
const ForecastDayWidget = (day: ForecastDay) => {
  const unit = getTemperatureUnit();
  const maxTemp = unit === "F" ? day.maxTempF : day.maxTempC;
  const minTemp = unit === "F" ? day.minTempF : day.minTempC;

  return (
    <box
      vertical
      className="forecast-day"
      spacing={4}
      halign={Gtk.Align.CENTER}
    >
      <label className="forecast-day-name" label={day.dayOfWeek} />
      <icon icon={day.icon} className="forecast-icon" />
      <label className="forecast-temp" label={`${maxTemp}°/${minTemp}°`} />
      {/* Optional: Add description */}
      {/* <label className="forecast-desc" label={day.description} /> */}
    </box>
  );
};

// --- Forecast Graph ---

type GraphMetricType =
  | "temp"
  | "humidity"
  | "wind"
  | "precip"
  | "pressure"
  | "uv";
const graphMetric = Variable<GraphMetricType>("temp");

const getMetricData = (
  point: HourlyDataPoint,
  metric: GraphMetricType,
  unit: "C" | "F",
): number => {
  switch (metric) {
    case "temp":
      return unit === "F" ? point.tempF : point.tempC;
    case "humidity":
      return point.humidity;
    case "wind":
      return point.windMiles; // Using Miles for now
    case "precip":
      return point.chanceOfRain; // Using chance of rain %
    case "pressure":
      return point.pressure; // Using hPa
    case "uv":
      return point.uvIndex;
    default:
      return 0;
  }
};

const getMetricLabel = (metric: GraphMetricType, unit: "C" | "F"): string => {
  switch (metric) {
    case "temp":
      return `Temperature (°${unit})`;
    case "humidity":
      return "Humidity (%)";
    case "wind":
      return "Wind (mph)";
    case "precip":
      return "Chance of Rain (%)";
    case "pressure":
      return "Pressure (hPa)";
    case "uv":
      return "UV Index";
    default:
      return "";
  }
};

// Define ForecastGraph using Widget.DrawingArea directly for JSX compatibility
const ForecastGraph = new Widget.DrawingArea({
  className: "forecast-graph",
  vexpand: true,
  hexpand: true,
  // Set a minimum height for the graph area
  setup: (self) => self.set_size_request(-1, 100),
  connections: [
    // Redraw when data, metric, or theme changes
    [hourlyForecast, (self) => self.queue_draw()],
    [graphMetric, (self) => self.queue_draw()],
    [Astal.Theme, (self) => self.queue_draw()],
    // Draw signal
    // ['draw', (self, cr: Cairo.Context) => {
    //     // Clear the background first
    //     cr.setSourceRGBA(0, 0, 0, 0); // Transparent
    //     cr.paint();

    //     const data = hourlyForecast.value;
    //     const metric = graphMetric.value;
    //     const unit = getTemperatureUnit();
    //     const allocation = self.get_allocation();
    //     const width = allocation.width;
    //     const height = allocation.height;
    //     const padding = 10; // Padding around the graph
    //     const graphHeight = height - padding * 2;
    //     const graphWidth = width - padding * 2;

    //     if (!data || data.length < 2) {
    //         console.log("Graph: No data or insufficient data:", data); // Insert this line
    //         // Draw "Loading..." or "Not enough data"
    //         cr.setSourceRGBA(0.8, 0.8, 0.8, 1); // Light gray, fully opaque
    //         cr.selectFontFace("sans-serif", Cairo.FontSlant.NORMAL, Cairo.FontWeight.NORMAL);
    //         cr.setFontSize(12);
    //         const text = !data ? "Loading graph..." : "Not enough data";
    //         const te = cr.textExtents(text);
    //         cr.moveTo(width / 2 - te.width / 2, height / 2);
    //         cr.showText(text);
    //         return;
    //     }

    //     const values = data.map(p => getMetricData(p, metric, unit));
    //     let minValue = Math.min(...values);
    //     let maxValue = Math.max(...values);

    //     // Avoid division by zero if all values are the same
    //     if (minValue === maxValue) {
    //         minValue -= 1;
    //         maxValue += 1;
    //     }
    //     const valueRange = maxValue - minValue;

    //     // --- Draw the graph line ---
    //     const theme = Astal.Theme.get_instance();
    //     const color = theme.get_widget_style_context(self).get_color(Gtk.StateFlags.NORMAL);
    //     cr.setSourceRGBA(1, 1, 1, 1); // White, fully opaque
    //     cr.setLineWidth(2);
    //     cr.setLineCap(Cairo.LineCap.ROUND);
    //     cr.setLineJoin(Cairo.LineJoin.ROUND);

    //     for (let i = 0; i < data.length; i++) {
    //         const x = padding + (i / (data.length - 1)) * graphWidth;
    //         const y = padding + graphHeight - ((values[i] - minValue) / valueRange) * graphHeight;

    //         if (i === 0) {
    //             cr.moveTo(x, y);
    //         } else {
    //             cr.lineTo(x, y);
    //         }
    //     }
    //     cr.stroke();

    //     // --- Draw Labels (Min/Max Value, Time) ---
    //     cr.setSourceRGBA(1, 1, 1, 0.9); // Almost white, very visible
    //     cr.selectFontFace("sans-serif", Cairo.FontSlant.NORMAL, Cairo.FontWeight.NORMAL);
    //     cr.setFontSize(10);

    //     // Max Value Label (top left)
    //     const maxLabel = `${maxValue.toFixed(0)}`;
    //     cr.moveTo(padding, padding - 2); // Position slightly above graph area
    //     cr.showText(maxLabel);

    //     // Min Value Label (bottom left)
    //     const minLabel = `${minValue.toFixed(0)}`;
    //     const minTe = cr.textExtents(minLabel);
    //     cr.moveTo(padding, height - padding + minTe.height + 2); // Position slightly below graph area
    //     cr.showText(minLabel);

    //     // Time Labels (Start and End Hour)
    //     const startLabel = `${data[0].time}:00`;
    //     const startTe = cr.textExtents(startLabel);
    //     cr.moveTo(padding, height - padding + startTe.height + 2); // Align with min value label
    //     // cr.showText(startLabel); // Maybe too cluttered?

    //     const endLabel = `${data[data.length - 1].time}:00`;
    //     const endTe = cr.textExtents(endLabel);
    //     cr.moveTo(width - padding - endTe.width, height - padding + endTe.height + 2);
    //     cr.showText(endLabel);

    //     // Current Metric Label (top right)
    //     const metricLabel = getMetricLabel(metric, unit);
    //     const metricTe = cr.textExtents(metricLabel);
    //     cr.moveTo(width - padding - metricTe.width, padding - 2);
    //     cr.showText(metricLabel);
    // }],
    [
      "draw",
      (self, cr: Cairo.Context) => {
        const allocation = self.get_allocation();
        const width = allocation.width;
        const height = allocation.height;
        console.log(
          `ForecastGraph draw signal: size <span class="math-inline">\{width\}x</span>{height}`,
        ); // Log size
        // Draw a bright, semi-transparent rectangle covering the whole area
        cr.setSourceRGBA(1, 0, 0, 0.5); // Red, 50% opacity
        cr.rectangle(0, 0, width, height);
        cr.fill();
        // Draw simple text
        cr.setSourceRGB(0, 0, 0); // Black text
        cr.moveTo(10, 20);
        cr.selectFontFace(
          "sans-serif",
          Cairo.FontSlant.NORMAL,
          Cairo.FontWeight.NORMAL,
        );
        cr.setFontSize(12);
        cr.showText(
          `Graph Area: <span class="math-inline">\{width\}x</span>{height}`,
        );
      },
    ],
  ],
});

export default () => {
  return (
    <PopupWindow
      scrimType="transparent"
      layer={Astal.Layer.OVERLAY}
      visible={false}
      margin={5}
      vexpand={true}
      keymode={Astal.Keymode.EXCLUSIVE}
      name="weather"
      namespace="weather"
      className="weather"
      exclusivity={Astal.Exclusivity.NORMAL}
      anchor={Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT}
      application={App}
      onKeyPressEvent={(self, event) => {
        const [keyEvent, keyCode] = event.get_keycode();
        if (keyEvent && keyCode == 9) {
          App.toggle_window(self.name);
        }
      }}
    >
      <box vertical className="weather-window" spacing={spacing}>
        <box
          horizontal
          className="location-header-container"
          halign={Gtk.Align.FILL}
        >
          <label
            label={displayLocation}
            className="location"
            halign={Gtk.Align.START}
            hexpand={true}
          />
          <button
            valign={Gtk.Align.CENTER}
            onClicked={() => isEntryVisible.set(!isEntryVisible.value)}
          >
            <icon icon={icon} className="icon" />
          </button>
        </box>
        {Entry}
        <box horizontal halign={Gtk.Align.START} spacing={spacing}>
          <icon
            icon={desc.as((value) => WeatherIcon(value))}
            className="temperature"
            hexpand={false}
          />
          <label
            label={temperature}
            className="temperature"
            halign={Gtk.Align.START}
          />
        </box>
        <box horizontal spacing={spacing}>
          <box vertical>
            <label className="weather-info-title" label="Humidity" />
            <label className="weather-info" label={Humidity} />
          </box>
          <box vertical>
            <label className="weather-info-title" label="Wind" />
            <label className="weather-info" label={Wind} />
          </box>
          <box vertical>
            <label className="weather-info-title" label="Precipitation" />
            <label className="weather-info" label={Precipitation} />
          </box>
          <box vertical>
            <label className="weather-info-title" label="Pressure" />
            <label className="weather-info" label={Pressure} />
          </box>
          <box vertical>
            <label className="weather-info-title" label="UV Index" />
            <label className="weather-info" label={uv} />
          </box>
          <box vertical>
            <label className="weather-info-title" label="Feels like" />
            <label className="weather-info" label={feelsTemperature} />
          </box>
        </box>
        {/* Forecast Section */}
        <box
          className="forecast-container"
          homogeneous={true} // Make columns equal width
          spacing={spacing * 1.5} // Add some space between days
          margin_top={spacing} // Add margin above the forecast
        >
          {bind(forecast).as(
            (fc) =>
              fc
                ? fc.map(ForecastDayWidget)
                : [<label label="Loading forecast..." />], // Show loading or error message
          )}
        </box>
        {/* Graph Section */}
        <box vertical spacing={spacing / 2} margin_top={spacing}>
          {/* Metric Selection Buttons */}
          <box
            homogeneous={true}
            spacing={spacing / 2}
            className="graph-metric-buttons"
          >
            {(
              [
                "temp",
                "humidity",
                "wind",
                "precip",
                "pressure",
                "uv",
              ] as GraphMetricType[]
            ).map((metric) => (
              <button
                // Use the standalone bind function here
                className={bind(graphMetric).as((m) =>
                  m === metric ? "active" : "",
                )}
                onClicked={() => (graphMetric.value = metric)}
              >
                {/* Simple text label for buttons */}
                <label
                  label={
                    metric === "temp"
                      ? "Temp"
                      : metric === "humidity"
                        ? "Humid"
                        : metric === "wind"
                          ? "Wind"
                          : metric === "precip"
                            ? "Rain"
                            : metric === "pressure"
                              ? "Pressure"
                              : "UV"
                  }
                />
              </button>
            ))}
          </box>
          {/* The Graph */}
          {ForecastGraph}
        </box>
      </box>
    </PopupWindow>
  );
};
