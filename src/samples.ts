// Seed content + loadable samples for the playground. Kept in TypeScript (not
// fetched) so the playground works offline and on GitHub Pages with no backend.
import type { LunasFile } from "./preview/engine.js";

export interface Sample {
  name: string;
  files: LunasFile[];
}

const COUNTER = `html:
    <main class="app">
        <h1>Lunas Counter</h1>
        <p>Count: \${count}</p>
        <button @click="increment()">+1</button>
        <button @click="reset()">Reset</button>
        <p :if="count == 0">Click the button to begin.</p>
        <p :elseif="count > 5">You are on a roll!</p>
        <p :else>Keep going.</p>
    </main>

style:
    .app { font-family: system-ui, sans-serif; max-width: 32rem; margin: 2rem auto; }
    h1 { color: #6200ea; }
    button { margin-right: 0.5rem; padding: 0.4rem 0.9rem; }

script:
    let count = 0
    function increment() { count = count + 1 }
    function reset() { count = 0 }
`;

const TODO = `html:
    <main class="todo">
        <h1>Todos</h1>
        <input ::value="draft" placeholder="What needs doing?" />
        <button @click="add()">Add</button>
        <ul>
            <li :for="item of items">\${item}</li>
        </ul>
        <p :if="items.length == 0">Nothing yet.</p>
    </main>

style:
    .todo { font-family: system-ui, sans-serif; max-width: 32rem; margin: 2rem auto; }
    input { padding: 0.4rem; }

script:
    let draft = ""
    let items = []
    function add() {
        if (draft.length == 0) return
        items = [...items, draft]
        draft = ""
    }
`;

const GREETING_APP = `@use Greeting from "./Greeting.lunas"
html:
    <main class="app">
        <h1>Components</h1>
        <input ::value="who" />
        <Greeting :name="who" />
    </main>

style:
    .app { font-family: system-ui, sans-serif; max-width: 32rem; margin: 2rem auto; }

script:
    let who = "world"
`;

const GREETING_CHILD = `@input name:string
html:
    <p class="greeting">Hello, \${name}!</p>

style:
    .greeting { color: #00897b; font-size: 1.2rem; }
`;

export const DEFAULT_FILES: LunasFile[] = [{ name: "App", content: COUNTER }];

export const SAMPLES: Sample[] = [
  { name: "Counter", files: [{ name: "App", content: COUNTER }] },
  { name: "Todo list", files: [{ name: "App", content: TODO }] },
  {
    name: "Components",
    files: [
      { name: "App", content: GREETING_APP },
      { name: "Greeting", content: GREETING_CHILD },
    ],
  },
];
