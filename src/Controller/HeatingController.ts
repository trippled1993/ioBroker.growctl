import { IController } from "./IController";

export class HeatingController implements IController {
	private tempTop: number;
	private tempBottom: number;
	private desiredTemp: number;
	private tempHyst: number;

	constructor(tempTop: number, tempBottom: number, desiredTemp: number, tempHyst: number) {
		this.tempTop = tempTop;
		this.tempBottom = tempBottom;
		this.desiredTemp = desiredTemp;
		this.tempHyst = tempHyst;
	}

	public shouldActivate(): number {
		const avgTemp = (this.tempTop + this.tempBottom) / 2;
		if (avgTemp < this.desiredTemp - this.tempHyst) {
			return 100; // Vollständig aktivieren
		} else if (avgTemp > this.desiredTemp + this.tempHyst) {
			return 0; // Deaktivieren
		}
		return 0; // Deaktivieren
	}
}
