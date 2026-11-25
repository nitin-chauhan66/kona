/**
 * Generic bounded undo/redo snapshot stack.
 */
export class HistoryManager<T> {
  private stack: T[] = [];
  private cursor = -1;
  private readonly maxEntries: number;
  private readonly equals: (a: T, b: T) => boolean;

  constructor(maxEntries = 40, equals: (a: T, b: T) => boolean = (a, b) => a === b) {
    this.maxEntries = maxEntries;
    this.equals = equals;
  }

  public push(snapshot: T): void {
    if (this.cursor >= 0 && this.equals(this.stack[this.cursor], snapshot)) {
      return;
    }
    this.stack = this.stack.slice(0, this.cursor + 1);
    this.stack.push(snapshot);
    if (this.stack.length > this.maxEntries) {
      this.stack.shift();
    }
    this.cursor = this.stack.length - 1;
  }

  public canUndo(): boolean {
    return this.cursor > 0;
  }

  public canRedo(): boolean {
    return this.cursor >= 0 && this.cursor < this.stack.length - 1;
  }

  public undo(): T | null {
    if (!this.canUndo()) return null;
    this.cursor--;
    return this.stack[this.cursor];
  }

  public redo(): T | null {
    if (!this.canRedo()) return null;
    this.cursor++;
    return this.stack[this.cursor];
  }

  public reset(initialSnapshot?: T): void {
    this.stack = [];
    this.cursor = -1;
    if (initialSnapshot !== undefined) {
      this.push(initialSnapshot);
    }
  }
}
