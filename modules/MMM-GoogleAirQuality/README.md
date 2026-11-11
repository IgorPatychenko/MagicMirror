# MMM-GoogleAirQuality

Displays the European Air Quality Index (AQI) and pollutant estimates for Madrid.

## Configuration

```js
const config = {
  module: "MMM-GoogleAirQuality",
  position: "bottom_left",
  header: "Calidad del aire · Madrid",
  config: {
    latitude: 40.4168,
    longitude: -3.7038,
    updateInterval: 20 * 60 * 1000
  }
};
```

`updateInterval` is in milliseconds and is clamped to at least one minute. The default 20-minute interval makes about 2,160 requests in a 30-day month.

Enable the Maps JavaScript API and Air Quality API in the same Google Cloud project, and allow both APIs in the key's API restrictions. Store the shared key in `config/config.env`:

```dotenv
GOOGLE_MAPS_API_KEY=your_actual_key
```

The Air Quality module reads `GOOGLE_MAPS_API_KEY` in its Node helper, while the traffic map uses the same variable in the browser. Google bills successful Air Quality API requests separately from map loads; the current pricing page lists a 10,000-request monthly free usage cap for the Air Quality Usage SKU.

## Data source

The module reads current hourly conditions from Google's Air Quality API at the configured coordinates. For Spain, it requests Google's European AQI (EAQI), plus PM₂.₅, PM₁₀, NO₂, and O₃ concentrations. Google describes its coverage as approximately 500 × 500 meters; this is modeled data, not a reading from a nearby monitoring station.

Source and method: [Google Air Quality API current conditions](https://developers.google.com/maps/documentation/air-quality/current-conditions), [supported AQIs](https://developers.google.com/maps/documentation/air-quality/laqis), and [usage and billing](https://developers.google.com/maps/documentation/air-quality/usage-and-billing).

The mirror displays the model data time and available pollutant concentrations. A missing reading is shown as `—`.
