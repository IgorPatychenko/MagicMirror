const NodeHelper = require("node_helper");

const endpoint = "https://places.googleapis.com/v1/places:searchNearby";
const DEFAULT_FUEL_TYPES = ["DIESEL", "REGULAR_UNLEADED", "SP95", "SP98"];

const formatPrice = (price) => {
	if (!price) return null;
	const amount = Number(price.units || 0) + Number(price.nanos || 0) / 1e9;
	return {
		amount,
		currencyCode: price.currencyCode || "EUR"
	};
};

module.exports = NodeHelper.create({
	start () {
		this.instances = new Map();
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "GOOGLE_FUEL_INIT") this.startInstance(payload);
		if (notification === "GOOGLE_FUEL_STOP") this.stopInstance(payload);
	},

	startInstance (config) {
		const { instanceId } = config;
		if (this.instances.has(instanceId)) return;
		if (!process.env.GOOGLE_MAPS_API_KEY) {
			this.sendSocketNotification("GOOGLE_FUEL_DATA", {
				instanceId,
				data: null,
				error: "GOOGLE_MAPS_API_KEY is missing from config/config.env"
			});
			return;
		}

		const instance = { config, apiKey: process.env.GOOGLE_MAPS_API_KEY, timer: null, inFlight: false, lastData: null };
		this.instances.set(instanceId, instance);
		this.fetchFuel(instanceId);
		instance.timer = setInterval(() => this.fetchFuel(instanceId), Math.max(config.updateInterval || 60 * 60 * 1000, 5 * 60 * 1000));
	},

	stopInstance (instanceId) {
		const instance = this.instances.get(instanceId);
		if (!instance) return;
		clearInterval(instance.timer);
		this.instances.delete(instanceId);
	},

	async fetchFuel (instanceId) {
		const instance = this.instances.get(instanceId);
		if (!instance || instance.inFlight) return;
		instance.inFlight = true;

		try {
			const response = await fetch(endpoint, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"X-Goog-Api-Key": instance.apiKey,
					"X-Goog-FieldMask": "places.id,places.displayName,places.location,places.formattedAddress,places.fuelOptions"
				},
				body: JSON.stringify({
					includedTypes: ["gas_station"],
					maxResultCount: Math.min(Math.max(instance.config.maxStations || 5, 1), 20),
					rankPreference: "DISTANCE",
					locationRestriction: {
						circle: {
							center: {
								latitude: instance.config.latitude ?? 40.4168,
								longitude: instance.config.longitude ?? -3.7038
							},
							radius: Math.min(Math.max(instance.config.radiusMeters || 5000, 100), 50000)
						}
					}
				}),
				signal: AbortSignal.timeout(15000)
			});
			if (!response.ok) {
				const errorBody = await response.json().catch(() => null);
				throw new Error(errorBody?.error?.message || `HTTP ${response.status}`);
			}
			const result = await response.json();
			const fuelTypes = instance.config.fuelTypes || DEFAULT_FUEL_TYPES;
			const stations = (result.places || [])
				.map((place) => ({
					id: place.id,
					name: place.displayName?.text || "Gasolinera",
					address: place.shortFormattedAddress || place.formattedAddress || "",
					prices: (place.fuelOptions?.fuelPrices || [])
						.filter((item) => fuelTypes.includes(item.type))
						.map((item) => ({
							type: item.type,
							price: formatPrice(item.price),
							updateTime: item.updateTime || null
						}))
				}))
				.filter((station) => station.prices.some((item) => item.price));
			const data = { stations, checkedAt: new Date().toISOString() };
			instance.lastData = data;
			this.sendSocketNotification("GOOGLE_FUEL_DATA", { instanceId, data });
		} catch (error) {
			this.sendSocketNotification("GOOGLE_FUEL_DATA", {
				instanceId,
				data: instance.lastData,
				error: instance.lastData ? null : `Could not get fuel prices: ${error.message}`
			});
		} finally {
			instance.inFlight = false;
		}
	}
});
