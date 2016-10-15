// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// import the azure node.js sdk
var msRestAzure = require('ms-rest-azure');

// misc packages
var open = require('open');
var getUrls = require('get-urls');
var cp = require('copy-paste');

// constants used in the extension
// message contains: To sign in, use a web browser to open the page https://aka.ms/devicelogin. Enter the code BKRUX7KTS to authenticate.
var constants = {
    loginButtonLabel: 'Sign In',
    enterCodeString: 'Enter the code ',
    authString: ' to authenticate.',
    signInMessage: 'The code {0} has been copied to your clipboard. Click Sign In and paste in the code to authenticate.',
    loggedInMessage: 'You have been logged in. Use the \'azure subscription list\' command to select your desired subscription.',
    statusGettingSubscriptions: 'Logging into Azure and getting your list of subscriptions.',
    statusLoggedInAndSubscriptionSelected: 'Logged into Azure and subscription "{0}" selected. Use "azure subscription list" to change subscription.',
    statusSubscriptionSelected: 'You selected subscription "{0}".',
    accessToken: null,
    subscriptions: null,
    subscriptionIds: [],
    subscriptionNames: [],
    selectedSubscriptionId: null
};

// handle the interactive user login message result
var options = {};
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('ACTIVATION: "azuretoolsforvscode"');

    // the command to login to azure 
    var loginToAzureCommand = vscode.commands.registerCommand('azure.logintoazure', function () {
        vscode.window.setStatusBarMessage(constants.statusGettingSubscriptions);

        msRestAzure.interactiveLogin(options, function (err, credentials, subsciptions) {
            // remember the subscriptions
            constants.subscriptions = subsciptions;
            for (var i = 0; i < constants.subscriptions.length; i++) {
                constants.subscriptionIds.push(constants.subscriptions[i].id);
                constants.subscriptionNames.push(constants.subscriptions[i].name);
            }

            credentials.retrieveTokenFromCache(function (notUsed, tokenType, accessToken) {
                constants.selectedSubscriptionId = constants.subscriptions[0].id;
                constants.accessToken = accessToken;
                vscode.window.showInformationMessage(constants.loggedInMessage);
                vscode.window.setStatusBarMessage(constants.statusLoggedInAndSubscriptionSelected.replace('{0}', constants.subscriptions[0].name));
            });
        });
    });

    // shows the user a list of subscriptions
    var selectSubscriptionCommand = vscode.commands.registerCommand('azure.selectsubscription', function () {
        // when the user selects a subscription remember the selected subscription id
        vscode.window.showQuickPick(constants.subscriptionNames).then(selected => {
            constants.subscriptions.forEach(function (element, index, array) {
                if (element.name == selected) {
                    constants.selectedSubscriptionId = element.id;
                    vscode.window.setStatusBarMessage(constants.statusSubscriptionSelected.replace('{0}', element.name));
                }
            });
        });
    });

    context.subscriptions.push(loginToAzureCommand);
    context.subscriptions.push(selectSubscriptionCommand);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

// handle deactivate
exports.deactivate = deactivate;