const { EventBridgeClient, PutEventsCommand } = require('@aws-sdk/client-eventbridge');
const { DynamoDBClient, GetItemCommand, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const Filter = require('bad-words');
const filter = new Filter({ placeHolder: '' });

const ddb = new DynamoDBClient();
const eventBridge = new EventBridgeClient();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const processedImage = await ddb.send(new GetItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: marshall({
        pk: body.referenceNumber,
        sk: 'image'
      })
    }));

    if (!processedImage.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'There is no verified image with the provided reference number' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    }

    const vendor = body.from.toLowerCase();
    if (filter.isProfane(vendor)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Please refrain from using profanity' }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      }
    }

    let createdBy = body.createdBy;
    if (createdBy && filter.isProfane(createdBy)) {
      createdBy = undefined;
    }

    const image = unmarshall(processedImage.Item);
    const tags = body.tags?.map(tag => {
      if (!filter.isProfane(tag)) {
        return tag.toLowerCase();
      }
    })?.filter(t => t) ?? [];

    try {
      const swag = {
        pk: `${vendor}#${body.type}`,
        sk: 'swag',
        type: 'swag',
        sort: 1,
        url: image.url,
        from: vendor,
        swagType: body.type,
        ...body.location && { location: filter.clean(body.location) },
        ...tags.length && { tags },
        ...createdBy && { createdBy }
      };

      await ddb.send(new PutItemCommand({
        TableName: process.env.TABLE_NAME,
        ConditionExpression: 'attribute_not_exists(pk)',
        Item: marshall(swag)
      }));

      await eventBridge.send(new PutEventsCommand({
        Entries: [{
          DetailType: 'Create Embedding',
          Source: 'swag hunt',
          Detail: JSON.stringify({ swag })
        }]
      }));

      return {
        statusCode: 201,
        body: JSON.stringify({ from: vendor, type: body.type }),
        headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
      };
    } catch (error) {
      if (error.name == 'ConditionalCheckFailedException') {
        // That means someone has already submitted this swag. Add this as another entry for it.
        await ddb.send(new PutItemCommand({
          TableName: process.env.TABLE_NAME,
          Item: marshall({
            pk: `${vendor}#${body.type}`,
            sk: `additional#${body.referenceNumber}`,
            url: image.url
          })
        }));
        return {
          statusCode: 201,
          body: JSON.stringify({ from: vendor, type: body.type }),
          headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
        };
      } else {
        throw error;
      }
    }
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
}
