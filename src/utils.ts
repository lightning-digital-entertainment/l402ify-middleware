import { decode } from "light-bolt11-decoder";
import {
    Lsat,
    Identifier,
    Caveat,
    getRawMacaroon,
    verifyMacaroonCaveats,
    expirationSatisfier,
} from "lsat-js";
import * as Macaroon from "macaroon";
import { createHash } from "crypto";
import { getInvoiceFromAddress } from "./lnurl";

export type MiddlewareConfig = {
    lnAddress: string;
    rootKey: string;
    location: string;
};

const LN_ADDRESS_REGEX =
    /^((?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;

export async function getLsatToChallenge(
    requestBody: string,
    amtinsats: number,
    config: MiddlewareConfig
): Promise<Lsat> {
    try {
        const invoice = await getInvoiceFromAddress(
            config.lnAddress,
            amtinsats
        );
        const paymentHash = getHashFromInvoice(invoice)
        const identifier = new Identifier({
            paymentHash: Buffer.from(paymentHash, "hex"),
        });

        const macaroon = Macaroon.newMacaroon({
            version: 1,
            rootKey: config.rootKey,
            identifier: identifier.toString(),
            location: config.location,
        });

        const lsat = Lsat.fromMacaroon(
            getRawMacaroon(macaroon),
            invoice
        );
        const caveat = Caveat.decode(
            `bodyHash=${createHash("sha256")
                .update(JSON.stringify(requestBody))
                .digest("hex")}`
        );

        const caveatExpiry = new Caveat({
            condition: "expiration",
            // adding 15 mins expiry
            value: Date.now() + 900000,
        });

        lsat.addFirstPartyCaveat(caveat);
        lsat.addFirstPartyCaveat(caveatExpiry);

        console.log(lsat.toJSON());
        console.log("Caveats: ", lsat.getCaveats());

        return lsat;
    } catch (e) {
        throw e;
    }
}

export function verifyLsatToken(
    lsatToken: any,
    requestBody: string,
    config: MiddlewareConfig
): boolean {
    try {
        const bodyhash = createHash("sha256")
            .update(JSON.stringify(requestBody))
            .digest("hex");
        const lsat = Lsat.fromToken(lsatToken);

        // Check to see if expires or preimage/hash not satisfied
        if (lsat.isExpired() || !lsat.isSatisfied) return false;

        const result = verifyMacaroonCaveats(
            lsat.baseMacaroon,
            config.rootKey,
            expirationSatisfier
        );
        // check if macaroon is not tampered
        if (!result) return false;

        const caveats = lsat.getCaveats();

        // check if the body hash matches
        for (const caveat of caveats) {
            if (caveat.condition === "bodyHash" && caveat.value !== bodyhash) {
                console.log("inside bodyhash", caveat.value);
                return false;
            }
        }
    } catch (error) {
        console.log("Inside catch with error: ", error);
        return false;
    }

    return true;
}

export function sendHeaders(stream: boolean): any {
    if (stream) {
        return {
            "Content-Type": "text/event-stream; charset=utf-8",
            Connection: "keep-alive",
            server: "uvicorn",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
        };
    } else {
        return {
            "Content-Type": "application/json",
            server: "uvicorn",
        };
    }
}

export function requestApiAccess(apiPath: string): {
    headers: HeadersInit;
    url: string;
} {
    // API key

    // API host
    const host = (process.env.CURRENT_API_HOST || "").trim();

    return {
        headers: {
            "Content-Type": "application/json",
        },
        url: host + apiPath,
    };
}

export function generateRandom10DigitNumber(): number {
    const min = 1000000000; // 10-digit number starting with 1
    const max = 9999999999; // 10-digit number ending with 9

    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}

async function getLnurlpData(lnAddress: string) {
    if (!lnAddress.match(LN_ADDRESS_REGEX)) {
        throw new Error("Invalid Lightning Address");
    }
    const [username, url] = lnAddress.split("");
    try {
        const req = await fetch(
            `https://${url}/.well-known/lnurlp/${username}`
        );
    } catch (e) {
        console.log(e);
    }
}

export const getHashFromInvoice = (invoice: string) => {
    if (!invoice) return null;
    try {
        const decoded = decode(invoice);
        if (!decoded || !decoded.sections) return null;
        const hashTag = decoded.sections.find(
            //@ts-ignore
            (value) => value.name === "payment_hash"
        );
        if (!hashTag || !hashTag.value) return null;
        return hashTag.value.toString();
    } catch {
        return null;
    }
};
