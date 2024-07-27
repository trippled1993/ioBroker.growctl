// AdapterConfig.ts
import * as utils from "@iobroker/adapter-core";

export interface IAdapterConfig {
	objectIDs: {
		currentTopTemperature: string;
		currentTopHumidity: string;
		currentBottomTemperature: string;
		currentBottomHumidity: string;
		heaterOn: string;
		lightOn: string;
		dehumidifierOn: string;
		fanPercent: string;
		heartbeatFromClient: string;
		heartbeatToClient: string;
		[key: string]: string;
	};
	generalSettings: {
		clientHeartbeatTimeout: number;
		clientHeartbeatInterval: number;
		// add other general settings here
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
				heaterOn: "",
				lightOn: "",
				dehumidifierOn: "",
				fanPercent: "",
				heartbeatFromClient: "",
				heartbeatToClient: "",
			},
			generalSettings: {
				clientHeartbeatTimeout: 0,
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
							currentTopTemperature: obj.native.objectIDs.CurrentTopTemperature || "",
							currentTopHumidity: obj.native.objectIDs.CurrentTopHumidity || "",
							currentBottomTemperature: obj.native.objectIDs.CurrentBottomTemperature || "",
							currentBottomHumidity: obj.native.objectIDs.CurrentBottomHumidity || "",
							heaterOn: obj.native.objectIDs.HeaterOn || "",
							lightOn: obj.native.objectIDs.LightOn || "",
							dehumidifierOn: obj.native.objectIDs.DehumidifierOn || "",
							fanPercent: obj.native.objectIDs.FanPercent || "",
							heartbeatFromClient: obj.native.objectIDs.HeartbeatFromClient || "",
							heartbeatToClient: obj.native.objectIDs.HeartbeatToClient || "",
						},
						generalSettings: {
							clientHeartbeatInterval: obj.native.generalSettings.HeartbeatInterval || 0,
							clientHeartbeatTimeout: obj.native.generalSettings.HeartbeatTimeout || 0,
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
