const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { CredentialProvider, PreviewVectorIndexClient, VectorIndexConfigurations, VectorSearch, ALL_VECTOR_METADATA,
  CacheClient, Configurations, CacheGet, CacheSet } = require('@gomomento/sdk');
const bedrock = new BedrockRuntimeClient();
const secrets = new SecretsManagerClient();
let mviClient;
let cacheClient;
const CACHE_NAME = 'reinvent';
const IMAGE_FILTER = 'https://assets.swaghunt.io';

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    await setupMomentoClients();
    const cachedResult = await getCachedSearchResults(body.query);
    console.log(cachedResult);
    if (cachedResult) {
      return {
        statusCode: 200,
        body: JSON.stringify({ swag: cachedResult }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }

    const embedding = await getSearchEmbedding(body.query);
    const result = await mviClient.search('swaghunt', embedding, {
      topK: 100, metadataFields: ALL_VECTOR_METADATA, scoreThreshold: .4
    });
    if (result instanceof VectorSearch.Error) {
      throw new Error(result.message());
    } else if (result instanceof VectorSearch.Success) {
      const results = result.hits().map(hit => {
        return hit.metadata;
      }).filter(r => r && r.url?.startsWith(IMAGE_FILTER)) ?? [];

      await cacheSearchResults(body.query, results);

      return {
        statusCode: 200,
        body: JSON.stringify({ swag: results }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
};

const setupMomentoClients = async () => {
  if (mviClient && cacheClient) {
    return;
  }

  const secretResponse = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }));
  const secret = JSON.parse(secretResponse.SecretString);
  mviClient = new PreviewVectorIndexClient({
    configuration: VectorIndexConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento })
  });

  cacheClient = await CacheClient.create({
    configuration: Configurations.Lambda.latest(),
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento }),
    defaultTtlSeconds: 60
  });
};

const getCachedSearchResults = async (query) => {
  const result = await cacheClient.get(CACHE_NAME, `${query}-results`);
  if (result instanceof CacheGet.Hit) {
    return JSON.parse(result.value());
  }
};

const getCachedQuery = async (query) => {
  const result = await cacheClient.get(CACHE_NAME, query);
  if (result instanceof CacheGet.Hit) {
    const embedding = result.value();
    return JSON.parse(embedding);
  }
};

/**
 *
 * @param {*} query
 * @param {*} results
 * Cache the search results for a minute (default during client initialization)
 */
const cacheSearchResults = async (query, results) => {
  const result = await cacheClient.set(CACHE_NAME, `${query}-results`, JSON.stringify(results));
  if (result instanceof CacheSet.Error) {
    console.error('Error caching search results', result.errorCode(), result.message());
  }
};

/**
 *
 * @param {*} query
 * @param {*} embedding
 * Cache the search query for 24 hours
 */
const cacheQuery = async (query, embedding) => {
  const result = await cacheClient.set(CACHE_NAME, query, JSON.stringify(embedding), { ttl: 86400 });
  if (result instanceof CacheSet.Error) {
    console.error('Error caching search query', result.errorCode(), result.message())
  }
};

const getSearchEmbedding = async (query) => {
  let embedding = await getCachedQuery(query);
  if (!embedding) {
    const response = await bedrock.send(new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: query
      })
    }));

    const data = JSON.parse(new TextDecoder().decode(response.body));
    embedding = data.embedding;
    await cacheQuery(query, embedding);
  }

  return embedding;
};
