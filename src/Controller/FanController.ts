import { IController } from "./IController";

export class FanController implements IController {
	private isActive: number;

	constructor() {
		this.isActive = 0; // Initialer Zustand
	}

	public shouldActivate(
		tempTop: number,
		tempBottom: number,
		humTop: number,
		humBottom: number,
		tempDiffThreshold: number,
		desiredHum: number,
		humHyst: number,
		desiredTemp: number,
		tempHyst: number,
	): number {
		const tempDifference = Math.abs(tempTop - tempBottom);
		const avgHum = (humTop + humBottom) / 2;
		const avgTemp = (tempTop + tempBottom) / 2;

		let fanSpeedTempDiff = 0;
		let fanSpeedTemp = 0;
		let fanSpeedHum = 0;

		// Erster Fall: Temperaturdifferenz zu groß
		if (tempDifference > tempDiffThreshold) {
			fanSpeedTempDiff = 20;
		}

		// Zweiter Fall: Temperatur zu hoch
		if (avgTemp > desiredTemp + tempHyst) {
			const tempExcess = avgTemp - (desiredTemp + tempHyst);
			fanSpeedTemp = Math.min(100, tempExcess * 10); // Beispielhafte Regelung
		}

		// Zweiter Fall: Feuchtigkeit zu hoch
		if (avgHum > desiredHum + humHyst) {
			const humExcess = avgHum - (desiredHum + humHyst);
			fanSpeedHum = Math.min(100, humExcess * 10); // Beispielhafte Regelung
		}

		// Den höchsten Sollwert übernehmen
		this.isActive = Math.max(fanSpeedTempDiff, fanSpeedTemp, fanSpeedHum);

		return this.isActive;
	}
}
