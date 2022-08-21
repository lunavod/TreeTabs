import { isEqual } from 'lodash-es'
import { $mobx, isObservable, makeObservable } from 'mobx'
import { useState, useEffect } from 'react'

export abstract class MobxStore<P = never> {
  _initialized = false
  _initData?: P

  abstract initialize(data?: P): void

  _initialize(data?: P) {
    if (this._initialized && isEqual(this._initData, data)) return
    this._initialized = true
    this._initData = data
    this.initialize(data)
  }
}

export function useMobx<T extends MobxStore<P>, P extends Array<any> = never>(
  store: T,
  data?: P,
): T {
  const [state] = useState(store)

  const deps = data ? [state._initialized, ...data] : [state._initialized]

  useEffect(() => {
    state._initialize(data)
  }, deps)

  return state
}

export function observableStore<T extends { new (...args: any[]): any }>(
  constructor: T,
) {
  return class extends constructor {
    constructor(...args: any[]) {
      super(...args)
      makeSimpleAutoObservable(this)
    }
  }
}

const annotationsSymbol = Symbol('annotationsSymbol')
const objectPrototype = Object.prototype

/**
 * A purposefully-limited version of `makeAutoObservable` that supports subclasses.
 *
 * There is valid complexity in supporting `makeAutoObservable` across disparate/edge-casey
 * class hierarchies, and so mobx doesn't support it out of the box. See:
 * https://github.com/mobxjs/mobx/discussions/2850#discussioncomment-1203102
 *
 * So this implementation adds a few limitations that lets us get away with it. Specifically:
 *
 * - We always auto-infer a key's action/computed/observable, and don't support user-provided config values
 * - Subclasses should not override parent class methods (although this might? work)
 * - Only the "most child" subclass should call `makeSimpleAutoObservable`, to avoid each constructor in
 *   the inheritance chain potentially re-decorating keys.
 *
 * See https://github.com/mobxjs/mobx/discussions/2850
 */
export function makeSimpleAutoObservable(target: any): void {
  // These could be params but we hard-code them
  const overrides = {} as any
  const options = {}

  // Make sure nobody called makeObservable/etc. previously (eg in parent constructor)
  if (isObservable(target)) {
    throw new Error('Target must not be observable')
  }

  let annotations = target[annotationsSymbol]
  if (!annotations) {
    annotations = {}
    let current = target
    while (current && current !== objectPrototype) {
      Reflect.ownKeys(current).forEach((key) => {
        if (key === $mobx || key === 'constructor') return
        annotations[key] = !overrides
          ? true
          : key in overrides
          ? overrides[key]
          : true
      })
      current = Object.getPrototypeOf(current)
    }
    // Cache if class
    const proto = Object.getPrototypeOf(target)
    if (proto && proto !== objectPrototype) {
      Object.defineProperty(proto, annotationsSymbol, { value: annotations })
    }
  }

  return makeObservable(target, annotations, options)
}
