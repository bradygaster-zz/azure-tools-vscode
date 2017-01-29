var msRestAzure = require('ms-rest-azure');
var WebSiteManagement = require('azure-arm-website');
var KeyVaultManagement = require('azure-arm-keyvault');
var ResourceManagement = require('azure-arm-resource');
var StorageManagement = require('azure-arm-storage');
var BatchManagement = require('azure-arm-batch');
var DocumentDd = require('documentdb');
var SubscriptionClient = require('azure-arm-resource').SubscriptionClient;
var fs = require('fs');
var telemetry = require('./telemetry').Telemetry;

exports.exportTemplate = function exportTemplate(state) {
    return new Promise((resolve, reject) => {
        telemetry.recordEvent('Azure.ExportTemplate.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });

        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resourceGroups.exportTemplate(state.resourceGroupToUse, {
            resources: ["*"],
            options: "IncludeParameterDefaultValue"
        }, (err, result, request, response) => {
            if (err) {
                telemetry.recordEvent('Azure.ExportTemplate.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });

                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.ExportTemplate.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });

                resolve(result);
            }
        });
    });
};

exports.deployTemplate = function deployTemplate(state) {
    var promptDeployingTemplateCompleted = 'Template {0} deployment to resource group {1} completed with status of {2}';

    return new Promise((resolve, reject) => {
        var resourceGroupName = state.resourceGroupToUse;
        var deploymentName = state.resourceGroupToUse + '-' + new Date().getTime();
        var templateFile = fs.readFileSync(state.SelectedTemplateFile);
        var templateParametersFile = fs.readFileSync(state.SelectedTemplateParametersFile);
        var template = JSON.parse(templateFile);
        var templateParameters = JSON.parse(templateParametersFile);

        // handle v2 version of parameters file that has $schema
        if (templateParameters.parameters)
            templateParameters = templateParameters.parameters;

        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);

        telemetry.recordEvent('Azure.DeployTemplate.Begin', {
            subscriptionId: state.selectedSubscriptionId,
            deploymentName: deploymentName
        });

        resourceClient.deployments.createOrUpdate(resourceGroupName,
            deploymentName,
            {
                properties: {
                    template: template,
                    parameters: templateParameters,
                    mode: 'Complete'
                }
            }, (err, result, request, response) => {
                if (err) {
                    telemetry.recordEvent('Azure.DeployTemplate.Error', {
                        subscriptionId: state.selectedSubscriptionId,
                        deploymentName: deploymentName
                    });

                    reject(err);
                } else {
                    telemetry.recordEvent('Azure.DeployTemplate.Success', {
                        subscriptionId: state.selectedSubscriptionId,
                        deploymentName: deploymentName
                    });

                    resolve(promptDeployingTemplateCompleted
                        .replace('{0}', state.selectedTemplateName)
                        .replace('{1}', state.resourceGroupToUse)
                        .replace('{2}', result.properties.provisioningState));
                }
            });
    });
};

exports.createWebApp = function createWebApp(state) {
    return createAppService(state);
};

exports.createFunction = function createFunction(state) {
    return createAppService(state, 'functionapp');
};

exports.createNewResourceGroup = function createNewResourceGroup(state) {
    return new Promise(function (resolve, reject) {
        telemetry.recordEvent('Azure.CreateResourceGroup.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });

        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resourceGroups.createOrUpdate(state.resourceGroupToUse, {
            location: state.selectedRegion // todo: enable user selection
        }, function (err, result) {
            if (err != null) {
                telemetry.recordEvent('Azure.CreateResourceGroup.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });

                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.CreateResourceGroup.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });

                resolve(result);
            }
        });
    });
};

exports.createNewKeyVault = function createNewKeyVault(state) {
    return new Promise(function (resolve, reject) {
        var keyVaultClient = new KeyVaultManagement(state.credentials, state.selectedSubscriptionId);
        var keyVaultParameters = {
            location : state.selectedRegion,
            properties : {
                sku : {
                    family : 'A',
                    name : 'standard'
                },
                accessPolicies : [],
                enabledForDeployment : false,
                tenantId: state.subscriptions.find(x => x.id === state.selectedSubscriptionId).tenantId
            },
            tags : {}
        };

        telemetry.recordEvent('Azure.CreateKeyVault.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });

        keyVaultClient.vaults.createOrUpdate(state.resourceGroupToUse, state.keyVaultName, keyVaultParameters, null,
            function (err, result) {
                if (err != null) {
                    telemetry.recordEvent('Azure.CreateKeyVault.Error', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    reject(err);
                }
                else {
                    telemetry.recordEvent('Azure.CreateKeyVault.Success', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    resolve(result);
                }
            });
    });
};

exports.createNewBatchAccount = function createNewBatchAccount(state) {
    return new Promise(function (resolve, reject) {
        var batchClient = new BatchManagement(state.credentials, state.selectedSubscriptionId);

        var batchAccountParameters = {
            location: state.selectedRegion,
            tags: {}
        }

        telemetry.recordEvent('Azure.CreateBatchAccount.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });

        batchClient.batchAccountOperations.create(state.resourceGroupToUse, state.batchAccountName, batchAccountParameters, null,
            function (err, result) {
                if (err !== null) {
                    telemetry.recordEvent('Azure.CreateBatchAccount.Error', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    reject(err);
                }
                else {
                    telemetry.recordEvent('Azure.CreateBatchAccount.Success', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    resolve(result);
                }
            });
    });
};

exports.checkBatchAccountNameAvailability = function checkBatchAccountNameAvailability(state) {
    return new Promise(function (resolve, reject) {
        telemetry.recordEvent('Azure.CheckBatchAccountName.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var batchClient = new BatchManagement(state.credentials, state.selectedSubscriptionId);
        batchClient.batchAccountOperations.get(state.resourceGroupToUse, state.batchAccountName, null,
            function (err, result) {
                if (err !== null) {
                    if (err.code === "ResourceNotFound") {
                        telemetry.recordEvent('Azure.CheckBatchAccountName.Success', {
                            subscriptionId: state.selectedSubscriptionId
                        });
                        resolve(true);
                    }
                    else {
                        telemetry.recordEvent('Azure.CheckBatchAccountName.Error', {
                            subscriptionId: state.selectedSubscriptionId
                        });
                        reject(err);
                    }
                }
                else {
                    telemetry.recordEvent('Azure.CheckBatchAccountName.Success', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    resolve(false);
                }
            });
    });
};

exports.createNewServerFarm = function createNewServerFarm(state) {
    return new Promise(function (resolve, reject) {
        var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);
        var planParameters = {
            serverFarmWithRichSkuName: state.selectedServerFarm,
            location: state.selectedRegion,
            sku: {
                name: 'F1',
                capacity: 1,
                tier: 'Free'
            }
        };

        telemetry.recordEvent('Azure.CreateServerFarm.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });

        webSiteManagement.serverFarms.createOrUpdateServerFarm(
            state.resourceGroupToUse,
            state.selectedServerFarm,
            planParameters,
            function (err, result) {
                if (err != null) {
                    telemetry.recordEvent('Azure.CreateServerFarm.Error', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    reject(err);
                }
                else {
                    telemetry.recordEvent('Azure.CreateServerFarm.Success', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    resolve(result);
                }
            }
        );
    });
};

exports.getServerFarms = function getServerFarms(state) {
    return new Promise(function (resolve, reject) {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        telemetry.recordEvent('Azure.GetServerFarms.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        resourceClient.resources.list({
            filter: "resourceType eq 'Microsoft.Web/serverfarms' and resourceGroup eq '" + state.resourceGroupToUse + "'"
        }, function (err, result) {
            if (err != null) {
                telemetry.recordEvent('Azure.GetServerFarms.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });
                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.GetServerFarms.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });
                resolve(result);
            }
        });
    });
};

exports.getResourceGroups = function getResourceGroups(state) {
    return new Promise(function (resolve, reject) {
        telemetry.recordEvent('Azure.GetResourceGroups.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        state.resourceGroupList = [];
        resourceClient.resourceGroups.list(function (err, result) {
            if (err != null) {
                telemetry.recordEvent('Azure.GetResourceGroups.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });
                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.GetResourceGroups.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });
                resolve(result);
            }
        })
    });
};

exports.checkSiteNameAvailability = function checkSiteNameAvailability(state) {
    return new Promise(function (resolve, reject) {
        telemetry.recordEvent('Azure.CheckSiteNameAvailability.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);
        webSiteManagement.global.checkNameAvailability({
            name: state.newWebAppName,
            type: 'Microsoft.Web/sites'
        }, function (err, result) {
            if (err != null) {
                telemetry.recordEvent('Azure.CheckSiteNameAvailability.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });
                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.CheckSiteNameAvailability.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });
                resolve(result);
            }
        });
    });
};

exports.checkKeyVaultNameAvailability = function checkKeyVaultNameAvailability(state) {
    return new Promise(function (resolve, reject) {
        var keyVaultManagement = new KeyVaultManagement(state.credentials, state.selectedSubscriptionId);
        telemetry.recordEvent('Azure.CheckKeyVaultName.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        keyVaultManagement.vaults.list(null,
            function (err, result) {
                if (err != null) {
                    telemetry.recordEvent('Azure.CheckKeyVaultName.Error', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    reject(err);
                }
                else {
                    if (result.filter(e => e.name === state.keyVaultName).length > 0) {
                        telemetry.recordEvent('Azure.CheckKeyVaultName.Error', {
                            subscriptionId: state.selectedSubscriptionId
                        });
                        resolve(false);
                    }
                    else {
                        telemetry.recordEvent('Azure.CheckKeyVaultName.Success', {
                            subscriptionId: state.selectedSubscriptionId
                        });
                        resolve(true);
                    }
                }
            });
    });
};

exports.getFullResourceList = function getFullResourceList(state) {
    return new Promise(function (resolve, reject) {
        telemetry.recordEvent('Azure.GetAllResources.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resources.list(function (err, result) {
            if (err != null) {
                telemetry.recordEvent('Azure.GetAllResources.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });
                reject(err);
            }
            else {
                state.entireResourceList = result;
                names = state.entireResourceList.map(function (resource) {
                    return resource.id.replace('subscriptions/' + state.selectedSubscriptionId + '/resourceGroups/', '');
                });
                telemetry.recordEvent('Azure.GetAllResources.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });
                resolve(names);
            }
        });
    });
};

exports.getRegionsForResource = function getRegionsForResource(state, resourceProvider, resourceType) {
    return new Promise(function (resolve, reject) {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        telemetry.recordEvent('Azure.GetRegionsForResource.Begin', {
            subscriptionId: state.selectedSubscriptionId,
            resourceProvider: resourceProvider
        });
        resourceClient.providers.list(function (err, result) {
            if (err != null) {
                telemetry.recordEvent('Azure.GetRegionsForResource.Error', {
                    subscriptionId: state.selectedSubscriptionId,
                    resourceProvider: resourceProvider
                });
                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.GetRegionsForResource.Success', {
                    subscriptionId: state.selectedSubscriptionId,
                    resourceProvider: resourceProvider
                });
                resolve(result);
            }
        })
    });

}

exports.getRegions = function getRegions(state) {
    return new Promise(function (resolve, reject) {
        var subscriptionClient = new SubscriptionClient(state.credentials);
        subscriptionClient.subscriptions.listLocations(state.selectedSubscriptionId, function (err, result) {
            if (err != null)
                reject(err);
            else {
                resolve(result);
            }
        });
    });
};

exports.getStorageAccounts = function getStorageAccounts(state) {
    return new Promise(function (resolve, reject) {
        telemetry.recordEvent('Azure.GetStorageAccounts.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var storageClient = new StorageManagement(state.credentials, state.selectedSubscriptionId);
        storageClient.storageAccounts.list(function (err, result) {
            if (err) {
                telemetry.recordEvent('Azure.GetStorageAccounts.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });
                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.GetStorageAccounts.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });
                resolve(result);
            }
        });
    });
};

exports.checkStorageAccountNameAvailability = (state) => {
    return new Promise((resolve, reject) => {
        telemetry.recordEvent('Azure.CheckStorageAccountNameAvailability.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var storageClient = new StorageManagement(state.credentials, state.selectedSubscriptionId);
        storageClient.storageAccounts.checkNameAvailability(
            state.selectedStorageAccount,
            (err, result) => {
                if (err) {
                    telemetry.recordEvent('Azure.CheckStorageAccountNameAvailability.Error', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    reject(err);
                }
                else {
                    telemetry.recordEvent('Azure.CheckStorageAccountNameAvailability.Success', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    resolve(result);
                }
            });
    })
};

exports.createStorageAccount = function createStorageAccount(state) {
    return new Promise((resolve, reject) => {
        telemetry.recordEvent('Azure.CreateStorageAccount.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var storageClient = new StorageManagement(state.credentials, state.selectedSubscriptionId);
        var createParameters = {
            location: state.selectedRegion,
            sku: {
                name: 'Standard_LRS'
            },
            kind: 'Storage'
        };

        storageClient.storageAccounts.create(
            state.resourceGroupToUse,
            state.selectedStorageAccount,
            createParameters,
            (err, result) => {
                if (err) {
                    telemetry.recordEvent('Azure.CreateStorageAccount.Error', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    reject(err);
                }
                else {
                    telemetry.recordEvent('Azure.CreateStorageAccount.Success', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    resolve(result);
                }
            });

    });
};

exports.getStorageAccountKeys = function getStorageAccountKeys(state) {
    return new Promise((resolve, reject) => {
        telemetry.recordEvent('Azure.GetStorageAccountKeys.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });
        var storageClient = new StorageManagement(state.credentials, state.selectedSubscriptionId);
        storageClient.storageAccounts.listKeys(state.resourceGroupToUse, state.selectedStorageAccount, (err, result) => {
            if (err) {
                telemetry.recordEvent('Azure.GetStorageAccountKeys.Error', {
                    subscriptionId: state.selectedSubscriptionId
                });
                reject(err);
            }
            else {
                telemetry.recordEvent('Azure.GetStorageAccountKeys.Success', {
                    subscriptionId: state.selectedSubscriptionId
                });
                resolve(result);
            }
        });
    });
};

function createAppService(state, kind) {
    return new Promise(function (resolve, reject) {
        var config = {
            location: state.selectedRegion,
            serverFarmId: state.selectedServerFarm
        };

        // doc: "kind" is how we determine what type of app service we're creating
        if (kind) {
            config.kind = kind;
        }

        telemetry.recordEvent('Azure.CreateAppService.Begin', {
            subscriptionId: state.selectedSubscriptionId
        });

        var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);
        webSiteManagement.sites.createOrUpdateSite(state.resourceGroupToUse,
            state.newWebAppName,
            config,
            function (err, result) {
                if (err != null) {
                    telemetry.recordEvent('Azure.CreateAppService.Error', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    reject(err);
                }
                else {
                    telemetry.recordEvent('Azure.CreateAppService.Success', {
                        subscriptionId: state.selectedSubscriptionId
                    });
                    resolve(result);
                }
            });
    });
};