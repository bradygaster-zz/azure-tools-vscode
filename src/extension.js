// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var msRestAzure = require('ms-rest-azure');
var open = require('open');
var getUrls = require('get-urls');
var cp = require('copy-paste');

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
    selectedRegion: 'West US'
};

function doNewOrExistingServerFarmWorkflow(callback) {
    // decide if we should use an existing farm or make a new one
    vscode.window.showQuickPick([
        constants.optionUseExistingHostingPlan,
        constants.optionNewHostingPlan
    ]).then(selected => {
        if (selected == constants.optionUseExistingHostingPlan) {
            ux
                .getServerFarms(state)
                .then(function () {
                    if (state.serverFarmList.length == 0)
                        vscode.window.showErrorMessage(constants.promptNoFarmInResourceGroup);
                    else {
                        vscode.window.showQuickPick(state.serverFarmList)
                            .then(function (selectedServerFarm) {
                                if(!selectedServerFarm) return; 
                                state.selectedServerFarm = selectedServerFarm;
                                callback();
                            })
                            .catch(function (err) {
                                vscode.window.showErrorMessage(err);
                            });
                    }
                });
        }
        else if (selected == constants.optionNewHostingPlan) {
            vscode.window.showInputBox({ prompt: constants.promptNewServerFarm })
                .then(function (newServerFarmName) {

                    if (!newServerFarmName || newServerFarmName === '') return;

                    state.selectedServerFarm = newServerFarmName;
                    vscode.window.setStatusBarMessage(constants.statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));
                    ux.createServerFarm(state, function () {
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
    var loginToAzureCommand = vscode.commands.registerCommand('logintoazure', function () {
        vscode.window.setStatusBarMessage(state.statusGettingSubscriptions);

        // handle the interactive user login message result
        var options = {};
        var tenantId = config.getTenantId();

        // see if the user is intending on logging in with an msa
        if (tenantId != null && tenantId.length > 0) {
            options = {
                domain: config.getTenantId()
            };
        }

        options.userCodeResponseLogger = function (message) {
            // extract the code to be copied to the clipboard from the message
            var codeCopied = message.substring(message.indexOf(constants.enterCodeString)
                + constants.enterCodeString.length).replace(constants.authString, '');
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

        msRestAzure.interactiveLogin(options, function (err, credentials, subscriptions) {
            state.credentials = credentials;
            state.subscriptions = subscriptions;

            if (state.subscriptions.length > 0) {
                ux.showSubscriptionStatusBarButton();
                ux.showSelectRegionStatusBarButton();

                for (var i = 0; i < state.subscriptions.length; i++) {
                    state.subscriptionIds.push(state.subscriptions[i].id);
                    state.subscriptionNames.push(state.subscriptions[i].name);
                }

                credentials.retrieveTokenFromCache(function (notUsed, tokenType, accessToken) {
                    state.selectedSubscriptionId = state.subscriptions[0].id;
                    state.accessToken = accessToken;
                    vscode.window.showInformationMessage(constants.loggedInMessage);
                    vscode.window.setStatusBarMessage(
                        constants.statusLoggedInAndSubscriptionSelected.replace('{0}', state.subscriptions[0].name));
                });

                ux.getRegions(state);
            }
            else {
                vscode.window.showErrorMessage(constants.promptNoSubscriptionsOrMisconfigured);
            }
        });
    });

    // shows the user a list of subscriptions
    var selectSubscriptionCommand = vscode.commands.registerCommand('selectsubscription', function () {
        // when the user selects a subscription remember the selected subscription id
        vscode.window.showQuickPick(state.subscriptionNames).then(selected => {

            // abort if user aborted
            if (!selected) return;

            state.subscriptions.forEach(function (element, index, array) {
                if (element.name == selected) {
                    state.selectedSubscriptionId = element.id;
                    ux.getRegions(state).then(function () {

                    });
                    vscode.window.setStatusBarMessage(constants.statusSubscriptionSelected.replace('{0}', element.name));

                }
            });
        });
    });

    // command to bounce a customer to a particular resource in their subscription
    var browseInPortal = vscode.commands.registerCommand('browseInPortal', function () {
        ux.getAzureResources(state)
            .then(function (names) {
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

    // starts simple function app creation process
    var createFunctionSimpleCommand = vscode.commands.registerCommand('createFunction.simple', function () {
        vscode.window.showInputBox({
            prompt: constants.promptCreateNewFunction
        }).then(function (newWebSiteName) {

            if(newWebSiteName == null) return;

            state.newWebAppName = newWebSiteName;
            state.selectedServerFarm = state.newWebAppName + 'ServerFarm';
            state.resourceGroupToUse = state.newWebAppName + 'Resources';

            ux.createResourceGroup(state,
                function () {
                    ux.createServerFarm(state, function () {
                        ux.createFunction(state)
                    })
                });
        });
    });
    
    // starts simple web app creation process
    var createWebAppCommandSimple = vscode.commands.registerCommand('createwebapp.simple', function () {
        vscode.window.showInputBox({
            prompt: constants.promptNewWebAppName
        }).then(function (newWebSiteName) {

            if (!newWebSiteName || newWebSiteName === "") return;

            state.newWebAppName = newWebSiteName;
            state.selectedServerFarm = state.newWebAppName + 'ServerFarm';
            state.resourceGroupToUse = state.newWebAppName + 'Resources';

            ux.createResourceGroup(state,
                function () {
                    ux.createServerFarm(state, function () {
                        ux.createWebApp(state)
                    })
                });
        });
    });

    // starts advanced the web app creation process
    var createWebAppCommandAdvanced = vscode.commands.registerCommand('createwebapp.advanced', function () {
        vscode.window.showInputBox({
            prompt: constants.promptNewWebAppName
        }).then(function (newWebSiteName) {

            if (!newWebSiteName || newWebSiteName === "") return;

            state.newWebAppName = newWebSiteName;
            ux
                .ifNameIsAvailable(state)
                .then(function () {
                    // name is available so we need to know a resource group to use
                    vscode.window.showQuickPick([
                        constants.optionExistingRg,
                        constants.optionNewRg
                    ]).then(selected => {
                        if (selected == constants.optionExistingRg) {
                            ux
                                .getResourceGroups(state)
                                .then(function () {
                                    // show the list in a quickpick
                                    vscode.window.showQuickPick(state.resourceGroupList)
                                        .then(function (selectedRg) {
                                            
                                            if(!selectedRg) return;

                                            state.resourceGroupToUse = selectedRg;
                                            doNewOrExistingServerFarmWorkflow(function () {
                                                ux.createWebApp(state);
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

                                if (!newResourceGroupName || newResourceGroupName === "") return;

                                state.resourceGroupToUse = newResourceGroupName;
                                ux.createResourceGroup(state, function () {
                                    doNewOrExistingServerFarmWorkflow(function () {
                                        ux.createWebApp(state);
                                    });
                                });
                            });
                        }
                    });
                })
                .catch(function (message) {
                    vscode.window.showErrorMessage(message);
                });
        });
    });

    var selectRegionCommand = vscode.commands.registerCommand('selectRegion', function () {
        ux.getRegions(state).then(function () {
            ux.showRegionMenu(state);
        });
    });

    context.subscriptions.push(loginToAzureCommand);
    context.subscriptions.push(selectSubscriptionCommand);
    context.subscriptions.push(createWebAppCommandSimple);
    context.subscriptions.push(createWebAppCommandAdvanced);
    context.subscriptions.push(browseInPortal);
    context.subscriptions.push(selectRegionCommand);
    context.subscriptions.push(createFunctionSimpleCommand);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

// handle deactivate
exports.deactivate = deactivate;