// Sample data for the playground (the single source of truth; `samples.ts`
// re-exports these with types). Bundled in, not fetched, so the playground works
// offline and on GitHub Pages with no backend. Every sample is compiled by the
// real Lunas compiler in test/samples.test.mjs so a broken one can't ship.

// ── Feature demos ───────────────────────────────────────────────────────────

const COUNTER = `html:
    <main class="demo">
        <h1>Counter</h1>
        <p class="count">\${count}</p>
        <div class="row">
            <button @click="count = count - 1">−1</button>
            <button class="primary" @click="add()">+1</button>
            <button @click="reset()">Reset</button>
        </div>
        <p :if="count == 0">Click a button to begin.</p>
        <p :elseif="count > 5">You are on a roll! 🎉</p>
        <p :else>Keep going.</p>
        <p class="hint">History: \${history.join(", ")}</p>
    </main>

style:
    .demo { font-family: system-ui, sans-serif; max-width: 24rem; margin: 2rem auto; text-align: center; }
    .count { font-size: 3rem; font-weight: 700; color: #6200ea; margin: 0.5rem 0; }
    .row { display: flex; gap: 0.5rem; justify-content: center; }
    button { padding: 0.5rem 1rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
    button.primary { background: #6200ea; color: #fff; border-color: #6200ea; }
    .hint { color: #777; font-size: 0.85rem; }

script:
    let count = 0
    let history = []
    function add() {
        history = [...history, count]
        count = count + 1
    }
    function reset() {
        count = 0
        history = []
    }
`;

const CONDITIONALS = `html:
    <main class="demo">
        <h1>Conditionals</h1>
        <p>Move the slider to change the grade.</p>
        <input type="range" min="0" max="100" ::value="score" />
        <p class="score">Score: \${score}</p>
        <p class="grade grade--a" :if="Number(score) >= 90">Grade: A — excellent!</p>
        <p class="grade grade--b" :elseif="Number(score) >= 70">Grade: B — good.</p>
        <p class="grade grade--c" :elseif="Number(score) >= 50">Grade: C — passing.</p>
        <p class="grade grade--f" :else>Grade: F — keep practicing.</p>
    </main>

style:
    .demo { font-family: system-ui, sans-serif; max-width: 26rem; margin: 2rem auto; }
    input[type=range] { width: 100%; }
    .score { font-weight: 600; }
    .grade { padding: 0.75rem 1rem; border-radius: 8px; font-weight: 600; }
    .grade--a { background: #e8f5e9; color: #2e7d32; }
    .grade--b { background: #e3f2fd; color: #1565c0; }
    .grade--c { background: #fff8e1; color: #f9a825; }
    .grade--f { background: #ffebee; color: #c62828; }

script:
    let score = "75"
`;

const FORMS = `html:
    <main class="demo">
        <h1>Forms & two-way binding</h1>
        <label>Name <input ::value="name" placeholder="Ada" /></label>
        <label>Favourite colour
            <select ::value="colour">
                <option>purple</option>
                <option>teal</option>
                <option>crimson</option>
            </select>
        </label>
        <label class="check"><input type="checkbox" ::checked="subscribe" /> Subscribe to updates</label>
        <div class="card" :style="{ borderColor: colour }">
            <p>Hi <strong>\${name.length > 0 ? name : "stranger"}</strong>!</p>
            <p>Colour: <span :style="{ color: colour }">\${colour}</span></p>
            <p :if="subscribe">✓ You'll get updates.</p>
            <p :else>You opted out of updates.</p>
        </div>
    </main>

style:
    .demo { font-family: system-ui, sans-serif; max-width: 26rem; margin: 2rem auto; }
    label { display: block; margin: 0.75rem 0; }
    label.check { display: flex; align-items: center; gap: 0.4rem; }
    input, select { padding: 0.4rem; font: inherit; }
    .card { border: 2px solid; border-radius: 10px; padding: 1rem; margin-top: 1rem; }

script:
    let name = ""
    let colour = "purple"
    let subscribe = true
`;

// ── Practical apps ──────────────────────────────────────────────────────────

const TODO = `html:
    <main class="app">
        <h1>Todos</h1>
        <div class="add">
            <input ::value="draft" placeholder="What needs doing?" />
            <button class="primary" @click="add()">Add</button>
        </div>
        <ul class="list">
            <li :for="[i, todo] of todos.entries()" :key="todo.id" :class="{ done: todo.done }">
                <input type="checkbox" ::checked="todo.done" @change="toggle(i)" />
                <span class="text">\${todo.text}</span>
                <button class="del" @click="remove(i)">✕</button>
            </li>
        </ul>
        <p class="empty" :if="todos.length == 0">Nothing yet — add your first todo.</p>
        <footer :if="todos.length > 0">
            <span>\${todos.filter((t) => !t.done).length} left</span>
            <button @click="clearDone()">Clear completed</button>
        </footer>
    </main>

style:
    .app { font-family: system-ui, sans-serif; max-width: 28rem; margin: 2rem auto; }
    .add { display: flex; gap: 0.5rem; }
    .add input { flex: 1; padding: 0.5rem; }
    button { padding: 0.5rem 0.9rem; border: 1px solid #ddd; border-radius: 6px; background: #fff; cursor: pointer; }
    button.primary { background: #6200ea; color: #fff; border-color: #6200ea; }
    .list { list-style: none; padding: 0; }
    .list li { display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0; border-bottom: 1px solid #eee; }
    .list li.done .text { text-decoration: line-through; color: #999; }
    .text { flex: 1; }
    .del { border: none; background: none; color: #c62828; }
    footer { display: flex; justify-content: space-between; align-items: center; color: #666; margin-top: 0.5rem; }
    .empty { color: #999; }

script:
    let draft = ""
    let nextId = 1
    let todos = []
    function add() {
        if (draft.trim().length == 0) return
        todos = [...todos, { id: nextId, text: draft.trim(), done: false }]
        nextId = nextId + 1
        draft = ""
    }
    function toggle(i) {
        todos = todos.map((t, x) => (x == i ? { ...t, done: !t.done } : t))
    }
    function remove(i) {
        todos = todos.filter((_, x) => x != i)
    }
    function clearDone() {
        todos = todos.filter((t) => !t.done)
    }
`;

const TEMPERATURE = `html:
    <main class="demo">
        <h1>Temperature converter</h1>
        <label>Celsius <input type="number" ::value="c" /></label>
        <div class="out">
            <div class="tile"><span>Fahrenheit</span><strong>\${(Number(c) * 9 / 5 + 32).toFixed(1)}°F</strong></div>
            <div class="tile"><span>Kelvin</span><strong>\${(Number(c) + 273.15).toFixed(2)} K</strong></div>
        </div>
        <p class="note" :if="Number(c) <= 0">Brr, that's freezing. ❄️</p>
        <p class="note" :elseif="Number(c) >= 30">That's hot! 🔥</p>
        <p class="note" :else>Comfortable. 🙂</p>
    </main>

style:
    .demo { font-family: system-ui, sans-serif; max-width: 26rem; margin: 2rem auto; }
    label { display: block; }
    input { padding: 0.5rem; font-size: 1.1rem; width: 8rem; }
    .out { display: flex; gap: 1rem; margin: 1rem 0; }
    .tile { flex: 1; background: #f3e5f5; border-radius: 10px; padding: 1rem; text-align: center; }
    .tile span { display: block; color: #6a1b9a; font-size: 0.8rem; }
    .tile strong { font-size: 1.4rem; }

script:
    let c = "20"
`;

const BILL = `html:
    <main class="demo">
        <h1>Bill splitter</h1>
        <label>Bill amount <input type="number" ::value="bill" /></label>
        <label>People <input type="number" min="1" ::value="people" /></label>
        <div class="tips">
            <span>Tip:</span>
            <button :for="pct of [10, 15, 20]" :class="{ active: tip == pct }" @click="tip = pct">\${pct}%</button>
        </div>
        <div class="totals">
            <div><span>Total with tip</span><strong>$\${(Number(bill) * (1 + tip / 100)).toFixed(2)}</strong></div>
            <div class="each"><span>Each pays</span><strong>$\${(Number(bill) * (1 + tip / 100) / Math.max(1, Number(people))).toFixed(2)}</strong></div>
        </div>
    </main>

style:
    .demo { font-family: system-ui, sans-serif; max-width: 26rem; margin: 2rem auto; }
    label { display: block; margin: 0.5rem 0; }
    input { padding: 0.5rem; width: 8rem; font: inherit; }
    .tips { display: flex; align-items: center; gap: 0.5rem; margin: 0.75rem 0; }
    .tips button { padding: 0.35rem 0.8rem; border: 1px solid #ccc; border-radius: 999px; background: #fff; cursor: pointer; }
    .tips button.active { background: #6200ea; color: #fff; border-color: #6200ea; }
    .totals { display: flex; gap: 1rem; }
    .totals div { flex: 1; background: #ede7f6; border-radius: 10px; padding: 1rem; }
    .totals span { display: block; color: #5e35b1; font-size: 0.8rem; }
    .totals strong { font-size: 1.4rem; }
    .each { background: #e8f5e9; }
    .each span { color: #2e7d32; }

script:
    let bill = "48.00"
    let people = "3"
    let tip = 15
`;

const SHOP_APP = `@use ProductCard from "./ProductCard.lunas"
html:
    <main class="shop">
        <header>
            <h1>Lunas Store</h1>
            <div class="cart">🛒 \${cart.length} item(s) — $\${total().toFixed(2)}</div>
        </header>
        <section class="grid">
            <ProductCard :for="p of products" :key="p.id" :name="p.name" :price="p.price" :onAdd="() => addToCart(p)" />
        </section>
        <section class="basket" :if="cart.length > 0">
            <h2>Your cart</h2>
            <ul>
                <li :for="[i, item] of cart.entries()" :key="i">
                    <span>\${item.name}</span>
                    <span>$\${item.price.toFixed(2)}</span>
                    <button @click="removeFromCart(i)">remove</button>
                </li>
            </ul>
            <p class="grand">Total: $\${total().toFixed(2)}</p>
        </section>
    </main>

style:
    .shop { font-family: system-ui, sans-serif; max-width: 40rem; margin: 1.5rem auto; }
    header { display: flex; justify-content: space-between; align-items: center; }
    .cart { background: #ede7f6; color: #5e35b1; padding: 0.4rem 0.8rem; border-radius: 999px; font-weight: 600; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin: 1rem 0; }
    .basket { background: #fafafa; border-radius: 12px; padding: 1rem; }
    .basket ul { list-style: none; padding: 0; }
    .basket li { display: flex; justify-content: space-between; align-items: center; padding: 0.4rem 0; border-bottom: 1px solid #eee; }
    .basket button { border: none; background: none; color: #c62828; cursor: pointer; }
    .grand { text-align: right; font-weight: 700; font-size: 1.1rem; }

script:
    let products = [
        { id: 1, name: "Notebook", price: 4.5 },
        { id: 2, name: "Pen set", price: 8.0 },
        { id: 3, name: "Sticker pack", price: 3.25 },
        { id: 4, name: "Desk mat", price: 19.0 },
    ]
    let cart = []
    function addToCart(p) {
        cart = [...cart, p]
    }
    function removeFromCart(i) {
        cart = cart.filter((_, x) => x != i)
    }
    function total() {
        return cart.reduce((sum, item) => sum + item.price, 0)
    }
`;

const SHOP_CARD = `@input name:string
@input price:number
@input onAdd:function
html:
    <div class="product">
        <h3>\${name}</h3>
        <p class="price">$\${price.toFixed(2)}</p>
        <button @click="onAdd()">Add to cart</button>
    </div>

style:
    .product { border: 1px solid #eee; border-radius: 10px; padding: 1rem; text-align: center; }
    .product h3 { margin: 0 0 0.5rem; }
    .price { color: #6200ea; font-weight: 700; font-size: 1.2rem; margin: 0 0 0.75rem; }
    .product button { padding: 0.4rem 0.9rem; border: none; border-radius: 6px; background: #6200ea; color: #fff; cursor: pointer; }
`;

const CARD_APP = `@use Card from "./Card.lunas"
html:
    <main class="gallery">
        <h1>Components & slots</h1>
        <p>The Card component takes a title prop and renders whatever you nest inside its slot.</p>
        <div class="grid">
            <Card title="Reactive">Lunas tracks your let bindings and updates the DOM for you.</Card>
            <Card title="Composable">Import components with @use and pass typed props with @input.</Card>
            <Card title="Slotted">Anything between the tags lands in the child's slot.</Card>
        </div>
    </main>

style:
    .gallery { font-family: system-ui, sans-serif; max-width: 40rem; margin: 2rem auto; }
    .grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }

script:
`;

const CARD_CHILD = `@input title:string
html:
    <section class="card">
        <h3>\${title}</h3>
        <div class="body"><slot>No content provided.</slot></div>
    </section>

style:
    .card { border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; }
    .card h3 { margin: 0; background: #6200ea; color: #fff; padding: 0.6rem 0.8rem; font-size: 1rem; }
    .body { padding: 0.8rem; color: #444; font-size: 0.9rem; }
`;

export const DEFAULT_FILES = [{ name: "App", content: COUNTER }];

export const SAMPLES = [
  { name: "Counter", files: [{ name: "App", content: COUNTER }] },
  { name: "Conditionals & slider", files: [{ name: "App", content: CONDITIONALS }] },
  { name: "Forms & two-way binding", files: [{ name: "App", content: FORMS }] },
  { name: "Components & slots", files: [{ name: "App", content: CARD_APP }, { name: "Card", content: CARD_CHILD }] },
  { name: "Todo list", files: [{ name: "App", content: TODO }] },
  { name: "Temperature converter", files: [{ name: "App", content: TEMPERATURE }] },
  { name: "Bill splitter", files: [{ name: "App", content: BILL }] },
  { name: "Shopping cart", files: [{ name: "App", content: SHOP_APP }, { name: "ProductCard", content: SHOP_CARD }] },
];
