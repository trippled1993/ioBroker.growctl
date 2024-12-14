import { IController } from "./IController";

export class HeatingController implements IController {
	private isActive: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
	}

	public shouldActivate(temp: number, desiredTemp: number, tempHyst: number, maxTemp: number): number {
		// Extrahiere die Werte aus den Input-Objekten

		const desiredTempValue = desiredTemp;
		const tempHystValue = tempHyst;

		if (!this.isActive && temp < desiredTempValue - tempHystValue) {
			this.isActive = true;
		} else if (this.isActive && temp > desiredTempValue + tempHystValue) {
			this.isActive = false;
		}

		// Wenn die maximale Temperatur erreicht ist, deaktiviere die Heizung
		if (temp > maxTemp) {
			this.isActive = false;
		}
		return this.isActive ? 100 : 0;
	}
}
