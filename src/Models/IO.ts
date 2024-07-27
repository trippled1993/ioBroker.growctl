export abstract class IO {
	objectID: string;
	current: any;

	constructor(objectID: string) {
		this.objectID = objectID;
		this.current = null;
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

	constructor(objectID: string, defaultValue: any = null) {
		super(objectID);
		this.desired = null;
		this.default = defaultValue;
	}
}
