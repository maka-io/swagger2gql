"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callBackend = exports.createSchema = void 0;
const create_schema_1 = __importDefault(require("./create-schema"));
exports.createSchema = create_schema_1.default;
const call_backend_1 = __importDefault(require("./call-backend"));
exports.callBackend = call_backend_1.default;
