# MMM-MadridTraffic

Displays current Madrid street and traffic incidents, including roadworks, accidents, alerts, events, forecasts, and pollution-protocol incidents.

## Configuration

```js
const config = {
  module: "MMM-MadridTraffic",
  position: "bottom_right",
  header: "Avisos de tráfico · Madrid",
  config: {
    maximumEntries: 5,
    updateInterval: 5 * 60 * 1000
  }
};
```

`maximumEntries` controls how many items are shown. `updateInterval` is in milliseconds and is clamped to at least one minute.

## Data source

The module reads the Ayuntamiento de Madrid's Informo XML feed. The City Council describes it as near-real-time data refreshed about every five minutes. It requires no API key. This feed covers mobility and street incidents; it is not a feed of every municipal announcement.

Source: [Informo street traffic incidents](https://informo.madrid.es/informo/tmadrid/incid_aytomadrid.xml) · [Dataset information](https://datos.madrid.es/dataset/202062-0-trafico-incidencias-viapublica/information)
