import { IController } from "./IController";

export class DehumidifierController implements IController {
	private humTop: number;
	private humBottom: number;
	private desiredHum: number;
	private humHyst: number;

	constructor(humTop: number, humBottom: number, desiredHum: number, humHyst: number) {
		this.humTop = humTop;
		this.humBottom = humBottom;
		this.desiredHum = desiredHum;
		this.humHyst = humHyst;
	}

	public shouldActivate(): number {
		const avgHum = (this.humTop + this.humBottom) / 2;
		if (avgHum > this.desiredHum + this.humHyst) {
			return 100; // Vollständig aktivieren
		}
		return 0; // Deaktivieren
	}
}
