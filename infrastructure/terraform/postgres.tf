data "azurerm_kubernetes_cluster" "ncts_k8s" {
  name                = var.ncts_k8s_cluster_name
  resource_group_name = data.azurerm_resource_group.ncts.name
}

data "azurerm_virtual_network" "vnet" {
  name                = var.ncts_k8s_vnet_name
  resource_group_name = data.azurerm_resource_group.ncts.name
}

resource "azurerm_postgresql_flexible_server" "ncts_db" {
  name                          = "ncts-db"
  resource_group_name           = data.azurerm_resource_group.ncts.name
  location                      = data.azurerm_resource_group.ncts.location
  version                       = "15"
  administrator_login           = var.adminuser
  administrator_password        = var.adminpassword
  storage_mb                    = 131072
  sku_name                      = "GP_Standard_D2ds_v4"
  zone                          = "3"
  backup_retention_days         = 7
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "csiro" {
  name                = "csiro-globalprotect"
  server_id           = azurerm_postgresql_flexible_server.ncts_db.id
  start_ip_address    = "140.253.0.0"
  end_ip_address      = "140.253.255.255"
}

resource "azurerm_postgresql_flexible_server_firewall_rule" "k8s" {
  name                = "allow-ncts-k8s"
  server_id           = azurerm_postgresql_flexible_server.ncts_db.id
  start_ip_address    = var.ncts_k8s_outbound_ip
  end_ip_address      = var.ncts_k8s_outbound_ip
}