| Property  | Data Type  | Required  | Required Properties | Accepted Value |
|---|---|---|---|---|
| workflowApiVersion  | String  | **TRUE**  | N/A | "1.1" |
| metaData  | Object  | **TRUE**  | "icon", "iconSmall" | N/A |
| metaData.icon  | String  | **TRUE**  | N/A | Relative or Absolute HTTPS URLs |
| metaData.iconSmall  | String  | **TRUE**  | N/A | Relative or Absolute HTTPS URLs |
| metaData.category  | String  | FALSE | N/A | "message", "customer", "flow", "custom" |
| type  | String  | **TRUE**  | N/A | "REST" |
| lang  | Object  | **TRUE**  | Salesforce Supported Culture Code("en-US", "fr-FR", etc.) | N/A |
| lang.CULTURE_CODE  | Object  | **TRUE**  | "name" | N/A |
| lang.CULTURE_CODE.name  | String  | **TRUE**  | N/A | Name of activity |
| lang.CULTURE_CODE.description  | String  | FALSE  | N/A | Activity Description |
| arguments  | Object  | **TRUE**  | "execute" | N/A |
| arguments.execute  | Object  | **TRUE**  | "inArguments", "outArguments", "url", "useJwt" | N/A |
| arguments.execute.inArguments  | Array  | **TRUE**  | N/A | Arguments |
| arguments.execute.outArguments  | Array  | **TRUE**  | N/A | Arguments |
| arguments.execute.url  | String  | **TRUE**  | N/A | This URL must always be HTTPS and must be absolute. |
| arguments.execute.useJwt  | Boolean  | FALSE  | N/A | N/A |
| configurationArguments  | Object  | **TRUE**  | "applicationExtensionKey", "save", "publish", "validate" | N/A |
| configurationArguments.applicationExtensionKey  | String  | **TRUE**  | N/A | Key specified in App Center |
| configurationArguments.save | Object  | **TRUE**  | "url" | N/A |
| configurationArguments.save.url | String  | **TRUE**  | N/A | This URL must always be HTTPS and must be absolute. |
| configurationArguments.publish | Object  | **TRUE**  | "url" | N/A |
| configurationArguments.publish.url | String  | **TRUE**  | N/A | This URL must always be HTTPS and must be absolute. |
| configurationArguments.validate | Object  | **TRUE**  | "url" | N/A |
| configurationArguments.validate.url | String  | **TRUE**  | N/A | This URL must always be HTTPS and must be absolute. |
| userInterfaces  | Object  | **TRUE**  | "configModal" | N/A |
| userInterfaces.configModal  | Object  | **TRUE**  | N/A | N/A |
| userInterfaces.configModal.height  | int  | FALSE  | N/A | height in pixels |
| userInterfaces.configModal.width  | int  | FALSE  | N/A | width in pixels |
| userInterfaces.configModal.fullscreen  | Boolean  | FALSE  | N/A | Overrides height/width |
| wizardSteps  | Array  | FALSE  | Object | N/A |
```
{
   "workflowApiVersion": "1.1",
   "metaData": {
      "icon": "images/sms.png",
      "iconSmall": "images/smsSmall.png",
      "category": "message"
   },
   "type": "REST",
   "lang": {
      "en-US": {
         "name": "REST Activity (Workflow API v1.1)",
         "description": "An example REST activity using workflow API v1.1 format."
      }
   },
   "arguments": {
      "execute": {
         "inArguments": [],
         "outArguments": [],
         "url": "URI/for/your/activity/execute"
      }
   },
   "configurationArguments": {
      "applicationExtensionKey": "key-from-app-center",
      "save": {
         "url": "URI/for/your/activity/save"
      },
      "publish": {
         "url": "URI/for/your/activity/publish"
      },
      "validate": {
         "url": "URI/for/your/activity/validate"
      }
   },
   "wizardSteps": [
      { "label": "Step 1", "key": "step1" },
      { "label": "Step 2", "key": "step2", "active": false }
   ],
   "userInterfaces": {
      "configModal": {
         "height": 200,
         "width": 300,
         "fullscreen": true
      }
   }

}
```
[Code@ Reference](http://code.exacttarget.com/app-development/journey-builder-development/platform/example-rest-activity.html)

The config.json file is not static. It is generated for GET requests to /rest-activity/config.json in the routes/activityBackend.js file.
