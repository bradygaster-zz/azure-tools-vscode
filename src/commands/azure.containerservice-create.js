var vscode = require('vscode');
var ux = require('../ux');
var constants = require('../constants').Constants;

const provider = "Microsoft.ContainerService";
const resourceType = "containerServices";
const promptNewACS = 'New Container Service Name:';
const promptDNSName = 'Provide the DNS Name prefix for the cluster';
const promptUserame = 'Provide an Admin username for virtual machines';
const promptPassword = 'Provide an Admin password for login';
const promptSSHkey = 'Provide an SSH key for login. Your key should include three parts, for example `ssh-rsa AAAAB...snip...UcyupgH azureuser@linuxvm`';
const promptClientCount = 'Provide the agent pool count (1-100)';
const promptClientDNSName = 'Provide the DNS name prefix for the client cluster';


exports.createCommand = function createCommand(state) {
    vscode.commands.registerCommand('azure.containerservice-create', function () {
        ux.isLoggedIn(state).then(() => {
            vscode.window.showInputBox({
                prompt: promptNewACS
            })
            .then(function (newACSName) {
                if (!newACSName || newACSName === "") return;

                state.ACSName = newACSName;
                state.resourceGroupToUse = state.ACSName + 'Resources';

                ux.getRegionsForResource(state, provider, resourceType)
                    .then((result) => {
                        state.ACSRegions = result.filter(x =>
                            x.namespace === provider)[0].resourceTypes.filter(x =>
                                x.resourceType === resourceType)[0].locations;
                        ux.createNewResourceGroupMenu(state)
                            .then(() => {
                                ux.ifACSNameIsAvailable(state)
                                    .then(() => {
                                        vscode.window.showQuickPick(state.ACSRegions)
                                            .then(selectedRegion => {
                                                if (!selectedRegion || selectedRegion === "") return;
                                                state.selectedRegion = selectedRegion;

                                                 // Orchestrator Type [Kubernetes, DC/OS, Swarm]
                                                vscode.window.showQuickPick(constants.ACSOrchestratorOptions)
                                                .then(selectedOrchestrator => {
                                                    if(!selectedOrchestrator || selectedOrchestrator === "") return;
                                                    state.ACSParameters.orchestratorProfile = new Object();
                                                    state.ACSParameters.orchestratorProfile.orchestratorType = selectedOrchestrator;

                                                    // Master configuration
                                                    // 1. DNS Name
                                                    // 2. Master VM Count
                                                    vscode.window.showInputBox({
                                                        prompt: promptDNSName
                                                    }).then(function(DNSName) {
                                                        state.ACSParameters.masterProfile = new Object();
                                                        state.ACSParameters.masterProfile.dnsPrefix = DNSName;
                                                        vscode.window.showQuickPick(constants.ACSMasterVMCountOptions)
                                                        .then(selectedCount => {
                                                            if(!selectedCount || selectedCount === "") return;
                                                            state.ACSParameters.masterProfile.count = selectedCount;

                                                            // Agent Pool Profile
                                                            // 1. Cluster node count
                                                            // 2. DNS prefix for cluster
                                                            // 3. Cluster Node size (SKU)
                                                            // 4. Default - cluster name
                                                            vscode.window.showInputBox({
                                                                prompt: promptClientCount
                                                            }).then(function(count) {
                                                                state.ACSParameters.agentPoolProfiles = new Object();
                                                                state.ACSParameters.agentPoolProfiles.count = count;
                                                                vscode.window.showInputBox({
                                                                    prompt: promptClientDNSName
                                                                }).then(function(dnsprefix) {
                                                                    state.ACSParameters.agentPoolProfiles.dnsPrefix = dnsprefix;
                                                                    vscode.window.showQuickPick(constants.ACSClientSKUOptions)
                                                                    .then(selectedSize => {
                                                                        if(!selectedSize || selectedSize === "") return;
                                                                        state.ACSParameters.agentPoolProfiles.vmSize = selectedSize;
                                                                        state.ACSParameters.agentPoolProfiles.name = 'agentpools';

                                                                        // Client (Windows/Linux) Profile
                                                                        // 1. Admin username
                                                                        // 2. Array of ssh keys for login for linux / Password for Windows
                                                                        vscode.window.showQuickPick(constants.ACSClientVMOptions)
                                                                        .then(selectedOS => {
                                                                            if(!selectedOS || selectedOS === "") return;
                                                                            if(selectedOS === 'Windows'){
                                                                                vscode.window.showInputBox({
                                                                                    prompt: promptUserame
                                                                                }).then(function(username) {
                                                                                    state.ACSParameters.windowsProfile = new Object();
                                                                                    state.ACSParameters.windowsProfile.adminUsername = username;
                                                                                    vscode.window.showInputBox({
                                                                                        prompt: promptPassword
                                                                                    }).then(function(password) {
                                                                                        state.ACSParameters.windowsProfile.adminPassword = password;
                                                                                    });
                                                                                })
                                                                            }
                                                                            else{
                                                                                vscode.window.showInputBox({
                                                                                    prompt: promptUserame
                                                                                }).then(function(username) {
                                                                                    state.ACSParameters.linuxProfile = new Object();
                                                                                    state.ACSParameters.linuxProfile.adminUsername = username;
                                                                                    vscode.window.showInputBox({
                                                                                        prompt: promptSSHkey
                                                                                    }).then(function(SSHkey) {
                                                                                        state.ACSParameters.linuxProfile.ssh.publicKeys = [SSHkey];
                                                                                    });
                                                                                });
                                                                            }
                                                                            
                                                                            // now go and create the ACS service
                                                                            ux.createAzureContainerService(state);
                                                                        });
                                                                    });
                                                                });
                                                            });
                                                        });
                                                    });
                                                    
                                                });
                                            });
                                        })
                                    })
                                    .catch(function (error) {
                                        vscode.window.showErrorMessage(error);
                                    });
                            });
                    });
            });
        });
};