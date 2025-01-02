import { AdapterInstance } from "@iobroker/adapter-core"; // Importiere den Adapter-Typ
import { IAdapterConfig } from "../AdapterConfig";

import { Input, Output, ScalableInput } from "./IO";

// Klasse die Funktionen zum generieren von Validierungsfunktionen enthält
export class Validation {
	// Funktion um zu prüfen ob ein Wert eine Zahl ist
	static isNumber(): (value: any) => boolean {
		return (value: any): boolean => {
			return typeof value === "number";
		};
	}

	// Funktion um zu prüfen ob ein Wert eine Zahl ist und im Bereich von 0-100 liegt
	static isPercent(): (value: any) => boolean {
		return (value: any): boolean => {
			return Validation.isNumber()(value) && value >= 0 && value <= 100;
		};
	}

	//Funktion um zu prüfen ob ein Wert eine Zahl ist und im angegebenen Bereich liegt
	static isInRange(min: number, max: number): (value: any) => boolean {
		return (value: any): boolean => {
			return Validation.isNumber()(value) && value >= min && value <= max;
		};
	}

	// Funktion um zu prüfen ob ein Wert eine Zahl ist und im Bereich von 0-100 liegt
	static isBoolean(): (value: any) => boolean {
		return (value: any): boolean => {
			return typeof value === "boolean";
		};
	}
}
export class IODefinitions {
	currentTopTemperature: Input;
	currentTopHumidity: Input;
	currentBottomTemperature: Input;
	currentBottomHumidity: Input;
	moistureRaw1: ScalableInput;
	moistureRaw2: ScalableInput;
	moistureRaw3: ScalableInput;
	moistureRaw4: ScalableInput;
	moistureRaw5: ScalableInput;
	moistureRaw6: ScalableInput;
	heaterOn: Output;
	lightOn: Output;
	dehumidifierOn: Output;
	fanPercent: Output;
	heartbeatFromClient: Input;
	heartbeatToClient: Output;

	private adapter: AdapterInstance;
	private writeCheckDelay = 200; // Wartezeit in ms

	constructor(config: IAdapterConfig, adapter: AdapterInstance) {
		console.log(config);
		this.currentTopTemperature = new Input(
			"Temperature.Top",
			config.objectIDs.currentTopTemperature,
			Validation.isInRange(-20, 70),
		);
		this.currentTopHumidity = new Input(
			"Humidity.Top",
			config.objectIDs.currentTopHumidity,
			Validation.isPercent(),
		);
		this.currentBottomTemperature = new Input(
			"Temperature.Bottom",
			config.objectIDs.currentBottomTemperature,
			Validation.isInRange(-20, 70),
		);
		this.currentBottomHumidity = new Input(
			"Humidity.Bottom",
			config.objectIDs.currentBottomHumidity,
			Validation.isPercent(),
		);
		this.moistureRaw1 = new ScalableInput(
			"Moisture.1",
			config.objectIDs.moistureRaw1,
			0,
			4000,
			Validation.isInRange(0, 5000),
		);
		this.moistureRaw2 = new ScalableInput(
			"Moisture.2",
			config.objectIDs.moistureRaw2,
			0,
			4000,
			Validation.isInRange(0, 5000),
		);
		this.moistureRaw3 = new ScalableInput(
			"Moisture.3",
			config.objectIDs.moistureRaw3,
			0,
			4000,
			Validation.isInRange(0, 5000),
		);
		this.moistureRaw4 = new ScalableInput(
			"Moisture.4",
			config.objectIDs.moistureRaw4,
			0,
			4000,
			Validation.isInRange(0, 5000),
		);
		this.moistureRaw5 = new ScalableInput(
			"Moisture.5",
			config.objectIDs.moistureRaw5,
			0,
			4000,
			Validation.isInRange(0, 5000),
		);
		this.moistureRaw6 = new ScalableInput(
			"Moisture.6",
			config.objectIDs.moistureRaw6,
			0,
			4000,
			Validation.isInRange(0, 5000),
		);
		this.heaterOn = new Output(
			"Output.HeaterOn",
			config.objectIDs.heaterOnRead,
			config.objectIDs.heaterOnWrite,
			false,
			Validation.isBoolean(),
		);
		this.lightOn = new Output(
			"Output.LightOn",
			config.objectIDs.lightOnRead,
			config.objectIDs.lightOnWrite,
			false,
			Validation.isBoolean(),
		);
		this.dehumidifierOn = new Output(
			"Output.DehumidifierOn",
			config.objectIDs.dehumidifierOnRead,
			config.objectIDs.dehumidifierOnWrite,
			false,
			Validation.isBoolean(),
		);
		this.fanPercent = new Output(
			"Output.FanPercent",
			config.objectIDs.fanPercentRead,
			config.objectIDs.fanPercentWrite,
			0,
			Validation.isPercent(),
		);
		this.heartbeatFromClient = new Input("Heartbeat.FromClient", config.objectIDs.heartbeatFromClient);
		this.heartbeatToClient = new Output(
			"Heartbeat.ToClient",
			config.objectIDs.heartbeatToClientRead,
			config.objectIDs.heartbeatToClientWrite,
			0,
		);
		this.adapter = adapter;
		console.log(this.Inputs);
	}

	// Getter um alle IOs auszugeben
	public get Inputs(): Input[] {
		return Object.values(this).filter((io) => io instanceof Input) as Input[];
	}
	public get Outputs(): Output[] {
		return Object.values(this).filter((io) => io instanceof Output) as Output[];
	}

	// Methode um Objekte für alle IOs im Adapter zu erstellen
	public async createObjects(): Promise<void> {
		for (const io of this.Inputs) {
			await this.createIOObject(io);
		}
		for (const io of this.Outputs) {
			await this.createIOObject(io);
		}
	}

	// Methode um ein Objekt für einen IO zu erstellen
	// Als Name des Objekts wird der Instanzname des IOs verwendet
	// Wenn es ein Output ist, wird der Typ anhand des Default Wertes gesetzt. Sonst auf "number"
	// Wenn es ein Output ist, wird der Wert beschreibbar gesetzt
	private async createIOObject(io: ScalableInput | Input | Output): Promise<void> {
		await this.adapter.setObjectNotExistsAsync(io.IOName, {
			type: "state",
			common: {
				name: io.IOName,
				type: io instanceof Output ? (typeof io.default === "boolean" ? "boolean" : "number") : "number",
				role: "value",
				read: true,
				write: io instanceof Output,
				def: io instanceof Output ? io.default : null,
			},
			native: {},
		});
		await this.adapter.setObjectNotExistsAsync(io.ValidName, {
			type: "state",
			common: {
				name: io.ValidName,
				type: "boolean",
				role: "value",
				read: true,
				write: false,
				def: false,
			},
			native: {},
		});
		if (io instanceof ScalableInput) {
			await this.adapter.setObjectNotExistsAsync(io.ScaledName, {
				type: "state",
				common: {
					name: io.ScaledName,
					type: "number",
					role: "value",
					read: true,
					write: false,
					def: null,
				},
				native: {},
			});
		}
		this.adapter.log.debug(`${this.constructor.name} 	| createIOObject durchlaufen: ${io.IOName} erstellt`);
	}

	// Methode um den Wert aller IOs einzulesen
	public async readAllInputs(): Promise<void> {
		for (const io of this.Inputs) {
			try {
				await this.readIO(io, true);
			} catch (error) {
				console.error(`Error reading state for ${io.ReadOID}:`, error);
			}
		}
		this.adapter.log.debug(
			`${this.constructor.name} 	| readAllInputs durchlaufen: ${this.Inputs.length} IOs gelesen`,
		);
	}

	// Methode um den Wert aller IOs einzulesen
	public async readAllOutputs(): Promise<void> {
		for (const io of this.Outputs) {
			try {
				await this.readIO(io, true);

				io.desired = io.current; // wird mit Input vorbelegt

				this.adapter.log.silly(
					`${this.constructor.name} 	| readAllOutputs durchlaufen: ${io.ReadOID} - Current: ${io.current} - Desired: ${io.desired}`,
				);
			} catch (error) {
				console.error(`Error reading state for ${io.ReadOID}:`, error);
			}
		}
		this.adapter.log.debug(
			`${this.constructor.name} 	| readAllOutputs durchlaufen: ${this.Outputs.length} IOs gelesen`,
		);
	}

	public async writeAllOutputs(): Promise<void> {
		for (const io of this.Outputs) {
			try {
				if (io.current !== io.desired) {
					await this.writeIO(io, io.desired, 0, io.IOName != "Heartbeat.ToClient"); //HEARTBEAT nicht loggen
				}
			} catch (error) {
				console.error(`Error writing desired state for ${io.WriteOID}:`, error);
			}
		}
		this.adapter.log.debug(
			`${this.constructor.name} 	| writeAllOutputs durchlaufen: ${this.Outputs.length} IOs geprüft`,
		);
	}

	// Methode um den Desired-Wert aller IOs zu schreiben
	public async resetAllOutputs(): Promise<void> {
		for (const io of this.Outputs) {
			io.desired = io.default;
		}
		this.writeAllOutputs();
		this.adapter.log.info(
			`${this.constructor.name} 	| resetAllOutputs durchlaufen: ${this.Outputs.length} IOs zurückgesetzt`,
		);
	}

	private async isValueWritten(io: Output, value: any): Promise<boolean> {
		const state = await this.adapter.getForeignStateAsync(io.ReadOID);
		if (state && state.val === value) {
			io.current = state.val;
			// Wert in IObroker schreiben
			this.adapter.setState(io.IOName, { val: io.current, ack: true });
			return true;
		}
		return false;
	}

	// Funktion um IO zu lesen, Default parameter "Update"= true. Wenn Update gesetzt, wird auch der Wert in IO aktualisiert, sonst nur zurückgegeben
	public async readIO(io: Input | Output, update = false): Promise<any> {
		try {
			const state = await this.adapter.getForeignStateAsync(io.ReadOID);
			if (state) {
				if (update) {
					io.current = state.val;

					// Wenn Typ ScalableInput, dann auch skalierten Wert schreiben
					if (io instanceof ScalableInput) {
						this.adapter.setState(io.ScaledName, { val: io.current, ack: true });
						this.adapter.setState(io.IOName, { val: io.getRawValue(), ack: true });
					} else {
						// Wert in IObroker schreiben
						this.adapter.setState(io.IOName, { val: io.current, ack: true });
					}
					// Valid status schreiben
					this.adapter.setState(io.ValidName, { val: io.valid, ack: true });

					this.adapter.log.silly(
						`${this.constructor.name} 	| readIO, Value aktualisiert: ${io.ReadOID} - Current: ${io.current} Datentyp: ${typeof io.current}`,
					);
					if (!io.valid) {
						this.adapter.log.error(
							`${this.constructor.name} 	| readIO, Value invalid: ${io.ReadOID} - Current: ${io.current}`,
						);
					}
				}
				return state.val;
			} else {
				console.warn(`State for ${io.ReadOID} not found.`);
				throw new Error(`State for ${io.ReadOID} not found.`);
			}
		} catch (error) {
			console.error(`Error reading state for ${io.ReadOID}:`, error);
			throw error;
		}
	}

	// Funktion um IO zu schreiben
	public async writeIO(io: Output, value: any, attempts = 0, log = true): Promise<void> {
		try {
			const maxAttempts = 2;
			const alternativeValue = "--"; // Behelfsmäßiger Wert

			//Nur loggen, wenn log = true oder wenn es ein Wiederholungsversuch ist
			if (attempts > 0 || log) {
				this.adapter.log.info(
					`${this.constructor.name} 	| Wert wird geändert: ${io.WriteOID} von ${io.current} auf ${value} (Versuch ${attempts + 1})`,
				);
			} else {
				this.adapter.log.debug(
					`${this.constructor.name} 	| Wert wird geändert: ${io.WriteOID} von ${io.current} auf ${value} (Versuch ${attempts + 1})`,
				);
			}

			while (attempts <= maxAttempts) {
				await this.adapter.setForeignStateAsync(io.WriteOID, value);
				await this.delay(this.writeCheckDelay);

				if (await this.isValueWritten(io, value)) {
					return; // Wert erfolgreich geschrieben
				} else {
					attempts++;
					if (attempts == maxAttempts) {
						await this.writeIO(io, alternativeValue, attempts);
						await this.writeIO(io, value, attempts);
						return;
					} else if (attempts > maxAttempts) {
						this.adapter.log.error(
							`${this.constructor.name} 	| Wert konnte nicht geschrieben werden: ${io.WriteOID} von ${io.current} auf ${value}`,
						);
						return;
					}
				}
			}
		} catch (error) {
			console.error(`Error writing desired state for ${io.WriteOID}:`, error);
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
