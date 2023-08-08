"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHashFromInvoice = exports.generateRandom10DigitNumber = exports.requestApiAccess = exports.sendHeaders = exports.verifyLsatToken = exports.getLsatToChallenge = void 0;
const light_bolt11_decoder_1 = require("light-bolt11-decoder");
const lsat_js_1 = require("lsat-js");
const Macaroon = __importStar(require("macaroon"));
const crypto_1 = require("crypto");
const lnurl_1 = require("./lnurl");
const LN_ADDRESS_REGEX = /^((?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function getLsatToChallenge(requestBody, amtinsats, config) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const invoice = yield (0, lnurl_1.getInvoiceFromAddress)(config.lnAddress, amtinsats);
            const paymentHash = (0, exports.getHashFromInvoice)(invoice);
            const identifier = new lsat_js_1.Identifier({
                paymentHash: Buffer.from(paymentHash, "hex"),
            });
            const macaroon = Macaroon.newMacaroon({
                version: 1,
                rootKey: config.rootKey,
                identifier: identifier.toString(),
                location: config.location,
            });
            const lsat = lsat_js_1.Lsat.fromMacaroon((0, lsat_js_1.getRawMacaroon)(macaroon), invoice);
            const caveat = lsat_js_1.Caveat.decode(`bodyHash=${(0, crypto_1.createHash)("sha256")
                .update(JSON.stringify(requestBody))
                .digest("hex")}`);
            const caveatExpiry = new lsat_js_1.Caveat({
                condition: "expiration",
                // adding 15 mins expiry
                value: Date.now() + 900000,
            });
            lsat.addFirstPartyCaveat(caveat);
            lsat.addFirstPartyCaveat(caveatExpiry);
            console.log(lsat.toJSON());
            console.log("Caveats: ", lsat.getCaveats());
            return lsat;
        }
        catch (e) {
            throw e;
        }
    });
}
exports.getLsatToChallenge = getLsatToChallenge;
function verifyLsatToken(lsatToken, requestBody, config) {
    try {
        const bodyhash = (0, crypto_1.createHash)("sha256")
            .update(JSON.stringify(requestBody))
            .digest("hex");
        const lsat = lsat_js_1.Lsat.fromToken(lsatToken);
        // Check to see if expires or preimage/hash not satisfied
        if (lsat.isExpired() || !lsat.isSatisfied)
            return false;
        const result = (0, lsat_js_1.verifyMacaroonCaveats)(lsat.baseMacaroon, config.rootKey, lsat_js_1.expirationSatisfier);
        // check if macaroon is not tampered
        if (!result)
            return false;
        const caveats = lsat.getCaveats();
        // check if the body hash matches
        for (const caveat of caveats) {
            if (caveat.condition === "bodyHash" && caveat.value !== bodyhash) {
                console.log("inside bodyhash", caveat.value);
                return false;
            }
        }
    }
    catch (error) {
        console.log("Inside catch with error: ", error);
        return false;
    }
    return true;
}
exports.verifyLsatToken = verifyLsatToken;
function sendHeaders(stream) {
    if (stream) {
        return {
            "Content-Type": "text/event-stream; charset=utf-8",
            Connection: "keep-alive",
            server: "uvicorn",
            "Cache-Control": "no-cache",
            "Transfer-Encoding": "chunked",
        };
    }
    else {
        return {
            "Content-Type": "application/json",
            server: "uvicorn",
        };
    }
}
exports.sendHeaders = sendHeaders;
function requestApiAccess(apiPath) {
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
exports.requestApiAccess = requestApiAccess;
function generateRandom10DigitNumber() {
    const min = 1000000000; // 10-digit number starting with 1
    const max = 9999999999; // 10-digit number ending with 9
    const randomNumber = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomNumber;
}
exports.generateRandom10DigitNumber = generateRandom10DigitNumber;
function getLnurlpData(lnAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!lnAddress.match(LN_ADDRESS_REGEX)) {
            throw new Error("Invalid Lightning Address");
        }
        const [username, url] = lnAddress.split("");
        try {
            const req = yield fetch(`https://${url}/.well-known/lnurlp/${username}`);
        }
        catch (e) {
            console.log(e);
        }
    });
}
const getHashFromInvoice = (invoice) => {
    if (!invoice)
        return null;
    try {
        const decoded = (0, light_bolt11_decoder_1.decode)(invoice);
        if (!decoded || !decoded.sections)
            return null;
        const hashTag = decoded.sections.find(
        //@ts-ignore
        (value) => value.name === "payment_hash");
        if (!hashTag || !hashTag.value)
            return null;
        return hashTag.value.toString();
    }
    catch (_a) {
        return null;
    }
};
exports.getHashFromInvoice = getHashFromInvoice;
//# sourceMappingURL=utils.js.map