resource "aws_s3_bucket" "receipts" {
  bucket        = "order-receipts-${data.aws_caller_identity.current.account_id}-${data.aws_region.current.name}"
  force_destroy = true
}
