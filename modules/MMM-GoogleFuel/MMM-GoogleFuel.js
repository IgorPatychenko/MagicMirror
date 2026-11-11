const FUEL_LABELS = {
	DIESEL: "Diésel",
	DIESEL_PLUS: "Diésel prémium",
	REGULAR_UNLEADED: "Gasolina",
	SP95: "Gasolina 95",
	SP98: "Gasolina 98",
	LPG: "GLP"
};

Module.register("MMM-GoogleFuel", {
	defaults: {
		latitude: 40.4168,
		longitude: -3.7038,
		radiusMeters: 5000,
		maxStations: 5,
		fuelTypes: ["DIESEL", "REGULAR_UNLEADED", "SP95", "SP98"],
		updateInterval: 60 * 60 * 1000
	},

	start () {
		this.fuelData = null;
		this.errorMessage = null;
		this.sendSocketNotification("GOOGLE_FUEL_INIT", {
			instanceId: this.identifier,
			...this.config
		});
	},

	stop () {
		this.sendSocketNotification("GOOGLE_FUEL_STOP", this.identifier);
	},

	getStyles () {
		return ["MMM-GoogleFuel.css"];
	},

	socketNotificationReceived (notification, payload) {
		if (notification !== "GOOGLE_FUEL_DATA" || payload.instanceId !== this.identifier) return;
		this.fuelData = payload.data;
		this.errorMessage = payload.error || null;
		this.updateDom(300);
	},

	getDom () {
		const wrapper = document.createElement("div");
		wrapper.className = "google-fuel";
		if (!this.fuelData) {
			wrapper.textContent = this.errorMessage || "Consultando precios de combustible…";
			return wrapper;
		}

		if (!this.fuelData.stations.length) {
			wrapper.textContent = "No se encontraron gasolineras cercanas con precios disponibles.";
			return wrapper;
		}

		for (const station of this.fuelData.stations) {
			const section = document.createElement("section");
			section.className = "google-fuel-station";
			const name = document.createElement("div");
			name.className = "google-fuel-name";
			name.textContent = station.name;
			section.appendChild(name);
			if (station.address) {
				const address = document.createElement("div");
				address.className = "google-fuel-address dimmed";
				address.textContent = station.address;
				section.appendChild(address);
			}
			if (!station.prices.length) {
				const noPrice = document.createElement("div");
				noPrice.className = "google-fuel-no-price dimmed";
				noPrice.textContent = "Sin precios disponibles";
				section.appendChild(noPrice);
			} else {
				for (const item of station.prices) {
					const row = document.createElement("div");
					row.className = "google-fuel-price";
					const label = document.createElement("span");
					label.textContent = FUEL_LABELS[item.type] || item.type;
					const value = document.createElement("span");
					value.textContent = item.price
						? new Intl.NumberFormat("es-ES", { style: "currency", currency: item.price.currencyCode, maximumFractionDigits: 3 }).format(item.price.amount)
						: "—";
					row.append(label, value);
					section.appendChild(row);
				}
			}
			wrapper.appendChild(section);
		}
		const footer = document.createElement("div");
		footer.className = "google-fuel-updated dimmed";
		footer.textContent = `Consulta: ${new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit" }).format(new Date(this.fuelData.checkedAt))} · Google Places`;
		wrapper.appendChild(footer);
		return wrapper;
	}
});
