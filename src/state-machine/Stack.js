'use strict';

class Stack {

  constructor() {
    this._store = [];
  }

  push(val) {
    this._store.push(val);
  }

  pop() {
    return this._store.pop();
  }

  peek() {
    return this._store[this._store.length - 1];
  }

  isEmpty() {
    return this._store.length === 0;
  }

  toArray() {
    return this._store.slice(0);
  }

}

module.exports = Stack;
