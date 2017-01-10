var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var github = require('octonode');
var client = github.client();
var githubSearch = client.search();
var constants = config.getConstants();
var download = require('download-file');

exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('searchQuickStartsGallery', function () {
        vscode.window.showInputBox({
            prompt: constants.promptSearchArmGallery
        }).then(function (searchTerm) {

            if (!searchTerm) {
                vscode.showErrorMessage(constants.promptNoTemplateQueryProvided);
                return;
            }

            state.AzureGallerySearchTerm = searchTerm;

            githubSearch.code({
                q: state.AzureGallerySearchTerm + '+in:file+repo:azure/azure-quickstart-templates+language:json+filename:metadata',
                sort: 'created',
                order: 'asc'
            }, (err, results) => {
                state.AzureGalleryList = [];
                state.AzureGallerySearchResults = results.items;
                state.AzureGallerySearchResults.sort(dynamicSort('path'));

                state.AzureGallerySearchResults.forEach(function (result) {
                    state.AzureGalleryList.push(result.path.replace('/metadata.json', ''));
                });

                vscode.window.showQuickPick(state.AzureGalleryList)
                    .then((selectedItem) => {
                        var selectedTemplate = state.AzureGallerySearchResults.filter((itm) => {
                            return itm.path == selectedItem + '/metadata.json';
                        });

                        if (vscode.workspace.rootPath) {
                            if (selectedTemplate && selectedTemplate.length > 0) {
                                var options = {
                                    directory: vscode.workspace.rootPath + '/arm-templates/' + selectedItem,
                                    filename: selectedTemplate[0].name
                                };

                                var url = selectedTemplate[0].html_url;
                                url = url.replace('https://github.com/', 'https://raw.githubusercontent.com/').replace('blob/', '');

                                // download and open the templates
                                downloadTemplate(url, options)
                                    .then(() => {
                                        downloadTemplateParameters(url, options);
                                    });
                            }
                        }
                    });
            });

        });
    })
}

function downloadTemplate(url, options) {
    return new Promise((resolve, reject) => {
        download(url.replace('metadata.json', 'azuredeploy.json'), {
            directory: options.directory,
            filename: 'azuredeploy.json'
        }, function (err) {
            if (err) {
                vscode.window.showErrorMessage(constants.promptErrorDownloadingTemplate.replace('{0}', err));
                reject();
            }
            else {
                vscode.workspace.openTextDocument(options.directory + '/azuredeploy.json')
                    .then(doc => {
                        vscode.window.showTextDocument(doc);
                        resolve();
                    });
            }
        });
    });
}

function downloadTemplateParameters(url, options) {
    return new Promise((resolve, reject) => {
        download(url.replace('metadata.json', 'azuredeploy.parameters.json'), {
            directory: options.directory,
            filename: 'azuredeploy.parameters.json'
        }, function (err) {
            if (err) {
                vscode.window.showErrorMessage(constants.promptErrorDownloadingTemplate.replace('{0}', err));
                reject();
            }
            else {
                vscode.workspace.openTextDocument(options.directory + '/azuredeploy.parameters.json')
                    .then(prms => {
                        vscode.window.showTextDocument(prms);
                        resolve();
                    });
            }
        });
    });
}

function dynamicSort(property) {
    var sortOrder = 1;
    if (property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a, b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    }
}