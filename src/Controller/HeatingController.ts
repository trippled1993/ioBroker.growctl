import { IController } from "./IController";

export class HeatingController implements IController {
	private isActive: boolean;
	private isLocked: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
		this.isLocked = false; // Initialer Zustand
	}

	public shouldActivate(temp: number, desiredTemp: number, tempHyst: number, maxTemp: number): number {
		// Wenn die maximale Temperatur erreicht ist, deaktiviere die Heizung
		if (temp >= maxTemp) {
			this.isLocked = true;
		} else if (temp <= maxTemp - 0.5) {
			this.isLocked = false;
		}

		if (!this.isActive && temp <= desiredTemp - tempHyst) {
			this.isActive = true;
		} else if (this.isActive && temp >= desiredTemp + tempHyst) {
			this.isActive = false;
		}

		// Wenn die Heizung gesperrt ist, schalte sie aus
		if (this.isLocked) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
