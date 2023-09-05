variable "resource_group" {
  description = "NCTS resource group name"
  type        = string
  default     = "ncts"
}

variable "postgres_admins_aad" {
  description = "Azure AD group name for Postgres Server Admins"
  type        = string
}


variable "ncts_k8s_cluster_name" {
  description = "NCTS AKS name"
  type        = string
  default     = "ncts-k8s-cluster"
}

variable "ncts_k8s_outbound_ip" {
  description = "AKS Load balancer's outbound IP"
  type        = string
  default     = "20.248.228.6"
}

variable "ncts_k8s_vnet_name" {
  description = "NCTS AKS Vnet name"
  type        = string
  default     = "ncts-k8s"
}

variable "adminuser" {
  description = "Postgres Server Admin User name"
  type        = string
}

variable "adminpassword" {
  description = "Postgres Server Admin Password"
  type        = string
}
