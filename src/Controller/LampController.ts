import { IController } from "./IController";

export class LampController implements IController {
	private isActive: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
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
		this.isActive = this.IsLightningTime(lightDuration);

		// Wenn die durchschnittliche Temperatur den Maximalwert überschreitet, schalte die Lampe aus
		if (temp > tempMax) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
