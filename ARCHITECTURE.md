# tsilog Architecture

Tasty logging for tasty TypeScript projects.

## Overview

tsilog is a logging library designed to work identically across Node.js, Bun, Deno, browser, and worker environments. It treats logging as a **streaming transformer chain** with four composable stages:

```
mapper -> formatter -> transporter[] -> reporter[]
```

Each stage is independently configurable, testable, and composable. The library exposes a facade (the logger object) with methods for each log level (`trace`, `debug`, `info`, `warn`, `error`, `fatal`) that feed into the pipeline.

---

## Pipeline Stages

### Stage 1: Mapper

**Interface:** `Mapper<T, R>` — `lib/mapper/mapper.ts`

```
(...args: unknown[]) --> Mapper --> Mapper --> ... --> Log[]
```

Mappers are pure functions chained together via `chain()`. The first mapper in the chain (the "input mapper") receives the raw variadic arguments from the log call and produces an intermediate `Log` object. Subsequent mappers transform `Log[]` to `Log[]`, applying operations like:

- **Entity mapping** (`entity.mapper.ts`) — convert raw args into structured log entities
- **Meta mapping** (`meta.mapper.ts`) — attach metadata (timestamps, request IDs, module names)
- **Secret hiding** (`secret.mapper.ts`) — redact sensitive data (tokens, passwords, PII)

Mappers compose via the `chain()` utility, which provides type-safe function composition with overloads for up to 6 stages:

```typescript
const pipeline = chain(inputMapper, metaMapper, secretMapper);
// Type: Mapper<unknown[], Log[]>
```

### Stage 2: Formatter

**Interface:** `Formatter<In, Out>` — `lib/formatter/formatter.ts`

```
Log[] --> Formatter --> Out[]
```

A formatter takes the structured `Log[]` output from the mapper stage and transforms it into a target format. Each transporter owns one formatter. Planned implementations:

- **JSON formatter** (`json.formatter.ts`) — serialize logs to JSON strings
- **YAML formatter** (`yaml.formatter.ts`) — serialize logs to YAML strings
- **Template formatter** (`template.formatter.ts`) — apply template strings with placeholder interpolation, potentially returning strings with attribute/range metadata for styled output

The formatter output type is generic — most commonly `string[]`, but could be more complex (e.g., a `Surrogate` string object carrying style ranges for later prettification).

### Stage 3: Transporter

**Abstract class:** `Transporter<Log, Out>` — `lib/transporter/transporter.ts`

```
Log[] --> Transporter --> [formatter(Log[]) --> Out[]] --> reporter[](Out[])
```

A transporter is the orchestrator that connects a formatter to one or more reporters. Each transporter owns:
- One `Formatter<Log, Out>` — transforms logs into the output format
- One or more `Reporter<Out>[]` — delivers the formatted output to its destination

You can have **multiple transporters** per logger instance, enabling a single log call to be routed to different destinations with different formatting:

```
logger.info("request complete")
  --> ConsoleTransporter (template formatter + CLI reporter)
  --> FetchTransporter (JSON formatter + HTTP reporter)
  --> FileTransporter (JSON formatter + file reporter)
```

Planned implementations:

- **Console transporter** (`console.transporter.ts`) — routes to `console.log/warn/error`
- **Fetch transporter** (`fetch.transporter.ts`) — sends logs via HTTP `fetch` requests
- **File transporter** (`file.transporter.ts`) — writes logs to the filesystem
- **Raw transporter** (`raw.transporter.ts`) — passes formatted output through with minimal processing (useful for DOM rendering, custom pipelines)

### Stage 4: Reporter

**Interface:** `Reporter<Out>` — `lib/reporter/reporter.ts`

```
Out[] --> Reporter --> side effect (console, file, DOM, network, etc.)
```

Reporters are the final stage — they receive formatted output and perform the actual side effect of delivering it. A reporter might buffer, prettify, colorize, or apply any last-minute transformation before writing to its destination. Planned implementations:

- **CLI reporter** (`cli.reporter.ts`) — terminal output with ANSI colors and formatting
- **CSS reporter** (`css.reporter.ts`) — browser console output using `%c` CSS styling, or transformation to HTML entities for DOM rendering
- **No-op reporter** (`no-op.reporter.ts`) — silent/discard (useful for testing or disabled loggers)

---

## Log Levels

**Defined in:** `lib/facade.ts`

Six log levels with both string names and numeric codes:

| Name    | Code | Typical Use                        |
|---------|------|------------------------------------|
| `trace` | 1    | Fine-grained diagnostic events     |
| `debug` | 2    | Debugging information              |
| `info`  | 3    | General informational messages     |
| `warn`  | 4    | Potentially harmful situations     |
| `error` | 5    | Error events, recoverable failures |
| `fatal` | 6    | Critical failures, app termination |

The `LevelMap` provides bidirectional lookup between names and codes. Type guards (`isLevelCode`, `isLevelName`) and conversion functions (`toName`, `toCode`) are provided for safe runtime level handling.

---

## Logger Facade

**Defined in:** `lib/facade.ts`

The facade is the user-facing API — a record of logging methods, one per level:

```typescript
type Facade = Record<LevelName, LogCall>;
```

Usage:

```typescript
const log = tsilog(mapper, transporters);

log.info("server started", { port: 3000 });
log.error("connection failed", error);
log.debug("request payload", payload);
```

The logger returns itself from each call, enabling method chaining:

```typescript
log.info("step 1").debug("details").warn("careful");
```

---

## Configuration

**Defined in:** `lib/configuration.ts`

```typescript
interface Configuration<Log = Record<string, unknown>> {
  name: string;
  levelCutoff: LevelCode | LevelName;
  mapper: Mapper<unknown[], Log[]>;
  additionalMapper: Mapper<Log[], Log[]>;
  transporters: Transporter<Log>[];
}
```

- **`name`** — logger instance identifier
- **`levelCutoff`** — minimum level to process (logs below this level are dropped)
- **`mapper`** — the input mapper (raw args to `Log[]`)
- **`additionalMapper`** — user-provided post-processing mapper (`Log[]` to `Log[]`)
- **`transporters`** — array of output transporter instances

---

## Environment Detection

**Defined in:** `lib/support/env.support.ts`

The `EnvironmentLoader` provides runtime environment detection with lazy evaluation and caching. It probes both `process.env` (Node.js/Bun/Deno) and `import.meta.env` (Vite/browser) to work across all target runtimes.

### Detected Properties

| Property      | Description                                    |
|---------------|------------------------------------------------|
| `isBrowser`   | Running in a browser with `window` + `document`|
| `isNode`      | Running in Node.js                             |
| `isBun`       | Running in Bun                                 |
| `isDeno`      | Running in Deno                                |
| `isWorker`    | Running in a Web Worker or Cloudflare Worker   |
| `isCI`        | Running in a CI environment (`CI=true`)        |
| `isProduction`| `NODE_ENV=production`                          |
| `isTest`      | `NODE_ENV=test`                                |
| `isDebug`     | Debug mode enabled via `TSILOG_DEBUG=true`     |
| `isEnabled`   | Logging enabled (default: true, via `TSILOG_ENABLED`) |
| `asserts`     | Assertion mode (default: true, via `TSILOG_ASSERTS`)  |

All boolean flags are cached after first evaluation. Custom configuration uses the `TSILOG_` prefix (e.g., `TSILOG_ENABLED=false` to disable logging globally).

---

## Support Utilities

Located in `lib/support/`:

| File                 | Purpose                                          | Status       |
|----------------------|--------------------------------------------------|--------------|
| `env.support.ts`     | Cross-runtime environment detection and caching  | Implemented  |
| `string.support.ts`  | `Surrogate` class for template string interpolation with placeholder format (`%@`) and attribute ranges | Stub |
| `color.support.ts`   | Terminal/browser color output utilities           | Stub         |
| `error.support.ts`   | Error handling and formatting utilities           | Stub         |
| `fs-path.support.ts` | Filesystem path utilities (Node/Deno)            | Stub         |
| `storage.support.ts` | Persistent storage utilities (browser/Node)      | Stub         |

---

## Factory Function

**Defined in:** `lib/tsilog.ts`

The `tsilog()` factory creates a configured logger instance:

```typescript
function tsilog<Log = Record<string, unknown>>(
  userMapper: Mapper<Log[], Log[]> | undefined,
  transporters: Transporter<Log>[] = [],
): Facade
```

**Internal flow:**

1. Creates an internal input mapper that converts raw call arguments to `Log[]`
2. Chains the input mapper with the optional user-provided mapper via `chain()`
3. Builds the facade object with a method for each log level
4. Each facade method closes over its level and delegates to the internal `log()` function
5. `log()` checks if logging is enabled (via `environment.isEnabled`), runs the mapper chain, then iterates over all transporters

---

## Project Structure

```
lib/
  tsilog.ts              # Factory function (entry point)
  facade.ts              # Log levels, LogCall type, Facade type
  configuration.ts       # Configuration interface
  mapper/
    mapper.ts            # Mapper interface + chain() composition
    entity.mapper.ts     # Entity transformation
    meta.mapper.ts       # Metadata attachment
    secret.mapper.ts     # Secret redaction
  formatter/
    formatter.ts         # Formatter interface
    json.formatter.ts    # JSON serialization
    yaml.formatter.ts    # YAML serialization
    template.formatter.ts # Template-based formatting
  transporter/
    transporter.ts       # Abstract Transporter base class
    console.transporter.ts
    fetch.transporter.ts
    file.transporter.ts
    raw.transporter.ts
  reporter/
    reporter.ts          # Reporter interface
    cli.reporter.ts      # Terminal output
    css.reporter.ts      # Browser/CSS styled output
    no-op.reporter.ts    # Silent reporter
  support/
    env.support.ts       # Environment detection
    string.support.ts    # String utilities
    color.support.ts     # Color utilities
    error.support.ts     # Error utilities
    fs-path.support.ts   # Filesystem path utilities
    storage.support.ts   # Storage utilities
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
