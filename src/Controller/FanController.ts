import { IController } from "./IController";

export class FanController implements IController {
	private isActive: number;

	constructor() {
		this.isActive = 0; // Initialer Zustand
	}

	public shouldActivate(
		tempTop: number,
		tempBottom: number,
		hum: number,
		temp: number,
		tempDiffThreshold: number,
		desiredTemp: number,
		tempHyst: number,
		maxTemp: number,
		maxHumidity: number,
		fanMinPercent: number,
	): number {
		const tempDifference = Math.abs(tempTop - tempBottom);

		const fanSpeedMin = fanMinPercent;
		let fanSpeedTempDiff = 0;
		let fanSpeedTemp = 0;
		let wasOnByTemp = false;

		// Erster Fall: Temperaturdifferenz zu groß
		if (tempDifference > tempDiffThreshold) {
			fanSpeedTempDiff = 30;
		}

		// Zweiter Fall: Temperatur zu hoch. Lüfter abhängig von Temperaturabweichung regeln.
		const tempExcess = temp - desiredTemp;
		// Temperatur übersteigt hysterese oder Lüfter wurde bereits eingeschaltet
		if (temp >= desiredTemp + tempHyst || wasOnByTemp) {
			// Regelung Lüfter zwischen 20 & 100% (100% bei 1,25xHysterese)
			fanSpeedTemp = Math.min(100, 20 + (tempExcess / (tempHyst * 1.25)) * 80);
			wasOnByTemp = true;
		}
		// Bei unterschreiten der Hysterese, Flag zurücksetzen
		if (temp <= desiredTemp - tempHyst) {
			wasOnByTemp = false;
			fanSpeedTemp = 0;
		}

		// Den höchsten Sollwert übernehmen
		this.isActive = Math.max(fanSpeedTempDiff, fanSpeedTemp, fanSpeedMin);

		// Wenn die maximale Temperatur erreicht ist, Lüfter 100%
		if (temp >= maxTemp) {
			this.isActive = 100;
		}
		//wenn die maximale Luftfeuchtigkeit erreicht ist, Lüfter deaktivieren
		if (hum >= maxHumidity) {
			this.isActive = 0;
		}

		return this.isActive;
	}
}
