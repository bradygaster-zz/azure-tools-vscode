'option strict';

const vscode = require('vscode');

exports.getConstants = function getConstants() {
    return {
        btnRegionSelectionLabel: 'Select your desired Azure region. ',
        loginButtonLabel: 'Sign In',
        enterCodeString: 'Enter the code ',
        authString: ' to authenticate.',
        signInMessage: 'The code {0} has been copied to your clipboard. Click Sign In and paste in the code to authenticate.',
        loggedInMessage: 'You have been logged in. Use the \'azure subscription list\' command to select your desired subscription.',
        statusGettingSubscriptions: 'Logging into Azure and getting your list of subscriptions...',
        statusGettingRGs: 'Getting your list of resource groups...',
        statusGettingFarms: 'Geting your list of server farms...',
        statusGettingResources: 'Getting your list of resources',
        statusLoggedInAndSubscriptionSelected: 'Logged into Azure and subscription "{0}" selected. Use "azure subscription list" to change subscription.',
        statusSubscriptionSelected: 'You selected subscription "{0}".',
        statusCreatingResourceGroup: 'Creating resource group "{0}"',
        statusCreatedResourceGroup: 'Resource group "{0}" created successfully',
        statusCreatingServerFarm: 'Creating server farm {0}',
        statusCreatedServerFarm: 'Created server farm {0}',
        statusRegionSelected: '{0} region selected',
        promptNewWebAppName: 'Web App Name',
        promptNewRgName: 'New Resource Group Name:',
        promptWebSiteNameNotAvailable: 'That web app name is not available.',
        promptNewServerFarm: 'Server Farm Name',
        promptWebAppCreationInProcess: 'Creating Web App "{0}"...',
        promptWebAppCreated: 'Created Web App "{0}". Use "azure browse resource in portal" to open it up in the Azure portal.',
        promptWebAppCreationFailed: 'Failed to create web app. Reason: {0}',
        promptFunctionAppCreationInProcess: 'Creating Web App "{0}"...',
        promptFunctionAppCreated: 'Created Web App "{0}". Use "azure browse resource in portal" to open it up in the Azure portal.',
        promptFunctionAppCreationFailed: 'Failed to create web app. Reason: {0}',
        promptNoFarmInResourceGroup: 'The resource group you selected doesn\'t have any server farms.',
        promptNoSubscriptionsOrMisconfigured: 'No Azure subscriptions found (are you missing the "azure.tenantId" setting?).',
        promptCreateNewFunction: 'Function App name:',
        btnLabelNewRg: 'New',
        btnLabelExistingRg: 'Existing',
        optionNewRg: 'Create new resource group',
        optionExistingRg: 'Use existing resource group',
        optionNewHostingPlan: 'Create a new server farm',
        optionUseExistingHostingPlan: 'Use an existing server farm'
    };
};

exports.getTenantId = function getTenantId() {
    var f = vscode.workspace.getConfiguration('azure');
    if (f != null) {
        if (f.tenantId != null)
            return f.tenantId;
    }
    return null;
};