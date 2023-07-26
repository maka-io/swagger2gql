"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isArrayType = exports.isObjectType = exports.isBodyType = exports.primitiveTypes = void 0;
const graphql_1 = require("graphql");
exports.primitiveTypes = {
    string: graphql_1.GraphQLString,
    date: graphql_1.GraphQLString,
    integer: graphql_1.GraphQLInt,
    number: graphql_1.GraphQLFloat,
    boolean: graphql_1.GraphQLBoolean,
};
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
