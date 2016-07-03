import { returnObject } from "standard-io"

function chainResult({ c, args, promise }) {
  if (typeof c == "function") {
    c = c(args)
  }
  if (!c) {
    return {}
  } else if (c.async || (c.value == undefined && c.then)) {
    args.async = true
    return c.then(thenMergeArgs(args))
  } else {
    return mergeArgs({ args, value: c })
  }
}

function fnEach({ array, fn }) {
  return fn(
    ...array.map(item => {
      if (Array.isArray(item)) {
        return fnEach({ array: item, fn })
      } else {
        return item
      }
    })
  )
}

function then({ args }) {
  return (...chains) => {
    let promise

    chains.forEach(c => {
      if (promise) {
        promise = promise
          .then(() => chainResult({ c, args }))
      } else {
        let result = chainResult({ c, args })
        if (args.async && result.then) {
          promise = result
        }
      }
    })

    return returnObject({ promise, value: args })
  }
}

function mergeArgs({ args, value={} }) {
  if (typeof value == "object") {
    for (let key in value) {
      if ([ "then", "catch" ].indexOf(key) < 0) {
        args[key] = value[key]
      }
    }
  } else {
    args.value = value
  }
  return args
}

function patch(ignore) {
  for (let name in this.functions()) {
    if (ignore.indexOf(name) == -1) {
      let fn = this[name]
      this[name] = (args) => {
        let thenFn = then({ args: args.args })
        let output = fn.bind(this)(args)

        if (Array.isArray(output)) {
          return fnEach({ array: output, fn: thenFn })
        } else {
          return output
        }
      }
    }
  }
}

function thenMergeArgs(args) {
  return value => mergeArgs({ args, value })
}

export let chain = Class =>
  class extends Class {
    static beforeFactoryOnce() {
      this.industry({
        ignore: {
          args: [ "chain" ]
        }
      })
      super.beforeFactoryOnce()
    }

    beforeInit() {
      patch.bind(this)(this.Class.industry().ignore.instance)
      super.beforeInit()
    }
  }
