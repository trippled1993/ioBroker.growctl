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
		this.heaterOn = new Output(config.objectIDs.heaterOn, false);
		this.lightOn = new Output(config.objectIDs.lightOn, false);
		this.dehumidifierOn = new Output(config.objectIDs.dehumidifierOn, false);
		this.fanPercent = new Output(config.objectIDs.fanPercent, 0);
		this.heartbeatFromClient = new Input(config.objectIDs.heartbeatFromClient);
		this.heartbeatToClient = new Output(config.objectIDs.heartbeatToClient, 0);
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
				const state = await this.adapter.getForeignStateAsync(io.objectID);
				if (state) {
					io.current = state.val;
				} else {
					console.warn(`State for ${io.objectID} not found.`);
				}
				this.adapter.log.silly(
					`${this.constructor.name} 	| readAllInputs durchlaufen: ${io.objectID} - Current: ${io.current}`,
				);
			} catch (error) {
				console.error(`Error reading state for ${io.objectID}:`, error);
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
				const state = await this.adapter.getForeignStateAsync(io.objectID);
				if (state) {
					io.current = state.val;
					io.desired = state.val; // wird mit Input vorbelegt
				} else {
					console.warn(`State for ${io.objectID} not found.`);
				}
				this.adapter.log.silly(
					`${this.constructor.name} 	| readAllOutputs durchlaufen: ${io.objectID} - Current: ${io.current} - Desired: ${io.desired}`,
				);
			} catch (error) {
				console.error(`Error reading state for ${io.objectID}:`, error);
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
					await this.writeDesiredValue(io);
				}
			} catch (error) {
				console.error(`Error writing desired state for ${io.objectID}:`, error);
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

	private async writeDesiredValue(io: any): Promise<void> {
		let attempts = 0;
		const maxAttempts = 2;
		const alternativeValue = "--"; // Behelfsmäßiger Wert

		while (attempts <= maxAttempts) {
			this.adapter.log.info(
				`${this.constructor.name} 	| Wert wird geändert: ${io.objectID} von ${io.current} auf ${io.desired}`,
			);
			await this.adapter.setForeignStateAsync(io.objectID, io.desired);
			await this.delay(this.writeCheckDelay);

			if (await this.isValueWritten(io)) {
				return; // Wert erfolgreich geschrieben
			} else {
				attempts++;
				if (attempts > maxAttempts) {
					await this.writeAlternativeValue(io, alternativeValue);
					return;
				}
			}
		}
	}

	private async isValueWritten(io: any): Promise<boolean> {
		const state = await this.adapter.getForeignStateAsync(io.objectID);
		if (state && state.val === io.desired) {
			io.current = state.val;
			return true;
		}
		return false;
	}

	private async writeAlternativeValue(io: any, alternativeValue: any): Promise<void> {
		this.adapter.log.warn(
			`${this.constructor.name} 	| Wert konnte nicht geschrieben werden: ${io.objectID}. Versuche alternativen Wert.`,
		);
		await this.adapter.setForeignStateAsync(io.objectID, alternativeValue);
		await this.delay(this.writeCheckDelay);
		const altState = await this.adapter.getForeignStateAsync(io.objectID);
		if (altState && altState.val === alternativeValue) {
			await this.adapter.setForeignStateAsync(io.objectID, io.desired);
			await this.delay(this.writeCheckDelay);

			const finalState = await this.adapter.getForeignStateAsync(io.objectID);
			if (finalState && finalState.val === io.desired) {
				io.current = finalState.val;
			} else {
				throw new Error(`Error writing desired state for ${io.objectID} after alternative value.`);
			}
		} else {
			throw new Error(`Error writing alternative state for ${io.objectID}.`);
		}
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
}
