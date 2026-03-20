/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
export enum SeverityName {
  TRACE = 'trace',
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export enum SeverityCode {
  trace = 1,
  debug,
  info,
  warn,
  error,
}

export const SeverityMap: Readonly<Record<SeverityName, SeverityCode>
                                 & Record<SeverityCode, SeverityName>> = Object.freeze({
  [SeverityName.TRACE]: SeverityCode.trace,
  [SeverityName.DEBUG]: SeverityCode.debug,
  [SeverityName.INFO]:  SeverityCode.info,
  [SeverityName.WARN]:  SeverityCode.warn,
  [SeverityName.ERROR]: SeverityCode.error,
  [SeverityCode.trace]: SeverityName.TRACE,
  [SeverityCode.debug]: SeverityName.DEBUG,
  [SeverityCode.info]:  SeverityName.INFO,
  [SeverityCode.warn]:  SeverityName.WARN,
  [SeverityCode.error]: SeverityName.ERROR,
} as const);

export function isCode(value: unknown): value is SeverityCode {
  return typeof value === 'number' &&
    !Number.isNaN(value) &&
    Number.isFinite(value) &&
    value >= SeverityCode.trace &&
    value <= SeverityCode.error;
}

export function isName(value: unknown): value is SeverityName {
  return typeof value === 'string' && (
    value === SeverityName.TRACE ||
    value === SeverityName.DEBUG ||
    value === SeverityName.INFO ||
    value === SeverityName.WARN ||
    value === SeverityName.ERROR
  );
}

export function toName(value: SeverityCode): SeverityName;
export function toName(value: unknown): SeverityName | undefined {
  return isCode(value) ? SeverityMap[value] : undefined;
}

export function toCode(value: SeverityName): SeverityCode;
export function toCode(value: unknown): SeverityCode | undefined {
  return isName(value) ? SeverityMap[value] : undefined;
}

export function severityMatches(severity: SeverityCode | SeverityName, value: SeverityCode | SeverityName): boolean {

  const input = isCode(severity) ? severity : toCode(severity);
  const other = isCode(value) ? value : toCode(value);

  return input === other;
}

export type JSONPrimitive = boolean | number | object | string | null;

export interface Log {
  severity: SeverityCode | SeverityName;
  arguments: unknown[];
  context?: Record<string, JSONPrimitive>;

  toString(): string;
}

export type LogCall = (...args: unknown[]) => Facade;

export type Facade = Record<SeverityName, LogCall> & Record<symbol, unknown>;
