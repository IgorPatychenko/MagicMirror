const NodeHelper = require("node_helper");

const feedUrl = "https://informo.madrid.es/informo/tmadrid/incid_aytomadrid.xml";
const typeNames = {
	"1": "Obras",
	"2": "Accidente",
	"3": "Aviso",
	"4": "Evento",
	"5": "Previsión",
	"10": "Contaminación"
};
const typePriority = { "2": 0, "3": 1, "10": 2, "1": 3, "4": 4, "5": 5 };

const decodeXml = (value) => value
	.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
	.replace(/&lt;/g, "<")
	.replace(/&gt;/g, ">")
	.replace(/&quot;/g, '"')
	.replace(/&apos;/g, "'")
	.replace(/&amp;/g, "&")
	.replace(/&#(\d+);/g, (match, code) => String.fromCodePoint(Number(code)))
	.replace(/&#x([\da-f]+);/gi, (match, code) => String.fromCodePoint(parseInt(code, 16)))
	.trim();

const readTag = (xml, name) => {
	const match = xml.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)<\\/${name}>`, "i"));
	return match ? decodeXml(match[1]) : "";
};

const parseDate = (value) => {
	const date = new Date(value);
	return Number.isNaN(date.getTime()) ? null : date;
};

const formatPeriod = (start, end) => {
	const formatter = new Intl.DateTimeFormat("es-ES", {
		timeZone: "Europe/Madrid",
		day: "2-digit",
		month: "short"
	});
	const startText = start ? formatter.format(start) : "";
	const endText = end ? formatter.format(end) : "";
	if (endText) return `Hasta ${endText}`;
	return startText ? `Desde ${startText}` : "Activa";
};

const parseIncidents = (xml, maximumEntries) => {
	const now = Date.now();
	const horizon = now + 7 * 24 * 60 * 60 * 1000;
	return [...xml.matchAll(/<Incidencia\b[^>]*>([\s\S]*?)<\/Incidencia>/gi)]
		.map((match) => {
			const item = match[1];
			const state = readTag(item, "incid_estado");
			const typeCode = readTag(item, "tipoincid");
			const start = parseDate(readTag(item, "fh_inicio"));
			const end = parseDate(readTag(item, "fh_final"));
			return {
				state,
				typeCode,
				type: typeNames[typeCode] || readTag(item, "nom_tipo_incidencia") || "Incidencia",
				description: readTag(item, "descripcion").replace(/\s+/g, " "),
				start,
				end
			};
		})
		.filter((item) => item.description && ["1", "4"].includes(item.state))
		.filter((item) => !item.end || item.end.getTime() >= now)
		.filter((item) => !item.start || item.start.getTime() <= horizon)
		.sort((a, b) => (typePriority[a.typeCode] ?? 9) - (typePriority[b.typeCode] ?? 9) || (a.start?.getTime() ?? 0) - (b.start?.getTime() ?? 0))
		.slice(0, maximumEntries)
		.map((item) => ({
			type: item.type,
			description: item.description.length > 110 ? `${item.description.slice(0, 107).trimEnd()}…` : item.description,
			period: formatPeriod(item.start, item.end)
		}));
};

module.exports = NodeHelper.create({
	start () {
		this.instances = new Map();
	},

	socketNotificationReceived (notification, payload) {
		if (notification === "MADRID_TRAFFIC_INIT") this.startInstance(payload);
		if (notification === "MADRID_TRAFFIC_STOP") this.stopInstance(payload);
	},

	startInstance (config) {
		const instanceId = config.instanceId;
		if (this.instances.has(instanceId)) return;
		const instance = { config, timer: null, inFlight: false, lastData: null };
		this.instances.set(instanceId, instance);
		this.fetchIncidents(instanceId);
		instance.timer = setInterval(() => this.fetchIncidents(instanceId), Math.max(config.updateInterval || 300000, 60000));
	},

	stopInstance (instanceId) {
		const instance = this.instances.get(instanceId);
		if (!instance) return;
		clearInterval(instance.timer);
		this.instances.delete(instanceId);
	},

	async fetchIncidents (instanceId) {
		const instance = this.instances.get(instanceId);
		if (!instance || instance.inFlight) return;
		instance.inFlight = true;
		try {
			const response = await fetch(feedUrl, { signal: AbortSignal.timeout(15000) });
			if (!response.ok) throw new Error(`HTTP ${response.status}`);
			const xml = await response.text();
			const data = parseIncidents(xml, Math.max(1, instance.config.maximumEntries || 5));
			instance.lastData = data;
			this.sendSocketNotification("MADRID_TRAFFIC_DATA", { instanceId, data });
		} catch (error) {
			this.sendSocketNotification("MADRID_TRAFFIC_DATA", {
				instanceId,
				data: instance.lastData,
				error: instance.lastData ? null : `No se pudieron obtener los avisos: ${error.message}`
			});
		} finally {
			instance.inFlight = false;
		}
	}
});
