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
exports.lsatMiddleware = void 0;
const utils_1 = require("./utils");
function lsatMiddleware(priceInSats, config) {
    function fn(req, res, next) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!req.headers.authorization || !(0, utils_1.verifyLsatToken)(req.headers.authorization, req.body, config)) {
                const lsat = yield (0, utils_1.getLsatToChallenge)(req.body, priceInSats, config);
                res.setHeader('WWW-Authenticate', lsat.toChallenge());
                res.status(402).send('Payment required!');
                return;
            }
            next();
        });
    }
    return fn;
}
exports.lsatMiddleware = lsatMiddleware;
//# sourceMappingURL=index.js.map