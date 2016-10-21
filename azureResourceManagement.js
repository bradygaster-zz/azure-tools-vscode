var msRestAzure = require('ms-rest-azure');
var WebSiteManagement = require('azure-arm-website');
var ResourceManagement = require('azure-arm-resource');
var config = require('./config');
var constants = config.getConstants();

exports.createWebApp = function createWebApp(state) {
    return new Promise(function (resolve, reject) {
        var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);
        webSiteManagement.sites.createOrUpdateSite(state.resourceGroupToUse,
            state.newWebAppName,
            {
                location: constants.selectedRegion,
                serverFarmId: state.selectedServerFarm
            },
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

exports.createNewResourceGroup = function createNewResourceGroup(state) {
    return new Promise(function (resolve, reject) {
        var resourceClient = new ResourceManagement.ResourceManagementClient(state.credentials, state.selectedSubscriptionId);
        resourceClient.resourceGroups.createOrUpdate(state.resourceGroupToUse, {
            location: constants.selectedRegion // todo: enable user selection
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

exports.createNewServerFarm = function createNewServerFarm(state) {
    return new Promise(function (resolve, reject) {
        console.log('create new server farm ' + state.selectedServerFarm);
        var webSiteManagement = new WebSiteManagement(state.credentials, state.selectedSubscriptionId);
        var planParameters = {
            serverFarmWithRichSkuName: state.selectedServerFarm,
            location: constants.selectedRegion,
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