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

// method to create the resource group
function createResourceGroup(callback) {
    console.log('creating the resource group');
    vscode.window.setStatusBarMessage(constants.statusCreatingResourceGroup.replace('{0}', state.resourceGroupToUse));
    azure
        .createNewResourceGroup(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(constants.statusCreatedResourceGroup.replace('{0}', state.resourceGroupToUse));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

function createServerFarm(callback) {
    console.log('creating the server farm');
    azure
        .createNewServerFarm(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(constants.statusCreatedResourceGroup.replace('{0}', state.selectedServerFarm));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// creates the web app based on the state persisted up to this point
function createWebApp(callback) {
    console.log('creating the web app');
    vscode.window.setStatusBarMessage(constants.promptWebAppCreationInProcess.replace('{0}', state.newWebAppName));
    azure
        .createWebApp(state)
        .then(function (result) {
            console.log(result);
            vscode.window.setStatusBarMessage(constants.promptWebAppCreated.replace('{0}', state.newWebAppName));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// gets all the hosting plans
function getHostingPlans() {
    vscode.window.showQuickPick([
        constants.optionUseExistingHostingPlan,
        constants.optionNewHostingPlan
    ]).then(selected => {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        if (selected == constants.optionUseExistingHostingPlan) {
            state.serverFarmList = [];

            var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);

            // get the list of server farms
            resourceClient.resources.list({
                filter: "resourceType eq 'Microsoft.Web/serverfarms'"
            }, function (err, result) {
                result.forEach(function (farm, index, arr) {
                    console.log('adding farm ' + farm.name + ' to the list');
                    state.serverFarmList.push(farm.name);
                    if (index == arr.length - 1) {
                        console.log('got the server farms');
                        vscode.window.showQuickPick(state.serverFarmList)
                            .then(function (selectedServerFarm) {
                                state.selectedServerFarm = selectedServerFarm;
                                console.log('server farm selected: ' + state.selectedServerFarm);
                                createWebApp();
                            });
                    }
                });
            });
        }
        else {
            console.log('allow user to create a new server farm');
            vscode.window.showInputBox({ prompt: constants.promptNewServerFarm })
                .then(function (newServerFarmName) {
                    if (newServerFarmName == '')
                        return;
                    state.selectedServerFarm = newServerFarmName;
                    vscode.window.setStatusBarMessage(constants.statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));
                    createServerFarm(createWebApp);
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
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resources.list(function (err, result) {
            state.entireResourceList = result;
            names = state.entireResourceList.map(function (resource) {
                return resource.id.replace('subscriptions/' + state.selectedSubscriptionId + '/resourceGroups/', '');
            });
            vscode.window.showQuickPick(names)
                .then(function (selected) {
                    filtered = state.entireResourceList.filter(function (value) {
                        return value.id.endsWith(selected);
                    });
                    open("https://portal.azure.com/#resource" + filtered[0].id);
                });
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

            createResourceGroup(function () {
                createServerFarm(function () {
                    createWebApp();
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

            // create the management client
            var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);

            // check the name availability
            console.log('check web app name: ' + state.newWebAppName);
            webSiteManagement.global.checkNameAvailability({
                name: state.newWebAppName,
                type: 'Microsoft.Web/sites'
            }, function (err, result) {
                if (!result.nameAvailable) {
                    // name isn't available so we bail out'
                    vscode.window.showErrorMessage(constants.promptWebSiteNameNotAvailable);
                }
                else {
                    // name is available so we need to know a resource group to use
                    console.log('ask user which resource group to use');
                    vscode.window.showQuickPick([
                        constants.optionExistingRg,
                        constants.optionNewRg
                    ]).then(selected => {
                        if (selected == constants.optionExistingRg) {

                            // retrieve list of resource groups using sdk
                            console.log('get resource groups');
                            var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
                            state.resourceGroupList = [];
                            resourceClient.resourceGroups.list(function (err, rgListResult) {
                                rgListResult.forEach(function (rg) {
                                    state.resourceGroupList.push(rg.name);
                                }, this);

                                // show the list in a quickpick
                                console.log('show pick list of resource groups');
                                vscode.window.showQuickPick(state.resourceGroupList)
                                    .then(function (selectedRg) {
                                        state.resourceGroupToUse = selectedRg;
                                        getHostingPlans();
                                    });
                            });
                        }
                        else if (selected == constants.optionNewRg) {
                            console.log('show input text box for new resource group');
                            vscode.window.showInputBox({
                                prompt: constants.promptNewRgName
                            }).then(function (newResourceGroupName) {
                                console.log('create resource group ' + newResourceGroupName);
                                state.resourceGroupToUse = newResourceGroupName;
                                createResourceGroup(getHostingPlans());
                            });
                        }
                    });
                }
            });
        });
    });

    context.subscriptions.push(loginToAzureCommand);
    context.subscriptions.push(selectSubscriptionCommand);
    context.subscriptions.push(createWebAppCommandSimple);
    context.subscriptions.push(createWebAppCommandAdvanced);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

// handle deactivate
exports.deactivate = deactivate;