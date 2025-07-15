export abstract class AView {
    public abstract render(parent?: HTMLElement): void;
    public abstract dispose(): void;
}