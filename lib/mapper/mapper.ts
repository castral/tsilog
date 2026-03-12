export type Mapper<In, Out> = (input: In) => Out;

export function chain<In, A, Out>(
  map1: Mapper<In, A>,
  map2: Mapper<A, Out>,
): Mapper<In, Out>;
export function chain<In, A, B, Out>(
  map1: Mapper<In, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, Out>,
): Mapper<In, Out>;
export function chain<In, A, B, C, Out>(
  map1: Mapper<In, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, C>,
  map4: Mapper<C, Out>,
): Mapper<In, Out>;
export function chain<In, A, B, C, D, Out>(
  map1: Mapper<In, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, C>,
  map4: Mapper<C, D>,
  map5: Mapper<D, Out>,
): Mapper<In, Out>;
export function chain<In, A, B, C, D, E, Out>(
  map1: Mapper<In, A>,
  map2: Mapper<A, B>,
  map3: Mapper<B, C>,
  map4: Mapper<C, D>,
  map5: Mapper<D, E>,
  map6: Mapper<E, Out>,
): Mapper<In, Out>;
export function chain(...mappers: Mapper<unknown, unknown>[]): Mapper<unknown, unknown> {
  return (input: unknown) =>
    mappers.reduce((previous, mapper) =>
      mapper(previous), input);
}

export function linkChains<In, A, Out>(link: Mapper<In, A>, chains: Mapper<A, Out>[]): Mapper<In, Out[]> {
  return (input) => {
    const cache = link(input);
    return chains.map((output) => output(cache));
  };
}

export function linkChainsNoMemo<In, A, Out>(link: Mapper<In, A>, chains: Mapper<A, Out>[]): Mapper<In, Out[]> {
  return (input) => chains.map((output) => output(link(input)));
}
