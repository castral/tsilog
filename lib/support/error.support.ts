/* eslint-disable regexp/no-super-linear-backtracking,regexp/strict */
import type { EnvironmentMap } from './env.support.ts';

export function isError(value: unknown): value is Error {
  return value instanceof Error
    || (
      value != null
      && typeof value === 'object'
      && (
        (
          'name' in value
          && typeof value.name === 'string'
          && value.name.endsWith('Error') // MyError
        )
        || Object.prototype.toString.call(value).endsWith('Error]') // [object Error]
      )
    );
}

enum FrameFormat {
  Unknown,
  JavaScriptCore,
  SpiderMonkey,
  V8,
}

export class Frame {
  // TODO: JSC is missing support for `eval@`, `eval@[native code]`, `[native code]`, etc
  private static javascriptCore = /^\s*((.*?)(?:\s—\s|@|\s\())?(.*?)(?:, line (\d+)|:(\d+)(?::(\d+))?)/gim; // safari

  private static spiderMonkey = /^\s*(.*?)[\s@]?([^@\s]*?)(?:\sline\s(\d+)\s>\seval)?:(\d+)(?::(\d+))?$/gim; // firefox

  private static v8 = /^\s+at\s([^(:\n]+)\(?([^)]*?)((:\d+){,2})\)?$/gim; // bun, chrome, deno, node

  public readonly dirName?: string;
  public readonly fileExt?: string;
  public readonly fileName?: string;
  public readonly location?: string;
  public readonly message?: string;
  public readonly srcPos?: [line: number, column: number];
  public readonly symbol?: string;

  constructor(public readonly original: string,
              public readonly index: number,
              public readonly format: FrameFormat = FrameFormat.V8) {}
}

export class StackTrace {
  private cursor = 0;
  private readonly frames: Frame[];

  constructor(env: EnvironmentMap, public readonly original: string) {
    // TODO: Detect and support correct frame format
    this.frames = original.split('\n').map((line, index) => new Frame(line, index));
  }
}

export interface TsilogErrorOptions {
  env: EnvironmentMap;
  message: string;
  wrapped: Error;
  cause?: TsilogError;
  stack?: StackTrace | string;
}

const TsilogErrorKey = Symbol('TsilogErrorKey');

export class TsilogError extends Error {
  private readonly _options: TsilogErrorOptions;

  public get options(): TsilogErrorOptions {
    return this._options;
  }
  public readonly wrapped: Error;
  public readonly stackTrace?: StackTrace | undefined;

  public constructor(options: TsilogErrorOptions) {
    super(options.message, { cause: options.cause });
    this.name = 'TsilogError';
    this._options = options;
    this.wrapped = options.wrapped;

    this.stack = typeof options.stack === 'string'
                 ? options.stack
                 : options.stack?.original ?? '';

    this.stackTrace = options.stack instanceof StackTrace
                      ? options.stack
                      : typeof options.stack === 'string'
                        ? new StackTrace(options.env, options.stack)
                        : undefined;

    Object.defineProperty(this, TsilogErrorKey, {
      value: true,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  public getCauses(err: unknown = this): readonly Error[] {
    return isError(err) ? [err, ...this.getCauses(err.cause)] : [];
  }
}

export function isTsilogError(value: unknown): value is TsilogError {
  return value != null && typeof value === 'object' && TsilogErrorKey in value;
}
