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

function each({ args }) {
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
        args.chain = {
          each: each({ args: args.args })
        }
        return fn.bind(this)(args)
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
