var msRestAzure = require('ms-rest-azure');
var cp = require('copy-paste');
var open = require('open');
var getUrls = require('get-urls');
var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();
var appEvents = require('../appEvents');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.login', function () {
        vscode.window.setStatusBarMessage(state.statusGettingSubscriptions);

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
            var codeCopied = message.substring(message.indexOf(constants.enterCodeString)
                + constants.enterCodeString.length).replace(constants.authString, '');
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

        msRestAzure.interactiveLogin(options, function (err, credentials, subscriptions) {
            state.credentials = credentials;
            state.subscriptions = subscriptions;

            if (state.subscriptions.length > 0) {
                ux.showSubscriptionStatusBarButton();
                ux.showSelectRegionStatusBarButton();

                for (var i = 0; i < state.subscriptions.length; i++) {
                    state.subscriptionIds.push(state.subscriptions[i].id);
                    state.subscriptionNames.push(state.subscriptions[i].name);
                }

                credentials.retrieveTokenFromCache(function (notUsed, tokenType, accessToken) {
                    state.selectedSubscriptionId = state.subscriptions[0].id;
                    state.accessToken = accessToken;
                    vscode.window.showInformationMessage(constants.loggedInMessage);
                    vscode.window.setStatusBarMessage(
                        constants.statusLoggedInAndSubscriptionSelected.replace('{0}', state.subscriptions[0].name));
                        appEvents.loggedIn(state);
                });

                ux.getRegions(state);
            }
            else {
                vscode.window.showErrorMessage(constants.promptNoSubscriptionsOrMisconfigured);
            }
        });
    });
};