// string with placeholder format: `%@`
// string.split('placeholder')
// string.interleave(values)
// range = [prefix.length, replacement.length]
// string.applyTo(range, Record<Attribute, Value>)

export class Surrogate {
  public constructor(public readonly template: string,
                     public readonly placeholder: string = '%@') {}
}
