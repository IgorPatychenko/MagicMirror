const NodeHelper = require("node_helper");

const endpoint = "https://air-quality-api.open-meteo.com/v1/air-quality";
const pollutants = [
	{ field: "pm2_5", label: "PM₂.₅", unit: "µg/m³" },
	{ field: "pm10", label: "PM₁₀", unit: "µg/m³" },
	{ field: "nitrogen_dioxide", label: "NO₂", unit: "µg/m³" },
	{ field: "ozone", label: "O₃", unit: "µg/m³" }
];

const numberOrNull = (value) => {
	if (value === null || value === undefined || value === "") return null;
	const number = Number(String(value).replace(",", "."));
	return Number.isFinite(number) && number >= 0 ? number : null;
};

const aqiDescription = (value) => {
	if (value === null) return "Sin dato";
	if (value < 20) return "Bueno";
	if (value < 40) return "Aceptable";
	if (value < 60) return "Moderado";
	if (value < 80) return "Malo";
	if (value <= 100) return "Muy malo";
	return "Extremadamente malo";
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

		const instance = { config, timer: null, inFlight: false, lastData: null };
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
			url.search = new URLSearchParams({
				latitude: String(instance.config.latitude ?? 40.4168),
				longitude: String(instance.config.longitude ?? -3.7038),
				current: "european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
				timezone: "Europe/Madrid",
				domains: "cams_europe"
			}).toString();
			const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const result = await response.json();
			if (result.error) throw new Error(result.reason || "Error de la fuente de calidad del aire");
			if (!result.current) throw new Error("La fuente no devolvió datos actuales");
			const current = result.current;
			const aqi = numberOrNull(current.european_aqi);
			const measurements = [
				{ label: "ICA europeo", value: aqi === null ? "Sin dato" : `${aqi} · ${aqiDescription(aqi)}`, unit: "" },
				...pollutants.map((pollutant) => ({
					label: pollutant.label,
					unit: pollutant.unit,
					value: numberOrNull(current[pollutant.field])
				}))
			];
			const data = {
				station: "Madrid · modelo CAMS",
				measurements,
				checkedAt: current.time?.slice(11, 16) || "—"
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
