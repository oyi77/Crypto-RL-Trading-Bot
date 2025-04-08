import { Plugin } from 'vite';

export function vitePluginNodePreGyp(): Plugin {
  return {
    name: 'vite-plugin-node-pre-gyp',
    enforce: 'pre',
    resolveId(id) {
      if (id === 'node-pre-gyp' || id === '@mapbox/node-pre-gyp') {
        return {
          id,
          external: true
        };
      }
      return null;
    },
    transform(code, id) {
      if (id.includes('node-pre-gyp')) {
        return {
          code: code.replace(/module\.exports/g, 'export default'),
          map: null
        };
      }
      return null;
    }
  };
} 