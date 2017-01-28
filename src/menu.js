var vscode = require('vscode');

class Menu {

    constructor() {
        this.buttons = [];
    }

    showButton(command, text, tooltip) {
        var customStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
        customStatusBarItem.color = 'white';
        customStatusBarItem.command = command;
        customStatusBarItem.text = text;
        customStatusBarItem.tooltip = tooltip;
        customStatusBarItem.show();
        this.buttons.push(customStatusBarItem);
    };

    updateButtonTooltip(command, tooltip) {
        var x = this.buttons.filter(function (f) {
            return f.command == command;
        });
        if (x != null && x.length > 0)
            x[0].tooltip = tooltip;
    };
}

exports.menu = new Menu();