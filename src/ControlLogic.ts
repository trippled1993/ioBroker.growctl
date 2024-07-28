import { AdapterInstance } from "@iobroker/adapter-core";
import { IAdapterConfig } from "./AdapterConfig";
import { DehumidifierController } from "./Controller/DehumidifierController";
import { FanController } from "./Controller/FanController";
import { HeatingController } from "./Controller/HeatingController";
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
	}

	/**
	 * Initialisiert die Steuerungslogik.
	 * @returns Eine Promise, die nach der Initialisierung aufgelöst wird.
	 */
	public async initialize(): Promise<void> {
		// Prüfe, ob alle ioDefinitions vorhanden sind
		if (!this.ioDefinitions.Inputs.every((io) => io.objectID)) {
			throw new Error("Nicht alle Eingänge wurden konfiguriert.");
		}

		// Prüfe, ob alle ioDefinition-ObjektIDs in ioBroker existieren
		const allIOs: IO[] = [...this.ioDefinitions.Inputs, ...this.ioDefinitions.Outputs];
		for (const io of allIOs) {
			const state = await this.adapter.getForeignStateAsync(io.objectID);
			if (!state) {
				throw new Error(`State ${io.objectID} nicht gefunden.`);
			}
		}

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

	/**
	 * Verarbeitet die Steuerungslogik.
	 */
	private processLogic(): void {
		const heatingController = new HeatingController(
			this.ioDefinitions.currentTopTemperature.current, // tempTop
			this.ioDefinitions.currentBottomTemperature.current, // tempBottom
			this.setpoints.desiredTemperature.currentValue, // desiredTemp
			this.setpoints.desiredTempHysteresis.currentValue, // tempHyst
		);

		const fanController = new FanController(
			this.ioDefinitions.currentTopTemperature.current, // tempTop
			this.ioDefinitions.currentBottomTemperature.current, // tempBottom
			this.ioDefinitions.currentTopHumidity.current, // humTop
			this.ioDefinitions.currentBottomHumidity.current, // humBottom
			22, // tempDiffThreshold
			this.setpoints.desiredHumidity.currentValue, // desiredHum
			this.setpoints.desiredHumidityHysteresis.currentValue, // humHyst
		);
		const dehumidifierController = new DehumidifierController(
			this.ioDefinitions.currentTopHumidity.current, // humTop
			this.ioDefinitions.currentBottomHumidity.current, // humBottom
			this.setpoints.desiredHumidity.currentValue, // desiredHum
			this.setpoints.desiredHumidityHysteresis.currentValue, // humHyst
		);

		this.ioDefinitions.heaterOn.desired = heatingController.shouldActivate() > 50;
		this.ioDefinitions.fanPercent.desired = fanController.shouldActivate();
		this.ioDefinitions.dehumidifierOn.desired = dehumidifierController.shouldActivate() > 50;
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
