const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const { from, type } = event.pathParameters;
    const swagId = `${from}#${type}`;

    const response = await ddb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        pk: swagId,
        sk: 'swag'
      }),
      UpdateExpression: 'ADD #sort :upvote',
      ConditionExpression: 'attribute_exists(pk)',
      ExpressionAttributeNames: {
        '#sort': 'sort'
      },
      ExpressionAttributeValues: marshall({
        ':upvote': 1
      }),
      ReturnValues: 'UPDATED_NEW'
    }));

    const newValue = Number(response.Attributes.sort.N);
    return {
      statusCode: 200,
      body: JSON.stringify({ newValue })
    };
  } catch (err) {
    console.error(err);
    if (error.name == 'ConditionalCheckFailedException') {
      // That means the swag doesn't exist
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'The swag you are trying to upvote does not exist' })
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Something went wrong' })
      };
    }
  }
}
