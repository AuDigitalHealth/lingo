# NCTS Postgres DB server terraform scripts
- This terraform project set up an Azure Database for PostgreSQL flexible servers instance
- Note: Proper Storage account access key needs to be provided in the ARM_ACCESS_KEY env variable and `az login` need to be executed before initialising Terraform for this project
- Use `terraform init --backend-config=backendconfig.tfvars` to initialise Terraform

