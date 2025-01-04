import { AdapterInstance } from "@iobroker/adapter-core"; // Importiere den Adapter-Typ

export class StatusValue {
	name: string;
	currentValue: number;

	constructor(name: string, currentValue: number) {
		this.name = name;
		this.currentValue = currentValue;
	}
}

export class StatusValues {
	DesiredTempMin: StatusValue;
	DesiredTempMax: StatusValue;
	DesiredHumidityMin: StatusValue;
	DesiredHumidityMax: StatusValue;
	TemperatureMaxMax: StatusValue;
	HumidityMaxMax: StatusValue;
	ControlTemperature: StatusValue;
	ControlHumidity: StatusValue;

	private adapter: AdapterInstance;

	/**
	 * Erstellt eine Instanz der StatusValues-Klasse.
	 * @param adapter - Die Adapterinstanz.
	 */
	constructor(adapter: AdapterInstance) {
		this.adapter = adapter;

		this.DesiredTempMin = new StatusValue("DesiredTempMin", 0);
		this.DesiredTempMax = new StatusValue("DesiredTempMax", 0);
		this.DesiredHumidityMin = new StatusValue("DesiredHumidityMin", 0);
		this.DesiredHumidityMax = new StatusValue("DesiredHumidityMax", 0);
		this.TemperatureMaxMax = new StatusValue("TemperatureMaxMax", 0);
		this.HumidityMaxMax = new StatusValue("HumidityMaxMax", 0);
		this.ControlTemperature = new StatusValue("ControlTemperature", 0);
		this.ControlHumidity = new StatusValue("ControlHumidity", 0);
	}

	/**
	 * Gibt ein Array aller StatusValues zurück.
	 * @returns Ein Array von StatusValues.
	 */
	public get Values(): StatusValue[] {
		const values: StatusValue[] = [];

		const addValues = (obj: any) => {
			for (const key in obj) {
				if (obj[key] instanceof StatusValue) {
					values.push(obj[key]);
				}
			}
		};

		addValues(this);

		return values;
	}

	/**
	 * Initialisiert alle StatusValue, indem entsprechende Objekte im Adapter erstellt werden.
	 * @returns Ein Promise, das nach der Initialisierung aufgelöst wird.
	 */
	public async initializeStatusValues(): Promise<void> {
		for (const value of this.Values) {
			this.adapter.log.debug(`${this.constructor.name} | Statuswert wird initialisiert: ${value.name}`);
			await this.adapter.setObjectNotExistsAsync(`Status.${value.name}`, {
				type: "state",
				common: {
					name: `Statuswert: ${value.name}`,
					type: "number",
					role: "value",
					read: true,
					write: true,
					def: value.currentValue,
				},
				native: {},
			});
		}
		this.adapter.log.debug(
			`${this.constructor.name} | initializeStatusValues durchlaufen: ${this.Values.length} Werte initialisiert`,
		);
	}

	/**
	 * Schreibt die aktuellen Werte aller StatusValue in den Adapter.
	 * @returns Ein Promise, das nach dem Schreiben der Werte aufgelöst wird.
	 */
	public async writeValues(): Promise<void> {
		for (const value of this.Values) {
			try {
				this.adapter.setState(value.name, { val: value.currentValue, ack: true });
				this.adapter.log.silly(
					`${this.constructor.name} | writeValue: ${value.name} - Geschrieben: ${value.currentValue}`,
				);
			} catch (error) {
				console.error(`Fehler beim Schreiben des Zustands für ${value.name}:`, error);
			}
		}
		this.adapter.log.silly(
			`${this.constructor.name} | writeValues durchlaufen: ${this.Values.length} Werte geschrieben`,
		);
	}
}
