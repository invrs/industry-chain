import { factory } from "industry"
import { instance } from "industry-instance"
import { functions } from "industry-functions"
import { standard_io } from "industry-standard-io"
import { chain } from "../../"

describe("IndustryChain", () => {
  function makeTest() {
    return factory()
      .set("instance", instance)
      .set("functions", functions)
      .set("standard_io", standard_io)
      .set("chain", chain)
  }

  it("implements the chain function", (done) => {
    let base = class {
      a() { return { a: 1 } }
      b() { return { b: 2 } }
      c({ promise: { resolve } }) { setTimeout(() => resolve({ c: 3 }), 1) }
      d({ promise: { resolve } }) { resolve({ d: 4 }) }
      e() { return { e: 5 } }
      f({ promise: { resolve } }) { resolve({ f: 6 }) }
      empty({ value }) { return value || true }
      chain() { return [ this.c, this.empty, this.d ] }

      run() {
        return [
          [ this.a, this.empty ],
          this.b, this.chain, this.e, this.f
        ]
      }
    }

    let test = makeTest().base(base)
    let value = test().run()
    let expected = { a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, async: true, value: { f: 6 } }
    
    value.then(args => {
      expect(args).toEqual(expected)
      done()
    })

    delete value.then
    delete value.catch

    expect(value).toEqual({
      a: 1, b: 2, async: true, value: { b: 2 }
    })
  })

  it("returns a synchronous value from the chain function", () => {
    let base = class {
      a() { return "a" }
      b({ promise: { resolve } }) { resolve("b") }

      run() {
        return [ this.a, this.b ]
      }
    }

    let test = makeTest().base(base)
    expect(test().run().value).toBe("b")
  })

  it("allows chains from multiple functions", (done) => {
    let base = class {
      a() { return { a: 1 } }
      b() { return { b: 2 } }
      c() { return { c: 3 } }
      d() { return { d: 4 } }

      chain() {
        return [ this.c, this.d ]
      }

      chain2() {
        return [ this.a, this.b, this.chain ]
      }

      run() {
        return this.chain2()
      }
    }

    let test = makeTest().base(base)
    
    let output = test().run()
    let expected = { a: 1, b: 2, c: 3, d: 4, value: { d: 4 } }

    output.then(args => {
      expect(args).toEqual(expected)
      done()
    })

    delete output.then
    delete output.catch

    expect(output).toEqual(expected)
  })

  it("passes objects into chains", (done) => {
    let base = class {
      b({ promise: { resolve } }) { setTimeout(() => resolve({ b: 2 }), 1) }
      c() { return [ { c: 3 } ] }

      run() {
        return [
          { a: 1 },
          this.b,
          this.c,
          { d: 4 }
        ]
      }
    }

    let test = makeTest().base(base)
    
    let output = test().run()
    let expected = { a: 1, b: 2, c: 3, d: 4, async: true }

    output.then(args => {
      expect(args).toEqual(expected)
      done()
    })
  })

  it("passes functions into chains", (done) => {
    let base = class {
      b({ promise: { resolve } }) { setTimeout(() => resolve({ b: 2 }), 1) }
      d() { return { d: 4 } }

      run() {
        return [
          () => { return { a: 1 } },
          this.b,
          () => { return { c: 3 } },
          this.d
        ]
      }
    }

    let test = makeTest().base(base)
    
    let output = test().run()
    let expected = { a: 1, b: 2, c: 3, d: 4, async: true, value: { d: 4 } }

    output.then(args => {
      expect(args).toEqual(expected)
      done()
    })
  })
})
