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
const graphql_1 = require("graphql");
const json_schema_ref_parser_1 = __importDefault(require("@apidevtools/json-schema-ref-parser"));
const swagger_1 = require("./swagger");
const typeMap_1 = require("./typeMap");
const apollo_server_1 = require("apollo-server");
function createResolvers(fieldConfigMap) {
    const resolvers = {};
    for (const fieldName in fieldConfigMap) {
        if (fieldConfigMap.hasOwnProperty(fieldName)) {
            const fieldConfig = fieldConfigMap[fieldName];
            const resolver = fieldConfig.resolve;
            if (typeof resolver === 'function') {
                resolvers[fieldName] = resolver;
            }
            else {
                throw new Error(`Resolver function missing for field '${fieldName}'.`);
            }
        }
    }
    return resolvers;
}
const schemaToTypeDefs = (schema) => {
    return (0, apollo_server_1.gql) `${(0, graphql_1.printSchema)(schema)}`;
};
function parseResponse(response, returnType) {
    const nullableType = returnType instanceof graphql_1.GraphQLNonNull ? returnType.ofType : returnType;
    if (nullableType instanceof graphql_1.GraphQLObjectType ||
        nullableType instanceof graphql_1.GraphQLList) {
        return response;
    }
    if (nullableType.name === 'String' && typeof response !== 'string') {
        return JSON.stringify(response);
    }
    return response;
}
const getFields = (endpoints, isMutation, gqlTypes, { callBackend }) => {
    return Object.keys(endpoints)
        .filter((operationId) => {
        return !!endpoints[operationId].mutation === !!isMutation;
    })
        .reduce((result, operationId) => {
        const endpoint = endpoints[operationId];
        const type = (0, typeMap_1.jsonSchemaTypeToGraphQL)(operationId, endpoint.response || { type: 'object', properties: {} }, 'response', false, gqlTypes, true);
        const gType = {
            type,
            description: endpoint.description,
            args: (0, typeMap_1.mapParametersToFields)(endpoint.parameters, operationId, gqlTypes),
            resolve: (_source, args, context, info) => __awaiter(void 0, void 0, void 0, function* () {
                return parseResponse(yield callBackend({
                    context,
                    requestOptions: endpoint.getRequestOptions(args),
                }), info.returnType);
            }),
        };
        return Object.assign(Object.assign({}, result), { [operationId]: gType });
    }, {});
};
const schemaFromEndpoints = (endpoints, options) => {
    const gqlTypes = {};
    let mutationResolvers = {};
    const queryFields = getFields(endpoints, false, gqlTypes, options);
    const queryResolvers = {
        Query: Object.assign({}, createResolvers(queryFields))
    };
    if (!Object.keys(queryFields).length) {
        throw new Error('Did not find any GET endpoints');
    }
    const rootType = new graphql_1.GraphQLObjectType({
        name: 'Query',
        fields: queryFields,
    });
    const graphQLSchema = {
        query: rootType,
    };
    const mutationFields = getFields(endpoints, true, gqlTypes, options);
    if (Object.keys(mutationFields).length) {
        mutationResolvers = {
            Mutation: Object.assign({}, createResolvers(mutationFields))
        };
        graphQLSchema.mutation = new graphql_1.GraphQLObjectType({
            name: 'Mutation',
            fields: mutationFields,
        });
    }
    const resolvers = Object.assign(Object.assign({}, queryResolvers), mutationResolvers);
    const newSchema = new graphql_1.GraphQLSchema(graphQLSchema);
    const typeDefs = schemaToTypeDefs(newSchema);
    return {
        schema: newSchema,
        typeDefs,
        resolvers
    };
};
const createSchema = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const schemaWithoutReferences = (yield json_schema_ref_parser_1.default.dereference(options.swaggerSchema));
    const swaggerSchema = (0, swagger_1.addTitlesToJsonSchemas)(schemaWithoutReferences);
    const endpoints = (0, swagger_1.getAllEndPoints)(swaggerSchema);
    const schema = schemaFromEndpoints(endpoints, options);
    return schema;
});
exports.default = createSchema;
