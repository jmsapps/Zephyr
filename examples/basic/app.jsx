import Zephyr, { signal, derived, effect } from "../../lib";

const count = signal(0);
const count2 = signal(0);
const isHidden = signal(true);
const doubled = derived(count, n => n * 2);

effect(() => {
  if (count.get() >= 5) {
    isHidden.set(false);
  }
  console.log("count", count.get());
  console.log("doubled", doubled.get());
}, [count, count2]);

document.body.appendChild(
  <div id="app">
    <button onclick={() => count.set(count.get() + 1)}>
      {derived(count, n => `Clicked ${n} times`)}
    </button>

    <button onclick={() => count2.set(count2.get() + 1)}>
      {derived(count2, n => `Clicked ${n} times`)}
    </button>

    <p>Double: {doubled}</p>

    <span data-count={count} disabled>
      {"inspect data-count"}
    </span>

    <br />
    <br />

    {derived(isHidden, h =>
      h ? (
        <div>Wait for it...</div>
      ) : (
        <div hidden={isHidden}>Hello world!</div>
      )
    )}
  </div>
);
