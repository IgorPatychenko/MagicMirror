# MMM-MadridAirQuality

Displays the European Air Quality Index (AQI) and pollutant estimates for Madrid.

## Configuration

```js
const config = {
  module: "MMM-MadridAirQuality",
  position: "bottom_left",
  header: "Calidad del aire · Madrid",
  config: {
    latitude: 40.4168,
    longitude: -3.7038,
    updateInterval: 20 * 60 * 1000
  }
};
```

`updateInterval` is in milliseconds and is clamped to at least one minute.

## Data source

The module reads current conditions from Open-Meteo's Air Quality API using the CAMS European model at Madrid's coordinates. It requires no API key for non-commercial use. Values are model estimates at roughly 11 km resolution, not readings from a nearby monitoring station. The API's European AQI is shown with its documented bands.

Source and method: [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api). Open-Meteo requests attribution to CAMS and Open-Meteo.

The mirror displays the model data time and available pollutant concentrations. A missing reading is shown as `—`.
