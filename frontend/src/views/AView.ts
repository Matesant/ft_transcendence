export abstract class AView {
    public abstract render(): void | Promise<void>;
    public abstract dispose(): void;
}