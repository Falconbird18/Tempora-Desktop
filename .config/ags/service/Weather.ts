import { Variable } from "astal";
import icons from "../lib/icons";
import { Utils } from "astal";
const { GLib, Gio } = imports.gi;

const settingsFile = `${GLib.get_home_dir()}/.config/ags/service/weather-location.json`;

const isNetworkError = (out: any) => {
  return (
    !out ||
    out === null ||
    out === undefined ||
    (typeof out === "string" && out.includes("curl: (6)"))
  ); // curl error 6 is "Couldn't resolve host"
};

export const loadLocation = () => {
  try {
    const file = Gio.File.new_for_path(settingsFile);
    const [ok, contents] = file.load_contents(null);
    if (ok) {
      const settings = JSON.parse(new TextDecoder().decode(contents));
      if (settings?.location && typeof settings.location === "string") {
        return settings.location;
      }
    }
  } catch (e) {
    console.error("Failed to load location:", e);
  }
  return null;
};

export let Location = loadLocation();
export const location = Variable(Location);

export const setLocation = (newLocation: string) => {
  Location = newLocation;
  location.set(newLocation); // Update the Variable instance
};

export const updateWeatherCommands = () => {
  temperature[1] = `wttr.in/${Location}?format=%c%t`;
  feelslikeTemp[1] = `wttr.in/${Location}?format=%f`;
  humid[1] = `wttr.in/${Location}?format=%h`;
  Pressure[1] = `wttr.in/${Location}?format=%P`;
  uvindex[1] = `wttr.in/${Location}?format=%u`;
  Precipitation[1] = `wttr.in/${Location}?format=%p`;
  Wind[1] = `wttr.in/${Location}?format=%w`;
  bar[1] = `wttr.in/${Location}?format=${barFormat}`;
  description[1] = `wttr.in/${Location}?format=%C`;
  forecastCommand[1] = `wttr.in/${Location}?format=j1`; // Update forecast command URL
};

const temperature = ["curl", `wttr.in/${Location}?format=%c%t`];
const feelslikeTemp = ["curl", `wttr.in/${Location}?format=%f`];
const humid = ["curl", `wttr.in/${Location}?format=%h`];
const Pressure = ["curl", `wttr.in/${Location}?format=%P`];

const uvindex = ["curl", `wttr.in/${Location}?format=%u`];
const Precipitation = ["curl", `wttr.in/${Location}?format=%p`];
const Wind = ["curl", `wttr.in/${Location}?format=%w`];
const description = ["curl", `wttr.in/${Location}?format=%C`];
const barFormat = `%c+%f+%w`;
const bar = ["curl", `wttr.in/${Location}?format=${barFormat}`];

// Command to fetch forecast data in JSON format
const forecastCommand = ["curl", `wttr.in/${Location}?format=j1`];

/**
 * Polls the weather API every 30 seconds and updates the weather variable.
 * The weather variable is an object containing the current weather data.
 */

export const barWeather = Variable<any | null>(null).poll(
  30_000,
  bar,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        console.log("No network connectivity detected");
        return "No WiFi";
      }
      console.log("Raw weather output:", out);

      const outputWithoutIcon = out
        .replace(/[^\x00-\x7F↖↗↙↘↔←→↑↓]/g, "")
        .trim();
      const trimmedOutput = outputWithoutIcon.replace(/\s+/g, " ");
      const cleanedOutput = trimmedOutput.replace(
        /\+(\d+)([°]?)([CF])/,
        "$1°$3",
      );

      const windMatch = cleanedOutput.match(/([↖↗↙↘↔←→↑↓]+)(\d+)mph/);
      if (windMatch) {
        const directionSymbol = windMatch[1];
        const windSpeedMph = parseFloat(windMatch[2]);
        const windSpeedKnots = windSpeedMph * 0.868976;
        const updatedOutput = cleanedOutput.replace(
          /([↖↗↙↘↔←→↑↓]+)(\d+)mph/,
          `${directionSymbol}${windSpeedKnots.toFixed(2)}kt`,
        );
        console.log("Updated weather output:", updatedOutput);
        return updatedOutput;
      }

      console.log("Cleaned weather output:", cleanedOutput);
      return cleanedOutput;
    } catch (e) {
      console.error("Error processing weather data:", e);
      return "No WiFi";
    }
  },
);

export const weatherDescription = Variable<any | null>(null).poll(
  30_000,
  description,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      console.log("Weather description:", out);
      return out;
    } catch (e) {
      console.error("Error processing weather description:", e);
      return "No WiFi";
    }
  },
);

export const realTemp = Variable<any | null>(null).poll(
  30_000,
  temperature,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      console.log("Temperature:", out);
      const cleanedOutput = out
        .replace(/[^\x00-\x7F°]/g, "")
        .replace(/\+/g, "");
      console.log("Cleaned temperature output:", cleanedOutput);
      return cleanedOutput;
    } catch (e) {
      console.error("Error processing temperature:", e);
      return "No WiFi";
    }
  },
);

export const feelsTemp = Variable<any | null>(null).poll(
  30_000,
  feelslikeTemp,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      console.log("Feels like temperature:", out);
      const cleanedOutput = out.replace(/\+/g, "");
      console.log("Cleaned feels like temperature output:", cleanedOutput);
      return cleanedOutput;
    } catch (e) {
      console.error("Error processing feels like temperature:", e);
      return "No WiFi";
    }
  },
);

export const humidity = Variable<any | null>(null).poll(
  30_000,
  humid,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      console.log("Humidity:", out);
      return out;
    } catch (e) {
      console.error("Error processing humidity:", e);
      return "No WiFi";
    }
  },
);

export const wind = Variable<any | null>(null).poll(
  30_000,
  Wind,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      const directionSymbol = out.match(/[^\d]+/)[0];
      const windSpeedValue = parseFloat(out.match(/\d+/)[0]);
      const knotsValue = windSpeedValue * 0.868976;
      console.log("Wind speed in knots:", knotsValue);
      return directionSymbol + knotsValue.toFixed(2) + " kt";
    } catch (e) {
      console.error("Error processing wind:", e);
      return "No WiFi";
    }
  },
);

export const pressure = Variable<any | null>(null).poll(
  30_000,
  Pressure,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      const hPaValue = parseFloat(out);
      const inHgValue = hPaValue * 0.02953;
      console.log("Pressure in inches of mercury:", inHgValue.toFixed(2));
      return inHgValue.toFixed(2) + " inHg";
    } catch (e) {
      console.error("Error processing pressure:", e);
      return "No WiFi";
    }
  },
);

export const uvIndex = Variable<any | null>(null).poll(
  30_000,
  uvindex,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      console.log("UV Index:", out);
      return out;
    } catch (e) {
      console.error("Error processing UV index:", e);
      return "No WiFi";
    }
  },
);

export const precipitation = Variable<any | null>(null).poll(
  30_000,
  Precipitation,
  (out, prev) => {
    try {
      if (isNetworkError(out)) {
        return "No WiFi";
      }
      console.log("Precipitation:", out);
      return out;
    } catch (e) {
      console.error("Error processing precipitation:", e);
      return "No WiFi";
    }
  },
);

export const WeatherIcon = (description: string | undefined) => {
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
    case "light freezing rain, mist":
      return icons.weather.freezingRain;
    default:
      return icons.weather.unknown; // Fallback for unknown descriptions
  }
};

export interface ForecastDay {
  date: string; // e.g., "Mon"
  dayOfWeek: string;
  icon: string;
  maxTempC: string;
  minTempC: string;
  maxTempF: string;
  minTempF: string;
  description: string;
}

// Structure for hourly forecast data points
export interface HourlyDataPoint {
  time: number; // Hour (0-23)
  tempC: number;
  tempF: number;
  humidity: number;
  windKmph: number;
  windMiles: number;
  precipMM: number;
  chanceOfRain: number;
  pressure: number; // hPa
  uvIndex: number;
}

// Poll for forecast data (e.g., every hour)
export const forecast = Variable<ForecastDay[] | null>(null).poll(
  3_600_000, // Poll every hour
  forecastCommand,
  (out) => {
    try {
      if (isNetworkError(out)) {
        console.error("Forecast: Network error or invalid location");
        return null;
      }
      const data = JSON.parse(out);
      // Basic validation of the expected structure
      if (!data?.weather?.[0]?.hourly || !Array.isArray(data.weather)) {
        console.error("Forecast: Invalid JSON structure", data);
        hourlyForecast.value = null; // Clear hourly data on error too
        return null;
      }

      // --- Process Daily Forecast ---
      // Get today's date to format day names correctly
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Process Daily Forecast first
      const dailyForecastData = data.weather
        .slice(0, 3)
        .map((day: any, index: number): ForecastDay => {
          // Take next 3 days
          const date = new Date(day.date);
          const dayOfWeek =
            index === 0
              ? "Today"
              : index === 1
                ? "Tomorrow"
                : date.toLocaleDateString("en-US", { weekday: "short" });
          // Use noon weather description as representative for the day
          const representativeHour =
            day.hourly?.find((h: any) => h.time === "1200") ||
            day.hourly[4] ||
            day.hourly[0]; // Try noon, then ~midday, then first available
          const description =
            representativeHour?.weatherDesc?.[0]?.value || "N/A"; // Use N/A if unknown
          return {
            date: day.date,
            dayOfWeek: dayOfWeek,
            icon: WeatherIcon(description),
            maxTempC: day.maxtempC,
            minTempC: day.mintempC,
            maxTempF: day.maxtempF,
            minTempF: day.mintempF,
            description: description,
          };
        });

      // --- THEN Process Hourly Forecast (next 12 hours) ---
      const nowHour = new Date().getHours();
      const hourlyPoints: HourlyDataPoint[] = [];
      let hoursCollected = 0;

      // Combine today's and tomorrow's hourly data if needed
      const combinedHourly = [
        ...(data.weather[0]?.hourly || []),
        ...(data.weather[1]?.hourly || []), // Add tomorrow's data
      ];

      for (const hourData of combinedHourly) {
        const hourTime = parseInt(hourData.time) / 100; // API time is "0", "100", "200" etc.

        // Start from the current hour or the next available forecast hour
        if (hourlyPoints.length === 0 && hourTime < nowHour) {
          continue; // Skip past hours for the first day
        }

        if (hoursCollected < 12) {
          // Collect next 12 hours
          hourlyPoints.push({
            time: hourTime,
            tempC: parseInt(hourData.tempC),
            tempF: parseInt(hourData.tempF),
            humidity: parseInt(hourData.humidity),
            windKmph: parseInt(hourData.windspeedKmph),
            windMiles: parseInt(hourData.windspeedMiles),
            precipMM: parseFloat(hourData.precipMM),
            chanceOfRain: parseInt(hourData.chanceofrain),
            pressure: parseInt(hourData.pressure),
            uvIndex: parseInt(hourData.uvIndex),
          });
          hoursCollected++;
        } else {
          break; // Stop once we have 12 hours
        }
      }
      hourlyForecast.value = hourlyPoints; // Update the hourly forecast variable

      return dailyForecastData; // NOW return the daily forecast data
    } catch (e) {
      console.error("Error processing forecast data:", e);
      console.error("Raw forecast output:", out); // Log raw output on error
      hourlyForecast.value = null; // Clear hourly data on error
      return null; // Return null or previous value on error
    }
  },
);

// Variable to store the processed hourly forecast data
export const hourlyForecast = Variable<HourlyDataPoint[] | null>(null);
