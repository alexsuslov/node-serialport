'use strict';
var fs = require('fs');

module.export = function read(size) {
  var push = this.push.bind(this);
  var fd = this.fd;


};


bindings.ondata(fd, function(chunk) {
  // if push() returns false, then stop reading from source
  if (!this.push(chunk)) {
    this._source.readStop();
  }
});
