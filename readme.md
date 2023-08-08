# Best-README-Template
-----

  <p>
    A L402 middleware to protect your express routes.
    <br/>
    <!-- <a href="https://github.com/othneildrew/Best-README-Template">View Demo</a> -->
    <!-- · -->
    <a href="https://github.com/othneildrew/Best-README-Template/issues">Report Bug</a>
    ·
    <a href="https://github.com/othneildrew/Best-README-Template/issues">Request Feature</a>
  </p>
</div>

# Getting started

## Installation

Download an install via npm:

`npm i l402ify-middleware`

## Adding it to your projects

Simply add and configure the middleware for the routes that should be protected with L402:

```js
import express, { Request, Response, Router } from "express";
import { lsatMiddleware } from "l402ify-middleware";
import bodyParser from "body-parser";

const app = express();

app.use(bodyParser.json());

app.get(
    "/",
    lsatMiddleware(21, {
        lnAddress: "egge@getcurrent.io",
        rootKey: "Super secret secret",
        location: "http://localhost",
    }),
    (req: Request, res: Response) => {
        res.json({
            message: "Great Success!",
        });
    }
);

app.listen(8000, () => {
    console.log(`L402 running on http://localhost:8000`);
});
```

# Reference

```ts
function lsatMiddleware(
  priceInSats: number, // The price of the requested resource in Satoshi
  config: MiddlewareConfig // A config option for the middleware to create valid L402 macaroons
  )

type MiddlewareConfig = {
    lnAddress: string; // The Lightning Address that should be used to fetch an invoice
    rootKey: string; // The secret used to sign the Macaroon
    location: string; // The location that the macaroon was created at
}
```