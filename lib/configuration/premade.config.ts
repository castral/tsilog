import {
  createTsilogConfig,
  defaultUserConfig,
  type TsilogConfig,
  type UserConfig,
} from './tsilog.config.ts';

export function configureConsole(userConfig?: UserConfig): TsilogConfig {
  return createTsilogConfig({
    ...defaultUserConfig,
    ...userConfig,

    features: {
      ...defaultUserConfig.features,
      ...userConfig?.features,
    },
  });
}
