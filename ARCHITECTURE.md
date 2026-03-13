# tsilog Architecture

Tasty logging for tasty TypeScript projects.

## Overview

tsilog is a logging library designed to work identically across Node.js, Bun, Deno, browser, and
worker environments. It treats logging as a **composable directed acyclic graph (DAG)** of pure
functions, rather than a fixed linear stage pipeline.

The pipeline is expressed entirely through two composition primitives:

```typescript
chain(a, b)          // sequential: a → b  (Mapper<In, Out>)

fanOut(a, b, c)      // parallel:     → a
                     //               → b  (Mapper<In, Promise<void>>)
                     //               → c
```

Any logging topology — single destination, multi-destination, shared formatter, branching
reporter — is expressed by nesting these two functions. The configuration is pure data; the
composed pipeline is derived from it at factory time.

---

## The Two Primitives

### `chain(...mappers)`

Sequential composition. Each mapper's output becomes the next mapper's input. Type-safe via
overloads for up to 6 stages; the implementation uses `reduce`.

```
unknown[] → [mapper] → Log[] → [formatter] → LogType[] → [reporter] → Promise<WireType[]>
```

### `fanOut(...branches)`

Parallel fan-out. All branches receive the same input and run concurrently. Returns
`Promise<void>` — the branches are sinks, not transformers.

```typescript
function fanOut<In>(...branches: Mapper<In, Promise<void>>[]): Mapper<In, Promise<void>> {
  return (input) => Promise.all(branches.map(b => b(input))).then(() => undefined);
}
```

```
           ┌─→ [branch A] ─→ void
input  ────┼─→ [branch B] ─→ void   → Promise<void>
           └─→ [branch C] ─→ void
```

---

## Pipeline Topology

A complete pipeline from raw call arguments to side effects is a single
`Mapper<unknown[], Promise<void>>` composed from the four semantic stages:

```
reason:  receive args → represent as Log → format for destination → emit as side effect
stage:      Mapper    →     Formatter    →        Reporter        →    Transporter
input:    unknown[]   →      Log[]       →       LogType[]        →    WireType[]
output:    Log[]      →    LogType[]     →   Promise<WireType[]>  →  Promise<void>
```

Because `fanOut` expresses parallel branches, a single call can route to multiple
destinations without repeating shared upstream work:

```typescript
// JSON formatter shared between file and fetch sinks;
// template formatter used only for console — expressed once, no duplication:

const pipeline = chain(
  mapperStage,
  fanOut(
    chain(jsonFormatter, fanOut(
      chain(fileReporter,  fileTransporter),
      chain(fetchReporter, fetchTransporter),
    )),
    chain(templateFormatter, fanOut(
      chain(cliReporter, consoleTransporter),
    )),
  ),
);
```

Shared nodes are shared references — if `jsonFormatter` is referenced in two branches it
is instantiated once and called twice per log event, not re-created.

---

## Stage Interfaces

### Mapper

**File:** `lib/mapper/mapper.ts`

```typescript
type Mapper<In, Out> = (input: In) => Out;
type MapperFactory<Config, In = unknown[], Out = unknown[]> = Mapper<Config, Mapper<In, Out>>;
```

The entry-point mapper receives `unknown[]` (the raw variadic log call arguments). Subsequent
mappers in the chain transform `Log[]` to `Log[]`. Concrete implementations:

- **`entity.mapper.ts`** — converts raw args to structured `Log` entities
- **`meta.mapper.ts`** — attaches metadata: timestamps, logger name, request IDs
- **`secret.mapper.ts`** — redacts sensitive fields: tokens, passwords, PII

### Formatter

**File:** `lib/formatter/formatter.ts`

```typescript
type Formatter<LogType = Log[]> = Mapper<Log[], LogType>;
```

Transforms `Log[]` into the wire representation for a particular destination. The output type
is generic — `string[]` for text destinations, a `Surrogate` object for styled terminal
output, a structured record for database sinks. Planned implementations:

- **`json.formatter.ts`** — serializes to JSON strings
- **`yaml.formatter.ts`** — serializes to YAML strings
- **`template.formatter.ts`** — interpolates template strings with optional style range metadata
  via `Surrogate` for downstream prettification

### Reporter

**File:** `lib/reporter/reporter.ts`

```typescript
type Reporter<LogType, WireType> = Mapper<LogType, Promise<WireType>>;
```

Owns *timing and serialization* — when to emit and in what final wire format. A buffering
reporter delays emission; a raw reporter passes through immediately. Planned implementations:

- **`raw.reporter.ts`** — immediate passthrough, no transformation
- **`buffer.reporter.ts`** — batches output and emits on next runloop tick (or configurable
  schedule)
- **`no-op.reporter.ts`** — discards output; useful for testing and disabled logger instances

### Transporter

**File:** `lib/transporter/transporter.ts`

```typescript
type Transporter<WireType> = Mapper<WireType | Promise<WireType>, Promise<void>>;
```

Owns *I/O destination* — where the output goes. Accepts `Promise<WireType>` to compose
naturally with async reporters. Planned implementations:

- **`console.transporter.ts`** — dispatches to `console.log/warn/error` by severity level
- **`fetch.transporter.ts`** — sends logs via HTTP `fetch`
- **`file.transporter.ts`** — appends to a log file (Node/Deno/Bun)
- **`callback.transporter.ts`** — user-provided callback; escape hatch for custom sinks


---

## Configuration

**Defined in:** `lib/configuration.ts`

Two configuration types are exposed:

### `UserConfig`

The consumer-facing configuration. All fields optional, no type parameters, no mapper
knowledge required. Suitable as a constructor argument for most use cases.

```typescript
interface UserConfig {
  name?: string;
  nameSeparator?: string;
  severityLimit?: SeverityCode | SeverityName;
}
```

### `TsilogConfig<LogType, WireType>`

The fully-resolved internal configuration produced by config factories. Carries the
composed pipeline as a single `Mapper<unknown[], Promise<void>>`.

```typescript
interface TsilogConfig<LogType extends Log[] = Log[], WireType = string[]>
  extends Required<UserConfig> {

  env: Environment;
  mapperStage: Mapper<unknown[], Log[]>;
  pipeline: Mapper<LogType, Promise<void>>;
}
```

`pipeline` is the fully-composed DAG from formatter through to all transporters. The
`mapperStage` feeds into it at factory time. Consumers do not interact with either field
directly — they are assembled by config factory functions.

### Config Factories

- **`consoleConfig(userConfig?)`** — produces a `TsilogConfig` wired for console output
- **`subLoggerConfig(parent, subConfig?)`** — inherits a parent `TsilogConfig`, merges
  `UserConfig` overrides, and scopes the logger name (`parent.sub` by default)

### Type Variance

`TsilogConfig` is **covariant** in `WireType` (output position) and **contravariant** in
`LogType` (input position through `Reporter`). The `tsilog()` factory must be generic to
preserve these type parameters through to the composed pipeline:

```typescript
function tsilog<L extends Log[], W>(config: TsilogConfig<L, W>): Facade
// NOT: function tsilog(config: TsilogConfig): Facade  ← widens to unknown[], breaks variance
```

---

## Sub-loggers

Sub-loggers are scoped logger instances that inherit a parent's pipeline configuration.
They are created via the `child()` method on the `Facade`, which is the idiomatic API:

```typescript
const log = tsilog(consoleConfig({ name: 'app' }));
const requestLog = log.child({ name: 'request' });
// requestLog.name === 'app.request'
```

Internally, `child()` calls `subLoggerConfig(parentConfig, userConfig)` and creates a new
factory closure. The parent's `mapperStage` and `pipeline` are inherited by reference —
no re-initialization of shared stages.

```typescript
type Facade = Record<SeverityName, LogCall> & {
  child(config?: UserConfig): Facade;
};
```

---

## Log Severity

**Defined in:** `lib/facade.ts`

Six severity levels with both string names and numeric codes:

| Name    | Code | Typical Use                        |
|---------|------|------------------------------------|
| `trace` | 1    | Fine-grained diagnostic events     |
| `debug` | 2    | Debugging information              |
| `info`  | 3    | General informational messages     |
| `warn`  | 4    | Potentially harmful situations     |
| `error` | 5    | Error events, recoverable failures |
| `fatal` | 6    | Critical failures, app termination |

The `SeverityMap` provides bidirectional lookup. Type guards (`isSeverityCode`,
`isSeverityName`) and conversion functions (`toName`, `toCode`) are provided for safe
runtime level handling.


---

## Environment Detection

**Defined in:** `lib/support/env.support.ts`

The `EnvironmentLoader` provides cross-runtime environment detection with lazy evaluation
and caching. Probes both `process.env` (Node/Bun/Deno) and `import.meta.env` (Vite/browser).

| Property       | Description                                          |
|----------------|------------------------------------------------------|
| `isBrowser`    | Running in a browser with `window` + `document`      |
| `isNode`       | Running in Node.js                                   |
| `isBun`        | Running in Bun                                       |
| `isDeno`       | Running in Deno                                      |
| `isWorker`     | Running in a Web Worker or Cloudflare Worker         |
| `isCI`         | Running in a CI environment (`CI=true`)              |
| `isProduction` | `NODE_ENV=production`                                |
| `isTest`       | `NODE_ENV=test`                                      |
| `isDebug`      | Debug mode enabled via `TSILOG_DEBUG=true`           |
| `isEnabled`    | Logging enabled (default: true, via `TSILOG_ENABLED`)|
| `asserts`      | Assertion mode (default: true, via `TSILOG_ASSERTS`) |

All boolean flags are cached after first evaluation. Each `TsilogConfig` carries its own
`Environment` instance, allowing per-logger enable/disable without a global singleton.

---

## Support Utilities

Located in `lib/support/`:

| File                 | Purpose                                                        | Status      |
|----------------------|----------------------------------------------------------------|-------------|
| `env.support.ts`     | Cross-runtime environment detection and per-instance caching   | Implemented |
| `string.support.ts`  | `Surrogate` — template string with placeholder format (`%@`) and style attribute ranges | Stub |
| `color.support.ts`   | Terminal/browser color output utilities                        | Stub        |
| `error.support.ts`   | Error formatting and classification utilities                  | Stub        |
| `fs-path.support.ts` | Filesystem path utilities (Node/Deno/Bun)                      | Stub        |
| `storage.support.ts` | Persistent storage utilities (browser/Node)                    | Stub        |

---

## Factory Function

**Defined in:** `lib/tsilog.ts`

```typescript
function tsilog<L extends Log[], W>(config: TsilogConfig<L, W>): Facade
```

**Internal flow:**

1. Composes the full pipeline: `chain(config.mapperStage, config.pipeline)`
2. Builds the `Facade` — a record of severity-named methods via tail-recursive construction
3. Each facade method closes over its severity level and delegates to `log()`
4. `log()` checks `config.env.isEnabled` and `config.severityLimit`, then invokes the
   composed pipeline and collects the resulting `Promise<void>`
5. Returns `logger` (the facade itself) for method chaining

---

## Project Structure

```
lib/
  tsilog.ts                   # Factory function and Facade builder
  facade.ts                   # Severity levels, LogCall, Facade type
  configuration.ts            # UserConfig, TsilogConfig, config factories
  mapper/
    mapper.ts                 # Mapper<In,Out>, chain(), fanOut(), linkToChains()
    entity.mapper.ts          # Raw args → structured Log entities
    meta.mapper.ts            # Metadata attachment (timestamp, name, etc.)
    secret.mapper.ts          # PII/secret redaction
  formatter/
    formatter.ts              # Formatter<LogType> interface
    json.formatter.ts         # Log[] → JSON string[]
    yaml.formatter.ts         # Log[] → YAML string[]
    template.formatter.ts     # Log[] → Surrogate[] (styled template strings)
  reporter/
    reporter.ts               # Reporter<LogType, WireType> interface
    raw.reporter.ts           # Immediate passthrough
    buffer.reporter.ts        # Batched/scheduled emission
    no-op.reporter.ts         # Silent discard
  transporter/
    transporter.ts            # Transporter<WireType> interface
    console.transporter.ts    # → console.log/warn/error
    fetch.transporter.ts      # → HTTP fetch
    file.transporter.ts       # → filesystem (Node/Deno/Bun)
    callback.transporter.ts   # → user-provided callback
  support/
    env.support.ts            # Cross-runtime environment detection
    string.support.ts         # Surrogate string with style ranges
    color.support.ts          # Terminal/browser color utilities
    error.support.ts          # Error formatting utilities
    fs-path.support.ts        # Filesystem path utilities
    storage.support.ts        # Persistent storage utilities
```

---

## Build & Tooling

- **Language:** TypeScript 5.9+ with strict mode and `isolatedDeclarations`
- **Module format:** ESM only (`"type": "module"`)
- **Build:** Vite 7 (library mode) + TypeScript compiler (declarations only)
- **Target:** ES2022 with DOM lib (cross-runtime)
- **Test:** Vitest with v8 coverage (100% threshold)
- **Lint:** ESLint 9 with import-x, unicorn, perfectionist, n, regexp plugins
- **Package manager:** pnpm 10
- **Runtime targets:** Node 24+, Bun, Deno, modern browsers, Web Workers
