import { signal, derived, el, effect } from '../../lib/utils';

// ultra-cheap text binding for plain text nodes
const text = (s: any) => {
  const t = document.createTextNode(String(s.get()));
  s.sub((v: any) => { t.nodeValue = String(v); });
  return t;
};

const count = signal(0);
const count2 = signal(0);
const isHidden = signal(true);
const doubled = derived(count, n => n * 2);

// derived that returns a fragment (array of nodes) — updates only that slice
const statusFrag = derived(count, n => [
  'Status: ',
  n % 2 === 0 ? el('strong', undefined, 'even') : el('em', undefined, 'odd'),
  ' | n=' + n
]);

// list rendering via a single signal → many <li> nodes
const items = signal<string[]>(['#1', '#2']);
const listView = derived(items, arr =>
  arr.length
    ? arr.map((x, i) => el('li', { 'data-i': i, title: `Item ${i}` }, x))
    : []
);

// effect with deps + cleanup example
const ticking = signal(false);
const ticks = signal(0);
effect(() => {
  if (!ticking.get()) return;
  const id = setInterval(() => ticks.set(ticks.get() + 1), 1000);
  return () => clearInterval(id);
}, [ticking]);

effect(() => {
  if (count.get() >= 5 && listView.get().length > 0) {
    isHidden.set(false)
  } else {
    isHidden.set(true)
  }

  console.log('count', count.get());
  console.log('doubled', doubled.get());
}, [count, listView]);

document.body.appendChild(
  el('div', { id: 'app' },

    el('h1', undefined, 'Demo'),

    // buttons + cheap text bindings (no re-create; only text node updates)
    el('div', undefined,
      el('button', { onclick: () => count.set(count.get() + 1) },
        'A: ', text(count)
      ),
      ' ',
      el('button', { onclick: () => count2.set(count2.get() + 1) },
        'B: ', text(count2)
      ),
      ' ',
      el('button', { onclick: () => items.set([...items.get(), `#${items.get().length + 1}`]) }, 'Add item'),
      ' ',
      el('button', { onclick: () => items.set(items.get().slice(0, -1)) }, 'Pop'),
      ' ',
      el('button', { onclick: () => items.set([]) }, 'Clear')
    ),

    el('p', undefined, 'Double: ', text(doubled)),
    el('p', { 'data-count': count, draggable: true }, '(inspect data-count)'),

    el('p', undefined, statusFrag), // fragment from a signal (array of nodes)

    el('label', undefined,
      el('input', {
        name: 'input_1',
        type: 'checkbox',
        checked: ticking,
        onclick: () => ticking.set(!ticking.get())
      }),
      ' ticking (ticks=', text(ticks), ')'
    ),

    el('hr'),

    el('p', undefined, 'Hello section uses boolean attr reactivity:'),
    // this <div> stays mounted; only its hidden prop toggles
    el('div', { hidden: isHidden, title: derived(count, n => `n is ${n}`) }, 'Hello world!'),

    el('p', undefined, 'Conditional block (entire region swaps between two nodes):'),
    derived(isHidden, h => h
      ? el('div', undefined, 'Wait for it...')
      : el('div', undefined, 'Revealed!')
    ),

    el('h2', undefined, 'Items'),
    el('ul', undefined, listView), // one signal → many <li> children, updated in place

    el('p', undefined,
      'Mixed static/dynamic siblings preserved: ',
      'before | ',
      derived(count, n => ['[dyn:', n, ']']), // array fragment
      ' | after'
    ),
  )
);
