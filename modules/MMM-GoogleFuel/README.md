# MMM-GoogleFuel

Shows nearby gas stations and their reported fuel prices using Google Places API (New).

```js
{
  module: "MMM-GoogleFuel",
  position: "bottom_left",
  header: "Precios de combustible · Madrid",
  config: {
    latitude: 40.35263049999083,
    longitude: -3.7022814781506397,
    radiusMeters: 5000,
    maxStations: 5,
    fuelTypes: ["DIESEL", "REGULAR_UNLEADED", "SP95", "SP98"],
    updateInterval: 60 * 60 * 1000
  }
}
```

The module reads the shared `GOOGLE_MAPS_API_KEY` from `config/config.env`, just like the Google Air Quality module. Enable Places API (New) and allow it in the key's API restrictions. The key is sent only from MagicMirror's Node helper, not exposed in the browser.

`radiusMeters` defaults to 5 km (maximum 50 km), `maxStations` defaults to five, and the default refresh interval is one hour, or about 720 nearby-search requests in a 30-day month. The interval is clamped to at least five minutes.

Fuel price data can be missing for some stations. Prices represent Google's last known reported price; the data provider's update time is returned by the API, while the module footer indicates when this module queried Places.

See [Nearby Search](https://developers.google.com/maps/documentation/places/web-service/nearby-search) and the Places API [fuel data reference](https://developers.google.com/maps/documentation/places/web-service/reference/rest/v1/places#FuelOptions).
