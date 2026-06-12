variable "resource_group_name" {
  description = "Azure resource group name"
  default     = "deploy-project-rg"
}

variable "location" {
  description = "Azure region"
  default = "centralindia"
}

variable "app_name" {
  description = "Application name prefix for resource naming"
  default     = "deploy-project"
}

variable "vm_size" {
  description = "Azure VM size available in centralindia for this subscription"
  default     = "Standard_B2ats_v2"
}

variable "admin_username" {
  description = "SSH admin username for the VM"
  default     = "azureuser"
}

variable "ssh_public_key_path" {
  description = "Path to your SSH public key file"
  default     = "D:/Coding/Deploy-Project Details/azure_deploy_key.pub.pem"
}

variable "acr_name" {
  description = "Azure Container Registry name (must be globally unique, lowercase only)"
  default     = "deployprojectacr"
}