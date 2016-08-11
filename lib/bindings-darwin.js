'use strict';

var bindings = require('bindings')('serialport.node');

module.exports = {
  close: bindings.close,
  drain: bindings.drain,
  flush: bindings.flush,
  list: bindings.list,
  open: bindings.open,
  set: bindings.set,
  update: bindings.update,
  write: bindings.write,
  PortReader: bindings.PortReader,
  platformOptions: {
    vmin: 1,
    vtime: 0
  }
};

function PortReader(options) {
  this.fd = options.fd;
  this.pushData = options.pushData;
  this.errorCallback = options.errorCallback;
}

PortReader.prototype.requestBytes = function(bytes) {
  this.bytesWanted = bytes;
  this.startReading();
};

PortReader.prototype.startReading = function() {

};

PortReader.prototype.stopReading = function() {

};

