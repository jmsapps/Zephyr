export type Props = Record<string, any>;

export type Unsub = () => void;
export type Subscriber<T> = (v: T) => void;

export interface Signal<T> {
  get(): T;
  set(v: T): void;
  sub(fn: Subscriber<T>): Unsub;
}

export type Child =
  | string | number | boolean
  | Node
  | Signal<unknown>
  | Array<Child>
  | null | undefined;
