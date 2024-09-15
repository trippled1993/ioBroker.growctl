import { AdapterInstance } from "@iobroker/adapter-core";
import { IAdapterConfig } from "./AdapterConfig";
import { DehumidifierController } from "./Controller/DehumidifierController";
import { FanController } from "./Controller/FanController";
import { HeatingController } from "./Controller/HeatingController";
import { LampController } from "./Controller/LampController";
import { HeartbeatManager } from "./HeartbeatManager";
import { IO } from "./Models/IO";
import { IODefinitions } from "./Models/IODefinitions";
import { Setpoints } from "./Models/Setpoints";

const CONTROL_LOOP_INTERVAL_DEFAULT = 5000; // Default interval in milliseconds
/**
 * Die Klasse ControlLogic stellt die Steuerungslogik für den Adapter bereit.
 */
export class ControlLogic {
	private adapter: AdapterInstance;
	private config: IAdapterConfig;
	private interval: NodeJS.Timeout | null = null;
	private ioDefinitions: IODefinitions;
	private setpoints: Setpoints;
	private heartbeatManager: HeartbeatManager;
	public IsRunning = false;
	private isClientConnected = false;
	private isInitialized = false;
	private isControlLoopRunning = false;

	private heatingController: HeatingController;
	private fanController: FanController;
	private dehumidifierController: DehumidifierController;
	private lampController: LampController;

	/**
	 * Erstellt eine Instanz der ControlLogic Klasse.
	 * @param adapter - Die Adapterinstanz.
	 * @param config - Die Adapterkonfiguration.
	 */
	constructor(adapter: AdapterInstance, config: IAdapterConfig) {
		this.adapter = adapter;
		this.config = config;
		this.ioDefinitions = new IODefinitions(config, adapter);
		this.setpoints = new Setpoints(adapter);
		this.heartbeatManager = new HeartbeatManager(
			adapter,
			this.ioDefinitions,
			config,
			this.handleHeartbeatChange.bind(this),
		);
		this.heatingController = new HeatingController();
		this.fanController = new FanController();
		this.dehumidifierController = new DehumidifierController();
		this.lampController = new LampController();
	}

	/**
	 * Initialisiert die Steuerungslogik.
	 * @returns Eine Promise, die nach der Initialisierung aufgelöst wird.
	 */
	public async initialize(): Promise<void> {
		// Prüfe, ob alle ioDefinitions vorhanden sind
		if (!this.ioDefinitions.Inputs.every((io) => io.ReadOID)) {
			throw new Error("Nicht alle Eingänge wurden konfiguriert.");
		}
		if (!this.ioDefinitions.Outputs.every((io) => io.ReadOID)) {
			throw new Error("Nicht alle Ausgänge wurden konfiguriert.");
		}

		// Prüfe, ob alle ioDefinition-ObjektIDs in ioBroker existieren
		const allIOs: IO[] = [...this.ioDefinitions.Inputs, ...this.ioDefinitions.Outputs];
		for (const io of allIOs) {
			await this.ioDefinitions.readIO(io);
		}
		// Erstelle alle Objekte für die IOs
		this.ioDefinitions.createObjects();

		// Initialisiere den Heartbeat-Manager
		this.heartbeatManager.initialize();

		this.isInitialized = true;
		this.adapter.log.info("Steuerungsschleife initialisiert. Warte auf Heartbeat von Client...");
	}

	/**
	 * Die Steuerungsschleife, die periodisch ausgeführt wird.
	 * @returns Eine Promise, die nach der Ausführung der Steuerungsschleife aufgelöst wird.
	 */
	private async controlLoop(): Promise<void> {
		if (this.isControlLoopRunning) return; // Wenn die Schleife bereits läuft, nichts tun
		this.isControlLoopRunning = true; // Sperrvariable setzen
		try {
			await this.setpoints.readPoints();
			this.setScalabeInputValues();
			await this.ioDefinitions.readAllInputs();
			await this.ioDefinitions.readAllOutputs();

			// Prüfe und sende den Heartbeat
			this.heartbeatManager.checkAndSendHeartbeat();

			// Verarbeite die Steuerungslogik
			this.processLogic();

			await this.ioDefinitions.writeAllOutputs();
		} catch (error) {
			this.adapter.log.error("Fehler in der Steuerungsschleife: " + error);
		} finally {
			this.isControlLoopRunning = false; // Sperrvariable zurücksetzen
		}
	}

	private setScalabeInputValues(): void {
		// Min/Max für Skalierbare Eingänge setzen
		this.ioDefinitions.moistureRaw1.min = this.setpoints.Moisture1Min.currentValue;
		this.ioDefinitions.moistureRaw1.max = this.setpoints.Moisture1Max.currentValue;
		this.ioDefinitions.moistureRaw2.min = this.setpoints.Moisture2Min.currentValue;
		this.ioDefinitions.moistureRaw2.max = this.setpoints.Moisture2Max.currentValue;
		this.ioDefinitions.moistureRaw3.min = this.setpoints.Moisture3Min.currentValue;
		this.ioDefinitions.moistureRaw3.max = this.setpoints.Moisture3Max.currentValue;
		this.ioDefinitions.moistureRaw4.min = this.setpoints.Moisture4Min.currentValue;
		this.ioDefinitions.moistureRaw4.max = this.setpoints.Moisture4Max.currentValue;
		this.ioDefinitions.moistureRaw5.min = this.setpoints.Moisture5Min.currentValue;
		this.ioDefinitions.moistureRaw5.max = this.setpoints.Moisture5Max.currentValue;
		this.ioDefinitions.moistureRaw6.min = this.setpoints.Moisture6Min.currentValue;
		this.ioDefinitions.moistureRaw6.max = this.setpoints.Moisture6Max.currentValue;
	}

	/**
	 * Verarbeitet die Steuerungslogik.
	 */
	private processLogic(): void {
		this.adapter.log.debug(`${this.constructor.name} 	| processLogic gestartet..`);
		this.ioDefinitions.heaterOn.desired =
			this.heatingController.shouldActivate(
				this.ioDefinitions.currentTopTemperature, // tempTop
				this.ioDefinitions.currentBottomTemperature, // tempBottom
				this.setpoints.desiredTemperature.currentValue, // desiredTemp
				this.setpoints.desiredTempHysteresis.currentValue, // tempHyst
				this.setpoints.maxTemperature.currentValue, // maxTemp
			) > 50;
		this.adapter.log.debug(`${this.constructor.name} 	| heaterOn: ${this.ioDefinitions.heaterOn.desired}`);
		this.ioDefinitions.fanPercent.desired = this.fanController.shouldActivate(
			this.ioDefinitions.currentTopTemperature.current, // tempTop
			this.ioDefinitions.currentBottomTemperature.current, // tempBottom
			this.ioDefinitions.currentTopHumidity.current, // humTop
			this.ioDefinitions.currentBottomHumidity.current, // humBottom
			this.setpoints.tempDiffThreshold.currentValue, // tempDiffThreshold
			this.setpoints.desiredTemperature.currentValue, // desiredTemp
			this.setpoints.desiredTempHysteresis.currentValue, // tempHyst
			this.setpoints.maxTemperature.currentValue, // maxTemp
			this.setpoints.maxHumidity.currentValue, // maxHumidity
			this.setpoints.fanMinPercent.currentValue, // fanMinPercent
		);
		this.adapter.log.debug(`${this.constructor.name} 	| fanPercent: ${this.ioDefinitions.fanPercent.desired}`);
		this.ioDefinitions.dehumidifierOn.desired =
			this.dehumidifierController.shouldActivate(
				this.ioDefinitions.currentTopHumidity.current, // humTop
				this.ioDefinitions.currentBottomHumidity.current, // humBottom
				this.setpoints.desiredHumidity.currentValue, // desiredHum
				this.setpoints.desiredHumidityHysteresis.currentValue, // humHyst
				this.setpoints.maxTemperature.currentValue, // maxTemp
			) > 50;
		this.adapter.log.debug(
			`${this.constructor.name} 	| dehumidifierOn: ${this.ioDefinitions.dehumidifierOn.desired}`,
		);
		this.ioDefinitions.lightOn.desired =
			this.lampController.shouldActivate(
				this.setpoints.lightsOnDuration.currentValue, // lightsOnDuration
				this.setpoints.maxTemperature.currentValue, // maxTemp
				this.ioDefinitions.currentTopTemperature.current, // tempTop
				this.ioDefinitions.currentBottomTemperature.current, // tempBottom
			) > 50;
		this.adapter.log.debug(`${this.constructor.name} 	| lightOn: ${this.ioDefinitions.lightOn.desired}`);
		this.adapter.log.debug(`${this.constructor.name} 	| processLogic beendet.`);
	}

	// Startet die Steuerungsschleife
	public async start(): Promise<void> {
		if (this.IsRunning || !this.isInitialized) return;
		this.adapter.log.info("Steuerungsschleife wird gestartet und alle Ausgänge werden zurückgesetzt.");
		await this.ioDefinitions.resetAllOutputs();
		// Start der Steuerungsschleife mit einem festen Zeitintervall (z.B. alle 5 Sekunden)
		const interval = this.config.generalSettings.controlLoopInterval * 1000 || CONTROL_LOOP_INTERVAL_DEFAULT;
		this.interval = setInterval(() => this.controlLoop(), interval);
		this.IsRunning = true;
	}

	/**
	 * Beendet die Steuerungsschleife.
	 * @returns Eine Promise, die nach dem Beenden der Steuerungsschleife aufgelöst wird.
	 */
	public async stop(): Promise<void> {
		if (this.interval) {
			clearInterval(this.interval);
			this.interval = null;
		}
		if (this.IsRunning) {
			this.adapter.log.info("Steuerungsschleife wird gestoppt und alle Ausgänge werden zurückgesetzt.");
			await this.ioDefinitions.resetAllOutputs();
		}
		this.IsRunning = false;
	}

	/**
	 * Handhabt Änderungen des Heartbeat-Status.
	 * @param isConnected - Gibt an, ob die Verbindung aktiv ist oder nicht.
	 */
	private handleHeartbeatChange(isConnected: boolean): void {
		this.isClientConnected = isConnected;
		this.adapter.log.info(
			`Heartbeat-Status geändert: Client ist jetzt ${this.isClientConnected ? "verbunden" : "getrennt"}.`,
		);
		if (this.isClientConnected) {
			this.adapter.log.debug("Starte Steuerungsschleife aufgrund einer Heartbeat-Änderung.");
			this.start();
		} else {
			this.adapter.log.debug("Stoppe Steuerungsschleife aufgrund einer Heartbeat-Änderung.");
			this.stop();
		}
	}
}
