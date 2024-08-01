import { AdapterInstance } from "@iobroker/adapter-core"; // Importiere den Adapter-Typ
import { IAdapterConfig } from "./AdapterConfig";
import { IODefinitions } from "./Models/IODefinitions";

export class HeartbeatManager {
	private adapter: AdapterInstance;
	private ioDefinitions: IODefinitions;
	private config: IAdapterConfig;
	private previousHeartbeatFromClient: string | null = null;
	private heartbeatTimeout: NodeJS.Timeout | null = null;
	private nextHeartbeatTime: number | null = null;
	private onHeartbeatChange: (isConnected: boolean) => void;
	private isConnected: boolean;
	private initialCheckDone: boolean = false;

	constructor(
		adapter: AdapterInstance,
		ioDefinitions: IODefinitions,
		config: IAdapterConfig,
		onHeartbeatChange: (isConnected: boolean) => void,
	) {
		this.adapter = adapter;
		this.ioDefinitions = ioDefinitions;
		this.config = config;
		this.onHeartbeatChange = onHeartbeatChange;
		this.isConnected = false; // Initialer Zustand
	}

	public initialize(): void {
		this.startHeartbeatTimeout();
		this.nextHeartbeatTime = Date.now() + this.config.generalSettings.clientHeartbeatInterval;
		this.subscribeToHeartbeat();
		this.checkHeartbeat(null);
	}

	private startHeartbeatTimeout(): void {
		const heartbeatTimeoutMs = this.config.generalSettings.clientHeartbeatTimeout * 1000;

		this.heartbeatTimeout = setInterval(async () => {
			this.checkHeartbeat(null);
		}, heartbeatTimeoutMs);
	}

	private subscribeToHeartbeat(): void {
		this.adapter.subscribeForeignStates(this.ioDefinitions.heartbeatFromClient.ReadOID);
		this.adapter.on("stateChange", (id, state) => {
			if (id === this.ioDefinitions.heartbeatFromClient.ReadOID && state && !this.isConnected) {
				this.checkHeartbeat(String(state.val));
			}
		});
	}

	// Heartbeat prüfen
	private async checkHeartbeat(currentHeartbeat: string | null): Promise<void> {
		this.adapter.log.debug(
			"HeartbeatTimeout prüfen... PreviousHeartbeat: " +
				this.previousHeartbeatFromClient +
				" LastConnected: " +
				this.isConnected,
		);

		currentHeartbeat = await this.getCurrentHeartbeat(currentHeartbeat);
		if (
			(currentHeartbeat && this.previousHeartbeatFromClient === null) ||
			this.previousHeartbeatFromClient === currentHeartbeat
		) {
			this.heartbeatLost();
		} else {
			this.heartbeatOk();
		}

		this.previousHeartbeatFromClient = currentHeartbeat;
		this.initialCheckDone = true;

		this.adapter.log.debug(
			"HeartbeatTimeout geprüft. CurrentHeartbeat: " + currentHeartbeat + " Connected: " + this.isConnected,
		);
	}

	private async getCurrentHeartbeat(currentHeartbeat: string | null): Promise<string | null> {
		if (!currentHeartbeat) {
			try {
				const state = await this.ioDefinitions.readIO(this.ioDefinitions.heartbeatFromClient);
				return state ? String(state) : "";
			} catch (err) {
				this.adapter.log.error("Heartbeat konnte nicht ausgelesen werden ..." + err);
				return this.previousHeartbeatFromClient;
			}
		}
		return currentHeartbeat;
	}

	private heartbeatLost(): void {
		if (this.isConnected) {
			this.onHeartbeatChange(false);
			this.isConnected = false;
			this.adapter.log.error(
				"Kein Heartbeat vom Client erhalten seit " +
					this.config.generalSettings.clientHeartbeatTimeout +
					" Sekunden.",
			);
		}
	}

	private heartbeatOk(): void {
		if (!this.isConnected && this.initialCheckDone) {
			this.onHeartbeatChange(true);
			this.isConnected = true;
			this.adapter.log.info("Heartbeat von Client wieder vorhanden.");
		}
	}

	public checkAndSendHeartbeat(): void {
		if (this.nextHeartbeatTime !== null && Date.now() >= this.nextHeartbeatTime) {
			this.ioDefinitions.heartbeatToClient.desired = Date.now();
			this.nextHeartbeatTime = Date.now() + this.config.generalSettings.clientHeartbeatInterval;
		}
	}
}
