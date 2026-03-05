export interface Mapper<T, R> {
  (input: T): R;
}

export function chain<T>(v: T): T;
export function chain<T, A>(
  map1: Mapper<T, A>,
): Mapper<T, A>;
export function chain<T, A, B>(
  map1: Mapper<T, A>,
  map2: Mapper<A, B>,
): Mapper<T, B>;
export function chain<T, A, B, C>(
  map1: Mapper<T, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, C>,
): Mapper<T, C>;
export function chain<T, A, B, C, D>(
  map1: Mapper<T, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, C>,
  map4: Mapper<C, D>,
): Mapper<T, D>;
export function chain<T, A, B, C, D, E>(
  map1: Mapper<T, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, C>,
  map4: Mapper<C, D>,
  map5: Mapper<D, E>,
): Mapper<T, E>;
export function chain<T, A, B, C, D, E, F>(
  map1: Mapper<T, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, C>,
  map4: Mapper<C, D>,
  map5: Mapper<D, E>,
  map6: Mapper<E, F>,
): Mapper<T, F>;
export function chain(...mappers: Mapper<unknown, unknown>[]): Mapper<unknown, unknown> {
  return (input: unknown) =>
    mappers.reduce((previous, mapper) =>
      mapper(previous), input);
}
