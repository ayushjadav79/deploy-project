output "vm_public_ip" {
  value       = azurerm_public_ip.pip.ip_address
  description = "Public IP of the Azure VM"
}

output "acr_login_server" {
  value       = data.azurerm_container_registry.acr.login_server
  description = "ACR login server URL (eg. deployprojectacr.azurecr.io)"
}

output "acr_backend_image" {
  value       = "${data.azurerm_container_registry.acr.login_server}/deploy-project-backend"
  description = "Full ACR image path for backend"
}

output "acr_frontend_image" {
  value       = "${data.azurerm_container_registry.acr.login_server}/deploy-project-frontend"
  description = "Full ACR image path for frontend"
}