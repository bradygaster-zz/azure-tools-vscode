var msRestAzure = require('ms-rest-azure');
var cp = require('copy-paste');
var open = require('open');
var getUrls = require('get-urls');
var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var appEvents = require('../appEvents');
var telemetry = require('../telemetry').createClient();
var outputChannel = require('../outputChannel').createChannel();

var commandName = 'azure.login';
var loginButtonLabel = 'Sign In',
    enterCodeString = 'enter the code ',
    authString = ' to authenticate.',
    signInMessage = 'The code {0} has been copied to your clipboard. Click Sign In and paste in the code to authenticate.',
    loggedInMessage = 'You have been logged in. Use the \'azure subscription list\' command to select your desired subscription.',
    promptNoSubscriptionsOrMisconfigured = 'No Azure subscriptions found (are you missing the "azure.tenantId" setting?).',
    statusLoggedInAndSubscriptionSelected = 'Logged into Azure and subscription "{0}" selected. Use "azure subscription list" to change subscription.',
    statusGettingSubscriptions = 'Logging into Azure and getting your list of subscriptions...';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand(commandName, function () {
        vscode.window.setStatusBarMessage(statusGettingSubscriptions);

        appEvents.on('loggedIn', (state) => {
            console.log('logged in');
        });

        telemetry.recordEvent('Azure.Login.Begin');

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
            var codeCopied = message.substring(message.indexOf(enterCodeString)
                + enterCodeString.length).replace(authString, '');
            cp.copy(codeCopied);

            // show the user the friendly message
            vscode.window.showInformationMessage(
                signInMessage.replace('{0}', codeCopied), {
                    title: loginButtonLabel
                }).then(function (btn) {
                    if (btn && btn.title == loginButtonLabel) {
                        open(getUrls(message)[0]);
                    }
                });
        }

        msRestAzure.interactiveLogin(options, function (err, credentials, subscriptions) {
            state.credentials = credentials;
            state.subscriptions = subscriptions;

            if (state.subscriptions && state.subscriptions.length > 0) {
                ux.showSubscriptionStatusBarButton();
                ux.showSelectRegionStatusBarButton();

                state.subscriptionIds = [];
                state.subscriptionNames = [];

                for (var i = 0; i < state.subscriptions.length; i++) {
                    state.subscriptionIds.push(state.subscriptions[i].id);
                    state.subscriptionNames.push(state.subscriptions[i].name + ' (' + state.subscriptions[i].id + ')');
                }

                credentials.retrieveTokenFromCache(function (notUsed, tokenType, accessToken) {
                    state.selectedSubscriptionId = state.subscriptions[0].id;
                    state.accessToken = accessToken;
                    vscode.window.showInformationMessage(loggedInMessage);
                    vscode.window.setStatusBarMessage(
                        statusLoggedInAndSubscriptionSelected.replace('{0}', state.subscriptions[0].name));
                    appEvents.emit('loggedIn', state);

                    telemetry.recordEvent('Azure.Login.Success', {
                        subscriptionCount: state.subscriptions.length,
                        subscriptionId: state.selectedSubscriptionId
                    })
                });

                outputChannel.appendLine('Getting the worldwide data center list.');

                ux.getRegions(state)
                    .then(() => {
                        outputChannel.appendLine('Data center list retrieved.');
                    })
                    .catch(() => {
                        outputChannel.appendLine('Error retrieving data center list.');
                    });
            }
            else {
                vscode.window.showErrorMessage(promptNoSubscriptionsOrMisconfigured);

                telemetry.recordEvent('Azure.Login.NoSubscriptions');
            }
        });
    });
};