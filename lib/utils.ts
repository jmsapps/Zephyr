import { Signal, Subscriber, Props, Unsub } from "./types";
import { BOOLEAN_ATTRS } from "./constants";

export function signal<T>(initial: T): Signal<T> {
  let v = initial;
  const subs = new Set<Subscriber<T>>();
  return {
    get: () => v,
    set: (nv) => { if (nv !== v) { v = nv; subs.forEach(f => f(v)); } },
    sub: (fn) => { subs.add(fn); fn(v); return () => subs.delete(fn); }
  };
}

export function derived<A, B>(s: Signal<A>, fn: (a: A) => B): Signal<B> {
  const out = signal(fn(s.get()));
  s.sub(a => out.set(fn(a)));
  return out;
}

export function effect(fn: () => Unsub | void, deps?: Array<Signal<any>>) {
  let cleanup: Unsub | undefined;

  const run = () => {
    if (cleanup) cleanup();
    const res = fn();
    cleanup = typeof res === "function" ? res : undefined;
  };

  if (deps && deps.length > 0) {
    // subscribe to all deps
    const unsubs = deps.map(d => d.sub(run));
    run();
    return () => { unsubs.forEach(u => u()); if (cleanup) cleanup(); };
  } else {
    run();
    return () => { if (cleanup) cleanup(); };
  }
}

export function isSignal(x: unknown): x is Signal<unknown> {
  return !!x && typeof x === 'object' && 'get' in (x as any) && 'sub' in (x as any);
}

function node(value: any): Node {
  if (value instanceof Node) return value;

  if (isSignal(value)) {
    let cur: Node;
    const init = value.get?.();

    cur = init instanceof Node
      ? init
      : (
        init == null || init === false
          ? document.createTextNode("") : document.createTextNode(String(init))
      );

    value.sub((v: any) => {
      const next = v instanceof Node
        ? v
        : (
          v == null || v === false
            ? document.createTextNode("") : document.createTextNode(String(v))
        );
      (cur as any).replaceWith(next);
      cur = next;
    });

    return cur;
  }

  if (value == null || value === false) {
    return document.createTextNode("")
  };

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return document.createTextNode(String(value));
  }

  return document.createTextNode("");
}

export function el(tag: string, props?: Props, ...children: Array<string | number | boolean | Node | Signal<unknown> | null | undefined>) {
  const e = document.createElement(tag);

  const apply = (k: string, v: any) => {
    if (k.startsWith('on') && typeof v === 'function') {
      (e as any)[k.toLowerCase()] = v;
      return;
    }
    if (BOOLEAN_ATTRS.has(k)) {
      const on = !!v;
      (e as any)[k] = on;                 // keep DOM property in sync
      if (on) e.setAttribute(k, "");      // present attribute => truthy
      else e.removeAttribute(k);          // remove when false
      return;
    }
    if (v === true) {
      e.setAttribute(k, "");
    } else if (v === false || v == null) {
      e.removeAttribute(k);
    } else {
      e.setAttribute(k, String(v));
    }
  };

  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (isSignal(v)) {
        // set initial
        apply(k, (v as any).get?.() ?? undefined);
        // update on change
        (v as any).sub((nv: any) => apply(k, nv));
      } else {
        apply(k, v);
      }
    }
  }

  for (const c of children) e.appendChild(node(c));

  return e;
}
