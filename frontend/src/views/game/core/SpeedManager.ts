export class SpeedManager {
    private _speedMultiplier: number = 1;

    constructor(defaultMultiplier: number) {
        this._speedMultiplier = defaultMultiplier;
    }

    public setSpeedMultiplier(multiplier: number): void {
        this._speedMultiplier = multiplier;
    }

    public get speedMultiplier() { return this._speedMultiplier; }

    public applyToBall(ball: any): void {
        if (ball && ball.velocity) {
            ball.velocity = ball.velocity.scale(this._speedMultiplier);
        }
    }
}
