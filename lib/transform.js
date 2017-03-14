'use strict';

const { AigleProxy } = require('aigle-core');
const { Aigle } = require('./aigle');
const { clone } = require('./internal/util');
const { INTERNAL, call3, callProxyReciever } = require('./internal/util');

class TransformArray extends AigleProxy {

  constructor(array, iterator, result = []) {
    super();
    const size = array.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    let i = -1;
    while (++i < size && callProxyReciever(call3(iterator, result, array[i], i), this, i)) {}
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

class TransformObject extends AigleProxy {

  constructor(object, iterator, result = {}) {
    super();
    const keys = Object.keys(object);
    const size = keys.length;
    this._promise = new Aigle(INTERNAL);
    this._rest = size;
    this._result = result;
    if (size === 0) {
      return this._promise._resolve(result);
    }
    let i = -1;
    while (++i < size) {
      const key = keys[i];
      if (callProxyReciever(call3(iterator, result, object[key], key), this, i) === false) {
        break;
      }
    }
  }

  _callResolve(bool) {
    if (bool === false) {
      this._promise._resolved === 0 && this._promise._resolve(clone(this._result));
    } else if (--this._rest === 0) {
      this._promise._resolve(this._result);
    }
  }

  _callReject(reason) {
    this._promise._reject(reason);
  }
}

module.exports = transform;

/**
 * @param {Array|Object} collection
 * @param {Function} iterator
 * @param {Array|Object} [accumulator]
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result[index] = num);
 * };
 * return Aigle.transform(collection, iterator, {})
 *   .then(value => console.log(value)); // { '0': 1, '1': 4, '2': 2 }
 *
 * @example
 * const collection = [1, 4, 2];
 * const iterator = (result, num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => result.push(num));
 * };
 * return Aigle.transform(collection, iterator)
 *   .then(value => console.log(value)); // [1, 2, 4]
 *
 * @example
 * const collection = { a: 1, b: 4, c: 2 };
 * const iterator = (result, num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       result.push(num);
 *       return num !== 2;
 *     });
 * };
 * return Aigle.transform(collection, iterator, [])
 *   .then(value => console.log(value)); // [1, 2]
 */
function transform(collection, iterator, accumulator) {
  if (Array.isArray(collection)) {
    return new TransformArray(collection, iterator, accumulator)._promise;
  }
  if (collection && typeof collection === 'object') {
    return new TransformObject(collection, iterator, accumulator)._promise;
  }
  return Aigle.resolve(accumulator || {});
}