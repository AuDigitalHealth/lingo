terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "3.67.0"
    }
    local = {
      version = "~> 2.4.0"
    }
  }


  backend "azurerm" {
    # Use backendconfig.tfvars to set backend location and call tarraform with -backend-config=backendconfig.tfvars
    # Microsoft suggested backend setup for Azure backend storage
    key                  = "codelab.microsoft.tfstate"
    # Provide storage account  access key via ARM_ACCESS_KEY environment variable
  }
}

provider "azurerm" {
  features {}
}
