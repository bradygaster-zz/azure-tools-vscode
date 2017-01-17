var msRestAzure = require('ms-rest-azure');
var WebSiteManagement = require('azure-arm-website');
var KeyVaultManagement = require('azure-arm-keyvault');
var ResourceManagement = require('azure-arm-resource');
var StorageManagement = require('azure-arm-storage');
var DocumentDd = require('documentdb');
var SubscriptionClient = require('azure-arm-resource').SubscriptionClient;
var fs = require('fs');
var config = require('./config');
var constants = config.getConstants();

exports.deployTemplate = function deployTemplate(state) {
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
                    reject(err);
                } else {
                    resolve(constants.promptDeployingTemplateCompleted
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
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resourceGroups.createOrUpdate(state.resourceGroupToUse, {
            location: state.selectedRegion // todo: enable user selection
        }, function (err, result) {
            if (err != null) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
};

exports.createNewKeyVault = function createNewKeyVault(state) {
    return new Promise(function (resolve, reject) {
        var keyVaultClient = new KeyVaultManagement(state.credentials, state.selectedSubscriptionId);
        var keyVaultParameters  =  {
            location :  state.selectedRegion,
            properties :  {
                sku :  {
                    family :  'A',
                    name :  'standard'
                },
                accessPolicies :  [],
                enabledForDeployment :  false,
                tenantId: state.subscriptions.find(x => x.id === state.selectedSubscriptionId).tenantId
            },
            tags :  {}
        };
        keyVaultClient.vaults.createOrUpdate(state.resourceGroupToUse, state.keyVaultName, keyVaultParameters, null,
            function (err, result) {
                if (err != null)
                    reject(err);
                else {
                    resolve(result);
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
        webSiteManagement.serverFarms.createOrUpdateServerFarm(
            state.resourceGroupToUse,
            state.selectedServerFarm,
            planParameters,
            function (err, result) {
                if (err != null)
                    reject(err);
                else {
                    resolve(result);
                }
            }
        );
    });
};

exports.getServerFarms = function getServerFarms(state) {
    return new Promise(function (resolve, reject) {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resources.list({
            filter: "resourceType eq 'Microsoft.Web/serverfarms' and resourceGroup eq '" + state.resourceGroupToUse + "'"
        }, function (err, result) {
            if (err != null)
                reject(err);
            else {
                resolve(result);
            }
        });
    });
};

exports.getResourceGroups = function getResourceGroups(state) {
    return new Promise(function (resolve, reject) {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        state.resourceGroupList = [];
        resourceClient.resourceGroups.list(function (err, result) {
            if (err != null)
                reject(err);
            else {
                resolve(result);
            }
        })
    });
};

exports.checkSiteNameAvailability = function checkSiteNameAvailability(state) {
    return new Promise(function (resolve, reject) {
        var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);
        webSiteManagement.global.checkNameAvailability({
            name: state.newWebAppName,
            type: 'Microsoft.Web/sites'
        }, function (err, result) {
            if (err != null)
                reject(err);
            else {
                resolve(result);
            }
        });
    });
};

exports.checkKeyVaultNameAvailability = function checkKeyVaultNameAvailability(state) {
    return new Promise(function (resolve, reject) {
        var keyVaultManagement = new KeyVaultManagement(state.credentials, state.selectedSubscriptionId);
        keyVaultManagement.vaults.list(null,
            function (err, result) {
                if (err != null)
                    reject(err);
                else {
                    if (result.filter(e => e.name === state.keyVaultName).length > 0) {
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                }
            });
    });
};

exports.getFullResourceList = function getFullResourceList(state) {
    return new Promise(function (resolve, reject) {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resources.list(function (err, result) {
            if (err != null)
                reject(err);
            else {
                state.entireResourceList = result;
                names = state.entireResourceList.map(function (resource) {
                    return resource.id.replace('subscriptions/' + state.selectedSubscriptionId + '/resourceGroups/', '');
                });
                resolve(names);
            }
        });
    });
};

exports.getRegionsForResource = function getRegionsForResource(state, resourceProvider, resourceType) {
    return new Promise(function (resolve, reject) {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.providers.list(function (err, result) {
            if (err != null) {
                reject(err);
            }
            else {
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
        var storageClient = new StorageManagement(state.credentials, state.selectedSubscriptionId);
        storageClient.storageAccounts.list(function (err, result) {
            if (err) {
                reject(err);
            }
            else {
                resolve(result);
            }
        });
    });
};

exports.checkStorageAccountNameAvailability = (state) => {
    return new Promise((resolve, reject) => {
        var storageClient = new StorageManagement(state.credentials, state.selectedSubscriptionId);
        storageClient.storageAccounts.checkNameAvailability(
            state.selectedStorageAccount,
            (err, result) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
    })
};

exports.createStorageAccount = function createStorageAccount(state) {
    return new Promise((resolve, reject) => {
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
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });

    });
};

exports.getStorageAccountKeys = function getStorageAccountKeys(state) {
    return new Promise((resolve, reject) => {
        var storageClient = new StorageManagement(state.credentials, state.selectedSubscriptionId);
        storageClient.storageAccounts.listKeys(state.resourceGroupToUse, state.selectedStorageAccount, (err, result) => {
            if (err) {
                reject(err);
            }
            else {
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

        var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);
        webSiteManagement.sites.createOrUpdateSite(state.resourceGroupToUse,
            state.newWebAppName,
            config,
            function (err, result) {
                if (err != null) {
                    reject(err);
                }
                else {
                    resolve(result);
                }
            });
    });
};