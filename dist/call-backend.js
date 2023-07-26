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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const request_promise_1 = __importDefault(require("request-promise"));
const callBackend = ({ requestOptions: { method, body, baseUrl, path, query, headers, bodyType }, }) => __awaiter(void 0, void 0, void 0, function* () {
    return (0, request_promise_1.default)(Object.assign(Object.assign(Object.assign({}, (bodyType === 'json' && {
        json: true,
        body,
    })), (bodyType === 'formData' && {
        form: body,
    })), { qs: query, qsStringifyOptions: {
            indices: false,
        }, method,
        headers,
        baseUrl, uri: path }));
});
exports.default = callBackend;
