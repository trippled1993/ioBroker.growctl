export abstract class IO {
	private _readObjectID: string;
	protected _current: any;
	protected _name: string;
	valid: boolean;
	private validationFn?: (value: any) => boolean;

	constructor(name: string, objectID: string, validationFn?: (value: any) => boolean) {
		this._name = name;
		this._readObjectID = objectID;
		this._current = null;
		this.valid = false;
		this.validationFn = validationFn;
	}

	get IOName(): string {
		return "IO." + this._name + ".Value";
	}
	get ValidName(): string {
		return "IO." + this._name + ".Valid";
	}

	get ReadOID(): string {
		return this._readObjectID;
	}
	get current(): any {
		return this._current;
	}

	set current(value: any) {
		this._current = value;
		this.valid = this.isValid(value);
	}

	protected isValid(value: any): boolean {
		const defaultValidation = value !== null && value !== undefined;
		if (defaultValidation && this.validationFn) {
			return defaultValidation && this.validationFn(value);
		}
		return defaultValidation;
	}
}

export class Input extends IO {
	constructor(name: string, objectID: string, validationFn?: (value: any) => boolean) {
		super(name, objectID, validationFn);
	}
}
export class Output extends IO {
	protected _desired: any;

	default: any;
	private _writeObjectID: string;

	constructor(
		name: string,
		readObjectID: string,
		writeObjectID: string,
		defaultValue: any = null,
		validationFn?: (value: any) => boolean,
	) {
		super(name, readObjectID, validationFn);
		this._writeObjectID = writeObjectID || readObjectID;
		this._desired = null;
		this.default = defaultValue;
	}

	get WriteOID(): string {
		return this._writeObjectID;
	}

	get desired(): any {
		return this._desired;
	}
	set desired(value: any) {
		this._desired = value;
	}
}

export class ScaleHelper {
	public min: number;
	public max: number;

	constructor(min: number, max: number) {
		this.min = min;
		this.max = max;
	}

	getScaledValue(rawValue: number): number {
		// Wenn min und max gleich sind, gib -99 zurück -> Fehler
		if (this.max == this.min) return -99;

		// Wenn min > max, setze inverted auf true -> Wertebereich ist invertiert
		const inverted = this.max < this.min;

		if ((rawValue < this.min && !inverted) || (rawValue > this.min && inverted)) {
			return 0;
		}
		if ((rawValue > this.max && !inverted) || (rawValue < this.max && inverted)) {
			return 100;
		}
		return ((rawValue - this.min) / (this.max - this.min)) * 100;
	}

	getRawValue(scaledValue: number): number {
		// Wenn min und max gleich sind, gib -99 zurück -> Fehler
		if (this.max == this.min) return -99;

		// Wenn min > max, setze inverted auf true -> Wertebereich ist invertiert
		const inverted = this.max < this.min;

		if ((scaledValue < 0 && !inverted) || (scaledValue > 100 && inverted)) {
			return this.min;
		}
		if ((scaledValue > 100 && !inverted) || (scaledValue < 0 && inverted)) {
			return this.max;
		}
		return (scaledValue / 100) * (this.max - this.min) + this.min;
	}
}

export class ScalableInput extends Input {
	private scaler: ScaleHelper;

	constructor(name: string, objectID: string, min: number, max: number, validationFn?: (value: any) => boolean) {
		super(name, objectID, validationFn);
		this.scaler = new ScaleHelper(min, max);
	}
	get IOName(): string {
		return "IO." + this._name + ".Raw";
	}

	get ScaledName(): string {
		return "IO." + this._name + ".Value";
	}
	get current(): any {
		return this.getScaledValue();
	}
	set current(value: any) {
		this._current = value;
		this.valid = this.isValid(value);
	}

	setMinMax(min: number, max: number): void {
		this.scaler = new ScaleHelper(min, max);
	}

	getScaledValue(): number {
		return this.scaler.getScaledValue(this._current);
	}

	getRawValue(): number {
		return this._current;
	}
}

export class ScalableOutput extends Output {
	private scaler: ScaleHelper;

	constructor(
		name: string,
		readObjectID: string,
		writeObjectID: string,
		min: number,
		max: number,
		defaultValue: any = null,
		validationFn?: (value: any) => boolean,
	) {
		super(name, readObjectID, writeObjectID, defaultValue, validationFn);
		this.scaler = new ScaleHelper(min, max);
	}
	get IOName(): string {
		return "IO." + this._name + ".Raw";
	}

	get ScaledName(): string {
		return "IO." + this._name + ".Value";
	}
	get current(): any {
		return this.getScaledValue();
	}
	set current(value: any) {
		this._current = this.scaler.getRawValue(value);
		this.valid = this.isValid(value);
	}

	get desired(): any {
		return this.scaler.getScaledValue(this._desired);
	}
	set desired(value: any) {
		this._desired = this.scaler.getRawValue(value);
	}

	setCurrentRaw(value: any): void {
		this._current = value;
		this.valid = this.isValid(this.scaler.getScaledValue(value));
	}

	getScaledValue(): number {
		return this.scaler.getScaledValue(this._current);
	}

	getRawValue(): number {
		return this._current;
	}

	scaleToRawValue(value: any): number {
		return this.scaler.getRawValue(value);
	}
}
