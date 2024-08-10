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
		desiredTemp: number,
		tempHyst: number,
		maxTemp: number,
		maxHumidity: number,
		fanMinPercent: number,
	): number {
		const tempDifference = Math.abs(tempTop - tempBottom);
		const avgHum = (humTop + humBottom) / 2;
		const avgTemp = (tempTop + tempBottom) / 2;

		const fanSpeedMin = fanMinPercent;
		let fanSpeedTempDiff = 0;
		let fanSpeedTemp = 0;
		let wasOnByTemp = false;

		// Erster Fall: Temperaturdifferenz zu groß
		if (tempDifference > tempDiffThreshold) {
			fanSpeedTempDiff = 30;
		}

		// Zweiter Fall: Temperatur zu hoch. Lüfter abhängig von Temperaturabweichung regeln.
		const tempExcess = avgTemp - desiredTemp;
		// Temperatur übersteigt hysterese oder Lüfter wurde bereits eingeschaltet
		if (avgTemp > desiredTemp + tempHyst || wasOnByTemp) {
			// Regelung Lüfter zwischen 20 & 100% (100% bei doppelter Hysterese)
			fanSpeedTemp = Math.min(100, 20 + (tempExcess / (tempHyst * 2)) * 80);
			wasOnByTemp = true;
		}
		// Bei unterschreiten der Hysterese, Flag zurücksetzen
		if (avgTemp < desiredTemp - tempHyst) {
			wasOnByTemp = false;
			fanSpeedTemp = 0;
		}

		// Den höchsten Sollwert übernehmen
		this.isActive = Math.max(fanSpeedTempDiff, fanSpeedTemp, fanSpeedMin);

		// Wenn die maximale Temperatur erreicht ist, Lüfter 100%
		if (avgTemp >= maxTemp) {
			this.isActive = 100;
		}
		//wenn die maximale Luftfeuchtigkeit erreicht ist, Lüfter deaktivieren
		if (avgHum >= maxHumidity) {
			this.isActive = 0;
		}

		return this.isActive;
	}
}
