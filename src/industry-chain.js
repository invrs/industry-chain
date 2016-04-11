import { returnObject } from "standard-io"

function each({ args }) {
  return (...chains) => {
    let promise

    chains.forEach(c => {
      if (promise) {
        promise = promise
          .then(() => c(args))
          .then(thenMergeArgs(args))
      } else {
        if (typeof c == "function") {
          c = c(args)
        }
        if (!c) {
          return
        } else if (c.async || (c.value == undefined && c.then)) {
          args.async = true
          promise = c.then(thenMergeArgs(args))
        } else {
          mergeArgs({ args, value: c })
        }
      }
    })

    promise = promise || Promise.resolve(args)
    
    let output = returnObject({ value: args })
    output.then = promise.then.bind(promise)

    return output
  }
}

function mergeArgs({ args, value={} }) {
  if (typeof value == "object") {
    for (let key in value) {
      if (key != "then") {
        args[key] = value[key]
      }
    }
  } else {
    args.value = value
  }
}

function thenMergeArgs(args) {
  return value => {
    mergeArgs({ args, value })
    return args
  }
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
