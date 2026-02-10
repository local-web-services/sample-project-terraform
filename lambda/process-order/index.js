const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

const ddb = new DynamoDBClient({});
const sns = new SNSClient({});

exports.handler = async (event) => {
  // Handle SQS event (records array) or direct invocation
  const records = event.Records || [{ body: JSON.stringify(event) }];

  const results = [];

  for (const record of records) {
    const order = JSON.parse(record.body || '{}');
    const orderId = order.orderId;

    if (!orderId) continue;

    await ddb.send(new UpdateItemCommand({
      TableName: process.env.TABLE_NAME,
      Key: { orderId: { S: orderId } },
      UpdateExpression: 'SET #status = :status',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: { ':status': { S: 'PROCESSED' } },
    }));

    await sns.send(new PublishCommand({
      TopicArn: process.env.TOPIC_ARN,
      Subject: `Order ${orderId} processed`,
      Message: JSON.stringify({
        orderId,
        status: 'PROCESSED',
        timestamp: new Date().toISOString(),
      }),
    }));

    results.push({ orderId, status: 'PROCESSED' });
  }

  return { processed: results.length, results };
};
