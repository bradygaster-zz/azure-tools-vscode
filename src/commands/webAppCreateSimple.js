var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('createwebapp.simple', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: constants.promptNewWebAppName
            }).then(function (newWebSiteName) {

                if (!newWebSiteName || newWebSiteName === "") return;

                state.newWebAppName = newWebSiteName;
                state.selectedServerFarm = state.newWebAppName + 'ServerFarm';
                state.resourceGroupToUse = state.newWebAppName + 'Resources';

                ux.createResourceGroup(state,
                    function () {
                        ux.createServerFarm(state, function () {
                            ux.createWebApp(state)
                        })
                    });
            }).catch((message) => {
                vscode.window.showErrorMessage(message);
            });
        });
    });
};