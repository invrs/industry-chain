# IndustryChain [![Build Status](https://travis-ci.org/invrs/industry-chain.svg?branch=master)](https://travis-ci.org/invrs/industry-chain)

Used with [IndustryStandardIO](https://github.com/invrs/industry-standard-io) to chain synchronous or asynchronous functions in a shared namespace.

## Requirements

This extension must be paired with [IndustryStandardIO](https://github.com/invrs/industry-standard-io) and [IndustryFunctions](https://github.com/invrs/industry-functions).

## Usage

```js
import { factory } from "industry"
import { chain } from "industry-chain"
import { instance } from "industry-instance"
import { functions } from "industry-functions"
import { standard_io } from "industry-standard-io"

let test = factory()
  .set("chain", chain)
  .set("instance", instance)
  .set("functions", functions)
  .set("standard_io", standard_io)
  .base(class {
    getHello() { return { hello: "hello" } }
    
    getWorld({ promise: { resolve } }) {
      setTimeout(() => resolve({ world: "world" }), 10)
    }
    
    isExclaming({ exclaim }) { return !!exclaim }
    
    addExclamation({ world }) { return { world: `${world}!` } }
    
    log({ hello, world }) { console.log(`${hello} ${world}`) }

    hello({ chain: { each, all, ifElse } }) {
      return each(
        all(
          this.getHello,
          this.getWorld,
        ),
        ifElse(
          this.isExclaming,
          this.addExclamation
        ),
        this.log
      )
    }
  })

test().hello({ exclaim: true })
  // hello world!
```
