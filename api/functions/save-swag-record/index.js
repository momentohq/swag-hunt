const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient();

exports.handler = async (state) => {
  await ddb.send(new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: marshall({
      pk: `${state.input.from}#${state.type}`,
      sk: 'swag',
      type: 'swag',
      sort: 1,
      from: state.input.from,
      swagType: state.type,
      url: state.url,
      ...state.input.location && { location: state.input.location },
      ...state.input.tags && { tags: state.input.tags },
      ...state.input.createdBy && { createdBy: state.input.createdBy }
    })
  }));

  return { success: true };
}
