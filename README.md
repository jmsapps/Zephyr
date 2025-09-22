# Zephyr

> **Zephyr** is a tiny reactive TypeScript framework built on signals.
> Lightweight, dependency-free, and fast.

## ✨ Features

- ⚡ **Signals** – reactive state with subscriptions
- 🔄 **Derived values** – computed state updates automatically
- 🎯 **Effects** – run side effects when state changes
- 🧩 **DOM bindings** – update text, attributes, and boolean props with signals
- 🪶 **Lightweight** – no dependencies, just plain TypeScript/JavaScript
- 🖋 **Optional JSX Support** – write UI using familiar JSX syntax with your custom `el()` factory

---

## 🚀 Getting Started

Clone the repo and run the basic example:

```bash
git clone https://github.com/jmsapps/zephyr.git
cd zephyr/examples/basic
yarn && yarn dev
```

This runs the **vanilla `el()` API** example.

---

## 🖋 JSX Example

Zephyr also supports JSX (no React required). Run the JSX example with:

```bash
cd zephyr/examples/basic
yarn && yarn dev-jsx
```

Ensure your `tsconfig.json` uses the custom JSX factory:

```jsonc
{
  "compilerOptions": {
    "jsxFactory": "Zephyr" // maps <div> → Zephyr("div", ...)
  }
}
```

Example JSX usage:

```jsx
import Zephyr, { signal, derived } from "../../lib/utils";

const count = signal(0);
const doubled = derived(count, (n) => n * 2);

document.body.appendChild(
  <div id="app">
    <button onclick={() => count.set(count.get() + 1)}>
      {derived(count, (n) => `Clicked ${n} times`)}
    </button>
    <p>Double: {doubled}</p>
  </div>
);
```

---

## 📂 Project Structure

- **lib/** – core framework utilities (signals, derived, effects, DOM helpers)
- **examples/basic/** – basic usage examples (`el()` API and JSX)
- **examples/complex/** – coming soon: more advanced examples

---

## 📝 License

GPL 2.0 © [jmsapps](https://github.com/jmsapps)
