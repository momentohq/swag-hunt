const { SFNClient, StartExecutionCommand } = require('@aws-sdk/client-sfn');
const Filter = require('bad-words');
const filter = new Filter({ placeHolder: '' });

const sfn = new SFNClient();

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
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

    const tags = body.tags?.map(tag => {
      if (!filter.isProfane(tag)) {
        return tag.toLowerCase();
      }
    })?.filter(t => t) ?? [];

    const response = await sfn.send(new StartExecutionCommand({
      stateMachineArn: process.env.ADD_SWAG_STATE_MACHINE,
      input: JSON.stringify({
        referenceNumber: body.referenceNumber,
        from: vendor,
        ...body.location && { location: filter.clean(body.location) },
        ...tags.length && { tags },
        ...createdBy && { createdBy }
      })
    }));

    return {
      statusCode: 202,
      body: JSON.stringify({ id: response.executionArn.split(':').pop() }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Something went wrong' }),
      headers: { 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN }
    };
  }
}
