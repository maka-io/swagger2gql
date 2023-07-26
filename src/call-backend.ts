import requestPromise from 'request-promise';

import { CallBackendArguments } from './module.interfaces';

const callBackend = async ({
  requestOptions: { method, body, baseUrl, path, query, headers, bodyType },
}: CallBackendArguments<{}>) => {
  return requestPromise({
    ...(bodyType === 'json' && {
      json: true,
      body,
    }),
    ...(bodyType === 'formData' && {
      form: body,
    }),
    qs: query,
    qsStringifyOptions: {
      indices: false,
    },
    method,
    headers,
    baseUrl,
    uri: path,
  });
};

export default callBackend;
