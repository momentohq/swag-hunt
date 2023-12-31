const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const bedrock = new BedrockRuntimeClient();

const swagTypes = ['shirt', 'hoodie', 'socks', 'sticker', 'hat', 'pin', 'toy', 'pen', 'cup', 'stuffed animal',
  'coozie', 'power bank', 'sunglasses', 'notebook', 'tote', 'phone accessory', 'other', 'bottle', 'mug', 'unknown'];

exports.handler = async (state) => {
  try {
    const labels = state.labels.join('\r\n');

    const prompt = `Human: I am trying to identify a piece of swag. I ran label detection on an image and got the below results.
     Based on the results, pick the type that makes the most sense. If you can tell it's swag but it's not in the list
     choose 'other'. If you can't identify any swag  or it seems like the image is clearly of a person use 'unknown'. Be creative,
     stickers could look like anything. Only pick from this list.: ${swagTypes.join(', ')}.
     Label analysis results:
     ${labels}
     Assistant: `;

    const response = await bedrock.send(new InvokeModelCommand({
      modelId: 'anthropic.claude-v2',
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt,
        temperature: 1,
        max_tokens_to_sample: 750,
        anthropic_version: "bedrock-2023-05-31"
      })
    }));

    const answer = JSON.parse(new TextDecoder().decode(response.body));
    const completion = answer.completion;
    const type = getTypeFromAnswer(completion);

    return { type };

  } catch (err) {
    console.error(err);
    throw err;
  }
};

const getTypeFromAnswer = (completion) => {
  const lowerCaseCompletion = completion.toLowerCase();
  let type = swagTypes.find(st => lowerCaseCompletion.includes(st));

  if (!type) {
    type = 'unknown';
  }

  return type;
};
