import { Input } from "../Models/IO";
import { IController } from "./IController";

export class HeatingController implements IController {
	private isActive: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
	}

	public shouldActivate(
		tempTop: Input,
		tempBottom: Input,
		desiredTemp: number,
		tempHyst: number,
		maxTemp: number,
	): number {
		// Überprüfe, ob alle Input-Objekte gültig sind
		if (!tempTop.valid || !tempBottom.valid) {
			throw new Error(`${this.constructor.name} 	| Ungültige Eingabewerte`);
		}

		// Extrahiere die Werte aus den Input-Objekten
		const tempTopValue = tempTop.current;
		const tempBottomValue = tempBottom.current;
		const desiredTempValue = desiredTemp;
		const tempHystValue = tempHyst;

		const avgTemp = (tempTopValue + tempBottomValue) / 2;

		if (!this.isActive && avgTemp < desiredTempValue - tempHystValue) {
			this.isActive = true;
		} else if (this.isActive && avgTemp > desiredTempValue + tempHystValue) {
			this.isActive = false;
		}

		// Wenn die maximale Temperatur erreicht ist, deaktiviere die Heizung
		if (avgTemp > maxTemp) {
			this.isActive = false;
		}
		return this.isActive ? 100 : 0;
	}
}
