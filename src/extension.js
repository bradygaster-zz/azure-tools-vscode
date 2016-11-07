// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// config and services
var ux = require('./ux');
var config = require('./config');
var constants = config.getConstants();

// state used in the extension
var state = {
    credentials: null,
    accessToken: null,
    subscriptions: null,
    subscriptionIds: [],
    subscriptionNames: [],
    selectedSubscriptionId: null,
    resourceGroupList: [],
    resourceGroupToUse: null,
    serverFarmList: [],
    selectedServerFarm: null,
    entireResourceList: [],
    newWebAppName: null,
    regions: [],
    selectedRegion: 'West US',
    storageAccountList: [],
    selectedStorageAccount: null,
    storageAccountKeyList: []
};

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('ACTIVATION: "azuretoolsforvscode"');

    // the command to login to azure 
    var loginToAzureCommand = require('./commands/loginToAzure').createCommand(state);

    // shows the user a list of subscriptions
    var selectSubscriptionCommand = require('./commands/selectSubscription').createCommand(state);

    // gives the user a pick list of regions to use to set their default region
    var selectRegionCommand = require('./commands/selectRegion').createCommand(state);

    // command to bounce a customer to a particular resource in their subscription
    var browseInPortal = require('./commands/browse').createCommand(state);

    // command to bounce a customer to a particular resource group in their subscription
    var browseResourceGroupInPortal = require('./commands/browseToResourceGroup').createCommand(state);

    // starts simple function app creation process
    var createFunctionSimpleCommand = require('./commands/functionAppCreateSimple').createCommand(state);

    // starts simple web app creation process
    var createWebAppCommandSimple = require('./commands/webAppCreateSimple').createCommand(state);

    // starts advanced the web app creation process
    var createWebAppCommandAdvanced = require('./commands/webAppCreateAdvanced').createCommand(state);

    // starts advanced the function app creation process
    var createFunctionAdvancedCommand = require('./commands/functionAppCreateAdvanced').createCommand(state);

    // starts simple storage account creation process
    var storageAccountGetConnectionStringCommand = require('./commands/storageAccountGetConnectionString').createCommand(state);

    // create a storage account
    var storageAccountCreateSimpleCommand = require('./commands/storageAccountCreateSimple').createCommand(state);

    context.subscriptions.push(loginToAzureCommand);
    context.subscriptions.push(selectSubscriptionCommand);
    context.subscriptions.push(selectRegionCommand);
    context.subscriptions.push(browseInPortal);
    context.subscriptions.push(browseResourceGroupInPortal);
    context.subscriptions.push(createFunctionSimpleCommand);
    context.subscriptions.push(createWebAppCommandSimple);
    context.subscriptions.push(createWebAppCommandAdvanced);
    context.subscriptions.push(createFunctionAdvancedCommand);
    context.subscriptions.push(storageAccountGetConnectionStringCommand);
    context.subscriptions.push(storageAccountCreateSimpleCommand);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

// handle deactivate
exports.deactivate = deactivate;