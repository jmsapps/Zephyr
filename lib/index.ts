import { Signal, Subscriber, Props, Unsub, Child } from './types';
import { BOOLEAN_ATTRS, SIGNAL_TAG } from './constants';

export function signal<T>(initial: T): Signal<T> {
  let v = initial;
  const subs = new Set<Subscriber<T>>();
  return {
    [SIGNAL_TAG]: true,
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
    cleanup = typeof res === 'function' ? res : undefined;
  };

  if (deps && deps.length > 0) {
    const unsubs = deps.map(d => d.sub(run));
    run();
    return () => { unsubs.forEach(u => u()); if (cleanup) cleanup(); };
  } else {
    run();
    return () => { if (cleanup) cleanup(); };
  }
}

function isSignal(x: unknown): x is Signal<unknown> {
  return !!x &&
    typeof x === "object" &&
    (x as any)[SIGNAL_TAG] === true &&
    typeof (x as any).get === "function" &&
    typeof (x as any).sub === "function";
}

function toNode(v: any): Node {
  if (v instanceof Node) return v;
  if (v == null || v === false) return document.createTextNode('');
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return document.createTextNode(String(v));
  }
  return document.createTextNode('');
}

function removeBetween(parent: Node, start: Node, end: Node) {
  let n = start.nextSibling;
  while (n && n !== end) {
    const next = n.nextSibling;
    parent.removeChild(n);
    n = next;
  }
}

function mountChild(parent: Node, child: Child): Unsub | void {
  if (child == null || child === false) return;

  // Flatten arrays (static or mixed)
  if (Array.isArray(child)) {
    const unsubs = child.map(c => mountChild(parent, c)).filter(Boolean) as Unsub[];
    if (unsubs.length) return () => unsubs.forEach(u => u());
    return;
  }

  // Reactive child: mount between two anchors and update only that slice
  if (isSignal(child)) {
    const start = document.createTextNode('');
    const end = document.createTextNode('');
    parent.appendChild(start);
    parent.appendChild(end);

    const render = (val: any) => {
      // Support signals that yield a single value or an array of values/nodes
      const items = Array.isArray(val) ? val : [val];
      const nodes = items.map(toNode);

      // Replace only between anchors
      removeBetween(parent, start, end);
      for (const n of nodes) parent.insertBefore(n, end);
    };

    // initial + subscribe
    render((child as any).get?.());
    const unsub = (child as any).sub(render);

    // cleanup (removes content + anchors)
    return () => {
      unsub?.();
      removeBetween(parent, start, end);
      parent.removeChild(start);
      parent.removeChild(end);
    };
  }

  // Static child
  parent.appendChild(toNode(child));
}

export default function Zephyr(tag: string, props?: Props, ...children: Child[]) {
  const e = document.createElement(tag);

  const apply = (k: string, v: any) => {
    if (k.startsWith('on') && typeof v === 'function') {
      (e as any)[k.toLowerCase()] = v;
      return;
    }
    if (BOOLEAN_ATTRS.has(k)) {
      const on = !!v;
      (e as any)[k] = on;
      if (on) e.setAttribute(k, '');
      else e.removeAttribute(k);
      return;
    }
    if (v === true) {
      e.setAttribute(k, '');
    } else if (v === false || v == null) {
      e.removeAttribute(k);
    } else {
      e.setAttribute(k, String(v));
    }
  };

  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (isSignal(v)) {
        apply(k, (v as any).get?.());
        (v as any).sub((nv: any) => apply(k, nv));
      } else {
        apply(k, v);
      }
    }
  }

  // Mount each child precisely; only dynamic regions update
  for (const c of children) mountChild(e, c);

  return e;
}
