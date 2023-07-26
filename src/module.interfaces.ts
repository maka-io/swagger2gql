import { GraphQLObjectType,
  GraphQLString, GraphQLOutputType,
  GraphQLInputType, GraphQLInt, GraphQLFloat, GraphQLBoolean, GraphQLSchema, DocumentNode,
  GraphQLResolveInfo
} from 'graphql';
import JSONSchema from "@apidevtools/json-schema-ref-parser"

export type GraphQLType = GraphQLOutputType | GraphQLInputType;

export type CustomGraphQLSchema = {
  schema: GraphQLSchema;
  typeDefs: DocumentNode;
  resolvers: any;
}

export interface CallBackendArguments<TContext> {
  context: TContext;
  requestOptions: RequestOptions;
}

export interface Options<TContext> {
  swaggerSchema: string | JSONSchema;
  callBackend: (args: CallBackendArguments<TContext>) => Promise<any>;
}

export type GraphQLFieldResolver<TSource, TContext> = (
  parent: TSource,
  args: { [argName: string]: any },
  context: TContext,
  info: GraphQLResolveInfo
) => any;

export interface GraphQLTypeMap {
  [typeName: string]: GraphQLType;
}
export const primitiveTypes = {
  string: GraphQLString,
  date: GraphQLString,
  integer: GraphQLInt,
  number: GraphQLFloat,
  boolean: GraphQLBoolean,
};

export const isBodyType = (
  jsonSchema: JSONSchemaType,
): jsonSchema is BodySchema =>
  Object.keys(jsonSchema).includes('in') &&
    (jsonSchema as BodySchema).in === 'body';

export const isObjectType = (
  jsonSchema: JSONSchemaType,
): jsonSchema is ObjectSchema =>
  !isBodyType(jsonSchema) &&
    (Object.keys(jsonSchema).includes('properties') ||
      jsonSchema.type === 'object');

export const isArrayType = (
  jsonSchema: JSONSchemaType,
): jsonSchema is ArraySchema =>
  !isBodyType(jsonSchema) &&
    (Object.keys(jsonSchema).includes('items') || jsonSchema.type === 'array');

export interface BodyParam {
  name: string;
  required?: boolean;
  schema: JSONSchemaType;
  in: 'body';
}

export interface Oa2NonBodyParam {
  name: string;
  type: JSONSchemaTypes;
  in: 'header' | 'query' | 'formData' | 'path';
  required?: boolean;
}

export interface Oa3Param {
  name: string;
  in: 'header' | 'query' | 'formData' | 'path';
  required?: boolean;
  schema: JSONSchemaType;
}

export type NonBodyParam = Oa2NonBodyParam | Oa3Param;

export type Param = BodyParam | NonBodyParam;

export interface OA3BodyParam {
  content: {
    'application/json'?: {
      schema: JSONSchemaType;
    };
    'application/x-www-form-urlencoded'?: {
      schema: JSONSchemaType;
    };
  };
  description?: string;
  required: boolean;
}

export interface Responses {
  [key: string]: {
    schema?: JSONSchemaType;
    content?: {
      'application/json': { schema: JSONSchemaType };
    };
    type?: 'file';
  };
}

export interface GraphQLParameters {
  [key: string]: any;
}

export interface RootGraphQLSchema {
  query: GraphQLObjectType;
  mutation?: GraphQLObjectType;
}

interface CommonSchema {
  description?: string;
  title?: string;
}

export interface BodySchema extends CommonSchema {
  in: 'body';
  schema: JSONSchemaType;
  required?: boolean;
}

export interface ObjectSchema extends CommonSchema {
  type: 'object';
  properties: {
    [propertyName: string]: JSONSchemaType;
  };
  required?: string[];
}

export interface ArraySchema extends CommonSchema {
  type: 'array';
  items: JSONSchemaNoBody | JSONSchemaNoBody[];
  required?: boolean;
}

export type JSONSchemaTypes =
  | 'string'
  | 'date'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'file';

export interface ScalarSchema extends CommonSchema {
  type: JSONSchemaTypes;
  format?: string;
  required?: boolean;
}

export type JSONSchemaNoBody = ObjectSchema | ArraySchema | ScalarSchema;

export type JSONSchemaType = BodySchema | JSONSchemaNoBody;

export interface EndpointParam {
  required: boolean;
  type: 'header' | 'query' | 'formData' | 'path' | 'body';
  name: string;
  swaggerName: string;
  jsonSchema: JSONSchemaType;
}

export interface RequestOptionsInput {
  method: string;
  baseUrl: string | undefined;
  path: string;
  parameterDetails: EndpointParam[];
  parameterValues: {
    [key: string]: any;
  };
  formData?: boolean;
}

export interface RequestOptions {
  baseUrl?: string;
  path: string;
  method: string;
  headers?: {
    [key: string]: string;
  };
  query?: {
    [key: string]: string | string[];
  };
  body?: any;
  bodyType: 'json' | 'formData';
}

export interface Endpoint {
  parameters: EndpointParam[];
  description?: string;
  response: JSONSchemaType | undefined;
  getRequestOptions: (args: GraphQLParameters) => RequestOptions;
  mutation: boolean;
}

export interface Endpoints {
  [operationId: string]: Endpoint;
}

export interface OperationObject {
  requestBody?: OA3BodyParam;
  description?: string;
  operationId?: string;
  parameters?: Param[];
  responses: Responses;
  consumes?: string[];
}

export type PathObject = {
  parameters?: Param[];
} & {
  [operation: string]: OperationObject;
};

export interface Variable {
  default?: string;
  enum: string[];
}

export interface ServerObject {
  url: string;
  description?: string;
  variables: {
    [key: string]: string | Variable;
  };
}

export interface SwaggerSchema {
  host?: string;
  basePath?: string;
  schemes?: [string];
  servers?: ServerObject[];
  paths: {
    [pathUrl: string]: PathObject;
  };
  components?: {
    requestBodies?: {
      [name: string]: OA3BodyParam;
    };
    schemas?: {
      [name: string]: JSONSchemaType;
    };
  };
  definitions?: {
    [name: string]: JSONSchemaType;
  };
}
