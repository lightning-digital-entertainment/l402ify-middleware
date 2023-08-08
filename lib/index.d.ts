import { MiddlewareConfig } from "./utils";
import { NextFunction, Request, Response } from "express";
export declare function lsatMiddleware(priceInSats: number, config: MiddlewareConfig): (req: Request, res: Response, next: NextFunction) => Promise<void>;
