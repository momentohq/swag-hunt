const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { CredentialProvider, PreviewVectorIndexClient, VectorIndexConfigurations, VectorUpsertItemBatch } = require('@gomomento/sdk');
const bedrock = new BedrockRuntimeClient();
const secrets = new SecretsManagerClient();
let mviClient;

exports.handler = async (state) => {
  try {
    const { swag } = state;

    const response = await bedrock.send(new InvokeModelCommand({
      modelId: 'amazon.titan-embed-text-v1',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        inputText: normalize(swag)
      })
    }));

    const data = JSON.parse(new TextDecoder().decode(response.body))
    await setupMviClient();
    const result = await mviClient.upsertItemBatch('swaghunt', [
      {
        id: swag.pk,
        vector: data.embedding,
        metadata: {
          from: swag.from,
          type: swag.swagType,
          url: swag.url
        }
      }
    ]);
    if (result instanceof VectorUpsertItemBatch.Error) {
      console.error(result.errorCode(), result.message());
      throw Error('Could not index provided item');
    } else if (result instanceof VectorUpsertItemBatch.Success) {
      console.log('Successfully indexed');
    }
  } catch (err) {
    console.error(err);
    throw err;
  }
};

const normalize = (swag) => {
  const embeddedSwag = {
    from: swag.from,
    swagType: swag.swagType,
    ...swag.location && { location: swag.location },
    ...swag.tags && { tags: swag.tags }
  };

  let resultArray = [];
  for (const [key, value] of Object.entries(embeddedSwag)) {
    if (Array.isArray(value)) {
      resultArray.push(`${key}_${value.join(' ')}`);
    } else {
      resultArray.push(`${key}_${value}`);
    }
  }
  return resultArray.join(' ').toLowerCase();
};

const setupMviClient = async () => {
  if (mviClient) {
    return;
  }

  const secretResponse = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }));
  const secret = JSON.parse(secretResponse.SecretString);
  mviClient = new PreviewVectorIndexClient({
    configuration: VectorIndexConfigurations.Laptop.v1(),
    credentialProvider: CredentialProvider.fromString({ apiKey: secret.momento })
  });
};
