(function () {
	const mapsPromises = (window.__MMMGoogleTrafficMapsPromises ||= new Map());
	const darkMapStyle = [
		{ elementType: "geometry", stylers: [{ color: "#242f3e" }] },
		{ elementType: "labels.text.fill", stylers: [{ color: "#d4d9e0" }] },
		{ elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
		{ featureType: "administrative", elementType: "geometry", stylers: [{ color: "#465263" }] },
		{ featureType: "landscape", elementType: "geometry", stylers: [{ color: "#202b38" }] },
		{ featureType: "poi", elementType: "geometry", stylers: [{ color: "#263442" }] },
		{ featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#9ca8b7" }] },
		{ featureType: "road", elementType: "geometry", stylers: [{ color: "#384657" }] },
		{ featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#c4ccd6" }] },
		{ featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#52647a" }] },
		{ featureType: "transit", elementType: "geometry", stylers: [{ color: "#344252" }] },
		{ featureType: "water", elementType: "geometry", stylers: [{ color: "#142333" }] },
		{ featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#8495a8" }] }
	];

	const loadGoogleMaps = (apiKey) => {
		if (window.google?.maps?.Map && window.google?.maps?.TrafficLayer) return Promise.resolve(window.google.maps);
		if (mapsPromises.has(apiKey)) return mapsPromises.get(apiKey);

		const promise = new Promise((resolve, reject) => {
			const script = document.createElement("script");
			const params = new URLSearchParams({ key: apiKey, v: "weekly" });
			script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
			script.async = true;
			script.defer = true;
			script.onload = () => {
				if (window.google?.maps?.Map && window.google?.maps?.TrafficLayer) resolve(window.google.maps);
				else reject(new Error("Google Maps JavaScript API did not load correctly."));
			};
			script.onerror = () => reject(new Error("Could not load Google Maps. Check the API key and network connection."));
			document.head.appendChild(script);
		});

		mapsPromises.set(apiKey, promise);
		return promise;
	};

	Module.register("MMM-GoogleTraffic", {
		defaults: {
			apiKey: "",
			latitude: 40.4168,
			longitude: -3.7038,
			zoom: 12,
			darkMode: true,
			width: "420px",
			height: "320px"
		},

		start () {
			this.map = null;
			this.trafficLayer = null;
			this.mapContainer = null;
			this.errorMessage = null;
			if (!this.config.apiKey) return;

			loadGoogleMaps(this.config.apiKey)
				.then(() => this.updateDom())
				.catch((error) => {
					this.errorMessage = error.message;
					this.updateDom();
				});
		},

		getStyles () {
			return ["MMM-GoogleTraffic.css"];
		},

		getDom () {
			const wrapper = document.createElement("div");
			wrapper.className = "google-traffic";
			if (!this.config.apiKey) {
				wrapper.textContent = "Set config.apiKey to display Google Maps traffic.";
				return wrapper;
			}
			if (this.errorMessage) {
				wrapper.textContent = this.errorMessage;
				return wrapper;
			}

			const mapContainer = document.createElement("div");
			mapContainer.className = "google-traffic-map";
			mapContainer.style.width = this.config.width;
			mapContainer.style.height = this.config.height;
			wrapper.appendChild(mapContainer);
			setTimeout(() => this.initializeMap(mapContainer), 0);
			return wrapper;
		},

		initializeMap (container) {
			if (!container.isConnected || !window.google?.maps) return;
			if (this.mapContainer === container && this.map) return;
			this.trafficLayer?.setMap(null);
			this.mapContainer = container;
			this.map = new window.google.maps.Map(container, {
				center: { lat: this.config.latitude, lng: this.config.longitude },
				zoom: this.config.zoom,
				disableDefaultUI: true,
				clickableIcons: false,
				styles: this.config.darkMode ? darkMapStyle : undefined
			});
			this.trafficLayer = new window.google.maps.TrafficLayer({ autoRefresh: true });
			this.trafficLayer.setMap(this.map);
		}
	});
})();
