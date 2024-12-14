import { IController } from "./IController";
export class DehumidifierController implements IController {
	private isActive: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
	}

	public shouldActivate(hum: number, temp: number, desiredHum: number, humHyst: number, maxTemp: number): number {
		if (!this.isActive && hum > desiredHum + humHyst) {
			this.isActive = true;
		} else if (this.isActive && hum < desiredHum - humHyst) {
			this.isActive = false;
		}

		// Wenn die maximale Temperatur erreicht ist, deaktiviere den Entfeuchter
		if (temp >= maxTemp) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
