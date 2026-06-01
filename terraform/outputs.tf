output "instance_public_ip" {
  value = aws_instance.web.public_ip
  description = "Public IP of the EC2 instance"
}

output "backend_ecr_url" {
  value       = aws_ecr_repository.backend.repository_url
  description = "ECR URL for the backend image"
}

output "frontend_ecr_url" {
  value       = aws_ecr_repository.frontend.repository_url
  description = "ECR URL for the frontend image"
}

output "aws_account_id" {
  value       = data.aws_caller_identity.current.account_id
  description = "Your AWS account ID"
}