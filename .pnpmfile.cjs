// TODO: This can be converted to .mjs in pnpm@11
module.exports = {
  hooks: {
    readPackage(pkg) {
      if (globalThis.process.env['CI'] === 'true') {
        delete pkg.devDependencies['@microsoft/api-extractor'];
        delete pkg.devDependencies['unplugin-dts'];
      }

      return pkg;
    },
  }
}
