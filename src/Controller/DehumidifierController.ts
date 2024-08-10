import { IController } from "./IController";
export class DehumidifierController implements IController {
	private isActive: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
	}

	public shouldActivate(
		humTop: number,
		humBottom: number,
		desiredHum: number,
		humHyst: number,
		maxTemp: number,
	): number {
		const avgHum = (humTop + humBottom) / 2;

		if (!this.isActive && avgHum > desiredHum + humHyst) {
			this.isActive = true;
		} else if (this.isActive && avgHum < desiredHum - humHyst) {
			this.isActive = false;
		}

		// Wenn die maximale Temperatur erreicht ist, deaktiviere den Entfeuchter
		if (avgHum >= maxTemp) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
