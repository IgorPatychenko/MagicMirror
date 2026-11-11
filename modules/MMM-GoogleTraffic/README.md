# MMM-GoogleTraffic

Displays a Google Map centered on Madrid with the current traffic layer enabled.

## Setup

Enable the Maps JavaScript API in a Google Cloud project, create an API key, and configure billing for the project. Map loads use Google's Dynamic Maps service and may incur charges. Restrict the key to the Maps JavaScript API and to the origins used by your MagicMirror installation where your deployment allows it.

Add the module to your MagicMirror configuration:

```js
const config = {
  module: "MMM-GoogleTraffic",
  position: "bottom_left",
  config: {
    apiKey: "${GOOGLE_MAPS_API_KEY}",
    latitude: 40.4168,
    longitude: -3.7038,
    zoom: 12,
    darkMode: true,
    width: "420px",
    height: "320px"
  }
};
```

`apiKey` is required. `latitude`, `longitude`, and `zoom` set the map's initial view. `darkMode` defaults to `true`; set it to `false` for Google's standard light map. `width` and `height` set its display size. Google refreshes traffic information automatically; updates are frequent but not instant.

Store the API key in `config/config.env`:

```dotenv
GOOGLE_MAPS_API_KEY=your_actual_key
```

MagicMirror loads `config/config.env` alongside `config/config.js` at startup. The env file is ignored by Git. The Maps JavaScript API key is still sent to the browser to render the map, so restrict it to the Maps JavaScript API and the application origins you can use.

## Data source

The map and traffic overlay are provided by the [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/trafficlayer). Availability and traffic coverage vary by region.
