import el, { signal, derived, effect } from "../../lib";

const count = signal(0);
const count2 = signal(0);
const isHidden = signal(true);
const doubled = derived(count, n => n * 2);

effect(() => {
  if (count.get() >= 5) {
    isHidden.set(false)
  }
  console.log("count", count.get());
  console.log("doubled", doubled.get());
}, [count, count2]);

document.body.appendChild(
  el('div', { id: 'app' },
    el('button',
      { onclick: () => count.set(count.get() + 1) },
      derived(count, n => `Clicked ${n} times`)
    ),
    el('button',
      { onclick: () => count2.set(count2.get() + 1) },
      derived(count2, n => `Clicked ${n} times`)
    ),
    el('p', undefined, 'Double: ', doubled),
    el('span', { 'data-count': count, disabled: true }, '(inspect data-count)'),
    el('br', undefined, ''),
    el('br', undefined, ''),
    derived(isHidden, h => h ?
      el('div', undefined, 'Wait for it...') :
      el('div', { hidden: isHidden }, 'Hello world!')
    ),
  )
);
