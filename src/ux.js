var vscode = require('vscode');
var config = require('./config');
var constants = require('./constants').Constants;
var azure = require('./azure');
var path = require('path');
var fs = require('fs');
var fsPath = require('fs-path');
var menu = require('./menu').menu;
var telemetry = require('./telemetry').createClient();
var outputChannel = require('./outputChannel').createChannel();

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
                    outputChannel.appendLine('Exporting template...');
                    azure.exportTemplate(state)
                        .then((result) => {
                            var json = JSON.stringify(result.template);
                            var filename = path.join(vscode.workspace.rootPath, constants.armTemplatesPath, state.resourceGroupToUse, 'azuredeploy.json');
                            fsPath.writeFile(filename, json, (err) => {
                                if (result.error) {
                                    outputChannel.appendLine('Error during template export:');
                                    outputChannel.appendLine(JSON.stringify(result.error));
                                    vscode.window.showErrorMessage(promptTemplateExportedWithErrors.replace('{0}', state.resourceGroupToUse));
                                }
                                else {
                                    outputChannel.appendLine('Template exported successfully.');
                                    vscode.window.showInformationMessage(promptTemplateExported.replace('{0}', state.resourceGroupToUse));
                                }
                                vscode.workspace.openTextDocument(filename)
                                    .then(prms => {
                                        vscode.window.showTextDocument(prms);
                                    });
                            });
                        })
                        .catch((err) => {
                            outputChannel.appendLine('Error during template export:');
                            outputChannel.appendLine(JSON.stringify(err));
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
        .replace('{1}', state.resourceGroupToUse));

    outputChannel.appendLine(promptDeployingTemplate
        .replace('{0}', state.selectedTemplateName)
        .replace('{1}', state.resourceGroupToUse));

    azure.deployTemplate(state)
        .then((msg) => {
            outputChannel.appendLine('Template deployed with messages from API:');
            outputChannel.appendLine(msg);
            state.statusBar.dispose();
        })
        .catch((err) => {
            outputChannel.appendLine(promptDeployingTemplateFailed
                .replace('{0}', state.selectedTemplateName)
                .replace('{1}', state.resourceGroupToUse));
            outputChannel.appendLine(err);
            vscode.window.showErrorMessage(promptDeployingTemplateFailed
                .replace('{0}', state.selectedTemplateName)
                .replace('{1}', state.resourceGroupToUse));
            state.statusBar.dispose();
        });
};

// get the list of resource groups from the subscription
exports.getResourceGroups = function getResourceGroups(state) {
    return new Promise(function (resolve, reject) {
        outputChannel.appendLine('Getting resource groups.');
        azure
            .getResourceGroups(state)
            .then(function (result) {
                outputChannel.appendLine('Found ' + result.length + ' resource groups.');
                result.forEach(function (rg) {
                    state.resourceGroupList.push(rg.name);
                });
                resolve();
            })
            .catch(function (err) {
                outputChannel.appendLine('Error retrieving resource groups:');
                outputChannel.appendLine(err);
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
        outputChannel.appendLine('Checking to see if \'' + state.newWebAppName + '\' is available.');
        azure
            .checkSiteNameAvailability(state)
            .then(function (result) {
                if (!result.nameAvailable) {
                    // name isn't available so we bail out'
                    outputChannel.appendLine(promptWebSiteNameNotAvailable);
                    reject(promptWebSiteNameNotAvailable);
                }
                else {
                    outputChannel.appendLine(state.newWebAppName + ' is available.');
                    resolve();
                }
            });
    });
};

// check the storage account's name
exports.ifStorageAccountNameIsAvailable = function ifStorageAccountNameIsAvailable(state) {
    var promptStorageAccountNameNotAvailable = 'That storage account name is not available.';

    return new Promise(function (resolve, reject) {
        outputChannel.appendLine('Checking to see if storage account name "' + state.selectedStorageAccount + '" is available.');
        azure
            .checkStorageAccountNameAvailability(state)
            .then(function (result) {
                if (!result.nameAvailable) {
                    // name isn't available so we bail out'
                    outputChannel.appendLine('Storage account name "' + state.selectedStorageAccount + '" is not available.');
                    reject(promptStorageAccountNameNotAvailable);
                }
                else {
                    outputChannel.appendLine('Storage account name "' + state.selectedStorageAccount + '" is available.');
                    resolve();
                }
            });
    });
};

// check the key vault name is available
exports.ifKeyVaultNameIsAvailable = function ifKeyVaultNameIsAvailable(state) {
    var promptKeyVaultNameNotAvailable = 'That key vault name is not available';
    return new Promise(function (resolve, reject) {
        outputChannel.appendLine('Checking to see if Key Vault name "' + state.keyVaultName + '" is available.');
        azure
            .checkKeyVaultNameAvailability(state)
            .then(function (result) {
                if (!result) {
                    outputChannel.appendLine(promptKeyVaultNameNotAvailable);
                    reject(promptKeyVaultNameNotAvailable);
                }
                else {
                    outputChannel.appendLine('The key vault name is available.');
                    resolve();
                }
            });
    });
}

// check the batch account name is available
exports.ifBatchAccountNameIsAvailable = function ifBatchAccountNameIsAvailable(state) {
    var promptBatchAccountNameNotAvailable = 'The batch account name is not available.';
    return new Promise(function (resolve, reject) {
        outputChannel.appendLine('Checking Batch account name availability...');
        azure
            .checkBatchAccountNameAvailability(state)
            .then(function (result) {
                if (!result) {
                    outputChannel.appendLine(promptBatchAccountNameNotAvailable);
                    reject(promptBatchAccountNameNotAvailable);
                }
                else {
                    outputChannel.appendLine('Batch account name ' + state.batchAccountName + ' is available.');
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
        outputChannel.appendLine(statusGettingResources);
        azure
            .getFullResourceList(state)
            .then(function (names) {
                statusBar.dispose();
                outputChannel.appendLine('Azure resources obtained.');
                resolve(names);
            })
            .catch(function (err) {
                outputChannel.appendLine('Error while getting Azure resource list:');
                outputChannel.appendLine(err);
                reject(err);
            });
    }));
};

// creates a new key vault
exports.createKeyVault = function createKeyVault(state, callback) {
    var statusCreatingKeyVault = 'Creating key vault "{0}"',
        statusCreatedKeyVault = 'Key vault "{0}" created successfully';

    vscode.window.setStatusBarMessage(statusCreatingKeyVault.replace('{0}', state.keyVaultName));
    outputChannel.appendLine(statusCreatingKeyVault.replace('{0}', state.keyVaultName));

    azure
        .createNewKeyVault(state)
        .then(function (result) {
            outputChannel.appendLine(statusCreatedKeyVault.replace('{0}', state.keyVaultName));
            vscode.window.setStatusBarMessage(statusCreatedKeyVault.replace('{0}', state.keyVaultName));
            if (callback)
                callback();
        })
        .catch(function (err) {
            outputChannel.appendLine('Error during key vault creation:');
            outputChannel.appendLine(err);
            vscode.window.showErrorMessage(err);
        });
}

exports.createBatchAccount = function createBatchAccount(state, callback) {
    var statusCreatingBatchAccount = 'Creating batch account {0}',
        statusCreatedBatchAccount = 'Batch account {0} created successfully';

    vscode.window.setStatusBarMessage(statusCreatingBatchAccount.replace('{0}', state.batchAccountName));
    outputChannel.appendLine(statusCreatingBatchAccount.replace('{0}', state.batchAccountName));
    azure
        .createNewBatchAccount(state)
        .then(function (result) {
            outputChannel.appendLine(statusCreatedBatchAccount.replace('{0}', state.batchAccountName));
            vscode.window.setStatusBarMessage(statusCreatedBatchAccount.replace('{0}', state.batchAccountName));
            if (callback)
                callback();
        })
        .catch(function (err) {
            outputChannel.appendLine('Error during Batch account creation:');
            outputChannel.appendLine(err);
            vscode.window.showErrorMessage(err);
        });
}

// method to create the resource group
exports.createResourceGroup = function createResourceGroup(state, callback) {
    var statusCreatingResourceGroup = 'Creating resource group "{0}"',
        statusCreatedResourceGroup = 'Resource group "{0}" created successfully';

    vscode.window.setStatusBarMessage(statusCreatingResourceGroup.replace('{0}', state.resourceGroupToUse));
    outputChannel.appendLine(statusCreatingResourceGroup.replace('{0}', state.resourceGroupToUse));

    azure
        .createNewResourceGroup(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(statusCreatedResourceGroup.replace('{0}', state.resourceGroupToUse));
            outputChannel.appendLine(statusCreatedResourceGroup.replace('{0}', state.resourceGroupToUse));
            if (callback)
                callback();
        })
        .catch(function (err) {
            outputChannel.appendLine('Error during resource group creation:');
            outputChannel.appendLine(err);
            vscode.window.showErrorMessage(err);
        });
}

// create the server farm
exports.createServerFarm = function createServerFarm(state, callback) {
    var statusCreatingServerFarm = 'Creating server farm {0}',
        statusCreatedServerFarm = 'Created server farm {0}';

    vscode.window.setStatusBarMessage(statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));
    outputChannel.appendLine(statusCreatingServerFarm.replace('{0}', state.selectedServerFarm));

    azure
        .createNewServerFarm(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(statusCreatedServerFarm.replace('{0}', state.selectedServerFarm));
            outputChannel.appendLine(statusCreatedServerFarm.replace('{0}', state.selectedServerFarm));
            if (callback)
                callback();
        })
        .catch(function (err) {
            outputChannel.appendLine('Error during server farm creation:');
            outputChannel.appendLine(err);
            vscode.window.showErrorMessage(err);
        });
}

// creates the web app based on the state persisted up to this point
exports.createWebApp = function createWebApp(state, callback) {
    var promptWebAppCreationInProcess = 'Creating Web App "{0}"...',
        promptWebAppCreated = 'Created Web App "{0}". Use "azure browse resource in portal" to open it up in the Azure portal.';

    vscode.window.setStatusBarMessage(promptWebAppCreationInProcess.replace('{0}', state.newWebAppName));

    outputChannel.appendLine(promptWebAppCreationInProcess.replace('{0}', state.newWebAppName));

    azure
        .createWebApp(state)
        .then(function (result) {
            outputChannel.appendLine(promptWebAppCreated.replace('{0}', state.newWebAppName));
            vscode.window.setStatusBarMessage(promptWebAppCreated.replace('{0}', state.newWebAppName));
            if (callback)
                callback();
        })
        .catch(function (err) {
            outputChannel.appendLine('Error during Web App creation');
            outputChannel.appendLine(err);
            vscode.window.showErrorMessage(err);
        });
}

// creates the function app based on the state persisted up to this point
exports.createFunction = function createFunction(state, callback) {
    var promptFunctionAppCreationInProcess = 'Creating Function App "{0}"...',
        promptFunctionAppCreated = 'Created Function App "{0}". Use "azure browse resource in portal" to open it up in the Azure portal.';

    vscode.window.setStatusBarMessage(promptFunctionAppCreationInProcess.replace('{0}', state.newWebAppName));
    outputChannel.appendLine(promptFunctionAppCreationInProcess.replace('{0}', state.newWebAppName));

    azure
        .createFunction(state)
        .then(function (result) {
            vscode.window.setStatusBarMessage(promptFunctionAppCreated.replace('{0}', state.newWebAppName));
            outputChannel.appendLine(promptFunctionAppCreated.replace('{0}', state.newWebAppName));
            if (callback)
                callback();
        })
        .catch(function (err) {
            outputChannel.appendLine('Error during function creation:');
            outputChannel.appendLine(err);
            vscode.window.showErrorMessage(err);
        });
}

// gets all the hosting plans
exports.getServerFarms = function getServerFarms(state) {
    var statusGettingFarms = 'Geting your list of server farms...';
    return new Promise(function (resolve, reject) {
        state.serverFarmList = [];
        var statusBar = vscode.window.setStatusBarMessage(statusGettingFarms);
        outputChannel.appendLine(statusGettingFarms);
        azure
            .getServerFarms(state)
            .then(function (result) {
                statusBar.dispose();
                if (result.length == 0) {
                    outputChannel.appendLine('No server farms found.');
                    resolve();
                }
                else {
                    outputChannel.appendLine('Found ' + result.length + ' server farms.');
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
        outputChannel.appendLine('Getting storage account list');
        azure
            .getStorageAccounts(state)
            .then(function (result) {
                if (result.length === 0) {
                    outputChannel.appendLine(promptNoStorageAccount);
                    vscode.window.showErrorMessage(promptNoStorageAccount);
                }
                else {
                    outputChannel.appendLine('Found ' + result.length + ' storage accounts.');
                    result.forEach((item, index, arr) => {
                        state.storageAccountList.push(item);
                        if (index === arr.length - 1)
                            resolve();
                    });
                }
            })
            .catch(function (err) {
                outputChannel.appendLine('Error during storage account retrieval:');
                outputChannel.appendLine(err);
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
        outputChannel.appendLine('Creating storage account ' + state.selectedStorageAccount);
        azure
            .createStorageAccount(state)
            .then((result) => {
                outputChannel.appendLine(statusCreatedStorageAccount.replace('{0}', state.selectedStorageAccount));
                vscode.window.setStatusBarMessage(statusCreatedStorageAccount.replace('{0}', state.selectedStorageAccount));
                resolve(result);
            })
            .catch(function (err) {
                outputChannel.appendLine('Error during storage account creation:');
                outputChannel.appendLine(err);
                vscode.window.showErrorMessage(err);
                reject(err);
            });
    });
}

// list storage account keys
exports.getStorageAccountKeys = function getStorageAccountKeys(state) {
    return new Promise(function (resolve, reject) {
        outputChannel.appendLine('Getting storage account keys...');
        azure
            .getStorageAccountKeys(state)
            .then(function (result) {
                if (result.keys.length == 0) {
                    outputChannel.appendLine('No keys found.');
                    reject();
                }
                else {
                    state.storageAccountKeyList = [];

                    if (result.keys.length != 0) {
                        outputChannel.appendLine(result.keys.length + ' keys found.');
                        resolve();
                    }
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

exports.getRegions = function getRegions(state) {
    return new Promise(function (resolve, reject) {
        azure
            .getRegions(state)
            .then(function (result) {
                state.regions = result;
                if (!state.selectedRegion) {
                    state.selectedRegion = state.regions[0].displayName;
                    outputChannel.appendLine(state.selectedRegion + ' was auto-selected as the active region.');
                }
                resolve();
            })
            .catch(function (err) {
                vscode.window.showErrorMessage(err);
            });
    });
};

exports.getRegionsForResource = function getRegionsForResource(state, resourceProvider, resourceType) {
    return new Promise(function (resolve, reject) {
        outputChannel.appendLine('Getting regions that support resource type ' + resourceType + '.');
        azure
            .getRegionsForResource(state, resourceProvider, resourceType)
            .then(function (result) {
                outputChannel.appendLine('Supported regions retrieved.');
                resolve(result);
            })
            .catch(function (err) {
                outputChannel.appendLine('Error during region retrieval:');
                outputChannel.appendLine(err);
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

        if (callback)
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
        menu.updateButtonTooltip('azure.region-select', btnRegionSelectionLabel + '('
            + statusRegionSelected.replace('{0}', state.selectedRegion) + ')');
        outputChannel.appendLine(statusRegionSelected.replace('{0}', state.selectedRegion));
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
                menu.updateButtonTooltip('selectStorageAccount', btnStorageSelectionLabel + '('
                    + statusStorageAccountSelected.replace('{0}', state.selectedStorageAccount) + ')');
                resolve(selected);
            }
        });
    });
};

exports.showSubscriptionStatusBarButton = function showSubscriptionStatusBarButton() {
    menu.showButton('azure.subscription-select', '$(cloud-upload)', 'Select the active Azure subscription');
};

exports.showSelectRegionStatusBarButton = function showSelectRegionStatusBarButton() {
    menu.showButton('azure.region-select', '$(globe)', 'Select your desired Azure region');
};