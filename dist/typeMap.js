"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mapParametersToFields = exports.createGraphQLType = exports.getTypeFields = exports.jsonSchemaTypeToGraphQL = void 0;
// TODO: fix no-param-reassign
/* eslint-disable no-param-reassign */
const graphql_1 = require("graphql");
const module_interfaces_1 = require("./module.interfaces");
const jsonType = new graphql_1.GraphQLScalarType({
    name: 'JSON',
    serialize(value) {
        return value;
    },
});
function getPrimitiveType(format, type) {
    const primitiveTypeName = format === 'int64' ? 'string' : type;
    const primitiveType = module_interfaces_1.primitiveTypes[primitiveTypeName];
    if (!primitiveType) {
        return module_interfaces_1.primitiveTypes.string;
    }
    return primitiveType;
}
const jsonSchemaTypeToGraphQL = (title, jsonSchema, propertyName, isInputType, gqlTypes, required) => {
    const baseType = (() => {
        if ((0, module_interfaces_1.isBodyType)(jsonSchema)) {
            return (0, exports.jsonSchemaTypeToGraphQL)(title, jsonSchema.schema, propertyName, isInputType, gqlTypes, required);
        }
        if ((0, module_interfaces_1.isObjectType)(jsonSchema) || (0, module_interfaces_1.isArrayType)(jsonSchema)) {
            // eslint-disable-next-line no-use-before-define,@typescript-eslint/no-use-before-define
            return (0, exports.createGraphQLType)(jsonSchema, `${title}_${propertyName}`, isInputType, gqlTypes);
        }
        if (jsonSchema.type === 'file') {
            // eslint-disable-next-line no-use-before-define,@typescript-eslint/no-use-before-define
            return (0, exports.createGraphQLType)({
                type: 'object',
                required: [],
                properties: { unsupported: { type: 'string' } },
            }, `${title}_${propertyName}`, isInputType, gqlTypes);
        }
        if (jsonSchema.type) {
            return getPrimitiveType(jsonSchema.format, jsonSchema.type);
        }
        throw new Error(`Don't know how to handle schema ${JSON.stringify(jsonSchema)} without type and schema`);
    })();
    return (required
        ? new graphql_1.GraphQLNonNull(baseType)
        : baseType);
};
exports.jsonSchemaTypeToGraphQL = jsonSchemaTypeToGraphQL;
const makeValidName = (name) => name.replace(/[^_0-9A-Za-z]/g, '_');
const getTypeFields = (jsonSchema, title, isInputType, gqlTypes) => {
    return () => {
        const properties = {};
        if ((0, module_interfaces_1.isObjectType)(jsonSchema)) {
            Object.keys(jsonSchema.properties).forEach(key => {
                properties[makeValidName(key)] = jsonSchema.properties[key];
            });
        }
        return Object.keys(properties).reduce((prev, propertyName) => {
            const propertySchema = properties[propertyName];
            const type = (0, exports.jsonSchemaTypeToGraphQL)(title, propertySchema, propertyName, isInputType, gqlTypes, !!((0, module_interfaces_1.isObjectType)(jsonSchema) &&
                jsonSchema.required &&
                jsonSchema.required.includes(propertyName)));
            return Object.assign(Object.assign({}, prev), { [propertyName]: {
                    description: propertySchema.description,
                    type,
                } });
        }, {});
    };
};
exports.getTypeFields = getTypeFields;
const createGraphQLType = (jsonSchema, title, isInputType, gqlTypes) => {
    title = (jsonSchema && jsonSchema.title) || title;
    title = makeValidName(title);
    if (isInputType && !title.endsWith('Input')) {
        title += 'Input';
    }
    if (title in gqlTypes) {
        return gqlTypes[title];
    }
    if (!jsonSchema) {
        jsonSchema = {
            type: 'object',
            properties: {},
            required: [],
            description: '',
            title,
        };
    }
    else if (!jsonSchema.title) {
        jsonSchema = Object.assign(Object.assign({}, jsonSchema), { title });
    }
    if ((0, module_interfaces_1.isArrayType)(jsonSchema)) {
        const itemsSchema = Array.isArray(jsonSchema.items)
            ? jsonSchema.items[0]
            : jsonSchema.items;
        if ((0, module_interfaces_1.isObjectType)(itemsSchema) || (0, module_interfaces_1.isArrayType)(itemsSchema)) {
            return new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull((0, exports.createGraphQLType)(itemsSchema, `${title}_items`, isInputType, gqlTypes)));
        }
        if (itemsSchema.type === 'file') {
            // eslint-disable-next-line no-use-before-define,@typescript-eslint/no-use-before-define
            return new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull((0, exports.createGraphQLType)({
                type: 'object',
                required: [],
                properties: { unsupported: { type: 'string' } },
            }, title, isInputType, gqlTypes)));
        }
        const primitiveType = getPrimitiveType(itemsSchema.format, itemsSchema.type);
        return new graphql_1.GraphQLList(new graphql_1.GraphQLNonNull(primitiveType));
    }
    if ((0, module_interfaces_1.isObjectType)(jsonSchema) &&
        !Object.keys(jsonSchema.properties || {}).length) {
        return jsonType;
    }
    const { description } = jsonSchema;
    const fields = (0, exports.getTypeFields)(jsonSchema, title, isInputType, gqlTypes);
    let result;
    if (isInputType) {
        result = new graphql_1.GraphQLInputObjectType({
            name: title,
            description,
            fields: fields,
        });
    }
    else {
        result = new graphql_1.GraphQLObjectType({
            name: title,
            description,
            fields: fields,
        });
    }
    gqlTypes[title] = result;
    return result;
};
exports.createGraphQLType = createGraphQLType;
const mapParametersToFields = (parameters, typeName, gqlTypes) => {
    return parameters.reduce((res, param) => {
        const type = (0, exports.jsonSchemaTypeToGraphQL)(`param_${typeName}`, param.jsonSchema, param.name, true, gqlTypes, param.required);
        res[param.name] = {
            type,
        };
        return res;
    }, {});
};
exports.mapParametersToFields = mapParametersToFields;
