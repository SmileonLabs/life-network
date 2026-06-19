const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'isows') {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (moduleName.startsWith('zustand')) {
    const ctx = {
      ...context,
      unstable_enablePackageExports: false,
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (moduleName === 'jose') {
    const ctx = {
      ...context,
      unstable_conditionNames: ['browser'],
    };
    return ctx.resolveRequest(ctx, moduleName, platform);
  }

  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './src/global.css' });
