var vscode = require('vscode');
var ux = require('../ux');
var config = require('../config');
var github = require('octonode');
var client = github.client();
var githubSearch = client.search();
var constants = config.getConstants();

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
                q: state.AzureGallerySearchTerm + ':file+repo:azure/azure-quickstart-templates+language:json',
                sort: 'created',
                order: 'asc'
            }, (err, results) => {
                state.AzureGalleryList = [];
                state.AzureGallerySearchResults = results.items;
                state.AzureGallerySearchResults.sort(dynamicSort('path'));
                state.AzureGallerySearchResults.forEach(function (result) {
                    state.AzureGalleryList.push(result.path);
                });
                vscode.window.showQuickPick(state.AzureGalleryList)
                    .then((selectedItem) => {
                        console.log(JSON.stringify(selectedItem));
                    });
            });

        }).catch(function (err) {

        });
    })
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