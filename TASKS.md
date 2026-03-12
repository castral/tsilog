# tsilog Tasks

Action items from the architecture review, ordered by priority.

---

## Priority 1: Type-Level Bugs

These are type-system correctness issues that should be fixed before the architecture hardens.

### T-1: Fix `LogCall` type to match facade API

**File:** `lib/facade.ts:63`

`LogCall` is currently `(level: LevelCode | LevelName, ...args: unknown[]) => Facade`, but the facade methods already bind the level internally. The user-facing signature should be `(...args: unknown[]) => Facade`.

The current type means `logger.info("hello")` types `"hello"` as a level parameter. The `as Record<LevelName, LogCall>` cast in the factory hides this mismatch.

**Action:**
- [x] Change `LogCall` to `(...args: unknown[]) => Facade`
- [ ] ~~Add a separate internal type (e.g., `InternalLogCall`) for the `log()` function that includes the level parameter~~
- [ ] ~~Remove the `as` cast in `lib/tsilog.ts:25`~~

### T-2: Fix Mapper arity mismatch

**Files:** `lib/mapper/mapper.ts:1-3`, `lib/tsilog.ts:11-16,32`

`Mapper<T, R>` takes one argument `(input: T): R`, but the input mapper is variadic `(..._args: unknown[]): Log[]` and is called with multiple arguments `mapper(level, ...args)`. Extra arguments are silently dropped at runtime.

**Options (pick one):**
- [x] **(a) Separate `InputMapper` type** — create a distinct type for the pipeline entry point that accepts variadic args and outputs `Log[]`. Keep `Mapper` as the intra-pipeline type. *(Recommended — the entry point is fundamentally different from mid-chain transforms.)*
- [x] **(b) Pack args before pipeline** — have the call site wrap `(level, ...args)` into a single object/tuple before entering the mapper chain
- [ ] ~~**(c) Variadic Mapper** — make `Mapper` accommodate variadic input at the head of the chain~~

### T-3: Fix `chain()` identity overload

**File:** `lib/mapper/mapper.ts:5`

`chain<T>(v: T): T` is unconstrained — `chain("hello")` compiles but is nonsensical.

**Action:**
- [x] Either remove the identity overload, or constrain it to `chain<T, R>(mapper: Mapper<T, R>): Mapper<T, R>`


---

## Priority 2: Critical Missing Features

### T-4: Wire Configuration into the factory

**Files:** `lib/configuration.ts`, `lib/tsilog.ts`

`Configuration` defines `name`, `levelCutoff`, `mapper`, `additionalMapper`, `transporters` — but `tsilog()` takes raw `(userMapper, transporters)`. The Configuration type is disconnected.

**Action:**
- [x] Decide whether the factory should accept a `Configuration` object directly
- [ ] ~~Align the `mapper`/`additionalMapper` distinction in Configuration with how the factory actually chains mappers~~
- [x] Wire `name` into the logger (e.g., as metadata in log entries)

### T-5: Implement level filtering

**Files:** `lib/tsilog.ts`, `lib/configuration.ts`

`levelCutoff` exists in the Configuration type but has no implementation anywhere. Level filtering is the most important feature of a logging library.

**Decision needed — where should filtering live?**
- [x] **Factory-level gate** *(recommended)* — `log()` compares level against cutoff and returns early before entering the pipeline. Simplest approach, used by pino/winston.
- [ ] ~~**Per-transporter override** *(optional addition)* — allow individual transporters to define their own cutoff (e.g., console gets debug+, file gets warn+). Requires level metadata to survive through the pipeline.~~
- [ ] ~~**Mapper-based** *(not recommended)* — a mapper that filters by level. Overloads the mapper concept — filtering is a gate, not a transform.~~

---

## Priority 3: Design Decisions

These should be decided before implementing concrete transporters/reporters/formatters.

### T-6: Decide sync vs async transporter story

**Files:** `lib/transporter/transporter.ts`, `lib/reporter/reporter.ts`

`Reporter<Out>` returns `void`, `Transporter.transport()` returns `void`. The planned `fetch.transporter` and `file.transporter` need async.

**Options (pick one):**
- [ ] ~~**(a) Sync-only, internal queues** — keep interfaces synchronous. Async transporters manage their own internal buffering/queuing. This is pino's approach — simplest API, pushes complexity to implementors.~~
- [x] **(b) `void | Promise<void>`** — make reporter/transporter return types async-compatible. Complicates the `for...of` loop in the factory (needs `await` or promise collection).
- [ ] ~~**(c) Separate base classes** — `SyncTransporter` and `AsyncTransporter`. More types, but clear intent.~~

### T-7: Define a structured base Log type

**File:** `lib/facade.ts` or new file

`Log = Record<string, unknown>` gives no compile-time guarantee that entries carry level, timestamp, or message.

**Action:**
- [x] Define a minimal `BaseLog` interface with required fields (`level`, `timestamp`, `message`)
- [ ] ~~Constrain the generic: `Log extends BaseLog = BaseLog`~~

### T-8: Consider single-item vs batch-oriented core

**Files:** `lib/formatter/formatter.ts`, `lib/reporter/reporter.ts`

Formatter is `(input: In[]): Out[]`, Reporter is `(output: Out[]): void`. Single log calls wrap one item in an array.

**Action:**
- [x] Decide if batching/buffering is a first-class feature (if yes, keep array-oriented)
- [ ] ~~If not, consider single-item core interface with optional batch wrapper~~


---

## Priority 4: Future Design Considerations

These can wait but should be kept in mind during implementation.

### T-9: Design child logger / scoped context API

No mechanism for `logger.child({ requestId: "abc" })`. Very common pattern for request-scoped server logging.

**Notes:**
- The mapper chain supports this naturally — a child logger is a new `tsilog()` instance with an extra mapper prepended that merges scoped context
- Depends on resolving the mapper arity issue (T-2) first
- [ ] Design the child logger API surface
- [ ] Ensure Configuration supports inheriting parent settings

### T-10: Allow per-instance environment overrides

**File:** `lib/support/env.support.ts:235`

All logger instances share the global `environment` singleton. Can't enable/disable individual instances. Testing is harder.

**Action:**
- [x] Allow per-instance environment/config overrides with global as default fallback
- [x] Consider making `EnvironmentLoader` injectable for testing

---

## Bug Fix

### T-11: Guard `navigator` access in worker detection

**File:** `lib/support/env.support.ts:191`

```typescript
globalThis.navigator.userAgent.includes('Cloudflare-Workers')
```

`globalThis.navigator` is `undefined` in Node.js (especially older versions). This will throw at runtime.

**Fix:**
- [x] Add optional chaining: `globalThis.navigator?.userAgent?.includes('Cloudflare-Workers') ?? false`


---

## New Issues (found during implementation review)

### T-12: Fix `Formatter` type — output is locked to `Log[]`

**File:** `lib/formatter/formatter.ts`

`Formatter = Mapper<Log[], Log[]>` — input and output are the same type. A formatter that produces
`string[]`, YAML, or a styled `Surrogate` object cannot be expressed. `template.formatter.ts`
currently returns `[]` as `Log[]`, confirming this hasn't been resolved yet.

**Action:**
- [x] Parameterize: `Formatter<Out = Log[]> = Mapper<Log[], Out>`
- [x] Update `Configuration` to carry the output type parameter, or accept `Formatter<unknown>` and let the transporter constrain it
- [x] Update `template.formatter.ts` to return the correct output type

### T-13: Fix double-wrap bug in `tsilog.ts`

**File:** `lib/tsilog.ts`

```typescript
// facade closure:
[level]: (...args: unknown[]): Facade => log(level, args),   // ← args packed as one argument
// log() signature:
const log = (level: LevelCode | LevelName, ...args: unknown[]) =>
  config.mapper([level, ...args]);  // ← spreads [level, [originalArgs]] — double wrapped
```

`log(level, args)` should be `log(level, ...args)`. User arguments arrive at the mapper wrapped
in an extra array.

**Action:**
- [x] Change `log(level, args)` to `log(level, ...args)` in the facade closure

### T-14: Resolve the Reporter↔Transporter pairing (the TODO)

**File:** `lib/tsilog.ts`

```typescript
// TODO: Figure out mapping between Reporter[] and Transporter[]
for (const transporter of config.transporters) {
  for (const outputLogs of reportedLogs) {
    void transporter(outputLogs);  // N×M broadcast — every reporter output goes to every transporter
  }
}
```

`linkChains` in `mapper.ts` was clearly added for this purpose and should be used here. The
decision is how to model the pairing in `Configuration`.

**Options (pick one):**
- [ ] **PipelineUnit model** *(recommended)* — replace flat `reporters[]` + `transporters[]` with
  `units: PipelineUnit[]` where each unit owns its reporter(s) and transporter(s). Clean type
  safety, no accidental N×M broadcast.
- [ ] **Flat arrays with zip** — keep flat arrays, zip reporters to transporters by index in the
  factory. Simpler config, but fragile (mismatched lengths silently drop entries).

**Note:** Also needs to handle `void | Promise<void>` from transporter — bare `void transporter(...)`
swallows async errors silently.


---

## Priority 5: First Concrete Implementations

Blocked on T-12 and T-14 being resolved.

### T-15: Implement `no-op.reporter.ts`

**File:** `lib/reporter/no-op.reporter.ts` *(stub exists, empty)*

Trivial — `(logs) => logs`. Needed before tests can assert pipeline behaviour without real side effects.

- [ ] Implement no-op reporter

### T-16: Implement `console.transporter.ts`

**File:** `lib/transporter/console.transporter.ts` *(stub exists, empty)*

Should dispatch to `console.log` / `console.warn` / `console.error` based on log level in each entry.

- [ ] Implement console transporter

### T-17: Wire `consoleConfig()` with real instances

**File:** `lib/configuration.ts`

`reporters: []` and `transporters: []` are both empty arrays. The config factory produces a logger
that does nothing end-to-end.

- [ ] Populate `consoleConfig()` with `no-op.reporter` (or `cli.reporter` once it exists) and `console.transporter`

### T-18: Replace spec stub with real tests

**File:** `spec/tsilog.spec.ts`

`it('should work', () => { console.debug(logger) })` is not a test.

- [ ] Level gate fires correctly (spy on pipeline, assert no invocation below cutoff)
- [ ] Pipeline runs stages in order (mapper → formatter → reporter → transporter)
- [ ] `no-op` reporter suppresses transport
- [ ] `consoleConfig()` produces output to stdout

---

## Tooling

### T-19: Wire or remove `@microsoft/api-extractor`

**File:** `package.json`

`@microsoft/api-extractor` is in `devDependencies` but not referenced in any script. Either
integrate it into `tsi:build` to produce a clean `.d.ts` rollup, or remove it.

- [ ] Wire into `tsi:build` / `tsi:package`, or remove from devDependencies

### T-20: Implement `pub:jsr` and `pub:npm` scripts

**File:** `package.json`

Both are `"tbd"`. Package exports are now correct — these just need the publish commands.

- [ ] `"pub:jsr": "jsr publish"`
- [ ] `"pub:npm": "npm publish --access public"`
