# Contributing Guidelines

Welcome fellow contributor. We're ecstatic that you find our project interesting and that you wish to contribute and make this open source extension even better.
We've added some guideliness to help you in your quest. Please read and feel free to reach out if you have any questions.

## Guidelines
1. Please adhere to the coding style and format
2. Make sure you raise an issue before embarking in any code changes
3. Raise an issue on GitHub to initiate the conversation and use it as a point of reference
4. Let us know if you have any questions or you're unsure of something
5. Please fork the project and create a new branch to commit your work
6. DO NOT push to master. If you don't know what this means, refresh your memory [here](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell) 
7. We use [App Insights](https://azure.microsoft.com/en-us/services/application-insights/) to track telemetry and ask that you make use of the `telemetry` module to capture telemetry on features you add. 

## Setting up the project locally
1. Ensure you have Node.js installed. Get it [here](https://nodejs.org/en/)
2. Ensure you have Visual Studio Code installed. Get it [here](https://code.visualstudio.com/Download)
3. Ensure you have Git installed. Get it [here](https://git-scm.com/download)
4. Open the command line of your choice and navigate to the root of the project folder
5. Run `npm install` to install the npm packages necessary to run the project
6. Install the `Azure Function Tools` extension for VS Code as we now have a dependency on this, since version 1.2.3
7. Edit the `constants.js` file and provide your own Instrumentation Key to use during development so you can see how your telemetry is coming in. Prior to being deployed to the marketplace, I'll update this to be the production key. 

## Testing your code changes
At the moment we don't have automated tests. Trust us, we're working on it. However, you're more than welcome to contribute if you've got time or feel you're up to the task. To test your code changes, launch the debugger from within VS Code. This will launch a separate instance of VS Code with the extension already installed. Step through the code as you would do norrmally.

## Ready to merge
Once you're happy with your changes and you've made sure they work and have no bugs (unit tests would help in this case), please commit your changes with a reference to the GitHub issue you raised. Push to your remote and raise a Pull Request. I hope you remembered to do all this work on your branch! If not, no biggie. Just create a branch on the fly and make sure you raise the PR accordingly.

## We're here to assist
We appreciate you talking time to help us out. We're a helpful bunch of developers and hobbyists so if you have any questions or need help with your code, please feel free to reach out to us. We will do our best to help. Please note that this is a side project and not our full time job, so response times may vary :)
