"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllEndPoints = exports.getParamDetailsFromRequestBody = exports.getParamDetails = exports.getServerPath = exports.addTitlesToJsonSchemas = exports.isOa3Param = exports.getSuccessResponse = void 0;
const module_interfaces_1 = require("./module.interfaces");
const get_request_options_1 = __importDefault(require("./get-request-options"));
const replaceOddChars = (str) => str.replace(/[^_a-zA-Z0-9]/g, '_');
const getGQLTypeNameFromURL = (method, url) => {
    const fromUrl = replaceOddChars(url.replace(/[{}]+/g, ''));
    return `${method}${fromUrl}`;
};
const getSuccessResponse = (responses) => {
    const successCode = Object.keys(responses).find(code => {
        return code[0] === '2';
    });
    if (!successCode) {
        return undefined;
    }
    const successResponse = responses[successCode];
    if (!successResponse) {
        throw new Error(`Expected responses[${successCode}] to be defined`);
    }
    if (successResponse.schema) {
        return successResponse.schema;
    }
    if (successResponse.content) {
        return successResponse.content['application/json'].schema;
    }
    return undefined;
};
exports.getSuccessResponse = getSuccessResponse;
const isOa3Param = (param) => {
    return !!param.schema;
};
exports.isOa3Param = isOa3Param;
function addTitlesToJsonSchemas(schema) {
    const requestBodies = (schema.components || {}).requestBodies || {};
    Object.keys(requestBodies).forEach(requestBodyName => {
        const { content } = requestBodies[requestBodyName];
        Object.keys(content).forEach(contentKey => {
            const contentValue = content[contentKey];
            if (contentValue) {
                contentValue.schema.title =
                    contentValue.schema.title || requestBodyName;
            }
        });
    });
    const jsonSchemas = (schema.components || {}).schemas || {};
    Object.keys(jsonSchemas).forEach(schemaName => {
        const jsonSchema = jsonSchemas[schemaName];
        jsonSchema.title = jsonSchema.title || schemaName;
    });
    const definitions = schema.definitions || {};
    Object.keys(definitions).forEach(definitionName => {
        const jsonSchema = definitions[definitionName];
        jsonSchema.title = jsonSchema.title || definitionName;
    });
    return schema;
}
exports.addTitlesToJsonSchemas = addTitlesToJsonSchemas;
const getServerPath = (schema) => {
    const server = schema.servers && Array.isArray(schema.servers)
        ? schema.servers[0]
        : schema.host
            ? [
                (schema.schemes && schema.schemes[0]) || 'http',
                '://',
                schema.host,
                schema.basePath,
            ]
                .filter(Boolean)
                .join('')
            : undefined;
    if (!server) {
        return undefined;
    }
    if (typeof server === 'string') {
        return server;
    }
    const { url, variables } = server;
    return variables
        ? Object.keys(server.variables).reduce((acc, variableName) => {
            const variable = server.variables[variableName];
            const value = typeof variable === 'string'
                ? variable
                : variable.default || variable.enum[0];
            return acc.replace(`{${variableName}}`, value);
        }, url)
        : url;
};
exports.getServerPath = getServerPath;
const getParamDetails = (param) => {
    const name = replaceOddChars(param.name);
    const swaggerName = param.name;
    if ((0, exports.isOa3Param)(param)) {
        const { schema, required, in: type } = param;
        return {
            name,
            swaggerName,
            type,
            required: !!required,
            jsonSchema: schema,
        };
    }
    return {
        name,
        swaggerName,
        type: param.in,
        required: !!param.required,
        jsonSchema: param,
    };
};
exports.getParamDetails = getParamDetails;
const contentTypeFormData = 'application/x-www-form-urlencoded';
const getParamDetailsFromRequestBody = (requestBody) => {
    const formData = requestBody.content[contentTypeFormData];
    function getSchemaFromRequestBody() {
        if (requestBody.content['application/json']) {
            return requestBody.content['application/json'].schema;
        }
        throw new Error(`Unsupported content type(s) found: ${Object.keys(requestBody.content).join(', ')}`);
    }
    if (formData) {
        const formdataSchema = formData.schema;
        if (!(0, module_interfaces_1.isObjectType)(formdataSchema)) {
            throw new Error(`RequestBody is formData, expected an object schema, got "${JSON.stringify(formdataSchema)}"`);
        }
        return Object.entries(formdataSchema.properties).map(([name, schema]) => ({
            name: replaceOddChars(name),
            swaggerName: name,
            type: 'formData',
            required: formdataSchema.required
                ? formdataSchema.required.includes(name)
                : false,
            jsonSchema: schema,
        }));
    }
    return [
        {
            name: 'body',
            swaggerName: 'requestBody',
            type: 'body',
            required: !!requestBody.required,
            jsonSchema: getSchemaFromRequestBody(),
        },
    ];
};
exports.getParamDetailsFromRequestBody = getParamDetailsFromRequestBody;
function isFormdataRequest(requestBody) {
    return !!requestBody.content[contentTypeFormData];
}
/**
 * Go through schema and grab routes
 */
const getAllEndPoints = (schema) => {
    const allOperations = {};
    const serverPath = (0, exports.getServerPath)(schema);
    Object.keys(schema.paths).forEach(path => {
        const route = schema.paths[path];
        Object.keys(route).forEach(method => {
            if (method === 'parameters' || method === 'servers') {
                return;
            }
            const operationObject = route[method];
            const isMutation = ['post', 'put', 'patch', 'delete'].indexOf(method) !== -1;
            const operationId = operationObject.operationId
                ? replaceOddChars(operationObject.operationId)
                : getGQLTypeNameFromURL(method, path);
            // [FIX] for when parameters is a child of route and not route[method]
            if (route.parameters) {
                if (operationObject.parameters) {
                    operationObject.parameters = route.parameters.concat(operationObject.parameters);
                }
                else {
                    operationObject.parameters = route.parameters;
                }
            }
            const bodyParams = operationObject.requestBody
                ? (0, exports.getParamDetailsFromRequestBody)(operationObject.requestBody)
                : [];
            const parameterDetails = [
                ...(operationObject.parameters
                    ? operationObject.parameters.map(param => (0, exports.getParamDetails)(param))
                    : []),
                ...bodyParams,
            ];
            const endpoint = {
                parameters: parameterDetails,
                description: operationObject.description,
                response: (0, exports.getSuccessResponse)(operationObject.responses),
                getRequestOptions: (parameterValues) => {
                    return (0, get_request_options_1.default)({
                        parameterDetails,
                        parameterValues,
                        baseUrl: serverPath,
                        path,
                        method,
                        formData: operationObject.consumes
                            ? !operationObject.consumes.includes('application/json')
                            : operationObject.requestBody
                                ? isFormdataRequest(operationObject.requestBody)
                                : false,
                    });
                },
                mutation: isMutation,
            };
            allOperations[operationId] = endpoint;
        });
    });
    return allOperations;
};
exports.getAllEndPoints = getAllEndPoints;
