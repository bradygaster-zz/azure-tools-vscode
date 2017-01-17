var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var constants = config.getConstants();

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('createFunction.simple', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: constants.promptCreateNewFunction
            }).then(function (newWebSiteName) {

                if (newWebSiteName == null) return;

                state.newWebAppName = newWebSiteName;
                state.selectedServerFarm = state.newWebAppName + 'ServerFarm';
                state.resourceGroupToUse = state.newWebAppName + 'Resources';

                ux.createResourceGroup(state,
                    function () {
                        ux.createServerFarm(state, function () {
                            ux.createFunction(state)
                        })
                    });
            });
        });
    });
};