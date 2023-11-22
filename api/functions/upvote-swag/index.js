const { DynamoDBClient, UpdateItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');

const { marshall } = require('@aws-sdk/util-dynamodb');

const eventbridge = new EventBridgeClient();
const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const { from, type } = event.pathParameters;
    const swagId = `${decodeURI(from.toLowerCase().trim())}#${decodeURI(type.toLowerCase().trim())}`;

    if (!canUpvote(swagId, event.requestContext.identity.sourceIp)) {
      return {
        statusCode: 204,
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
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
    await sendMetricsEvent(swagId);
    return {
      statusCode: 200,
      body: JSON.stringify({ newValue }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  } catch (err) {
    console.error(err);
    if (error.name == 'ConditionalCheckFailedException') {
      // That means the swag doesn't exist
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'The swag you are trying to upvote does not exist' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    } else {
      return {
        statusCode: 500,
        body: JSON.stringify({ message: 'Something went wrong' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }
  }
};

const canUpvote = async (swagId, ipAddress) => {
  try {
    const key = `${swagId}#${ipAddress}`
    await ddb.send(new PutItemCommand({
      TableName: process.env.TABLE_NAME,
      ConditionExpression: 'attribute_not_exists(pk)',
      Item: marshall({
        pk: key,
        sk: 'upvotes'
      })
    }));

    return true;
  } catch (err) {
    console.log(`IP: ${ipAddress} tried to upvote ${swagId} multiple times`);
    return false;
  }
};

const sendMetricsEvent = async (swagId) => {
  try {
    await eventbridge.send(new PutEventsCommand({
      Entries: [
        {
          DetailType: 'Update Metrics',
          Source: 'swag hunt',
          Detail: JSON.stringify({
            metricType: 'voting',
            metrics: [
              {
                name: 'total',
                value: 1
              },
              {
                name: swagId,
                value: 1
              }
            ]
          })
        }
      ]
    }));
  } catch (err) {
    console.error('Error updating voting metrics', err);
  }
};
