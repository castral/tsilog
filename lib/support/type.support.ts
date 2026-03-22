export function walkObjectGraph(
  root: Record<number | string | symbol, unknown> | undefined,
  callback: (obj: Record<number | string | symbol, unknown>,
             key: number | string | symbol,
             value: unknown) => void,
  seen: Set<object> = new Set(),
): void {

  if (root === undefined) {
    return;
  }

  if (typeof root === 'object' && !seen.has(root)) {
    seen.add(root);

    const properties = Object.getOwnPropertyDescriptors(root);
    // TODO: Walk the prototype chain as well
    for (const [key, descriptor] of Object.entries(properties)) {
      if (descriptor.enumerable) {
        callback(root, key, descriptor.value);

        if (descriptor.value != null
          && typeof descriptor.value === 'object'
          && !Array.isArray(descriptor.value)) {
          walkObjectGraph(
            descriptor.value as Record<number | string | symbol, unknown>,
            callback,
            seen,
          );
        }
      }
    }
  }
}
