var vscode = require('vscode');
var ux = require('../ux');

var promptNewFunctionAppName = 'Function App Name';

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.functionApp-create-simple', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: promptNewFunctionAppName
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