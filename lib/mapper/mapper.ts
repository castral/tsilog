/**
 * A generic functional type that defines a mapping operation from one type to another.
 *
 * The `Mapper` type is a function that takes an input of type `In` and transforms it
 * into an output of type `Out`. This operation is purely functional, assuming no mutations
 * or side effects, and the return type solely depends on the given input and the mapping
 * logic.
 *
 * @template In - The type of the input expected by the mapping function.
 * @template Out - The type of the output produced by the mapping function.
 *
 * @param {In} input - The value to be transformed by the mapping function.
 *                     The exact transformation applied depends on the implementation of
 *   the function.
 *
 * @returns {Out} - The transformed result based on the input and the underlying
 *   implementation logic.
 */
export type Mapper<In, Out> = (input: In) => Out;

/**
 * Represents a factory type that generates a two-level mapping structure.
 * Specifically, it produces a {@link Mapper} that itself maps inputs to outputs using a
 * given configuration.
 *
 * @template ConfigType - The type representing the configuration used by the mapping
 *   logic.
 * @template In - (Optional) The type of input values to the nested mapper. Defaults to
 *   `unknown[]`.
 * @template Out - (Optional) The type of output values produced by the nested mapper.
 *   Defaults to `unknown[]`.
 *
 * @returns {Mapper<ConfigType, Mapper<In, Out>>}
 * A mapper that takes a configuration input and returns another mapper, the latter
 *   performing transformation between input values of type `In` and output values of type
 *   `Out`.
 */
export type MapperFactory<ConfigType, In = unknown[], Out = unknown[]> =
  Mapper<ConfigType, Mapper<In, Out>>;

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
export function chain<In, Out>(...mappers: Mapper<In, Out>[]): Mapper<In, Out>;
/**
 * Creates a composite mapper function by chaining the provided mapper functions.
 * The resulting function applies each mapper in sequence, passing the output of one mapper
 * as the input to the next. The chain begins with the provided input value.
 *
 * @param {...Mapper<unknown, unknown>[]} mappers - An array of mapper functions, where
 * each mapper transforms a value from one format to another. Each function must accept
 * an argument of the type returned by the previous mapper in the chain.
 *
 * @return {Mapper<unknown, unknown>} A new mapper function that executes the sequence
 * of provided mappers from left to right. The output of the final mapper in the chain
 * is returned. If no mappers are provided, the resulting mapper will return the input value
 * unchanged.
 */
export function chain(...mappers: Mapper<unknown, unknown>[]): Mapper<unknown, unknown> {
  globalThis.console.debug(`creating a chain of mappers: ${JSON.stringify(mappers)}`);
  return (input: unknown) => {
    globalThis.console.debug(`in a mapper chain looking at ${JSON.stringify(input)}`);
    return mappers.reduce((previous, mapper) =>
      mapper(previous), input);
  };

}

/**
 * Constructs a composite mapper function by chaining a primary transformation function
 * (`chain`) with multiple subsequent transformations (`chains`). The resulting function
 * applies the primary transformation on the input, then sequentially applies all
 * subsequent transformations to the output of the primary transformation, producing an
 * array of results corresponding to each of the subsequent transformations.
 *
 * @template In The type of the input value processed by the primary transformation
 *   function.
 * @template A  The intermediate type resulting from the primary transformation function.
 * @template Out The output type produced by each of the subsequent transformation
 *   functions.
 *
 * @param {Mapper<In, A>} chain A mapper function that processes the input and returns an
 *   intermediate value of type `A`. This function is executed once for the provided input.
 * @param {Mapper<A, Out>[]} chains An array of mapper functions, each taking the
 *   intermediate value produced by `chain` and transforming it into an output value of
 *   type `Out`. Each mapper operates independently, and the results are collected into an
 *   array.
 *
 * @return {Mapper<In, Out[]>} A new mapper function that takes an input of type `In`,
 *   processes it using the `chain` mapper, and applies all subsequent mappers in `chains`
 *   to generate an array of output values. The position of each output in the returned
 *   array corresponds to the order of the mappers in the `chains` array.
 *
 * Note:
 * - The `chain` function is called exactly once per input.
 * - Each function in the `chains` array is invoked independently with the same
 *   intermediate value produced by `chain`.
 * - If the `chains` array is empty, the resulting mapper returns an empty array.
 * - If any of the mappers in `chains` have side effects, those effects will occur based on
 *   their implementation during execution.
 */
export function chainToMany<In, A, Out>(chain: Mapper<In, A>, chains: Mapper<A, Out>[]): Mapper<In, Out[]> {
  return (input) => {
    const cache = chain(input);
    return chains.map((output) => output(cache));
  };
}

/**
 * Applies a cascading sequence of transformations over an input value to produce multiple
 * outputs.
 *
 * This function takes an initial transformation function (`chain`) and applies it to the
 * input. Then, it applies each transformation function in the `chains` array to the result
 * of the first transformation. The output is an array of results, where each element is
 * the result of applying a transformation from the `chains` array to the intermediate
 * result of `chain`.
 *
 * This method does not perform memoization, meaning it re-executes the transformations
 * rather than caching results.
 *
 * @param chain A `Mapper` function that transforms an input of type `In` into an output of
 *   type `A`. This is applied first to the input.
 * @param chains An array of `Mapper` functions, each transforming an input of type `A` to
 *   an output of type `Out`. Each element in the array is applied independently to the
 *   result of the `chain` transformation.
 * @return A `Mapper` function that, when invoked, transforms an input of type `In` to an
 *   array of outputs of type `Out`. The array consists of the results of applying each
 *   function in `chains` to the intermediate transformation of `chain`.
 */
export function chainToManyNoMemo<In, A, Out>(chain: Mapper<In, A>, chains: Mapper<A, Out>[]): Mapper<In, Out[]> {
  return (input) => chains.map((output) => output(chain(input)));
}

/**
 * Combines multiple mapping functions into a single function that aggregates their results
 * into an array.
 *
 * The returned function applies each provided mapping function to an input value and
 * concatenates the results into a new array. If a mapping function returns an empty array,
 * its contribution is excluded.
 *
 * This function enables chaining multiple transformations and consolidating their outputs
 * while preserving the order in which the mapping functions were provided.
 *
 * @param {Mapper<In, Out>[]} chains - An array of mapping functions, each transforming an
 *   input of type `In` into a value or collection of values of type `Out`. These functions
 *   are called sequentially, and their results are flattened into the output array.
 * @return {Mapper<In, Out[]>} A new function that takes an input value of type `In`,
 *   applies the provided mapping functions to this input, and produces a flattened array
 *   of the resulting values.
 */
export function manyToChain<In, Out>(...chains: Mapper<In, Out>[]): Mapper<In, Out[]> {
  globalThis.console.debug(`creating a manyToChain of mappers: ${JSON.stringify(chains)}`);
  return (input) => {
    globalThis.console.debug(`inside manyToChain looking at ${JSON.stringify(input)}`);
    return chains.flatMap((branch) => branch(input));
  };
}
