import builtinType from 'builtin-type';

const EntityRepresentationKey = Symbol('EntityRepresentationKey');

export class EntityRepresentation {
  protected _type: string;

  public get type(): string {
    return this._type;
  }

  public constructor(
    public readonly value: unknown,
    public readonly mask?: string,
  ) {

    this._type = this.deduceType();

    Object.defineProperty(this, EntityRepresentationKey, {
      value: true,
      enumerable: false,
      writable: false,
      configurable: false,
    });
  }

  private deduceType(): string {
    return builtinType(this.value);
  }

  public toString(): string {
    // TODO: Implement this
    return this.mask ?? '';
  }
}

export function isEntity(value: unknown): value is EntityRepresentation {
  return value != null
    && typeof value === 'object'
    && EntityRepresentationKey in value;
}
