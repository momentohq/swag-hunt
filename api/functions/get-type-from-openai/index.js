const OpenAI = require('openai');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const secrets = new SecretsManagerClient();
let openai;
const swagTypes = ['shirt', 'hoodie', 'socks', 'sticker', 'hat', 'pin', 'toy', 'pen', 'cup', 'stuffed animal',
  'coozie', 'power bank', 'sunglasses', 'notebook', 'tote', 'phone accessory', 'other', 'bottle', 'mug', 'unknown'];

exports.handler = async (state) => {
  try {
    await setupOpenAiClient();

    const messages = [
      {
        role: 'system',
        content: `You are an expert conference swag analyzer. You are being asked to classify what swag is in the provided image.
        Your options are ${swagTypes.join(', ')}.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'What is this swag? Also include three tags used to search for this item. Return a JSON object with a type property (string) and tags property (array of strings)'
          },
          {
            type: 'image_url',
            image_url: { url: state.imageUrl }
          }
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4-vision-preview',
      temperature: .7,
      messages,
      max_tokens: 2000
    });

    let data = response.choices[0].message.content.replace(/```json?\s*|\s*```/g, '').trim();
    data = JSON.parse(data);
    return {
      type: data.type,
      tags: data.tags.join(',')
    };
  } catch (err) {
    console.error(err);
    return { type: 'unknown', tags: '' };
  }
};

const setupOpenAiClient = async () => {
  if (openai) {
    return;
  }

  const secretResponse = await secrets.send(new GetSecretValueCommand({ SecretId: process.env.SECRET_ID }));
  const secret = JSON.parse(secretResponse.SecretString);
  openai = new OpenAI({ apiKey: secret.openai });
};
