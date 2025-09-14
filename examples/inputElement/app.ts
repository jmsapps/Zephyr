import { signal, el } from '../../lib/utils';

const text = signal('');

document.body.appendChild(
  el('div', {},
    el('input', {
      type: 'text',
      placeholder: 'Enter text',
      value: text, // signal prop: keeps value in sync
      oninput: (e: Event) => text.set((e.target as HTMLInputElement).value)
    }),
    el('button', {
      onclick: (e: Event) => window.alert(text.get())
    }, 'Click me'),
    el('p', {}, text)
  )
);
