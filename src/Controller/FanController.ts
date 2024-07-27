import { IController } from "./IController";

export class FanController implements IController {
	private tempTop: number;
	private tempBottom: number;
	private humTop: number;
	private humBottom: number;
	private tempDiffThreshold: number;
	private desiredHum: number;
	private humHyst: number;

	constructor(
		tempTop: number,
		tempBottom: number,
		humTop: number,
		humBottom: number,
		tempDiffThreshold: number,
		desiredHum: number,
		humHyst: number,
	) {
		this.tempTop = tempTop;
		this.tempBottom = tempBottom;
		this.humTop = humTop;
		this.humBottom = humBottom;
		this.tempDiffThreshold = tempDiffThreshold;
		this.desiredHum = desiredHum;
		this.humHyst = humHyst;
	}

	public shouldActivate(): number {
		const tempDifference = Math.abs(this.tempTop - this.tempBottom);
		const avgHum = (this.humTop + this.humBottom) / 2;
		if (tempDifference > this.tempDiffThreshold || avgHum > this.desiredHum + this.humHyst) {
			return 100; // Vollständig aktivieren
		}
		return 0; // Deaktivieren
	}
}
