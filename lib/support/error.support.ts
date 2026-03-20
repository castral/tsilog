/* eslint-disable regexp/no-super-linear-backtracking,regexp/strict */
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

export class Frame {
  public readonly fileName?: string;
  public readonly fileExt?: string;
  public readonly dirName?: string;
  public readonly srcPos?: [line: number, column: number];
  public readonly funcName?: string;

  constructor(public readonly original: string, public readonly index: number) {}
}

export class StackTrace {
  private static nodeTrace = /^\s+at\s([^(:\n]+)\(?([^)]*?)((:\d+){,2})\)?$/gim;
  private static safariTrace = /(.*?)(?:\s—\s|\)\s\()(.+?)(?::|,\sline\s)(\d+)\)?$/gim;
  private cursor = 0;
  private readonly frames: Frame[];

  constructor(public readonly original: string) {
    this.frames = original.split('\n').map((line, index) => new Frame(line, index));
  }
}

export interface TsilogErrorOptions {
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
                        ? new StackTrace(options.stack)
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
