# REST Custom Activity with Data Binding
This custom activity is ready to be deployed to Heroku. It is a basic example on how to auto-configure
the event fields in a custom activity to be used as input paramters.
It also defines a "result" output parameters to be used in later activities within the same interaction.

It is a node application which serves the static files required to render the configuration UI of the application, and also
contains the backed endpoints (save, validate, publish, execute) with the skeleton for an actual implementation of the activity.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.exacttarget.com/rdenhaanalonso/jb-rest-activity)

(Note that the heroku button will not work in exacttarget repositories)

## Manual deployment
The manual deployment will be used when the source code of the application is not saved in a public github repository.
This sequence assumes you have git installed, a heroku account and the heroku toolbelt installed.

### Create the Heroku Application
1. Fork this repository (if you want to make changes) or just clone it in a folder in your local drive.
2. In a terminal, go to the project folder. Execute the following commands (replace *<my-app-name>* with your actual application name)
    ```
    $git clone https://github.exacttarget.com/rdenhaanalonso/jb-rest-activity <my-app-name>
    $cd *my-app-name*
    $heroku apps:create *my-app-name*
    $git push heroku master
    ```

3. If you are using your own fork, you can refresh the application at any time
    ```
    $git add .
    $git commit -m "*Your commit message*"
    $git push heroku master
    $git push origin master
    ```

### Define the application in AppCenter

1. Create a Marketing Cloud Extension
2. Create a Journey Builder Activity
    You must use the same value for the Application Key than the defined *my-app-name*, so it matches the heroku app name.
3. Configure the root http address of your heroku app https://*my-app-name*.herokuapp.com/rest-activity

### Configure the application variables in the Heroku dashboard

Add the following variables, taking the values from the appCenter where necessary

| Variable          | Description                                      | Example                                                   |
| ----------------- |--------------------------------------------------| ----------------------------------------------------------|
| JB_ACTIVITY_NAME  | Default name of the CA in the JB palette         | Custom Channel                                            |
| JB_APP_ID         | Installed Packages: Package ID                   | 83568899-07d9-4ec6-875d-13a8abcdabcd                      |
| JB_APP_SIGNATURE  | Installed Packages: JWT Signing Secret           | qlhznxasnxbmoj5mqhhh0csos2ba (...)                        |
| JB_ACTIVITY_KEY   | Installed Packages: Unique Key                   | 12345899-07d9-4ec6-875d-13a8ab123123                      |
| JB_CLIENT_ID      | Installed Packages: Client ID                    | xxvhxxxxti21gmd0lrxxxx                                    |
| JB_CLIENT_SECRET  | Installed Packages: Client Secret                | xyyyyyxxti21gyyyyyyxxx                                    |
| JB_AUTH_URL       | API Authentication URL                           | https://auth.exacttargetapis.com/v1/requestToken?legacy=1 |
| JB_JWT_ENABLED    | Use JWT encoding                                 | true                                                      |
| JB_TARGET_DE      | External Key of the Data Extension where the 'Execute' method will write a row for each contact reaching the custom activity | CustomActivityTarget                                      |
| JB_CA_BASE_URL    | Base URL where the app's backend is deployed     | https://myapp.herokuapp.com                        |

## Optional Variables

By default, the Custom activity will be configured to map the different REST endpoints to its own express server, but this behavior can be overriden by definining in Heroku one or many of the following variables. All these endpoints must be compatible with the payload that the custom activity will receive, and also must respond the expected payload.

| Variable          | Description                              | Example                                                            |
| ----------------- |------------------------------------------| -------------------------------------------------------------------|
| REST_EXECUTE      | Endpoint for the *execute* call.         | https://posttestserver.com/post.php?dir=rha_rest_activity_execute  |
| REST_SAVE         | Endpoint for the *save* call.            | https://posttestserver.com/post.php?dir=rha_rest_activity_save     |
| REST_VALIDATE     | Endpoint for the *validate* call.        | https://posttestserver.com/post.php?dir=rha_rest_activity_validate |
| REST_PUBLISH      | Endpoint for the *publish* call.         | https://posttestserver.com/post.php?dir=rha_rest_activity_publish  |
| REST_UNPUBLISH    | Endpoint for the *unpublish* call.       | https://posttestserver.com/post.php?dir=rha_rest_activity_unpublish  |


Variables can be created from the Heroku dashboard, or via toolbelt:

    ```
    $ heroku config:set JB_ACTIVITY_NAME="xxx" JB_APP_ID="xxx" JB_APP_SIGNATURE="xxx" JB_AUTH_URL="xxx" JB_CLIENT_ID="xxx" JB_CLIENT_SECRET="xxx" JB_ACTIVITY_KEY="xxx"
    $
    $ heroku config:set REST_EXECUTE="xxx" REST_SAVE="xxx" REST_VALIDATE="xxx" REST_PUBLISH="xxx"
    ```
