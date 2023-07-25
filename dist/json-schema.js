"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArrayType = exports.isObjectType = exports.isBodyType = void 0;
const isBodyType = (jsonSchema) => Object.keys(jsonSchema).includes('in') &&
    jsonSchema.in === 'body';
exports.isBodyType = isBodyType;
const isObjectType = (jsonSchema) => !(0, exports.isBodyType)(jsonSchema) &&
    (Object.keys(jsonSchema).includes('properties') ||
        jsonSchema.type === 'object');
exports.isObjectType = isObjectType;
const isArrayType = (jsonSchema) => !(0, exports.isBodyType)(jsonSchema) &&
    (Object.keys(jsonSchema).includes('items') || jsonSchema.type === 'array');
exports.isArrayType = isArrayType;
