variable "aws_region" {
  description = "AWS region to deploy resources"
  default = "ap-south-1"
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  default     = "t3.micro"
}

variable "app_name" {
  description = "Application name prefix for resource naming"
  default     = "deploy-project"
}