// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// config and services
var ux = require('./ux');
var config = require('./config');
var constants = config.getConstants();
var fs = require('fs');
var path = require('path');

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
    keyVaultName: null,
    keyVaultRegions: [],
    batchAccountName: null,
    batchAccountRegions: [],
    newWebAppName: null,
    regions: [],
    selectedRegion: 'West US',
    storageAccountList: [],
    selectedStorageAccount: null,
    storageAccountKeyList: [],
    AzureGalleryList: [],
    AzureGalleryItemId: null,
    AzureGallerySearchTerm: null,
    AzureGallerySearchResults: [],
    SelectedTemplateFile: null,
    SelectedTemplateParametersFile: null
};

var appEvents = require('./appEvents');

function activate(context) {
    appEvents.setContext(context);

    var commandFilesPath = path.join(context.extensionPath, 'src', 'commands');
    fs.readdir(commandFilesPath, (err, files) => {
        files.forEach((file) => {
            context.subscriptions.push(
                require('./commands/' + path.basename(file, '.js')).createCommand(state)
            );
            console.log(path.basename(file, '.js') + ' command added');
        });
    });

    console.log('ACTIVATION: "azuretoolsforvscode"');
}

exports.activate = activate;

function deactivate() {
}

exports.deactivate = deactivate;