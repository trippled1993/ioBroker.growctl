// AdapterConfig.ts
import * as utils from "@iobroker/adapter-core";

export interface IAdapterConfig {
	objectIDs: {
		currentTopTemperature: string;
		currentTopHumidity: string;
		currentBottomTemperature: string;
		currentBottomHumidity: string;
		heaterOnRead: string;
		heaterOnWrite: string;
		lightOnRead: string;
		lightOnWrite: string;
		dehumidifierOnRead: string;
		dehumidifierOnWrite: string;
		fanPercentRead: string;
		fanPercentWrite: string;
		heartbeatFromClient: string;
		heartbeatToClientRead: string;
		heartbeatToClientWrite: string;
		[key: string]: string;
	};
	generalSettings: {
		clientHeartbeatTimeout: number;
		clientHeartbeatInterval: number;
		controlLoopInterval: number; // Intervall in Sekunden
	};
}

export class AdapterConfig {
	private adapter: utils.AdapterInstance;
	private config: IAdapterConfig;

	constructor(adapter: utils.AdapterInstance) {
		this.adapter = adapter;
		this.config = {
			objectIDs: {
				currentTopTemperature: "",
				currentTopHumidity: "",
				currentBottomTemperature: "",
				currentBottomHumidity: "",
				heaterOnRead: "",
				heaterOnWrite: "",
				lightOnRead: "",
				lightOnWrite: "",
				dehumidifierOnRead: "",
				dehumidifierOnWrite: "",
				fanPercentRead: "",
				fanPercentWrite: "",
				heartbeatFromClient: "",
				heartbeatToClientRead: "",
				heartbeatToClientWrite: "",
			},
			generalSettings: {
				clientHeartbeatTimeout: 0,
				clientHeartbeatInterval: 0,
				controlLoopInterval: 5,
				// add other general settings here
			},
		};
	}

	// Methode zum Laden der Konfiguration
	public loadConfig(): Promise<void> {
		return new Promise((resolve, reject) => {
			this.adapter.getForeignObject("system.adapter." + this.adapter.namespace, (err, obj) => {
				if (err) {
					reject("Fehler beim Laden der Konfiguration: " + err);
				} else if (obj && obj.native) {
					this.config = {
						objectIDs: {
							currentTopTemperature: obj.native.objectIDs.currentTopTemperature || "",
							currentTopHumidity: obj.native.objectIDs.currentTopHumidity || "",
							currentBottomTemperature: obj.native.objectIDs.currentBottomTemperature || "",
							currentBottomHumidity: obj.native.objectIDs.currentBottomHumidity || "",
							heaterOnRead: obj.native.objectIDs.heaterOnRead || "",
							heaterOnWrite: obj.native.objectIDs.heaterOnWrite || "",
							lightOnRead: obj.native.objectIDs.lightOnRead || "",
							lightOnWrite: obj.native.objectIDs.lightOnWrite || "",
							dehumidifierOnRead: obj.native.objectIDs.dehumidifierOnRead || "",
							dehumidifierOnWrite: obj.native.objectIDs.dehumidifierOnWrite || "",
							fanPercentRead: obj.native.objectIDs.fanPercentRead || "",
							fanPercentWrite: obj.native.objectIDs.fanPercentWrite || "",
							heartbeatFromClient: obj.native.objectIDs.heartbeatFromClient || "",
							heartbeatToClientRead: obj.native.objectIDs.heartbeatToClientRead || "",
							heartbeatToClientWrite: obj.native.objectIDs.heartbeatToClientWrite || "",
						},
						generalSettings: {
							clientHeartbeatInterval: obj.native.generalSettings.HeartbeatInterval || 0,
							clientHeartbeatTimeout: obj.native.generalSettings.HeartbeatTimeout || 0,
							controlLoopInterval: obj.native.generalSettings.controlLoopInterval || 0,
							// add other general settings here
						},
					};
					resolve();
				} else {
					reject("Keine Konfiguration gefunden");
				}
			});
		});
	}

	// Getter für die Konfiguration
	public getConfig(): IAdapterConfig {
		return this.config;
	}

	// Setter für die Konfiguration
	public setConfig(newConfig: IAdapterConfig): void {
		this.config = newConfig;
	}
}
