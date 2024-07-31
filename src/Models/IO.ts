export abstract class IO {
	private _readObjectID: string;
	current: any;

	constructor(objectID: string) {
		this._readObjectID = objectID;
		this.current = null;
	}

	get ReadOID(): string {
		return this._readObjectID;
	}
}

export class Input extends IO {
	constructor(objectID: string) {
		super(objectID);
	}
}

export class Output extends IO {
	desired: any;
	default: any;
	private _writeObjectID: string;

	constructor(readObjectID: string, writeObjectID: string, defaultValue: any = null) {
		super(readObjectID);
		this._writeObjectID = writeObjectID || readObjectID;
		this.desired = null;
		this.default = defaultValue;
	}

	get WriteOID(): string {
		return this._writeObjectID;
	}
}
