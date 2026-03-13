# tsilog vs. Traditional Loggers — Design Survey

A comparison of tsilog's functional DAG composition model against the dominant TypeScript/Node.js
logging libraries.

---

## The Core Philosophical Split

Traditional logging libraries treat the pipeline as a **configuration object**: you declare
transports, set levels, attach formatters, and the library's internal engine interprets that
declaration at runtime. The library owns the execution model.

tsilog treats the pipeline as a **composed function**: you build the execution graph explicitly
using `chain()` and `fanOut()`, and the result is a plain `Mapper<unknown[], Promise<void>>` that
the library simply calls. You own the execution model; the library provides the primitives.

This is the same split as React vs. jQuery, or RxJS vs. EventEmitter — not better or worse
categorically, but meaningfully different in what it optimises for.

---

## pino

**Model:** Synchronous core, transport workers  
**Repo:** `pinojs/pino`

pino is the performance reference point in Node.js logging. Its core is intentionally synchronous
and fast — it serialises to NDJSON and writes to stdout immediately, then optionally routes to
worker-thread transports for async destinations.

**Pipeline model:**

```
log call → serialise (sync) → stdout
                           ↘ pino-transport worker (async, separate thread)
```

Formatters are called "prettifiers" and run either in-process (dev) or in the transport worker
(prod). There is no user-composable stage graph — the serialiser is fixed, prettifiers are
bolted on, transports are separate processes.

**What pino does better than tsilog:**
- Raw throughput. The sync-to-stdout model with NDJSON is benchmarked at ~2–3× faster than
  any async pipeline for high-volume server logging.
- Ecosystem maturity. `pino-http`, `pino-pretty`, `pino-elasticsearch` etc. are battle-tested.
- `child()` API is the gold standard for scoped context.

**What tsilog does differently:**
- The pipeline topology is a value you can inspect, serialize, and modify at runtime.
- Async is first-class from the start, not a worker-process workaround.
- Formatters and reporters are composable functions, not plugin registrations.
- Works in browsers and workers without configuration; pino requires bundler shims.

---

## winston

**Model:** Transport array, format pipeline  
**Repo:** `winstonjs/winston`

winston is the most widely adopted Node.js logger. Its format pipeline is a composable chain
of `printf`-style transform streams using the `logform` library. Transports are instances of
`winston.Transport` registered on the logger.

**Pipeline model:**

```
log call → format chain (logform) → transport[0]
                                  → transport[1]
                                  → transport[N]
```

`logform` is the closest prior art to tsilog's functional composition — formats are composed
via `format.combine(format.timestamp(), format.json())`. The key difference is that logform
operates on Node.js `Transform` streams, which carry significant overhead and are not portable
to browsers or Deno.

**What winston does better than tsilog:**
- Ecosystem. `winston-transport`, `winston-elasticsearch`, `winston-cloudwatch` etc.
- `createLogger` is a known, widely-documented API surface.
- Stream backpressure handling is built in via the Transport base class.

**What tsilog does differently:**
- `chain()` / `fanOut()` are plain functions, not Transform streams. No Node.js stream
  overhead, portable everywhere.
- The DAG model handles shared formatters naturally (one node, multiple outgoing edges).
  winston's flat transport array requires duplicating format chains if two transports need
  the same format.
- Type parameters flow through the pipeline — `Formatter<string[]>`,
  `Reporter<Log[], string[]>`, `Transporter<string[]>` are statically checked to be
  compatible. winston's pipeline is typed at `Record<string, any>` boundaries.


---

## tslog

**Model:** Class hierarchy, transport callbacks  
**Repo:** `fullstack-build/tslog`

tslog is the most TypeScript-native of the traditional loggers. It uses a generic class
`Logger<T>` where `T` is the shape of the log object, and exposes a `attachTransport`
callback API rather than a formal transport interface.

**Pipeline model:**

```
log call → Logger<T>.info() → prettyPrint (sync) → attachTransport callback(logObj)
```

The formatter and transport are conceptually merged — each attached transport receives the
raw log object and is responsible for its own formatting. There is no stage separation.

**What tslog does better than tsilog:**
- TypeScript generics on the log object itself are ergonomic and well-documented.
- `Logger<T>` subclassing is familiar OOP style for teams coming from Java/C# backgrounds.
- Very low setup friction for simple use cases.

**What tsilog does differently:**
- Stage separation is explicit and enforced by type: formatters cannot accidentally be used
  as reporters, reporters cannot accidentally act as transporters.
- `chain()` composition is testable at each seam — you can unit-test a formatter in isolation
  without instantiating a logger.
- The generic parameters (`LogType`, `WireType`) enforce end-to-end type compatibility
  across stages, not just on the log object shape.

---

## consola

**Model:** Reporter array, levels  
**Repo:** `unjs/consola`

consola is the logger used across the Nuxt/UnJS ecosystem. Its design prioritises DX —
coloured terminal output, browser compatibility, and a minimal API. It uses "reporters" in
the sense of output adapters (equivalent to tsilog's transporters), not timing/buffering
controllers.

**Pipeline model:**

```
log call → reporter[0].log(logObj, ctx)
         → reporter[1].log(logObj, ctx)
```

There is no formatter stage — reporters handle both formatting and output. The pipeline is
not composable; reporters are independent.

**What consola does better than tsilog:**
- Out-of-box terminal output is the best in class among these libraries.
- `@nuxt/kit` and UnJS ecosystem integration is first-class.
- Minimal boilerplate — `consola.info("hello")` works with zero config.

**What tsilog does differently:**
- Formatter/reporter/transporter separation means you can combine any formatter with any
  transporter without writing a custom reporter class.
- The DAG topology makes shared formatting explicit and allocation-efficient.
- tsilog's "reporter" owns timing (buffering, scheduling) — a distinct concern from
  consola's reporter which owns everything.

---

## Summary Comparison

| Concern                         | pino        | winston       | tslog       | consola     | tsilog               |
|---------------------------------|-------------|---------------|-------------|-------------|----------------------|
| **Pipeline model**              | Fixed       | Stream chain  | Callbacks   | Array       | Composed DAG         |
| **Topology expression**         | Config      | `logform`     | Subclassing | Config      | `chain` / `fanOut`   |
| **Shared formatter nodes**      | ❌ Manual   | ❌ Duplicate  | ❌ Manual   | ❌ Manual   | ✅ By reference      |
| **Type-safe stage boundaries**  | ❌          | ❌            | Partial     | ❌          | ✅ Full variance     |
| **Async first-class**           | Via workers | Via streams   | Callbacks   | ❌          | ✅ Native            |
| **Browser/Worker portable**     | With shims  | ❌            | ✅          | ✅          | ✅                   |
| **Sub-logger / child context**  | ✅          | ✅            | ✅          | ❌          | ✅ (`.child()`)      |
| **Raw throughput**              | ★★★★★      | ★★★          | ★★★        | ★★★        | ★★★ (not the goal)   |
| **Zero-config DX**              | ★★★        | ★★★          | ★★★★       | ★★★★★     | ★★ (early)           |
| **Ecosystem / transports**      | ★★★★★      | ★★★★★        | ★★★        | ★★★        | ★ (early)            |

---

## When tsilog's model is the right choice

- You need the pipeline to be introspectable or serialisable at runtime (e.g. a UI that
  shows the active log routing for a server process).
- You need the same formatter shared across multiple destinations without code duplication.
- You want to unit-test each pipeline stage in isolation with full type safety.
- You are targeting multiple runtimes (browser, Node, Deno, worker) from a single codebase
  and cannot afford Node-specific stream or worker-thread APIs.
- You want the pipeline topology to be a first-class value you can pass, store, and compose
  programmatically.

## When traditional loggers are the right choice

- Raw throughput is the primary concern (pino is the answer).
- You need an established ecosystem of pre-built transports immediately.
- Your team is more comfortable with OOP configuration patterns than functional composition.
- You have a simple, single-destination logging requirement where the DAG model adds
  complexity without benefit.
