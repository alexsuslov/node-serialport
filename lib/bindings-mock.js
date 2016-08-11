'use strict';

var util = require('util');

function callLater() {
  var args = Array.prototype.slice.call(arguments);
  var callback = args.shift();
  process.nextTick(function() {
    callback && callback.apply(null, args);
  });
}

function MissingPortError(message) {
  this.message = message || 'Port does not exist - please call hardware.createPort(path) first';
  this.name = 'MissingPortError';
  Error.captureStackTrace(this, MissingPortError);
}
util.inherits(MissingPortError, Error);

var mockSerialportPoller = function(hardware) {
  var Poller = function(fd, cb) {
    this.port = hardware.fds[fd];
    if (!this.port) {
      throw new MissingPortError();
    }
    this.port.poller = this;
    this.polling = null;
    this.cb = cb;
  };
  Poller.prototype.start = function() {
    this.polling = true;
  };
  Poller.prototype.close = function() {
    this.polling = false;
  };
  Poller.prototype.detectRead = function() {
    this.cb();
  };
  return Poller;
};

function MockBindings() {
  this.nextFd = 0;
  this.fds = {};
  this.ports = {};
  var functions = [
    'close',
    'drain',
    'flush',
    'list',
    'open',
    'set',
    'update',
    'write'
  ];
  functions.forEach(function(name){
    this[name] = this[name].bind(this);
  }.bind(this));
};

MockBindings.prototype.reset = function() {
  this.ports = {};
  this.fds = {};
  this.nextFd = 0;
};


// need to allow multiple fd's for a path
MockBindings.prototype.createPort = function(path) {
  if (this.ports[path]) {
    delete this.fds[this.ports[path].fd];
  }
  this.ports[path] = {
    data: new Buffer(0),
    lastWrite: null,
    poller: null,
    info: {
      comName: path,
      manufacturer: 'The J5 Robotics Company',
      serialNumber: undefined,
      pnpId: undefined,
      locationId: undefined,
      vendorId: undefined,
      productId: undefined
    },
    fds: []
  };
};

MockBindings.prototype.getPortByPath = function(path) {
  return this.ports[path];
};

MockBindings.prototype.getPortByFD = function(fd) {
  return this.fds[fd];
};

MockBindings.prototype.emitData = function(path, data) {
  var port = this.getPortByPath(path);
  port.data = Buffer.concat([port.data, data]);
  port.poller && port.poller.detectRead();
};

MockBindings.prototype.disconnect = function(path) {
  var port = this.getPortByPath(path);
  var err = new Error('disconnected');
  port.openOpt.disconnectedCallback(err);
};

MockBindings.prototype.list = function(cb) {
  var ports = this.ports;
  var info = Object.keys(ports).map(function(path) {
    return ports[path].info;
  });
  callLater(cb, null, info);
};

MockBindings.prototype.open = function(path, opt, cb) {
  var port = this.getPortByPath(path);
  if (!port) {
    return cb(new MissingPortError(path));
  }
  if (port.fds.length > 0 && port.openOpt.lock) {
    return cb(new Error('port is locked cannot open'));
  }
  port.openOpt = opt;
  var fd = this.nextFd++;
  port.fds.push(fd);
  this.fds[fd] = port;
  callLater(cb, null, fd);
};

MockBindings.prototype.close = function(fd, cb) {
  var port = this.getPortByFD(fd);
  if (!port) {
    return callLater(cb, new Error(fd + ' fd is already closed'));
  }

  // remove fd
  delete this.fds[fd];
  port.fds = port.fds.filter(function(item) { return item !== fd });
  callLater(cb, null);
};

MockBindings.prototype.update = function(fd, opt, cb) {
  if (!opt.baudRate) {
    throw new Error('Missing baudRate');
  }

  if (!this.getPortByFD(fd)) {
    return callLater(cb, new MissingPortError());
  }
  callLater(cb, null);
};

MockBindings.prototype.write = function(fd, buffer, cb) {
  var port = this.getPortByFD(fd);
  if (!port) {
    return callLater(cb, new MissingPortError());
  }
  port.lastWrite = new Buffer(buffer); // copy
  callLater(cb, null, buffer.length);
};

MockBindings.prototype.flush = function(fd, cb) {
  if (!this.getPortByFD(fd)) {
    return callLater(cb, new MissingPortError());
  }
  callLater(cb, null, undefined);
};

MockBindings.prototype.set = function(fd, options, cb) {
  if (!this.getPortByFD(fd)) {
    return callLater(cb, new MissingPortError());
  }
  callLater(cb, null, undefined);
};

MockBindings.prototype.drain = function(fd, cb) {
  if (!this.getPortByFD(fd)) {
    return callLater(cb, new MissingPortError());
  }
  callLater(cb, null, undefined);
};

var mockBindings = new MockBindings();
module.exports = mockBindings;
