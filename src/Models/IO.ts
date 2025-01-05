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

// Klasse ScalableInput erbt von Input. Sie erweitert Input um die Eigenschaften "min" und "max". Der Output erfolgt in %. Min = 0%, Max = 100%. Außerdem wird eine Methode "scale" hinzugefügt.
export class ScalableInput extends Input {
	public min: number;
	public max: number;

	constructor(name: string, objectID: string, min: number, max: number, validationFn?: (value: any) => boolean) {
		super(name, objectID, validationFn);
		this.min = min;
		this.max = max;
	}

	get IOName(): string {
		return "IO." + this._name + ".Raw";
	}

	get ScaledName(): string {
		return "IO." + this._name + ".Value";
	}

	getScaledValue(): number {
		let inverted = false;
		// Wenn min und max gleich sind, gib -99 zurück -> Fehler
		if (this.max == this.min) {
			return -99;
		}

		// Wenn min > max, setze inverted auf true -> Wertebereich ist invertiert
		if (this.max < this.min) {
			inverted = true;
		}

		if ((this._current < this.min && !inverted) || (this._current > this.min && inverted)) {
			return 0;
		}
		if ((this._current > this.max && !inverted) || (this._current < this.max && inverted)) {
			return 100;
		}

		return ((this._current - this.min) / (this.max - this.min)) * 100;
	}
	//Überschreibt getter current um skalierten Wert zurückzugeben
	get current(): any {
		return this.getScaledValue();
	}
	set current(value: any) {
		this._current = value;
		this.valid = this.isValid(value);
	}

	getRawValue(): number {
		return this._current;
	}
}

export class Output extends IO {
	desired: any;
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
		this.desired = null;
		this.default = defaultValue;
	}

	get WriteOID(): string {
		return this._writeObjectID;
	}
}
