variable "aws_region" {
  default = "ap-south-1"
}

variable "key_name" {
  description = "Name of the SSH key pair"
  type        = string
}
