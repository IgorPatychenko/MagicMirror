Module.register("MMM-GoogleAirQuality", {
	defaults: {
		latitude: 40.4168,
		longitude: -3.7038,
		updateInterval: 20 * 60 * 1000
	},

	start () {
		this.airData = null;
		this.errorMessage = null;
		this.sendSocketNotification("AIR_QUALITY_INIT", {
			instanceId: this.identifier,
			latitude: this.config.latitude,
			longitude: this.config.longitude,
			updateInterval: this.config.updateInterval
		});
	},

	stop () {
		this.sendSocketNotification("AIR_QUALITY_STOP", this.identifier);
	},

	getStyles () {
		return ["MMM-GoogleAirQuality.css"];
	},

	socketNotificationReceived (notification, payload) {
		if (notification !== "AIR_QUALITY_DATA" || payload.instanceId !== this.identifier) return;
		this.airData = payload.data;
		this.errorMessage = payload.error || null;
		this.updateDom(300);
	},

	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = "google-air-quality";

		if (!this.airData) {
			wrapper.textContent = this.errorMessage || "Consultando estaciones…";
			return wrapper;
		}

		const station = document.createElement("div");
		station.className = "google-air-quality-station";
		station.textContent = this.airData.station;
		wrapper.appendChild(station);

		const measurements = document.createElement("div");
		measurements.className = "google-air-quality-values";
		for (const item of this.airData.measurements) {
			const row = document.createElement("div");
			row.className = "google-air-quality-row";
			const label = document.createElement("span");
			label.textContent = item.label;
			const value = document.createElement("span");
			value.textContent = item.value === null ? "—" : [item.value, item.unit].filter(Boolean).join(" ");
			row.append(label, value);
			measurements.appendChild(row);
		}
		wrapper.appendChild(measurements);

		const footer = document.createElement("div");
		footer.className = "google-air-quality-updated dimmed";
		footer.textContent = `Hora del dato: ${this.airData.checkedAt} · Google Air Quality API`;
		wrapper.appendChild(footer);
		return wrapper;
	}
});
