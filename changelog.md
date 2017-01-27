## 1.2.0
- [Azure Batch](https://docs.microsoft.com/en-us/azure/batch/) creation. Select the Create Batch Account command to create a new, empty batch account. Future features will enable consumption and scripting your Batch account.

- Export resource group as template will allow you to download an Azure Resource Manager (ARM) template representing the structure of a resource group in your Azure subscription.  

## 1.1.0
- [Azure Key Vault](https://azure.microsoft.com/en-us/services/key-vault/) creation. Select the Create Key Vault command to create a new or select an existing resource group into which your new Key Vault will be created.

## 1.0.0
- Search the [Azure QuickStart Templates](https://github.com/Azure/azure-quickstart-templates) GitHub repository for Azure Resource Manager (ARM) templates.
- Takes a dependency on the [Azure Resource Manager Tools](https://marketplace.visualstudio.com/items?itemName=msazurermtools.azurerm-vscode-tools) to make the ARM template editing experience better.
- Download ARM template and parameters to workspace.
- Deploy ARM templates to live Azure subscription. 

## 0.0.11
- Repaired login due to change in incoming authentication message. 

## 0.0.10 - 2016-11-04
- Added storage account creation
- Added storage account connection string retrieval
- Added browse to resource group

## 0.0.9 - 2016-10-31
- Added support for Azure Functions creation

## 0.0.8 - 2016-10-29
- Quick bug fix  

## 0.0.7 - 2016-10-26
- **Added support for all Azure regions**
- Changed publisher and moved within Marketplace.
- Refactored code to move source into sub-folder.  

## 0.0.6 - 2016-10-26
- Changed publisher and moved within Marketplace. 

## 0.0.5 - 2016-10-25
- Fixed NPM-related bug during installation.
- Minor optimizations for marketplace appearance. 

## 0.0.1 - 2016-10-23
- Login using interactive browser authentication
- Shows all of your Azure subscriptions and allows you to select the one you want to use
- Select a resource to browse in the Azure portal
- Simple web app create (defaults to creating a new resource group and server farm)
- Advanced web app create (allows creation/selection of new resource group and server farm)
- Tenant ID configuration via workspace settings to enable MSA (@outlook.com, @live.com, @hotmail.com) login
