export interface IController {
	shouldActivate(avgValue: number, additionalValue?: number): number;
}
