export class Setpoint {
	name: string;
	label: string;
	currentValue: number;

	constructor(name: string, label: string, currentValue: number) {
		this.name = name;
		this.label = label;
		this.currentValue = currentValue;
	}
}

import { AdapterInstance } from "@iobroker/adapter-core"; // Importiere den Adapter-Typ

/**
 * Represents a set of desired setpoints for temperature, humidity, lighting duration, and hysteresis.
 */
/**
 * Klasse, die die Setpoints für Temperatur, Luftfeuchtigkeit, Beleuchtungsdauer und Hysterese speichert.
 */
export class Setpoints {
	desiredTemperature: Setpoint;
	desiredHumidity: Setpoint;
	desiredLightingDuration: Setpoint;
	desiredTempHysteresis: Setpoint;
	desiredHumidityHysteresis: Setpoint;
	maxTemperature: Setpoint;
	maxHumidity: Setpoint;
	fanMinPercent: Setpoint;
	tempDiffThreshold: Setpoint;
	lightsOnDuration: Setpoint;
	Moisture1Min: Setpoint;
	Moisture1Max: Setpoint;
	Moisture2Min: Setpoint;
	Moisture2Max: Setpoint;
	Moisture3Min: Setpoint;
	Moisture3Max: Setpoint;
	Moisture4Min: Setpoint;
	Moisture4Max: Setpoint;
	Moisture5Min: Setpoint;
	Moisture5Max: Setpoint;
	Moisture6Min: Setpoint;
	Moisture6Max: Setpoint;

	private adapter: AdapterInstance;

	/**
	 * Erstellt eine Instanz der Setpoints-Klasse.
	 * @param adapter - Die Adapterinstanz.
	 */
	constructor(adapter: AdapterInstance) {
		this.adapter = adapter;
		this.desiredTemperature = new Setpoint("DesiredTemperature", "Gewünschte Temperatur", 0);
		this.desiredHumidity = new Setpoint("DesiredHumidity", "Gewünschte Luftfeuchtigkeit", 0);
		this.desiredLightingDuration = new Setpoint("DesiredLightingDuration", "Gewünschte Beleuchtungsdauer", 0);
		this.desiredTempHysteresis = new Setpoint("DesiredTempHysteresis", "Gewünschte Temperaturhysterese", 0);
		this.desiredHumidityHysteresis = new Setpoint(
			"DesiredHumidityHysteresis",
			"Gewünschte Luftfeuchtigkeithysterese",
			0,
		);
		this.maxTemperature = new Setpoint("MaxTemperature", "Maximale Temperatur", 0);
		this.maxHumidity = new Setpoint("MaxHumidity", "Maximale Luftfeuchtigkeit", 0);
		this.fanMinPercent = new Setpoint("FanMinPercent", "Minimale Lüfterdrehzahl in Prozent", 0);
		this.tempDiffThreshold = new Setpoint("TempDiffThreshold", "Abweichung von Temperatur oben/unten", 0);
		this.lightsOnDuration = new Setpoint("LightsOnDuration", "Leuchtdauer in Stunden pro Tag", 0);
		this.Moisture1Min = new Setpoint("Moisture1Min", "Feuchtigkeitssensor 1 Min", 0);
		this.Moisture1Max = new Setpoint("Moisture1Max", "Feuchtigkeitssensor 1 Max", 0);
		this.Moisture2Min = new Setpoint("Moisture2Min", "Feuchtigkeitssensor 2 Min", 0);
		this.Moisture2Max = new Setpoint("Moisture2Max", "Feuchtigkeitssensor 2 Max", 0);
		this.Moisture3Min = new Setpoint("Moisture3Min", "Feuchtigkeitssensor 3 Min", 0);
		this.Moisture3Max = new Setpoint("Moisture3Max", "Feuchtigkeitssensor 3 Max", 0);
		this.Moisture4Min = new Setpoint("Moisture4Min", "Feuchtigkeitssensor 4 Min", 0);
		this.Moisture4Max = new Setpoint("Moisture4Max", "Feuchtigkeitssensor 4 Max", 0);
		this.Moisture5Min = new Setpoint("Moisture5Min", "Feuchtigkeitssensor 5 Min", 0);
		this.Moisture5Max = new Setpoint("Moisture5Max", "Feuchtigkeitssensor 5 Max", 0);
		this.Moisture6Min = new Setpoint("Moisture6Min", "Feuchtigkeitssensor 6 Min", 0);
		this.Moisture6Max = new Setpoint("Moisture6Max", "Feuchtigkeitssensor 6 Max", 0);
	}

	/**
	 * Gibt ein Array aller Setpoints zurück.
	 * @returns Ein Array von Setpoints.
	 */
	public get Points(): Setpoint[] {
		return Object.values(this).filter((point) => point instanceof Setpoint) as Setpoint[];
	}

	/**
	 * Initialisiert alle Setpoints, indem entsprechende Objekte im Adapter erstellt werden.
	 * @returns Ein Promise, das nach der Initialisierung aufgelöst wird.
	 */
	public async initializePoints(): Promise<void> {
		for (const point of this.Points) {
			await this.adapter.setObjectNotExistsAsync(point.name, {
				type: "state",
				common: {
					name: point.label,
					type: "number",
					role: "value",
					read: true,
					write: true,
					def: point.currentValue,
				},
				native: {},
			});
		}
		this.adapter.log.debug(
			`${this.constructor.name} | initializePoints durchlaufen: ${this.Points.length} Punkte initialisiert`,
		);
	}

	/**
	 * Liest die aktuellen Werte aller Setpoints aus dem Adapter.
	 * @returns Ein Promise, das nach dem Lesen der Werte aufgelöst wird.
	 */
	public async readPoints(): Promise<void> {
		for (const point of this.Points) {
			try {
				const state = await this.adapter.getStateAsync(point.name);
				if (state && typeof state.val === "number") {
					point.currentValue = state.val;
					this.adapter.log.silly(
						`${this.constructor.name} | readPoint: ${point.name} - Aktuell: ${point.currentValue}`,
					);
				} else {
					console.warn(`Der Zustand für ${point.name} ist keine Zahl oder existiert nicht.`);
				}
			} catch (error) {
				console.error(`Fehler beim Lesen des Zustands für ${point.name}:`, error);
			}
		}
		this.adapter.log.debug(
			`${this.constructor.name} | readPoints durchlaufen: ${this.Points.length} Punkte gelesen`,
		);
	}
}
