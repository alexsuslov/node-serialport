'use strict';

switch (process.platform) {
  case 'win32':
    module.exports = require('./bindings-win32');
    break;
  case 'darwin':
    module.exports = require('./bindings-darwin');
    break;
  default:
    module.exports = require('./bindings-unix');
}
