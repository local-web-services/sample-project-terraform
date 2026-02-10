# lws-sample-project-terraform

A serverless order processing system built with Terraform and designed for local development with [LWS (Local Web Services)](https://github.com/local-web-services).

## Architecture

The application implements an event-driven order processing workflow using the following AWS services:

- **API Gateway (HTTP)** - REST endpoints for creating and retrieving orders
- **Lambda** - Four Node.js 20.x functions handling order lifecycle
- **DynamoDB** - Order persistence (`Orders` table)
- **SQS** - Asynchronous order processing queue with dead letter queue
- **Step Functions** - `OrderWorkflow` state machine orchestrating processing, receipt generation, and notification
- **S3** - Receipt storage
- **SNS** - Order status notifications

### Request Flow

```
POST /orders
  -> CreateOrderFunction
       -> DynamoDB (store order)
       -> SQS (enqueue for processing)

Step Functions (OrderWorkflow):
  ValidateOrder -> ProcessPayment -> GenerateReceipt -> NotifyCustomer -> OrderComplete

GET /orders/{id}
  -> GetOrderFunction
       -> DynamoDB (retrieve order)
```

## Project Structure

```
lws-sample-project-terraform/
├── main.tf                            # Provider configuration
├── variables.tf                       # Input variables
├── outputs.tf                         # Stack outputs
├── dynamodb.tf                        # DynamoDB table
├── sqs.tf                             # SQS queues
├── s3.tf                              # S3 bucket
├── sns.tf                             # SNS topic
├── iam.tf                             # IAM roles and policies
├── lambda.tf                          # Lambda functions
├── apigateway.tf                      # HTTP API Gateway
├── stepfunctions.tf                   # Step Functions state machine
├── lambda/
│   ├── create-order/index.js          # Create order, store in DynamoDB, enqueue to SQS
│   ├── get-order/index.js             # Retrieve order from DynamoDB
│   ├── process-order/index.js         # Process order, publish SNS notification
│   └── generate-receipt/index.js      # Generate receipt, store in S3
└── test-orders.sh                     # End-to-end test script
```

## Prerequisites

- [Terraform](https://www.terraform.io/) >= 1.0
- [LWS](https://github.com/local-web-services) for local development

## Setup

```bash
terraform init
terraform plan
```

## Local Development

Start the local development environment with LWS:

```bash
lws dev
```

This starts all services locally (API Gateway, DynamoDB, SQS, S3, SNS, Step Functions) and watches for file changes.

### Available Local Resources

| Type          | Name               | Details                         |
|---------------|--------------------|---------------------------------|
| API Route     | POST /orders       | Create a new order              |
| API Route     | GET /orders/{id}   | Retrieve an order               |
| Table         | Orders             | Order data (partition key: orderId) |
| Queue         | order-queue        | Order processing queue          |
| Queue         | order-dlq          | Dead letter queue               |
| Bucket        | ReceiptsBucket     | Receipt storage                 |
| Topic         | order-notifications| Order status notifications      |
| State Machine | OrderWorkflow      | Order processing workflow       |

## Running Tests

Run the end-to-end test script while `lws dev` is running:

```bash
bash test-orders.sh
```

This script:
1. Creates an order via POST /orders
2. Starts the OrderWorkflow state machine
3. Polls until the workflow completes
4. Retrieves the order via GET /orders/{id}

### Example Output

```
=== Creating order ===
Order ID: dbdbbfe3-a4d8-408d-ad55-78b1de2e3873

=== Starting OrderWorkflow ===

=== Polling for workflow completion ===
  Attempt 1: RUNNING
  Attempt 2: SUCCEEDED

Workflow output:
{
  "processed": 1,
  "results": [
    {
      "orderId": "dbdbbfe3-a4d8-408d-ad55-78b1de2e3873",
      "status": "PROCESSED"
    }
  ]
}

=== Getting order ===
{
  "orderId": "dbdbbfe3-a4d8-408d-ad55-78b1de2e3873",
  "customerName": "Alice",
  "items": ["widget", "gadget"],
  "total": 49.99,
  "createdAt": "2026-02-08T16:41:20.649Z"
}
```

## Deploying to AWS

```bash
terraform apply
```

## License

MIT
