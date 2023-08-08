import { Lsat } from "lsat-js";
export type MiddlewareConfig = {
    lnAddress: string;
    rootKey: string;
    location: string;
};
export declare function getLsatToChallenge(requestBody: string, amtinsats: number, config: MiddlewareConfig): Promise<Lsat>;
export declare function verifyLsatToken(lsatToken: any, requestBody: string, config: MiddlewareConfig): boolean;
export declare function sendHeaders(stream: boolean): any;
export declare function requestApiAccess(apiPath: string): {
    headers: HeadersInit;
    url: string;
};
export declare function generateRandom10DigitNumber(): number;
export declare const getHashFromInvoice: (invoice: string) => any;
