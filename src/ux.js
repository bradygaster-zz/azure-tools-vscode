var vscode = require('vscode');
var config = require('./config');
var constants = config.getConstants();
var azure = require('./azure');

// get the list of resource groups from the subscription
exports.getResourceGroups = function getResourceGroups(state) {
    return new Promise(function (resolve, reject) {
        azure
            .getResourceGroups(state)
            .then(function (result) {
                result.forEach(function (rg) {
                    state.resourceGroupList.push(rg.name);
                });
                resolve();
            })
            .catch(function (err) {
                reject(err);
            });
    });
};

// check the site's name
exports.ifNameIsAvailable = function ifNameIsAvailable(state) {
    return new Promise(function (resolve, reject) {
        azure
            .checkSiteNameAvailability(state)
            .then(function (result) {
                if (!result.nameAvailable) {
                    // name isn't available so we bail out'
                    reject(constants.promptWebSiteNameNotAvailable);
                }
                else {
                    resolve();
                }
            });
    });
};

// gets all of the resources
exports.getAzureResources = function getAzureResources(state) {
    return new Promise((function (resolve, reject) {
        vscode.window.setStatusBarMessage(constants.statusGettingResources);

        azure
            .getFullResourceList(state)
            .then(function (names) {
                vscode.window.setStatusBarMessage('');
                resolve(names);
            })
            .catch(function (err) {
                reject(err);
            });
    }));
};

// method to create the resource group
exports.createResourceGroup = function createResourceGroup(state, callback) {
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

// create the server farm
exports.createServerFarm = function createServerFarm(state, callback) {
    vscode.window.setStatusBarMessage(constants.statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));

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
exports.createWebApp = function createWebApp(state, callback) {
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

// creates the function app based on the state persisted up to this point
exports.createFunction = function createFunction(state, callback) {
    vscode.window.setStatusBarMessage(constants.promptFunctionAppCreationInProcess.replace('{0}', state.newWebAppName));

    azure
        .createFunction(state)
        .then(function (result) {
            console.log(result);
            vscode.window.setStatusBarMessage(constants.promptFunctionAppCreated.replace('{0}', state.newWebAppName));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// gets all the hosting plans
exports.getServerFarms = function getServerFarms(state) {
    return new Promise(function (resolve, reject) {
        state.serverFarmList = [];
        vscode.window.setStatusBarMessage(constants.statusGettingFarms);
        azure
            .getServerFarms(state)
            .then(function (result) {
                vscode.window.setStatusBarMessage('');
                if (result.length == 0)
                    resolve();
                else {
                    result.forEach(function (farm, index, arr) {
                        state.serverFarmList.push(farm.name);
                        if (index == arr.length - 1) {
                            resolve();
                        }
                    });
                }
            })
            .catch(function (err) {
                reject(err);
            });
    });
}

var buttons = [];

exports.showSubscriptionStatusBarButton = function showSubscriptionStatusBarButton() {
    showButton('selectsubscription', '$(cloud-upload)', 'Select the active Azure subscription');
};

exports.showSelectRegionStatusBarButton = function showSelectRegionStatusBarButton() {
    showButton('selectRegion', '$(globe)', 'Select your desired Azure region');
};

exports.getRegions = function getRegions(state) {
    return new Promise(function (resolve, reject) {
        azure
            .getRegions(state)
            .then(function (result) {
                state.regions = result;
                state.selectedRegion = state.regions[0].displayName;
                resolve();
            })
            .catch(function (err) {
                vscode.window.showErrorMessage(err);
            });
    });
};

exports.showRegionMenu = function showRegionMenu(state) {
    var regionNames = state.regions.map(function (x) { return x.displayName; });
    vscode.window.showQuickPick(regionNames).then(function (selected) {
        if (!selected) return;

        state.selectedRegion = selected;
        vscode.window.setStatusBarMessage(constants.statusRegionSelected.replace('{0}', state.selectedRegion));
        updateButtonTooltip('selectRegion', constants.btnRegionSelectionLabel + '('
            + constants.statusRegionSelected.replace('{0}', state.selectedRegion) + ')');

    });
};

function showButton(command, text, tooltip) {
    var customStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
    customStatusBarItem.color = 'white';
    customStatusBarItem.command = command;
    customStatusBarItem.text = text;
    customStatusBarItem.tooltip = tooltip;
    customStatusBarItem.show();
    buttons.push(customStatusBarItem);
};

function updateButtonTooltip(command, tooltip) {
    var x = buttons.filter(function (f) {
        return f.command == command;
    });
    if (x != null && x.length > 0)
        x[0].tooltip = tooltip;
};