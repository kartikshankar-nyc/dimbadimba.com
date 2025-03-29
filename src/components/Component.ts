export abstract class Component {
  protected element: HTMLElement;

  constructor(container: HTMLElement) {
    this.element = document.createElement('div');
    container.appendChild(this.element);
  }

  protected update(): void {
    // Override in subclasses
  }

  protected cleanup(): void {
    this.element.remove();
  }
} 