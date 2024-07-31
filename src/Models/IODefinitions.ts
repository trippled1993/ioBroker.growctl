import { AdapterInstance } from "@iobroker/adapter-core"; // Importiere den Adapter-Typ
import { IAdapterConfig } from "../AdapterConfig";

import { Input, Output } from "./IO";

export class IODefinitions {
	currentTopTemperature: Input;
	currentTopHumidity: Input;
	currentBottomTemperature: Input;
	currentBottomHumidity: Input;
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
		this.currentTopTemperature = new Input(config.objectIDs.currentTopTemperature);
		this.currentTopHumidity = new Input(config.objectIDs.currentTopHumidity);
		this.currentBottomTemperature = new Input(config.objectIDs.currentBottomTemperature);
		this.currentBottomHumidity = new Input(config.objectIDs.currentBottomHumidity);
		this.heaterOn = new Output(config.objectIDs.heaterOnRead, config.objectIDs.heaterOnWrite, false);
		this.lightOn = new Output(config.objectIDs.lightOnRead, config.objectIDs.lightOnWrite, false);
		this.dehumidifierOn = new Output(
			config.objectIDs.dehumidifierOnRead,
			config.objectIDs.dehumidifierOnWrite,
			false,
		);
		this.fanPercent = new Output(config.objectIDs.fanPercentRead, config.objectIDs.fanPercentWrite, 0);
		this.heartbeatFromClient = new Input(config.objectIDs.heartbeatFromClient);
		this.heartbeatToClient = new Output(
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
				const state = await this.readIO(io);
				if (state) {
					io.current = state.val;
					io.desired = state.val; // wird mit Input vorbelegt
				}
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
					await this.writeIO(io, io.desired);
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
		this.adapter.log.debug(
			`${this.constructor.name} 	| resetAllOutputs durchlaufen: ${this.Outputs.length} IOs zurückgesetzt`,
		);
	}

	private async isValueWritten(io: Output, value: any): Promise<boolean> {
		const state = await this.adapter.getForeignStateAsync(io.WriteOID);
		if (state && state.val === value) {
			io.current = state.val;
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
					this.adapter.log.silly(
						`${this.constructor.name} 	| readIO, Value aktualisiert: ${io.ReadOID} - Current: ${io.current}`,
					);
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
	public async writeIO(io: Output, value: any, attempts = 0): Promise<void> {
		try {
			const maxAttempts = 2;
			const alternativeValue = "--"; // Behelfsmäßiger Wert

			while (attempts <= maxAttempts) {
				this.adapter.log.info(
					`${this.constructor.name} 	| Wert wird geändert: ${io.WriteOID} von ${io.current} auf ${value} (Versuch ${attempts + 1})`,
				);
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
