/* eslint-disable @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument */
import { Traverse } from 'neotraverse/modern';

import type { TsilogConfig } from '../configuration/tsilog.config.ts';
import type { MapperFactory } from './mapper.ts';

import {
  isCode,
  isName,
  type JSONPrimitive,
  type Log,
  SeverityCode,
  severityMatches,
  SeverityName,
} from '../facade.ts';
import { EntityRepresentation } from './entity-representation.ts';
import { MetaKey } from './mapper-feature.config.ts';

const defaultKeyMatcher = '(?:(?:auth|deploy(?:ment)?|secret|private|prod(?:uction)?)[-_\s]?key|auth(?:orization)?|pass(?:word)?|pw|(?:cc|(?:cred|deb)(?:it)?)(?:(?:[-_\s]?card)?(?:[-_\s]?num(?:ber)?)?)|cvv|secret|ssn?|soc(?:ial)?(?:[-_\s]?sec(?:urity)?)?)';

// This mapper is the default entrypoint to most tsilog chains
export const entityMapperFactory: MapperFactory<Omit<TsilogConfig, 'flume'>, unknown[], Log[]> =
  (config) => {

    const mappingConfig = config.features.mapper;
    const mappingEnabled = mappingConfig.enabled ?? true;
    const captureStackSeverity = mappingConfig.captureStack ?? SeverityName.TRACE;
    const keyMatcher = new RegExp(
      mappingConfig.matcherOverride ?? defaultKeyMatcher,
      'gi',
    );
    const defaultMaskValue = mappingConfig.maskValue ?? '{{SECRET_OMITTED}}';
    const additionalMatcher = mappingConfig.additionalMatcher === undefined
                              ? undefined
                              : new RegExp(mappingConfig.additionalMatcher, 'gi');
    const maskValueCallback = mappingConfig.maskValueCallback;

    const mapper: ReturnType<typeof entityMapperFactory> = (input) => {

      const severity = isCode(input.at(0))
                       ? input.shift() as SeverityCode
                       : isName(input.at(0))
                         ? input.shift() as SeverityName
                         : config.defaultSeverity;
      let entities = globalThis.structuredClone(input);

      const captureStackEnabled = mappingEnabled &&
        (typeof captureStackSeverity === 'boolean'
         ? captureStackSeverity
         : severityMatches(severity, captureStackSeverity));
      let context: Map<string, JSONPrimitive> | undefined;

      if (mappingEnabled) {

        entities = new Traverse(entities, {
          immutable: true,
          includeSymbols: false,
        }).map((ctx) => {

          const key = String(ctx.key);
          let mask: string | undefined;

          if (ctx.key !== undefined &&
            (keyMatcher.test(key) || additionalMatcher?.test(key))) {
            mask = maskValueCallback?.(
              ctx.parent?.node,
              ctx.key,
              ctx.node,
            ) ?? defaultMaskValue;
          }

          ctx.update(new EntityRepresentation(ctx.node, mask));
        });
        context ??= new Map();
        context.set(MetaKey.Time, Date.now());

        if (captureStackEnabled) {
          context.set(MetaKey.Stack, captureStack(mapper) ?? null);
        }
      }

      return [
        {
          severity,
          entities,
          context,

          toString: () => {
            const values = entities.map((arg) => {
              // TODO: get rid of the JSON here
              return typeof arg === 'string' ? arg : JSON.stringify(arg);
            });

            return values.join('');
          },
        } satisfies Log,
      ];
    };

    return mapper;
  };

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
function captureStack(fn?: Function): string | undefined {
  const error = new Error('Capturing stack');
  Error.captureStackTrace(error, fn ?? captureStack);
  return error.stack;
}
