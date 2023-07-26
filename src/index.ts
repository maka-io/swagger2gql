import {
  GraphQLFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLList,
  GraphQLNonNull,
  GraphQLObjectType,
  GraphQLOutputType,
  GraphQLResolveInfo,
  GraphQLSchema,
  printSchema,
  DocumentNode
} from 'graphql';
import $RefParser, { JSONSchema } from "@apidevtools/json-schema-ref-parser"
import {
  addTitlesToJsonSchemas,
  Endpoint,
  Endpoints,
  getAllEndPoints,
  GraphQLParameters,
  SwaggerSchema,
} from './swagger';
import {
  GraphQLTypeMap,
  jsonSchemaTypeToGraphQL,
  mapParametersToFields,
} from './typeMap';
import { RequestOptions } from './getRequestOptions';
import { RootGraphQLSchema } from './json-schema';

import { gql } from 'apollo-server';

type GraphQLFieldResolver<TSource, TContext> = (
  parent: TSource,
  args: { [argName: string]: any },
  context: TContext,
  info: GraphQLResolveInfo
) => any;

type CustomGraphQLSchema = {
  schema: GraphQLSchema;
  typeDefs: DocumentNode;
  resolvers: any;
}

// Reusable function to convert GraphQLFieldConfigMap to resolvers
function createResolvers<TSource, TContext>(
  fieldConfigMap: GraphQLFieldConfigMap<TSource, TContext>
): { [key: string]: GraphQLFieldResolver<TSource, TContext> } {
  const resolvers: { [key: string]: GraphQLFieldResolver<TSource, TContext> } = {};

  for (const fieldName in fieldConfigMap) {
    if (fieldConfigMap.hasOwnProperty(fieldName)) {
      const fieldConfig = fieldConfigMap[fieldName];
      const resolver = fieldConfig.resolve;

      if (typeof resolver === 'function') {
        resolvers[fieldName] = resolver;
      } else {
        throw new Error(`Resolver function missing for field '${fieldName}'.`);
      }
    }
  }

  return resolvers;
}

function schemaToTypeDefs(schema: GraphQLSchema): DocumentNode {
  return gql`${printSchema(schema)}`;
}

export function parseResponse(response: any, returnType: GraphQLOutputType) {
  const nullableType =
    returnType instanceof GraphQLNonNull ? returnType.ofType : returnType;
  if (
    nullableType instanceof GraphQLObjectType ||
    nullableType instanceof GraphQLList
  ) {
    return response;
  }

  if (nullableType.name === 'String' && typeof response !== 'string') {
    return JSON.stringify(response);
  }

  return response;
}

const getFields = <TContext>(
  endpoints: Endpoints,
  isMutation: boolean,
  gqlTypes: GraphQLTypeMap,
  { callBackend }: Options<TContext>,
): GraphQLFieldConfigMap<any, any> => {
  return Object.keys(endpoints)
    .filter((operationId: string) => {
      return !!endpoints[operationId].mutation === !!isMutation;
    })
    .reduce((result, operationId) => {
      const endpoint: Endpoint = endpoints[operationId];
      const type = jsonSchemaTypeToGraphQL(
        operationId,
        endpoint.response || { type: 'object', properties: {} },
        'response',
        false,
        gqlTypes,
        true,
      );
      const gType: GraphQLFieldConfig<any, any> = {
        type,
        description: endpoint.description,
        args: mapParametersToFields(endpoint.parameters, operationId, gqlTypes),
        resolve: async (
          _source: any,
          args: GraphQLParameters,
          context: TContext,
          info: GraphQLResolveInfo,
        ): Promise<any> => {
          return parseResponse(
            await callBackend({
              context,
              requestOptions: endpoint.getRequestOptions(args),
            }),
            info.returnType,
          );
        },
      };
      return { ...result, [operationId]: gType };
    }, {});
};

const schemaFromEndpoints = <TContext>(
  endpoints: Endpoints,
  options: Options<TContext>,
): CustomGraphQLSchema => {
  const gqlTypes = {};
  let mutationResolvers = {};
  const queryFields = getFields(endpoints, false, gqlTypes, options);

  const queryResolvers = {
    Query: {
      ...createResolvers(queryFields)
    }
  };

  if (!Object.keys(queryFields).length) {
    throw new Error('Did not find any GET endpoints');
  }
  const rootType = new GraphQLObjectType({
    name: 'Query',
    fields: queryFields,
  });

  const graphQLSchema: RootGraphQLSchema = {
    query: rootType,
  };

  const mutationFields = getFields(endpoints, true, gqlTypes, options);
  if (Object.keys(mutationFields).length) {
    mutationResolvers = {
      Mutation: {
        ...createResolvers(mutationFields)
      }
    }

    graphQLSchema.mutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: mutationFields,
    });
  }

  const resolvers = {
    ...queryResolvers,
    ...mutationResolvers
  };

  const newSchema = new GraphQLSchema(graphQLSchema);

  const typeDefs = schemaToTypeDefs(newSchema);

  return {
    schema: newSchema,
    typeDefs,
    resolvers
  };
};

export { RequestOptions, JSONSchema };

export interface CallBackendArguments<TContext> {
  context: TContext;
  requestOptions: RequestOptions;
}

export interface Options<TContext> {
  swaggerSchema: string | JSONSchema;
  callBackend: (args: CallBackendArguments<TContext>) => Promise<any>;
}

export const createSchema = async <TContext>(
  options: Options<TContext>,
): Promise<any> => {
  const schemaWithoutReferences = (await $RefParser.dereference(
    options.swaggerSchema,
  )) as SwaggerSchema;
  const swaggerSchema = addTitlesToJsonSchemas(schemaWithoutReferences);
  const endpoints = getAllEndPoints(swaggerSchema);
  const schema = schemaFromEndpoints(endpoints, options);

  return schema;
};

export default createSchema;
