const NodeHelper = require("node_helper");

const endpoint = "https://airquality.googleapis.com/v1/currentConditions:lookup";
const pollutants = [
	{ code: "pm25", label: "PM₂.₅" },
	{ code: "pm10", label: "PM₁₀" },
	{ code: "no2", label: "NO₂" },
	{ code: "o3", label: "O₃" }
];

const formatConcentration = (pollutant) => {
	if (!pollutant?.concentration || !Number.isFinite(pollutant.concentration.value)) return { value: null, unit: "" };
	const unit = pollutant.concentration.units === "MICROGRAMS_PER_CUBIC_METER" ? "µg/m³" : "ppb";
	return { value: pollutant.concentration.value, unit };
};

const formatDataTime = (dateTime) => {
	const date = new Date(dateTime);
	if (Number.isNaN(date.getTime())) return "—";
	return new Intl.DateTimeFormat("es-ES", {
		timeZone: "Europe/Madrid",
		hour: "2-digit",
		minute: "2-digit",
		hourCycle: "h23"
	}).format(date);
};

module.exports = NodeHelper.create({
	start () {
		this.instances = new Map();
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "AIR_QUALITY_INIT") this.startInstance(payload);
		if (notification === "AIR_QUALITY_STOP") this.stopInstance(payload);
	},

	startInstance (config) {
		const instanceId = config.instanceId;
		if (this.instances.has(instanceId)) return;
		if (!process.env.GOOGLE_MAPS_API_KEY) {
			this.sendSocketNotification("AIR_QUALITY_DATA", {
				instanceId,
				data: null,
				error: "Falta GOOGLE_MAPS_API_KEY en config/config.env"
			});
			return;
		}

		const instance = { config, apiKey: process.env.GOOGLE_MAPS_API_KEY, timer: null, inFlight: false, lastData: null };
		this.instances.set(instanceId, instance);
		this.fetchAirQuality(instanceId);
		instance.timer = setInterval(() => this.fetchAirQuality(instanceId), Math.max(config.updateInterval || 1200000, 60000));
	},

	stopInstance (instanceId) {
		const instance = this.instances.get(instanceId);
		if (!instance) return;
		clearInterval(instance.timer);
		this.instances.delete(instanceId);
	},

	async fetchAirQuality (instanceId) {
		const instance = this.instances.get(instanceId);
		if (!instance || instance.inFlight) return;
		instance.inFlight = true;

		try {
			const url = new URL(endpoint);
			url.searchParams.set("key", instance.apiKey);
			const response = await fetch(url, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					location: {
						latitude: instance.config.latitude ?? 40.4168,
						longitude: instance.config.longitude ?? -3.7038
					},
					universalAqi: false,
					customLocalAqis: [{ regionCode: "ES", aqi: "eaqi" }],
					extraComputations: ["LOCAL_AQI", "POLLUTANT_CONCENTRATION"],
					languageCode: "es"
				}),
				signal: AbortSignal.timeout(15000)
			});
			if (!response.ok) {
				const errorBody = await response.json().catch(() => null);
				throw new Error(errorBody?.error?.message || `HTTP ${response.status}`);
			}
			const result = await response.json();
			const index = result.indexes?.find((item) => item.code === "eaqi");
			if (!index) throw new Error("Google no devolvió el índice europeo para esta ubicación");
			const pollutantsByCode = new Map((result.pollutants || []).map((item) => [item.code, item]));
			const aqiValue = index.aqiDisplay || (Number.isFinite(index.aqi) ? String(index.aqi) : null);
			const measurements = [
				{ label: "ICA europeo", value: aqiValue && index.category ? `${aqiValue} · ${index.category}` : index.category || aqiValue || "Sin dato", unit: "" },
				...pollutants.map((pollutant) => ({
					label: pollutant.label,
					...formatConcentration(pollutantsByCode.get(pollutant.code))
				}))
			];
			const data = {
				station: "Madrid · Google",
				measurements,
				checkedAt: formatDataTime(result.dateTime)
			};
			instance.lastData = data;
			this.sendSocketNotification("AIR_QUALITY_DATA", { instanceId, data });
		} catch (error) {
			this.sendSocketNotification("AIR_QUALITY_DATA", {
				instanceId,
				data: instance.lastData,
				error: instance.lastData ? null : `No se pudieron obtener los datos: ${error.message}`
			});
		} finally {
			instance.inFlight = false;
		}
	}
});
