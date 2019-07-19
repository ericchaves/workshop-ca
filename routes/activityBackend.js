const express = require('express')
const router = express.Router({mergeParams: true})
const request = require('request');
const FuelRest = require('fuel-rest')
const jwt = require('jwt-simple')
const isJwtEnabled = (process.env.JB_JWT_ENABLED === 'true')
const jwtSignature = process.env.JB_APP_SIGNATURE

const sfmcSDKConfiguration = {
	auth: {
		clientId: process.env.JB_CLIENT_ID,
		clientSecret: process.env.JB_CLIENT_SECRET
	}
}

const sfmcSDK = new FuelRest(sfmcSDKConfiguration)

/**
 * Redirect to the index.html file
 */
router.get('/index.html', function (req, res) {
	res.redirect('https://' + req.hostname)
  }
)

/**
 * POST Handler for /save/ route of the Activity.
 */
router.post('/save', function (req, res) {
	console.log('>>> SAVE <<<');
	const body = isJwtEnabled ? jwt.decode(req.body.toString('utf8'), jwtSignature) : req.body
	console.log(body);
	res.json({result: 'ok'});
  }
)

/**
 * POST Handler for /validate/ route of the Activity.
 *
 * We use here SFMC SDK to validate that the current Journey's entry source matches the event
 * in all the InArguments node of the payload. This is to avoid issues with active journeys and
 * incorrect InArguments event mappings.
 */
router.post('/validate', function (req, res) {
	console.log('>>> VALIDATE <<<');
	const body = isJwtEnabled ? jwt.decode(req.body.toString('utf8'), jwtSignature) : req.body
	console.log(body);
	const requestOptionsGetJourney = {
		uri: '/interaction/v1/interactions/' + body.originalDefinitionId,
		json: true,
		headers: {}
	}

	// Use SFMC SDK to retrieve the full payload of the Journey
	sfmcSDK.get(requestOptionsGetJourney, (err, response) => {
		if (err) {
			// Unexpected errors (timeout, connection errors...) will fall here
			console.log('EXCEPTION POST /validate while getting interaction for validation', err)
			res.status(400).send({result: 'KO - Exception'})
		} else {
			// All HTTP responses (includin 2xx, 4xx, 5xx... will fall here)
			const jbActivities = response.body.activities
			// console.log(response.body.activities)
			// console.log('Current activityObjectID', body.activityObjectID)
			const jbActivity = jbActivities.find(activity => activity.id === body.activityObjectID)
			console.log('Activitiy', jbActivity)
			if (!jbActivity) {
				// If the activity is not found in the payload, return an error
				res.status(400).send({result: 'KO - Activity ID does not exist'})
			} else {
				// Validate that the Journey's EventDefinitionKey matches all the InArguments' expressions
				const jbTriggers = response.body.triggers
				const jbTrigger = jbTriggers[0]
				const jbTriggerEventDefinitionKey = jbTrigger.metaData.eventDefinitionKey
				const jbInArguments = jbActivity.arguments.execute.inArguments
				let isInvalid = false
				for (let oArg of jbInArguments) {
					let prop = Object.keys(oArg)[0]
					let propTokens = oArg[prop].split('.')
					if (propTokens.length > 1) {
						// For each inArgument, if the mapping is an 'Event' mapping, check the EventDefinitionKey
						if (propTokens[0] === '{{Event' && propTokens[1] !== jbTriggerEventDefinitionKey) {
							isInvalid = true
						}
					}
				}

				// If any of the inArguments is mapped with an incorrect EventDefinitionKey, return an error and abort Journey Activation
				if (isInvalid) {
					let resp = {
						"additionalInfo": {
							"activityId": jbActivity.id,
							"activityKey": jbActivity.key,
							"activityType": "REST"
						},
						"errorCode": "121043",
						"errorDetail": "Event has changed" // TODO: custom messages not working!
					}

					console.log('Error. EventDefinitionKey Validation Failed', resp)
					res.status(400).send(resp)
				} else {
					let resp = {
						"additionalInfo": {
							"activityId": jbActivity.id,
							"activityKey": jbActivity.key,
							"activityType": "REST"
						}
					}
					console.log('Valudation Success', resp)
					res.status(200).send(resp)
				}
			}
		}
	})
  }
)

/**
 * POST Handler for /publish/ route of the Activity.
 */
router.post('/publish', function (req, res) {
	console.log('>>> PUBLISH <<< jwt?', isJwtEnabled);
	const body = isJwtEnabled ? jwt.decode(req.body.toString('utf8'), jwtSignature) : req.body
	console.log(body);
	res.json({'result': 'OK'})
  }
)

/**
 * POST Handler for /execute/ route of the Activity.
 *
 * For each contact reaching the custom activity, this method will be triggered,
 * including in the received payload all the corresponding values for the mappings
 * defined in InArguments.
 *
 * Using SFMC SDK, we save in a data extension one row for each contact reaching the custom activity.
 */
router.post('/execute', function (req, res) {
	console.log('>>> EXECUTE - Payload from Journey Builder <<<');
	const body = isJwtEnabled ? jwt.decode(req.body.toString('utf8'), jwtSignature) : req.body
	console.log(body);
	/*
	1. Validar datos de entrada (inarguments)
	2. Llamada al web service que realiza la tarea
	3. Responder a JB el codigo apropiado (200 o 500) y con los outarguments definiidos
    */

	let result
	let oContactKey = body.inArguments.find(o => o.ContactKey !== undefined)
	let oFirstName = body.inArguments.find(o => o.FirstName !== undefined)
	let oLastName = body.inArguments.find(o => o.LastName !== undefined)
	let oMessage = body.inArguments.find(o => o.message !== undefined)

	result = Math.random()
	//1. Request a la API de Marketing Cloud usando la respuesta de la otra request (forex)
	const requestOptionsWriteDE = {
		uri: `/hub/v1/dataeventsasync/key:${process.env.JB_TARGET_DE}/rowset`,
		json: true,
		headers: {},
		body: [{
			keys: {
				keyValue: body.keyValue,
				activityInstanceId: body.activityInstanceId,
				timestamp: new Date().toISOString()
			},
			values: {
				definitionInstanceId: body.definitionInstanceId,
				activityId: body.activityId,
				journeyId: body.journeyId,
				activityObjectID: body.activityObjectID,
				inArguments_ContactKey: oContactKey ? oContactKey.ContactKey : '',
				inArguments_FirstName: oFirstName ? oFirstName.FirstName : '',
				inArguments_LastName: oLastName ? oLastName.LastName : '',
				inArguments_message: oMessage ? oMessage.message : '',
				outArguments_result: result,
				mode: body.mode
			}
		}]
	};

	console.log('>>> Payload formatted for API dataeventsasync <<<');
	console.log('Writing row...', requestOptionsWriteDE.body);
	sfmcSDK.post(requestOptionsWriteDE, (err, response) => {
		if (err) {
			console.log('EXCEPTION POST /execute while writting de', err)
			res.status(200).send({ // en este caso respondemos 200 a los errores, porque no queremos que los contactos sean expulsados del journey.
				result: result/*, branchResult: outcome*/
			})
		} else {
			console.log('RESPONSE POST /execute while writting de', response.body)
			res.status(200).send({
				result: result/*, branchResult: outcome*/
			})
		}
	})
  }
)

module.exports = router

/*
// OTHER IMPLEMENTABLE, OPTIONAL ACTIONS OF CUSTOM ACTIVITIES
// ========================================================
// POST /unpublish: 1st call on journey stop
router.post('/unpublish', function (req, res) {
  // activityObjectID=8867bf01-b152-4d21-9189-64da67bc6a16 interactionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 originalDefinitionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 interactionKey=65583294-0f58-fe74-a3d2-757c7dfef0a2 interactionVersion=1 isPublished=false
  logger.debug('POST /unpublish', JSON.stringify(req.body))
  res.json({result: 'ok'})
})

// POST /stop: 2nd call on journey stop
router.post('/stop', function (req, res) {
  // activityObjectID=8867bf01-b152-4d21-9189-64da67bc6a16 interactionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 originalDefinitionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 interactionKey=65583294-0f58-fe74-a3d2-757c7dfef0a2 interactionVersion=1
  logger.debug('POST /stop', JSON.stringify(req.body))
  res.json({result: 'ok'})
})

// POST /test-validate
router.post('/test-validate', function (req, res) {
  // activityObjectID=f4c7b82a-c057-4437-a0a5-6581e3216866 interactionId=d2e611ae-1179-4fa8-870d-486ad731a7fb originalDefinitionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 interactionKey=65583294-0f58-fe74-a3d2-757c7dfef0a2 interactionVersion=2
  logger.debug('POST /test-validate', JSON.stringify(req.body))
  res.json({result: 'ok'})
})

// POST /test-publish
router.post('/test-publish', function (req, res) {
  // activityObjectID=f4c7b82a-c057-4437-a0a5-6581e3216866 interactionId=d2e611ae-1179-4fa8-870d-486ad731a7fb originalDefinitionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 interactionKey=65583294-0f58-fe74-a3d2-757c7dfef0a2 interactionVersion=2 isPublished=true
  logger.debug('POST /test-publish', JSON.stringify(req.body))
  res.json({result: 'ok'})
})

// POST /test-unpublish
router.post('/test-unpublish', function (req, res) {
  // activityObjectID=f4c7b82a-c057-4437-a0a5-6581e3216866 interactionId=d2e611ae-1179-4fa8-870d-486ad731a7fb originalDefinitionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 interactionKey=65583294-0f58-fe74-a3d2-757c7dfef0a2 interactionVersion=2 isPublished=false
  logger.debug('POST /test-unpublish', JSON.stringify(req.body))
  res.json({result: 'ok'})
})

// POST /test-stop
router.post('/test-stop', function (req, res) {
  // activityObjectID=f4c7b82a-c057-4437-a0a5-6581e3216866 interactionId=d2e611ae-1179-4fa8-870d-486ad731a7fb originalDefinitionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 interactionKey=65583294-0f58-fe74-a3d2-757c7dfef0a2 interactionVersion=2
  logger.debug('POST /test-stop', JSON.stringify(req.body))
  res.json({result: 'ok'})
})

// POST /test-save
router.post('/test-save', function (req, res) {
  // activityObjectID=f4c7b82a-c057-4437-a0a5-6581e3216866 interactionId=d2e611ae-1179-4fa8-870d-486ad731a7fb originalDefinitionId=78744b8d-7d8a-46ff-89aa-3c0287c0f130 interactionKey=65583294-0f58-fe74-a3d2-757c7dfef0a2 interactionVersion=2 logger.debug('POST /test-save', req.body)
  logger.debug('POST /test-save', JSON.stringify(req.body))
  res.json({result: 'ok'})
})
*/
