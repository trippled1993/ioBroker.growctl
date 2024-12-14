import { IController } from "./IController";

export class LampController implements IController {
	private isActive: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
	}

	public shouldActivate(lightDuration: number, tempMax: number, temp: number): number {
		const currentHour = new Date().getHours();
		const halfDuration = lightDuration / 2;
		const startHour = (24 - halfDuration) % 24;
		const endHour = halfDuration % 24;

		if (startHour < endHour) {
			this.isActive = currentHour >= startHour && currentHour < endHour;
		} else {
			this.isActive = currentHour >= startHour || currentHour < endHour;
		}

		// Wenn die durchschnittliche Temperatur den Maximalwert überschreitet, schalte die Lampe aus
		if (temp > tempMax) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
