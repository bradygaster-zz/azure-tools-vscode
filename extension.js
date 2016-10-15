// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');

// import the azure node.js sdk
var msRestAzure = require('ms-rest-azure');

// import the open package
var open = require('open');
var getUrls = require('get-urls');

// copy-paste support
var cp = require('copy-paste');

// constants used in the extension
// message contains: To sign in, use a web browser to open the page https://aka.ms/devicelogin. Enter the code BKRUX7KTS to authenticate.
var constants = {
    loginButtonLabel: 'Sign In',
    enterCodeString: 'Enter the code ',
    authString: ' to authenticate.',
    signInMessage: 'The code {0} has been copied to your clipboard. Click Sign In and paste in the code to authenticate.'
};

// handle the interactive user login message result
var options = {};
options.userCodeResponseLogger = function (message) {
    // extract the code to be copied to the clipboard from the message
    var codeCopied = message.substring(message.indexOf(constants.enterCodeString) + constants.enterCodeString.length).replace(constants.authString,'');
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
    var azureCommand = vscode.commands.registerCommand('azure.logintoazure', function () {
        msRestAzure.interactiveLogin(options, function (err, credentials, subsciptions) {
            credentials.retrieveTokenFromCache(function (notUsed, tokenType, accessToken) {
                vscode.window.showInformationMessage("logged in with " + accessToken);
            });
        });
    });

    context.subscriptions.push(azureCommand);

}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {
}

// handle deactivate
exports.deactivate = deactivate;