"use strict";
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
exports.getInvoiceFromAddress = void 0;
const LN_ADDRESS_REGEX = /^((?:[^<>()\[\]\\.,;:\s@"]+(?:\.[^<>()\[\]\\.,;:\s@"]+)*)|(?:".+"))@((?:\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(?:(?:[a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function getLnurlpData(lnAddress) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!lnAddress.match(LN_ADDRESS_REGEX)) {
            throw new Error("Invalid Lightning Address");
        }
        const [username, url] = lnAddress.split("@");
        try {
            const req = yield fetch(`https://${url}/.well-known/lnurlp/${username}`);
            const data = (yield req.json());
            return parseLnurlp(data);
        }
        catch (e) {
            throw new Error("Could not get LNURL pay data");
        }
    });
}
function parseLnurlp(data) {
    const callback = (data.callback + "").trim();
    const min = Math.ceil(Number(data.minSendable || 1));
    const max = Number(data.maxSendable);
    return {
        callback,
        min,
        max,
    };
}
function getLnurlpInvoice(lnurlpData, amountInSats) {
    return __awaiter(this, void 0, void 0, function* () {
        const amountInMilliSats = amountInSats * 1000;
        if (amountInMilliSats > lnurlpData.max || amountInMilliSats < lnurlpData.min) {
            throw new Error("Amount is out of bounds");
        }
        const req = yield fetch(`${lnurlpData.callback}?amount=${amountInMilliSats}`);
        const data = yield req.json();
        return data.pr;
    });
}
function getInvoiceFromAddress(lnAddress, amountInSats) {
    return __awaiter(this, void 0, void 0, function* () {
        const data = yield getLnurlpData(lnAddress);
        const invoice = yield getLnurlpInvoice(data, amountInSats);
        return invoice;
    });
}
exports.getInvoiceFromAddress = getInvoiceFromAddress;
getInvoiceFromAddress('egge@getcurrent.io', 21);
//# sourceMappingURL=lnurl.js.map