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

export function effect<T>(fn: () => Unsub | void, deps?: Array<Signal<any>>) {
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

export function node(value: string | Node | Signal<unknown>): Node {
  if (value instanceof Node) return value;
  if (typeof value === 'string') return document.createTextNode(value);
  const t = document.createTextNode('');
  (value as Signal<unknown>).sub((v) => { t.textContent = String(v); });
  return t;
}

export function el(tag: string, props?: Props, ...children: Array<string | Node | Signal<unknown>>) {
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
