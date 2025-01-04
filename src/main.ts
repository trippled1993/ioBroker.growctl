/*
 * Created with @iobroker/create-adapter v2.6.3
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";
import { AdapterConfig } from "./AdapterConfig";
import { ControlLogic } from "./ControlLogic";
import { Setpoints } from "./Models/Setpoints";
import { StatusValues } from "./Models/StatusValues";
// Load your modules here, e.g.:
// import * as fs from "fs";

class Growctl extends utils.Adapter {
	private ctlConfig: AdapterConfig;
	private controlLogic: ControlLogic | null = null;
	private setpoints: Setpoints;
	private statusValues: StatusValues;
	public constructor(options: Partial<utils.AdapterOptions> = {}) {
		super({
			...options,
			name: "growctl",
		});
		this.ctlConfig = new AdapterConfig(this);
		this.setpoints = new Setpoints(this);
		this.statusValues = new StatusValues(this);

		this.on("ready", this.onReady.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		// this.on("objectChange", this.onObjectChange.bind(this));
		// this.on("message", this.onMessage.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	private async onReady(): Promise<void> {
		try {
			await this.ctlConfig.loadConfig();
			const config = this.ctlConfig.getConfig();

			// Initialisiere alle Sollwerte
			this.setpoints
				.initializePoints()
				.then(() => {
					console.log("Alle Sollwerte wurden initialisiert.");
					this.log.info("Alle Sollwerte wurden initialisiert.");
				})
				.catch((err) => {
					console.error("Fehler bei der Initialisierung der Sollwerte:", err);
					this.log.error("Fehler bei der Initialisierung der Sollwerte:" + err);
				});

			// Initialisiere alle Statuswerte
			this.statusValues
				.initializeStatusValues()
				.then(() => {
					console.log("Alle Statuswerte wurden initialisiert.");
					this.log.info("Alle Statuswerte wurden initialisiert.");
				})
				.catch((err) => {
					console.error("Fehler bei der Initialisierung der Statuswerte:", err);
					this.log.error("Fehler bei der Initialisierung der Statuswerte:" + err);
				});

			this.controlLogic = new ControlLogic(this, config);
			// Steuerungslogik initialisieren
			await this.controlLogic.initialize();
		} catch (error) {
			this.log.error("Fehler beim Laden der Konfiguration: " + error);
			if (this.stop) this.stop();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.debug(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			// Steuerungsschleife stoppen
			if (this.controlLogic && this.controlLogic.IsRunning) {
				this.controlLogic
					.stop()
					.then(() => {
						this.log.info("Steuerungsschleife gestoppt.");
						callback();
					})
					.catch((e) => {
						this.log.error("Fehler beim Stoppen der Steuerungsschleife: " + e);
						callback();
					});
			}
			callback();
		} catch (e) {
			callback();
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<utils.AdapterOptions> | undefined) => new Growctl(options);
} else {
	// otherwise start the instance directly
	(() => new Growctl())();
}
