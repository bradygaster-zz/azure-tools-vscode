// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// import the azure node.js sdk
var msRestAzure = require('ms-rest-azure');
var WebSiteManagement = require('azure-arm-website');
var ResourceManagement = require('azure-arm-resource');

// misc packages
var open = require('open');
var getUrls = require('get-urls');
var cp = require('copy-paste');
var async = require('async');

// get the config and services
var azure = require('./azureResourceManagement');
var commandServices = require('./commandServices');
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
    newWebAppName: null
};

function doNewOrExistingServerFarmWorkflow(callback) {
    // decide if we should use an existing farm or make a new one
    vscode.window.showQuickPick([
        constants.optionUseExistingHostingPlan,
        constants.optionNewHostingPlan
    ]).then(selected => {
        if (selected == constants.optionUseExistingHostingPlan) {
            state.serverFarmList = [];
            commandServices.getServerFarms(state).then(function () {
                vscode.window.showQuickPick(state.serverFarmList)
                    .then(function (selectedServerFarm) {
                        state.selectedServerFarm = selectedServerFarm;
                        callback();
                    });
            });
        }
        else if (selected == constants.optionNewHostingPlan) {
            vscode.window.showInputBox({ prompt: constants.promptNewServerFarm })
                .then(function (newServerFarmName) {
                    if (newServerFarmName == '')
                        return;
                    state.selectedServerFarm = newServerFarmName;
                    vscode.window.setStatusBarMessage(constants.statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));
                    commandServices.createServerFarm(state, function () {
                        callback();
                    });
                });
        }
    });
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('ACTIVATION: "azuretoolsforvscode"');

    // the command to login to azure 
    var loginToAzureCommand = vscode.commands.registerCommand('azure.logintoazure', function () {
        vscode.window.setStatusBarMessage(state.statusGettingSubscriptions);

        // handle the interactive user login message result
        var options = {
            domain: config.getTenantId()
        };

        options.userCodeResponseLogger = function (message) {
            // extract the code to be copied to the clipboard from the message
            var codeCopied = message.substring(message.indexOf(constants.enterCodeString) + constants.enterCodeString.length).replace(constants.authString, '');
            cp.copy(codeCopied);

            // show the user the friendly message
            vscode.window.showInformationMessage(
                constants.signInMessage.replace('{0}', codeCopied), {
                    title: constants.loginButtonLabel
                }).then(function (btn) {
                    if (btn && btn.title == constants.loginButtonLabel) {
                        open(getUrls(message)[0]);
                    }
                });
        }

        msRestAzure.interactiveLogin(options, function (err, credentials, subsciptions) {
            state.credentials = credentials;
            // remember the subscriptions
            state.subscriptions = subsciptions;
            for (var i = 0; i < state.subscriptions.length; i++) {
                state.subscriptionIds.push(state.subscriptions[i].id);
                state.subscriptionNames.push(state.subscriptions[i].name);
            }

            credentials.retrieveTokenFromCache(function (notUsed, tokenType, accessToken) {
                state.selectedSubscriptionId = state.subscriptions[0].id;
                state.accessToken = accessToken;
                vscode.window.showInformationMessage(constants.loggedInMessage);
                vscode.window.setStatusBarMessage(constants.statusLoggedInAndSubscriptionSelected.replace('{0}', state.subscriptions[0].name));
            });
        });
    });

    // shows the user a list of subscriptions
    var selectSubscriptionCommand = vscode.commands.registerCommand('azure.selectsubscription', function () {
        // when the user selects a subscription remember the selected subscription id
        vscode.window.showQuickPick(state.subscriptionNames).then(selected => {
            state.subscriptions.forEach(function (element, index, array) {
                if (element.name == selected) {
                    state.selectedSubscriptionId = element.id;
                    vscode.window.setStatusBarMessage(constants.statusSubscriptionSelected.replace('{0}', element.name));
                }
            });
        });
    });

    // command to bounce a customer to a particular resource in their subscription
    var browseInPortal = vscode.commands.registerCommand('azure.browseInPortal', function () {
        vscode.window.setStatusBarMessage(constants.statusGettingResources);
        azure
            .getFullResourceList(state)
            .then(function (names) {
                vscode.window.setStatusBarMessage('');
                vscode.window.showQuickPick(names)
                    .then(function (selected) {
                        if (selected != null && selected.length > 0) {
                            filtered = state.entireResourceList.filter(function (value) {
                                return value.id.endsWith(selected);
                            });
                            if (filtered != null)
                                open("https://portal.azure.com/#resource" + filtered[0].id);
                        }
                    });
            })
            .catch(function (err) {
                vscode.window.showErrorMessage(err);
            });
    });

    // starts simple the web app creation process
    var createWebAppCommandSimple = vscode.commands.registerCommand('azure.createwebapp.simple', function () {
        vscode.window.showInputBox({
            prompt: constants.promptNewWebAppName
        }).then(function (newWebSiteName) {
            state.newWebAppName = newWebSiteName;
            state.selectedServerFarm = state.newWebAppName + 'ServerFarm';
            state.resourceGroupToUse = state.newWebAppName + 'Resources';

            commandServices.createResourceGroup(state,
                function () {
                    commandServices.createServerFarm(state, function () {
                        commandServices.createWebApp(state)
                    })
                });
        });
    });

    // starts advanced the web app creation process
    var createWebAppCommandAdvanced = vscode.commands.registerCommand('azure.createwebapp.advanced', function () {
        vscode.window.showInputBox({
            prompt: constants.promptNewWebAppName
        }).then(function (newWebSiteName) {
            state.newWebAppName = newWebSiteName;

            azure
                .checkSiteNameAvailability(state)
                .then(function (result) {
                    if (!result.nameAvailable) {
                        // name isn't available so we bail out'
                        vscode.window.showErrorMessage(constants.promptWebSiteNameNotAvailable);
                    }
                    else {
                        // name is available so we need to know a resource group to use
                        vscode.window.showQuickPick([
                            constants.optionExistingRg,
                            constants.optionNewRg
                        ]).then(selected => {
                            if (selected == constants.optionExistingRg) {
                                azure
                                    .getResourceGroups(state)
                                    .then(function (result) {
                                        result.forEach(function (rg) {
                                            state.resourceGroupList.push(rg.name);
                                        });

                                        // show the list in a quickpick
                                        vscode.window.showQuickPick(state.resourceGroupList)
                                            .then(function (selectedRg) {
                                                state.resourceGroupToUse = selectedRg;
                                                doNewOrExistingServerFarmWorkflow(function () {
                                                    commandServices.createWebApp(state);
                                                });
                                            });
                                    })
                                    .catch(function (err) {
                                        vscode.window.showErrorMessage(err);
                                    });
                            }
                            else if (selected == constants.optionNewRg) {
                                vscode.window.showInputBox({
                                    prompt: constants.promptNewRgName
                                }).then(function (newResourceGroupName) {
                                    state.resourceGroupToUse = newResourceGroupName;
                                    commandServices.createResourceGroup(state, function () {
                                        doNewOrExistingServerFarmWorkflow(function () {
                                            commandServices.createWebApp(state);
                                        });
                                    });
                                });
                            }
                        });
                    }
                })
                .catch(function (err) {
                    vscode.window.showErrorMessage(err);
                });
        });
    });

    context.subscriptions.push(loginToAzureCommand);
    context.subscriptions.push(selectSubscriptionCommand);
    context.subscriptions.push(createWebAppCommandSimple);
    context.subscriptions.push(createWebAppCommandAdvanced);
    context.subscriptions.push(browseInPortal);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

// handle deactivate
exports.deactivate = deactivate;