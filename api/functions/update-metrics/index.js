const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb')
const { marshall } = require('@aws-sdk/util-dynamodb');
const ddb = new DynamoDBClient();

exports.handler = async (event) => {
  try {
    const { metrics, metricType } = event.detail;

    let updateExpression;
    let expressionAttributeNames = {};
    let expressionAttributeValues = {};
    for (const metric of metrics) {
      const cleanName = metric.name.replace(/[^a-zA-Z]/g, "");
      if (!updateExpression) {
        updateExpression = `ADD #${cleanName} :${cleanName}`;
      } else {
        updateExpression += `, #${cleanName} :${cleanName}`;
      }

      expressionAttributeNames[`#${cleanName}`] = metric.name;
      expressionAttributeValues[`:${cleanName}`] = metric.value;
    }

    await ddb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        pk: 'metrics',
        sk: metricType
      }),
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: marshall(expressionAttributeValues)
    }));

  } catch (err) {
    console.error(err)
  }
}
