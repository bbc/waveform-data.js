"use strict";

function MainThreadWorker(func) {
  this._listeners = {};

  func.call(this);
}

MainThreadWorker.prototype.addEventListener = function(event, listener) {
  if (!this._listeners[event]) {
    this._listeners[event] = [];
  }

  this._listeners[event].push(listener);
};

MainThreadWorker.prototype.removeEventListener = function(event, listener) {
  if (this._listeners[event]) {
    this._listeners[event] = this._listeners[event].filter(function(item) {
      return item !== listener;
    });
  }
};

MainThreadWorker.prototype.postMessage = function(data) {
  var event = { data: data };

  var listeners = this._listeners.message;

  for (var i = 0; i < listeners.length; i++) {
    listeners[i].call(this, event);
  }
};

MainThreadWorker.prototype.close = function() {
  this._listeners = {};
};

module.exports = MainThreadWorker;
