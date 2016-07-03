# IndustryChain [![Build Status](https://travis-ci.org/invrs/industry-chain.svg?branch=master)](https://travis-ci.org/invrs/industry-chain)

Chain synchronous or async methods using a common parameter namespace.

## Requirements

This extension must be paired with [StandardIO](https://github.com/invrs/industry-standard-io) and [Functions](https://github.com/invrs/industry-functions).

## Usage

```js
import { factory } from "industry"
import { chain } from "industry-chain"
import { instance } from "industry-instance"
import { functions } from "industry-functions"
import { standard_io } from "industry-standard-io"

class Test {
  hello() {
    return [
      this.getHello,
      this.getWorld,
      this.log
    ]
  }

    getHello() { return { hello: "hello" } }
    
    getWorld({ promise: { resolve } }) {
      setTimeout(() => resolve({ world: "world" }), 10)
    }
    
    log({ hello, world }) { console.log(`${hello} ${world}`) }
}

let test = factory(Test)
  .set("instance", instance)
  .set("functions", functions)
  .set("standard_io", standard_io)
  .set("chain", chain)

test().hello()
  // hello world!
```
