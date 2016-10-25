var vscode = require('vscode');

exports.showSubscriptionStatusBarButton = function showSubscriptionStatusBarButton() {
    var customStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
    customStatusBarItem.color = 'white';
    customStatusBarItem.command = 'selectsubscription';
    customStatusBarItem.text = '$(cloud-upload)';
    customStatusBarItem.tooltip = 'Select the active Azure subscription';
    customStatusBarItem.show();
};