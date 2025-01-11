import { IController } from "./IController";

export class HeatingControllerPID implements IController {
	private isActive: boolean;
	private isLocked: boolean;

	// Zustandsgrößen für den Regler
	private integrator: number;
	private lastUpdate: number;

	// PWM-Einstellungen
	private cycleTime: number; // PWM-Zyklus in Sekunden (z.B. 30s)
	private cycleStart: number; // Wann die aktuelle PWM-Periode startete

	// Laufzeit-Logik für Relais
	private minOnTime: number; // Mindest-EIN-Zeit (Sekunden)
	private minOffTime: number; // Mindest-AUS-Zeit (Sekunden)
	private lastHeaterChange: number; // Wann wurde zuletzt EIN/AUS gewechselt?

	constructor() {
		this.isActive = false; // Initialer Zustand
		this.isLocked = false; // Initialer Zustand
		this.integrator = 0;
		this.lastUpdate = Date.now();
		this.lastHeaterChange = this.lastUpdate;
		this.cycleStart = this.lastUpdate;
		this.minOnTime = 30;
		this.minOffTime = 30;
		this.cycleTime = 60;
	}

	public shouldActivate(
		temp: number,
		desiredTemp: number,
		maxTemp: number,
		kp: number,
		ki: number,
		minOnTime: number,
		minOffTime: number,
		cycleTime: number,
	): number {
		this.minOnTime = minOnTime;
		this.minOffTime = minOffTime;
		this.cycleTime = cycleTime;

		// Wenn die maximale Temperatur erreicht ist, deaktiviere die Heizung
		if (temp >= maxTemp) {
			this.isLocked = true;
		} else if (temp <= maxTemp - 0.5) {
			this.isLocked = false;
		}

		const now = Date.now();
		const dt = (now - this.lastUpdate) / 1000; // in Sekunden
		this.lastUpdate = now;

		// ─────────────────────────────────────────────────────────────
		// 2) PI-Regler berechnen => Stellwert in % (0..100)
		// ─────────────────────────────────────────────────────────────
		const error = desiredTemp - temp;
		// P-Anteil
		const pTerm = kp * error;
		// I-Anteil
		this.integrator += error * dt;
		const iTerm = ki * this.integrator;

		let output = pTerm + iTerm;
		// Begrenzen auf [0..100]
		if (output > 100) output = 100;
		if (output < 0) output = 0;

		// Falls locked => Zwangsweise 0% (Heizung aus)
		if (this.isLocked) {
			output = 0;
		}

		// ─────────────────────────────────────────────────────────────
		// 3) PWM-Berechnung: Bestimme, welcher Teil des cycleTime
		//    "Heizung EIN" sein soll.
		// ─────────────────────────────────────────────────────────────
		const cycleElapsed = (now - this.cycleStart) / 1000; // s
		if (cycleElapsed >= this.cycleTime) {
			// Neue Periode starten
			this.cycleStart = now;
		}

		// PWM: Wenn output=75 => 75% der cycleTime soll EIN sein
		const onTime = (output / 100) * this.cycleTime;
		// Aktuelle Sekunde in der Periode:
		const currentCycleSec = (now - this.cycleStart) / 1000;

		// "Theoretischer" Heizwunsch anhand PWM
		const desiredHeating = currentCycleSec <= onTime;

		// ─────────────────────────────────────────────────────────────
		// 4) Mindestlaufzeiten (Min On/Off) wahren
		// ─────────────────────────────────────────────────────────────
		const timeSinceChange = (now - this.lastHeaterChange) / 1000;

		let nextState = this.isActive; // Default: Beibehalten

		if (this.isActive) {
			// Wir sind EIN
			// Schalte erst dann AUS, wenn "desiredHeating" = false
			// UND minOnTime erfüllt
			if (!desiredHeating && timeSinceChange >= this.minOnTime) {
				nextState = false;
				this.lastHeaterChange = now;
			}
		} else {
			// Wir sind AUS
			// Schalte erst dann EIN, wenn "desiredHeating" = true
			// UND minOffTime erfüllt
			if (desiredHeating && timeSinceChange >= this.minOffTime) {
				nextState = true;
				this.lastHeaterChange = now;
			}
		}

		this.isActive = nextState;

		// Wenn die Heizung gesperrt ist, schalte sie aus
		if (this.isLocked) {
			this.isActive = false;
		}

		return this.isActive ? 100 : 0;
	}
}
