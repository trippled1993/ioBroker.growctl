import { IController } from "./IController";
export class DehumidifierController implements IController {
	private isActive: boolean;
	private isLocked: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
		this.isLocked = false; // Initialer Zustand
	}

	public shouldActivate(hum: number, temp: number, desiredHum: number, humHyst: number, maxTemp: number): number {
		// Wenn die maximale Temperatur erreicht ist, sperre den Entfeuchter
		if (temp >= maxTemp) {
			this.isLocked = true;
		} else if (temp <= maxTemp - 0.5) {
			this.isLocked = false;
		}

		// Wenn die Luftfeuchtigkeit über dem Sollwert + Hysterese liegt, schalte den Entfeuchter ein
		// Wenn die Luftfeuchtigkeit unter dem Sollwert - Hysterese liegt, schalte den Entfeuchter aus
		if (!this.isActive && hum >= desiredHum + humHyst) {
			this.isActive = true;
		} else if (this.isActive && hum <= desiredHum - humHyst) {
			this.isActive = false;
		}

		// Wenn der Entfeuchter gesperrt ist, schalte ihn aus
		if (this.isLocked) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
