import { IController } from "./IController";

export class LampController implements IController {
	private isActive: boolean;
	private isLocked: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
		this.isLocked = false; // Initialer Zustand
	}

	// Prüft, ob es Zeit ist, das Licht einzuschalten
	public IsLightningTime(lightDuration: number): boolean {
		const currentHour = new Date().getHours();
		const halfDuration = lightDuration / 2;
		const startHour = (24 - halfDuration) % 24;
		const endHour = halfDuration % 24;

		if (startHour < endHour) {
			return currentHour >= startHour && currentHour < endHour;
		} else {
			return currentHour >= startHour || currentHour < endHour;
		}
	}

	public shouldActivate(lightDuration: number, tempMax: number, temp: number): number {
		// Wenn die Temperatur den Maximalwert überschreitet, sperre die Lampe
		if (temp >= tempMax) {
			this.isLocked = true;
		} else if (temp <= tempMax - 0.5) {
			this.isLocked = false;
		}

		this.isActive = this.IsLightningTime(lightDuration);

		// Wenn die Lampe gesperrt ist, schalte sie aus
		if (this.isLocked) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
