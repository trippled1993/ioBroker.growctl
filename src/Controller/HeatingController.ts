import { IController } from "./IController";

export class HeatingController implements IController {
	private isActive: boolean;

	constructor() {
		this.isActive = false; // Initialer Zustand
	}

	public shouldActivate(tempTop: number, tempBottom: number, desiredTemp: number, tempHyst: number): number {
		const avgTemp = (tempTop + tempBottom) / 2;

		if (!this.isActive && avgTemp < desiredTemp - tempHyst) {
			this.isActive = true;
		} else if (this.isActive && avgTemp > desiredTemp + tempHyst) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
