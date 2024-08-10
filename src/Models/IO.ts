export abstract class IO {
	private _readObjectID: string;
	private _current: any;
	valid: boolean;
	private validationFn?: (value: any) => boolean;

	constructor(objectID: string, validationFn?: (value: any) => boolean) {
		this._readObjectID = objectID;
		this._current = null;
		this.valid = false;
		this.validationFn = validationFn;
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

	private isValid(value: any): boolean {
		const defaultValidation = value !== null && value !== undefined;
		if (defaultValidation && this.validationFn) {
			return defaultValidation && this.validationFn(value);
		}
		return defaultValidation;
	}
}

export class Input extends IO {
	constructor(objectID: string, validationFn?: (value: any) => boolean) {
		super(objectID, validationFn);
	}
}

export class Output extends IO {
	desired: any;
	default: any;
	private _writeObjectID: string;

	constructor(
		readObjectID: string,
		writeObjectID: string,
		defaultValue: any = null,
		validationFn?: (value: any) => boolean,
	) {
		super(readObjectID, validationFn);
		this._writeObjectID = writeObjectID || readObjectID;
		this.desired = null;
		this.default = defaultValue;
	}

	get WriteOID(): string {
		return this._writeObjectID;
	}
}
