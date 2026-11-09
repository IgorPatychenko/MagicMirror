Module.register("MMM-MadridTraffic", {
	defaults: {
		updateInterval: 5 * 60 * 1000,
		maximumEntries: 5
	},

	start () {
		this.incidents = null;
		this.errorMessage = null;
		this.sendSocketNotification("MADRID_TRAFFIC_INIT", {
			instanceId: this.identifier,
			updateInterval: this.config.updateInterval,
			maximumEntries: this.config.maximumEntries
		});
	},

	stop () {
		this.sendSocketNotification("MADRID_TRAFFIC_STOP", this.identifier);
	},

	getStyles () {
		return ["MMM-MadridTraffic.css"];
	},

	socketNotificationReceived (notification, payload) {
		if (notification !== "MADRID_TRAFFIC_DATA" || payload.instanceId !== this.identifier) return;
		this.incidents = payload.data;
		this.errorMessage = payload.error || null;
		this.updateDom(300);
	},

	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = "madrid-traffic";

		if (!this.incidents) {
			wrapper.textContent = this.errorMessage || "Consultando avisos…";
			return wrapper;
		}
		if (this.incidents.length === 0) {
			wrapper.textContent = "No hay incidencias activas.";
			return wrapper;
		}

		for (const incident of this.incidents) {
			const item = document.createElement("div");
			item.className = "madrid-traffic-item";
			const type = document.createElement("div");
			type.className = "madrid-traffic-type bright";
			type.textContent = incident.type;
			const description = document.createElement("div");
			description.className = "madrid-traffic-description";
			description.textContent = incident.description;
			const time = document.createElement("div");
			time.className = "madrid-traffic-time dimmed";
			time.textContent = incident.period;
			item.append(type, description, time);
			wrapper.appendChild(item);
		}

		const source = document.createElement("div");
		source.className = "madrid-traffic-source dimmed";
		source.textContent = "Fuente: Ayuntamiento de Madrid · Informo";
		wrapper.appendChild(source);
		return wrapper;
	}
});
