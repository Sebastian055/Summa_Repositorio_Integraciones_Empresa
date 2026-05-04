const { createConfig } = require('@backstage/cli/config/webpack');

module.exports = (env) => {
  const config = createConfig(env);

  config.stats = {
    ...config.stats,
    warningsFilter: [/protobufjs\/inquire/],
  };

  return config;
};
