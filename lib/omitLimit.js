'use strict';

const { EachLimit } = require('./eachLimit');
const { setLimit } = require('./internal/collection');

class OmitLimit extends EachLimit {
  constructor(collection, limit, iterator) {
    super(collection, limit, iterator, set);
    this._result = {};
  }
}

module.exports = { omitLimit, OmitLimit };

function set(collection) {
  setLimit.call(this, collection);
  this._callResolve = this._keys === undefined ? callResolveArray : callResolveObject;
  return this;
}

function callResolveArray(value, index) {
  if (!value) {
    this._result[index] = this._coll[index];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

function callResolveObject(value, index) {
  if (!value) {
    const key = this._keys[index];
    this._result[key] = this._coll[key];
  }
  if (--this._rest === 0) {
    this._promise._resolve(this._result);
  } else if (this._callRest-- > 0) {
    this._iterate();
  }
}

/**
 * `Aigle.omitLimit` is almost the as [`Aigle.omit`](https://suguru03.github.io/aigle/docs/Aigle.html#omit) and
 * [`Aigle.omitSeries`](https://suguru03.github.io/aigle/docs/Aigle.html#omitSeries), but it will work with concurrency.
 * @param {Array|Object} collection
 * @param {integer} [limit=8]
 * @param {Function} iterator
 * @return {Aigle} Returns an Aigle instance
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = (num, index) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { '3': 4, '4': 2 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = { a: 1, b: 5, c: 3, d: 4, e: 2 };
 * const iterator = (num, key) => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitLimit(collection, 2, iterator)
 *   .then(object => {
 *     console.log(object); // { d: 4, e: 2 }
 *     console.log(order); // [1, 3, 5, 2, 4]
 *   });
 *
 * @example
 * const order = [];
 * const collection = [1, 5, 3, 4, 2];
 * const iterator = num => {
 *   return Aigle.delay(num * 10)
 *     .then(() => {
 *       order.push(num);
 *       return num % 2;
 *     });
 * };
 * Aigle.omitLimit(collection, iterator)
 *   .then(object => {
 *     console.log(object); // { '3': 4, '4': 2 }
 *     console.log(order); // [1, 2, 3, 4, 5]
 *   });
 */
function omitLimit(collection, limit, iterator) {
  return new OmitLimit(collection, limit, iterator)._execute();
}
