# Azure Tools for Visual Studio Code

This extension for [Visual Studio Code](http://code.visualstudio.com) gives Azure developers some convenient commands for creating or accessing resources directly in the editor. 

## Features

- Interactive Login, with support for Azure Active Directory accounts right out of the box.

    ![Sign in using an Azure Active Directory account](./media/docs/sign-in-org-account.gif) 

    Microsoft accounts are also supported, so you can log in using @outlook.com, @live.com, or @hotmail.com services. To enable MSA login, add the GUID of your AAD tenant to your workspace configuration using the `azure.tenantId` setting this extension contributes.

    ![Sign in using a Microsoft account](./media/docs/sign-in-msa.gif) 

- Browse resources in the Azure portal shows a pick list of all your resources. When clicked, you'll go right to the portal blade for that resource.

    ![Browse to portal feature](./media/docs/browse-to-resource-in-portal.gif)

- Multiple subscription support, so if you have multiple Azure subscriptions associated with your login you'll be able to switch between them easily.

    ![Select subscription](./media/docs/select-subscription.gif)

- Web App creation - using either an advanced or simple mode, you can create new Azure App Service Web Apps directly from within Visual Studio Code.

    Advanced mode allows you to create or select new or existing resource groups and server farms.

    ![Advanced web app creation mode](./media/docs/create-web-app-advanced-scenario.gif)

    Simple mode creates a new resource group, server farm, and Web App after typing in the name of the Web App.

    ![Simple web app creation mode](./media/docs/create-web-app-simple-scenario.gif)

## Extension Settings

`azure.tenantId` : The GUID specifier for the tenant you intend on authenticating against. This is *required* if you're attempting to log in using a Microsoft Account like @outlook.com, @hotmail.com, or @live.com. 

## Requirements

All dependencies are listed in [package.json](package.json). You will need an Azure subscription. If you don't yet have an Azure subscription [sign up for a free account](https://azure.microsoft.com/en-us/free/) and then you can make use of the features in this extension, not to mention all the great features Azure offers. 

## Known Issues

All feature ideas and issues should be reported using [GitHub issues](https://github.com/bradygaster/azure-tools-vscode/issues).

- West US is only supported region for new creates

## Release Notes

You can find notes for each release below. 

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