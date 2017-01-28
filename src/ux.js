var vscode = require('vscode');
var config = require('./config');
var constants = require('./constants').Constants;
var azure = require('./azure');
var path = require('path');
var fs = require('fs');
var fsPath = require('fs-path');

// perform the export template feature
exports.exportTemplate = function exportTemplate(state) {
    var promptTemplateExportedWithErrors = 'Resource group {0} has been exported with errors. Check the template for completeness.',
        promptTemplateExported = 'Resource group {0} has been exported to your workspace\'s arm-templates folder';

    this.getResourceGroups(state)
        .then(function () {
            vscode.window.showQuickPick(state.resourceGroupList)
                .then(function (selectedRg) {
                    if (!selectedRg) reject();
                    state.resourceGroupToUse = selectedRg;
                    azure.exportTemplate(state)
                        .then((result) => {
                            var json = JSON.stringify(result.template);
                            var filename = path.join(vscode.workspace.rootPath, constants.armTemplatesPath, state.resourceGroupToUse, 'azuredeploy.json');
                            fsPath.writeFile(filename, json, (err) => {
                                if (result.error) {
                                    vscode.window.showErrorMessage(promptTemplateExportedWithErrors.replace('{0}', state.resourceGroupToUse));
                                }
                                else {
                                    vscode.window.showInformationMessage(promptTemplateExported.replace('{0}', state.resourceGroupToUse));
                                }
                                vscode.workspace.openTextDocument(filename)
                                    .then(prms => {
                                        vscode.window.showTextDocument(prms);
                                    });
                            });
                        });
                });
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
};

// check to see if the user is logged in
exports.isLoggedIn = function isLoggedIn(state) {
    var promptNotLoggedIn = 'You have not yet logged in. Run the Azure Login command first.';

    return new Promise((resolve, reject) => {
        if (state && state.credentials && state.accessToken && (state.subscriptions && state.subscriptions.length > 0)) {
            resolve();
        }
        else {
            vscode.window.showErrorMessage(promptNotLoggedIn);
        }
    });
};

// deploys arm template
exports.deployTemplate = function deployTemplate(state) {
    var promptDeployingTemplate = 'Deploying template {0} to resource group {1}',
        promptDeployingTemplateFailed = 'FAILED to deploy template {0} to resource group {1}';

    state.statusBar = vscode.window.setStatusBarMessage(promptDeployingTemplate
        .replace('{0}', state.selectedTemplateName)
        .replace('{1}', state.resourceGroupToUse))

    azure.deployTemplate(state)
        .then((msg) => {
            vscode.window.showInformationMessage(msg);
            state.statusBar.dispose();
        })
        .catch((err) => {
            vscode.window.showErrorMessage(promptDeployingTemplateFailed
                .replace('{0}', state.selectedTemplateName)
                .replace('{1}', state.resourceGroupToUse));
            state.statusBar.dispose();
        });
};

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

// wrapper method for handling "new or existing resource group" workflows
exports.showNewOrExistingResourceGroupMenu = function showNewOrExistingResourceGroupMenu(state) {
    return new Promise((resolve, reject) => {
        vscode.window.showQuickPick([
            constants.optionExistingRg,
            constants.optionNewRg
        ]).then(selected => {
            if (selected == constants.optionExistingRg) {
                this.getResourceGroups(state)
                    .then(function () {
                        vscode.window.showQuickPick(state.resourceGroupList)
                            .then(function (selectedRg) {
                                if (!selectedRg) reject();
                                state.resourceGroupToUse = selectedRg;
                                resolve();
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
                    if (!newResourceGroupName || newResourceGroupName === "") reject();
                    state.resourceGroupToUse = newResourceGroupName;
                    azure.createNewResourceGroup(state).then(() => {
                        resolve();
                    });
                });
            }
        });
    });
};

// check the site's name
exports.ifWebSiteNameIsAvailable = function ifWebSiteNameIsAvailable(state) {
    var promptWebSiteNameNotAvailable = 'That web app name is not available.';

    return new Promise(function (resolve, reject) {
        azure
            .checkSiteNameAvailability(state)
            .then(function (result) {
                if (!result.nameAvailable) {
                    // name isn't available so we bail out'
                    reject(promptWebSiteNameNotAvailable);
                }
                else {
                    resolve();
                }
            });
    });
};

// check the storage account's name
exports.ifStorageAccountNameIsAvailable = function ifStorageAccountNameIsAvailable(state) {
    var promptStorageAccountNameNotAvailable = 'That storage account name is not available.';

    return new Promise(function (resolve, reject) {
        azure
            .checkStorageAccountNameAvailability(state)
            .then(function (result) {
                if (!result.nameAvailable) {
                    // name isn't available so we bail out'
                    reject(promptStorageAccountNameNotAvailable);
                }
                else {
                    resolve();
                }
            });
    });
};

// check the key vault name is available
exports.ifKeyVaultNameIsAvailable = function ifKeyVaultNameIsAvailable(state) {
    var promptKeyVaultNameNotAvailable = 'That key vault name is not available';

    return new Promise(function (resolve, reject) {
        azure
            .checkKeyVaultNameAvailability(state)
            .then(function (result) {
                if (!result) {
                    // name isn't available so we bail out'
                    reject(promptKeyVaultNameNotAvailable);
                }
                else {
                    resolve();
                }
            });
    });
}

// check the batch account name is available
exports.ifBatchAccountNameIsAvailable = function ifBatchAccountNameIsAvailable(state) {
    var promptBatchAccountNameNotAvailable = 'The batch account name is not available.';

    return new Promise(function (resolve, reject) {
        azure
            .checkBatchAccountNameAvailability(state)
            .then(function (result) {
                if (!result) {
                    reject(promptBatchAccountNameNotAvailable);
                }
                else {
                    resolve();
                }
            });
    });
}

// gets all of the resources
exports.getAzureResources = function getAzureResources(state) {
    var statusGettingResources = 'Getting your list of resources';

    return new Promise((function (resolve, reject) {
        var statusBar = vscode.window.setStatusBarMessage(statusGettingResources);
        azure
            .getFullResourceList(state)
            .then(function (names) {
                statusBar.dispose();
                resolve(names);
            })
            .catch(function (err) {
                reject(err);
            });
    }));
};

// creates a new key vault
exports.createKeyVault = function createKeyVault(state, callback) {
    var statusCreatingKeyVault = 'Creating key vault "{0}"',
        statusCreatedKeyVault = 'Key vault "{0}" created successfully';

    vscode.window.setStatusBarMessage(statusCreatingKeyVault.replace('{0}', state.keyVaultName));
    azure
        .createNewKeyVault(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(statusCreatedKeyVault.replace('{0}', state.keyVaultName));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

exports.createBatchAccount = function createBatchAccount(state, callback) {
    var statusCreatingBatchAccount = 'Creating batch account {0}',
        statusCreatedBatchAccount = 'Batch account {0} created successfully';

    vscode.window.setStatusBarMessage(statusCreatingBatchAccount.replace('{0}', state.batchAccountName));
    azure
        .createNewBatchAccount(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(statusCreatedBatchAccount.replace('{0}', state.batchAccountName));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// method to create the resource group
exports.createResourceGroup = function createResourceGroup(state, callback) {
    var statusCreatingResourceGroup = 'Creating resource group "{0}"',
        statusCreatedResourceGroup = 'Resource group "{0}" created successfully';

    vscode.window.setStatusBarMessage(statusCreatingResourceGroup.replace('{0}', state.resourceGroupToUse));

    azure
        .createNewResourceGroup(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(statusCreatedResourceGroup.replace('{0}', state.resourceGroupToUse));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// create the server farm
exports.createServerFarm = function createServerFarm(state, callback) {
    var statusCreatingServerFarm = 'Creating server farm {0}',
        statusCreatedServerFarm = 'Created server farm {0}';

    vscode.window.setStatusBarMessage(statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));

    azure
        .createNewServerFarm(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(statusCreatedServerFarm.replace('{0}', state.selectedServerFarm));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// creates the web app based on the state persisted up to this point
exports.createWebApp = function createWebApp(state, callback) {
    var promptWebAppCreationInProcess = 'Creating Web App "{0}"...',
        promptWebAppCreated = 'Created Web App "{0}". Use "azure browse resource in portal" to open it up in the Azure portal.';

    vscode.window.setStatusBarMessage(promptWebAppCreationInProcess.replace('{0}', state.newWebAppName));

    azure
        .createWebApp(state)
        .then(function (result) {
            console.log(result);
            vscode.window.setStatusBarMessage(promptWebAppCreated.replace('{0}', state.newWebAppName));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// creates the function app based on the state persisted up to this point
exports.createFunction = function createFunction(state, callback) {
    var promptFunctionAppCreationInProcess = 'Creating Function App "{0}"...',
        promptFunctionAppCreated = 'Created Function App "{0}". Use "azure browse resource in portal" to open it up in the Azure portal.';

    vscode.window.setStatusBarMessage(promptFunctionAppCreationInProcess.replace('{0}', state.newWebAppName));

    azure
        .createFunction(state)
        .then(function (result) {
            console.log(result);
            vscode.window.setStatusBarMessage(promptFunctionAppCreated.replace('{0}', state.newWebAppName));
            if (callback != null)
                callback();
        })
        .catch(function (err) {
            vscode.window.showErrorMessage(err);
        });
}

// gets all the hosting plans
exports.getServerFarms = function getServerFarms(state) {
    var statusGettingFarms = 'Geting your list of server farms...';

    return new Promise(function (resolve, reject) {
        state.serverFarmList = [];
        var statusBar = vscode.window.setStatusBarMessage(statusGettingFarms);
        azure
            .getServerFarms(state)
            .then(function (result) {
                statusBar.dispose();
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

// lists all storage accounts in subscription
exports.getStorageAccounts = function getStorageAccounts(state) {
    var promptNoStorageAccount = 'No storage accounts found in subscription. Maybe you should create one?';
    return new Promise(function (resolve, reject) {
        state.storageAccountList = [];
        azure
            .getStorageAccounts(state)
            .then(function (result) {
                if (result.length === 0)
                    vscode.window.showErrorMessage(promptNoStorageAccount);
                else {
                    result.forEach((item, index, arr) => {
                        state.storageAccountList.push(item);
                        if (index === arr.length - 1)
                            resolve();
                    });
                }
            })
            .catch(function (err) {
                vscode.window.showErrorMessage(err);
            });
    });
}

// create new storage account
exports.createStorageAccount = function createStorageAccount(state, callback) {
    var statusCreatingStorageAccount = 'Creating storage account "{0}"',
        statusCreatedStorageAccount = 'Storage account "{0}" created successfully';

    return new Promise((resolve, reject) => {
        vscode.window.setStatusBarMessage(statusCreatingStorageAccount.replace('{0}', state.selectedStorageAccount));
        azure
            .createStorageAccount(state)
            .then((result) => {
                vscode.window.setStatusBarMessage(statusCreatedStorageAccount.replace('{0}', state.selectedStorageAccount));
                if (callback !== null)
                    callback(result);
            })
            .catch(function (err) {
                vscode.window.showErrorMessage(err);
            });
    });
}

// list storage account keys
exports.getStorageAccountKeys = function getStorageAccountKeys(state) {

    return new Promise(function (resolve, reject) {
        azure
            .getStorageAccountKeys(state)
            .then(function (result) {
                if (result.keys.length == 0)
                    reject();
                else {
                    state.storageAccountKeyList = [];

                    if (result.keys.length != 0)
                        resolve();
                    else
                        reject();

                    result.keys.forEach(function (item, index, arr) {
                        state.storageAccountKeyList.push(item);
                    });
                }
            })
            .catch(function (err) {
                vscode.window.showErrorMessage(err);
                reject();
            });
    });
};

var buttons = [];

exports.showSubscriptionStatusBarButton = function showSubscriptionStatusBarButton() {
    showButton('azure.subscription-select', '$(cloud-upload)', 'Select the active Azure subscription');
};

exports.showSelectRegionStatusBarButton = function showSelectRegionStatusBarButton() {
    showButton('azure.region-select', '$(globe)', 'Select your desired Azure region');
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

exports.getRegionsForResource = function getRegionsForResource(state, resourceProvider, resourceType) {
    return new Promise(function (resolve, reject) {
        azure
            .getRegionsForResource(state, resourceProvider, resourceType)
            .then(function (result) {
                resolve(result);
            })
            .catch(function (err) {
                vscode.window.showErrorMessage(err);
            });
    });
}

exports.showResourceGroupsMenu = function showResourceGroupsMenu(state, callback) {
    var statusResourceGroupSelected = '{0} resource group selected';

    var resourceGroupNames = state.resourceGroupList.map(function (x) { return x; });
    vscode.window.showQuickPick(resourceGroupNames).then(function (selected) {
        if (!selected) return;

        state.resourceGroupToUse = selected;
        vscode.window.setStatusBarMessage(statusResourceGroupSelected.replace('{0}', state.resourceGroupToUse));

        if (callback !== null)
            callback();
    });
};

exports.showRegionMenu = function showRegionMenu(state) {
    var statusRegionSelected = '{0} region selected',
        btnRegionSelectionLabel = 'Select your desired Azure region. ';

    var regionNames = state.regions.map(function (x) { return x.displayName; });
    vscode.window.showQuickPick(regionNames).then(function (selected) {
        if (!selected) return;

        state.selectedRegion = selected;
        vscode.window.setStatusBarMessage(statusRegionSelected.replace('{0}', state.selectedRegion));
        updateButtonTooltip('azure.region-select', btnRegionSelectionLabel + '('
            + statusRegionSelected.replace('{0}', state.selectedRegion) + ')');

    });
};

exports.showStorageAccountMenu = function showStorageMenu(state) {
    var statusStorageAccountSelected = '{0} storage account selected',
        btnStorageSelectionLabel = 'Select your desired Azure Storage Account. ';
    return new Promise(function (resolve, reject) {
        var storageAccountNames = state.storageAccountList.map(function (x) { return x.name; });
        vscode.window.showQuickPick(storageAccountNames).then(function (selected) {
            if (!selected)
                resolve(null);
            else {
                state.selectedStorageAccount = selected;
                vscode.window.setStatusBarMessage(statusStorageAccountSelected.replace('{0}', state.selectedStorageAccount));
                updateButtonTooltip('selectStorageAccount', btnStorageSelectionLabel + '('
                    + statusStorageAccountSelected.replace('{0}', state.selectedStorageAccount) + ')');
                resolve(selected);
            }
        });
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