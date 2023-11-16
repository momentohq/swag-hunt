const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { CredentialProvider, PreviewVectorIndexClient, VectorIndexConfigurations, VectorDeleteItemBatch } = require('@gomomento/sdk');

const secrets = new SecretsManagerClient();
let mviClient;

exports.handler = async (state) => {
  await setupMviClient();

  const response = await mviClient.deleteItemBatch('swaghunt', [state.id]);
  if (response instanceof VectorDeleteItemBatch.Error) {
    console.error(response.errorCode(), response.message());
    throw new Error(response.message());
  } else {
    return { success: true }
  }
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

