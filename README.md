# Azure Tools for Visual Studio Code

This repository contains code for a prototype extension for [Visual Studio Code](http://code.visualstudio.com) that would enable Azure management features from directly within the editor. 

## Requirements

All dependencies are listed in [package.json](package.json)

## Extension Settings

`azure.tenantId` : The GUID specifier for the tenant you intend on authenticating against. This is *required* if you're attempting to log in using a Microsoft Account like @outlook.com, @hotmail.com, or @live.com. 

## Known Issues

All feature ideas and issues should be reported using GitHub issues.

## Release Notes

This extension is *absolutely* in pre-release. So far it is just a pet project, but if you think the idea of having tools for Azure using [Visual Studio Code](http;//code.visualstudio.com), please submit an issue or a pull request if you have ideas or contributions. Both are welcome.

### 0.0.0 (Pre-release stage)

## Features:
- Login using interactive browser authentication
- Shows all of your Azure subscriptions and allows you to select the one you want to use
- Select a resource to browse in the Azure portal
- Simple web app create (defaults to creating a new resource group and server farm)
- Advanced web app create (allows creation/selection of new resource group and server farm)
- Tenant ID configuration via workspace settings to enable MSA (@outlook.com, @live.com, @hotmail.com) login