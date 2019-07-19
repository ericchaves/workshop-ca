const express = require('express')
const router = express.Router({mergeParams: true})
const customActivityUseJWT = (process.env.JB_JWT_ENABLED === 'true')
const customActivityName = process.env.JB_ACTIVITY_NAME
const customActivityAppExtensionKey = process.env.JB_ACTIVITY_KEY
const customActivityType = process.env.JB_CA_TYPE || 'REST'
const customActivityTimeout = 30000

const httpExecute = process.env.REST_EXECUTE && process.env.REST_EXECUTE.length > 0 ? process.env.REST_EXECUTE : process.env.JB_CA_BASE_URL + "/rest-activity/execute"
const httpSave = process.env.REST_SAVE && process.env.REST_SAVE.length > 0 ? process.env.REST_SAVE : process.env.JB_CA_BASE_URL + "/rest-activity/save"
const httpPublish = process.env.REST_PUBLISH && process.env.REST_PUBLISH.length > 0 ? process.env.REST_PUBLISH : process.env.JB_CA_BASE_URL + "/rest-activity/publish"
const httpUnpublish = process.env.REST_UNPUBLISH && process.env.REST_UNPUBLISH.length > 0 ? process.env.REST_UNPUBLISH : process.env.JB_CA_BASE_URL + "/rest-activity/unpublish"
const httpValidate = process.env.REST_VALIDATE && process.env.REST_VALIDATE.length > 0 ? process.env.REST_VALIDATE : process.env.JB_CA_BASE_URL + "/rest-activity/validate"

var configJSON = {
	"workflowApiVersion": "1.1",
	"metaData": {
		"icon": "images/image.png",
		"iconSmall": "images/image.png"
	},
	"type": customActivityType,
	"lang": {
		"en-US": {
			"name": customActivityName,
			"description": ""
		}
	},
	"arguments": {
		"execute": {
			"inArguments": [],
			"outArguments": [{
				"result": ""
			}],
			"url": httpExecute,
			"useJwt": customActivityUseJWT
		}
	},
	"configurationArguments": {
		"applicationExtensionKey": customActivityAppExtensionKey,
		"save": {
			"url": httpSave,
			"verb": "POST",
			"useJwt": customActivityUseJWT,
			"format": "json",
			"timeout": customActivityTimeout
		},
		"publish": {
			"url": httpPublish,
			"verb": "POST",
			"useJwt": customActivityUseJWT,
			"format": "json",
			"timeout": customActivityTimeout
		},
		"unpublish": {
			"url": httpUnpublish,
			"verb": "POST",
			"useJwt": customActivityUseJWT,
			"format": "json",
			"timeout": customActivityTimeout
		},
		"validate": {
			"url": httpValidate,
			"verb": "POST",
			"useJwt": customActivityUseJWT,
			"timeout": customActivityTimeout
		}
	},
	"wizardSteps": [{
			"label": "Seleccion de Plantilla",
			"key": "step1"
		},
		{
			"label": "Visualizacion de Configuracion",
			"key": "step2",
			"active": false
		}
	],
	"userInterfaces": {
		"configModal": {
			"fullscreen": true
		},
		"runningModal": {
			"url": "runningModal.html"
		},
		"runningHover": {
			"url": "runningHover.html"
		}
	},
	"schema": {
		"arguments": {
			"execute": {
				"inArguments": [],
				"outArguments": []
			}
		}
	}/*,
	"outcomes": [
		{
			"arguments": {
				"branchResult": "OK",
				"someArgument": "1"
			},
			"metaData": {
				"label": "OK"
			}
		},
		{
			"arguments": {
				"branchResult": "KO",
				"someArgument": "2"
			},
			"metaData": {
				"label": "Error"
			}
		}
	]*/
}


// GET config.json: configuration file, generated with template
router.get('/config.json', function (req, res) {
  console.log('GET /config.json')
  res.json(configJSON)
})

module.exports = router
