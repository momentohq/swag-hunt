const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');
const ddb = new DynamoDBClient();

exports.handler = async (state) => {
  const deltas = [];
  const totals = unmarshall(state.totals);
  const lastRun = unmarshall(state.lastRun);
  for (const key in totals) {
    if (['pk', 'sk'].includes(key)) continue;

    let value = totals[key];
    if (lastRun[key]) {
      value = totals[key] - lastRun[key];
    }
    deltas.push({ name: key, value });
  }

  deltas.sort((a, b) => b.value - a.value);
  const reportDeltas = deltas.reduce((obj, item) => {
    obj[item.name] = item.value;
    return obj;
  }, {});

  await ddb.send(new PutItemCommand({
    TableName: process.env.TABLE_NAME,
    Item: marshall({
      pk: 'report',
      sk: `${state.reportType}#${new Date().toISOString()}`,
      ...reportDeltas
    })
  }));

  if (state.top) {
    return { top: deltas.slice(0, state.top) };
  } else {
    return { success: true }
  }
};
