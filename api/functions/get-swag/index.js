const { DynamoDBClient, QueryCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const nextToken = event.queryStringParameters?.pageToken;
    const results = await ddb.send(new QueryCommand({
      TableName: process.env.TABLE_NAME,
      IndexName: 'types',
      KeyConditionExpression: '#type = :type',
      ExpressionAttributeNames: {
        '#type': 'type'
      },
      ExpressionAttributeValues: marshall({
        ':type': 'swag'
      }),
      ...nextToken && { ExclusiveStartKey: nextToken }
    }));

    const swag = results.Items?.map(item => {
      const data = unmarshall(item);
      return {
        from: data.from,
        type: data.swagType,
        url: data.url,
        upvotes: data.sort
      };
    }) ?? [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        swag,
        ...results.LastEvaluatedKey && { pageToken: results.LastEvaluatedKey }
      }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
  catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    }
  }
};
