import { MiddlewareConfig, getLsatToChallenge, verifyLsatToken } from "./utils";
import { NextFunction, Request, Response } from "express";

export function lsatMiddleware(priceInSats: number, config: MiddlewareConfig) {
  async function fn(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization || !verifyLsatToken(req.headers.authorization, req.body, config)) {
      const lsat = await getLsatToChallenge(req.body, priceInSats, config);
      res.setHeader('WWW-Authenticate', lsat.toChallenge());
      res.status(402).send('Payment required!');
      return;
    }
    next();
  }
  return fn
}