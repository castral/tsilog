/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
export enum LevelName {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  FATAL = 'fatal',
}

export enum LevelCode {
  trace = 1,
  debug,
  info,
  warn,
  error,
  fatal,
}

export const LevelMap: Readonly<Record<LevelName, LevelCode>
                              & Record<LevelCode, LevelName>> = Object.freeze({
  [LevelName.TRACE]: LevelCode.trace,
  [LevelName.DEBUG]: LevelCode.debug,
  [LevelName.INFO]: LevelCode.info,
  [LevelName.WARN]: LevelCode.warn,
  [LevelName.ERROR]: LevelCode.error,
  [LevelName.FATAL]: LevelCode.fatal,
  [LevelCode.trace] :LevelName.TRACE,
  [LevelCode.debug] :LevelName.DEBUG,
  [LevelCode.info] :LevelName.INFO,
  [LevelCode.warn] :LevelName.WARN,
  [LevelCode.error] :LevelName.ERROR,
  [LevelCode.fatal] :LevelName.FATAL,
} as const);

export function isLevelCode(value: unknown): value is LevelCode {
  return typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value) &&
    value >= LevelCode.trace &&
    value <= LevelCode.fatal;
}

export function isLevelName(value: unknown): value is LevelName {
  return typeof value === 'string' && (
    value === LevelName.TRACE ||
    value === LevelName.DEBUG ||
    value === LevelName.INFO ||
    value === LevelName.WARN ||
    value === LevelName.ERROR ||
    value === LevelName.FATAL
  );
}

export function toName(value: LevelCode): LevelName;
export function toName(value: unknown): LevelName | undefined {
  return isLevelCode(value) ? LevelMap[value] : undefined;
}

export function toCode(value: LevelName): LevelCode;
export function toCode(value: unknown): LevelCode | undefined {
  return isLevelName(value) ? LevelMap[value] : undefined;
}

export type JSONPrimitive = boolean | number | object | string | null;

export interface Log {
  arguments: unknown[];
  context: Record<string, JSONPrimitive>;
}

export type LogCall = (...args: unknown[]) => Facade;

export type Facade = Record<LevelName, LogCall>;
