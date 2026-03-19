import { describe, it, vi } from 'vitest';

import { chain, chainToMany, chainToManyNoMemo, manyToChain } from './mapper.ts';

describe('mapper', () => {
  it ('should chain one to one sequentially', ({ expect }) => {
    expect.hasAssertions();

    const mapper = vi.fn<(input: number) => number>((input: number): number => input + 1);

    const flume = chain(
      mapper,
      mapper,
      mapper,
      mapper,
      mapper,
    );

    const result = flume(0);

    expect(result).toStrictEqual(5);
    expect(mapper).toHaveBeenCalledTimes(5);
  });

  it('should chain one to many', ({ expect }) => {
    expect.hasAssertions();

    const mapper = vi.fn<(input: number) => number>((input: number) => input + 1);

    const outTwo = vi.fn<(input: number) => number>((input: number) => input * 2);
    const outThree = vi.fn<(input: number) => number>((input: number) => input * 3);
    const outFour = vi.fn<(input: number) => number>((input: number) => input * 4);

    const flume = chainToMany(mapper, [outTwo, outThree, outFour]);
    const results = flume(1);

    expect(results).toStrictEqual([4, 6, 8]);
    expect(mapper).toHaveBeenCalledTimes(1);
    expect(outTwo).toHaveBeenCalledTimes(1);
    expect(outThree).toHaveBeenCalledTimes(1);
    expect(outFour).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    const flume2 = chainToManyNoMemo(mapper, [outTwo, outThree, outFour]);

    const results2 = flume2(1);

    expect(results2).toStrictEqual([4, 6, 8]);
    expect(mapper).toHaveBeenCalledTimes(3); // Note no caching here
    expect(outTwo).toHaveBeenCalledTimes(1);
    expect(outThree).toHaveBeenCalledTimes(1);
    expect(outFour).toHaveBeenCalledTimes(1);
  });

  it('should chain many to one', ({ expect }) => {
    expect.hasAssertions();

    const outTwo = vi.fn<(input: number) => number>((input: number) => input * 2);
    const outThree = vi.fn<(input: number) => number>((input: number) => input * 3);
    const outFour = vi.fn<(input: number) => number>((input: number) => input * 4);

    const mapper = vi.fn<(input: number[]) => number>((input: number[]) => input.reduce((prev, next) => prev + next, 0));

    const flume = chain(
      manyToChain(outTwo, outThree, outFour),
      mapper,
    );
    const results = flume(2);

    expect(results).toStrictEqual(18);
    expect(mapper).toHaveBeenCalledTimes(1);
    expect(outTwo).toHaveBeenCalledTimes(1);
    expect(outThree).toHaveBeenCalledTimes(1);
    expect(outFour).toHaveBeenCalledTimes(1);
  });
});
