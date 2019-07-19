requirejs(['js/postmonger'], function(Postmonger) {
    'use strict';
	var connection = new Postmonger.Session();
	var isInitialized = false;
	var selectedMessage = null;
    var payload = {};
	var schemaPayload = [];
	var currentStack = null;
    var lastStepEnabled = false;
    var steps = [ // initialize to the same value as what's set in _config.json for consistency
        { 'label': 'Step 1', 'key': 'step1' },
        { 'label': 'Step 2', 'key': 'step2', 'active': false }
    ];
    var currentStep = null;

    $(window).ready(onRender);

    // connection.on('ready', onReady);
	connection.on('initActivity', initialize);

    connection.on('requestedTokens', onGetTokens); // callback response used to generate the API call for retrieving Data Extension dows
    connection.on('requestedEndpoints', onGetEndpoints); // callback response used to generate the API call to retrieve DE values
	connection.on('requestedSchema', onGetSchema); // callback response used to map Entry source fields to inArguments
	connection.on('requestedInteraction', onGetInteraction); // callback response used only for console.log, but it should be used for validation
    connection.on('clickedNext', onClickedNext);
    connection.on('clickedBack', onClickedBack);

	connection.on('updateActivity', onUpdateActivity);
    connection.on('gotoStep', onGotoStep);

    // connection.on('requestedSsoRequired', onGetSsoRequired);

    /**
     * This function is called on the $(window).ready event. It triggers some postmonger events
     * to gather contextual information of the custom activity journey.
	 *
	 * It also defines UI events, listeners and performs the initial UI configuration.
     */
    function onRender() {
		// We must call this event to tell JB the index is rendered. JB will respond the first time 'ready' is called with 'initActivity'

        connection.trigger('requestEndpoints'); // On its callback we trigger 'requestTokens', and use them to send an API call

		connection.trigger('requestSchema'); // On its callback we populate the global var schemaPayload
		connection.trigger('requestInteraction'); // On its callback we run validations

        // jQuery: set a listener to the UI drop-down menu. On change, we enable the next button.
        $('#dropDownMenu').change(function() {
			selectedMessage = $(this).val()
			console.log('Setting new message to', selectedMessage)
            connection.trigger('updateButton', { button: 'next', enabled: Boolean(selectedMessage) });
        });

        // jQuery: set a listener to the UI button. On click, we enable or disable the last wizard step
        $('#toggleLastStep').click(function() {
            lastStepEnabled = !lastStepEnabled; // toggle status
            steps[1].active = lastStepEnabled; // toggle active

            connection.trigger('updateSteps', steps);
        });

		// jQuery: set a listener to the UI text-area. On change/keyup, we want to save the modified config.json payload
        $('#payload').on('change', onPayloadChanged);
    }

    /**
     * The function is triggered by the 'ready' postmonger event, triggered by jQuery on window.ready.
     * It will evaluate current CA payload (it could be a new CA instance or an existing one) in order
	 * to set the corresponding current values in the UI.
	 *
     * @param data payload received from postmonger
     */
    function initialize(data) {
        console.log('Postmonger - initActivity', data);
		// Set the postmonger 'data' parameter to the global var 'payload'. This contains the current state of the CA.
        if (data) {
            payload = data;
        }

		// Set the current inArguments to the global var 'inArguments'
        var hasInArguments = Boolean(
            payload.arguments &&
            payload.arguments.execute &&
            payload.arguments.execute.inArguments &&
            payload.arguments.execute.inArguments.length > 0
        );
        var inArguments = hasInArguments ? payload.arguments.execute.inArguments : {};

		// Search for the 'message' inArgument. If there is a value for this inArgument, we set it as pre-selected in the UI
        $.each(inArguments, function(index, inArgument) {
			$.each(inArgument, function(key, val) {
				if (key === 'message') {
					selectedMessage = val
					$('#dropDownMenu').val(selectedMessage)
                }
            });
		});

		isInitialized = true
		showStep(null, 0)
    }

    function onGetInteraction(interaction) {
        console.log('Postmonger - requestedInteraction', interaction);
    }

	/**
	 * Invoked from the GetEndopints callback
	 */
    function onGetTokens(tokens) {
		console.log('Postmonger - requestedTokens. Calling DE data retrieve...', tokens);
		var uri = new URL(window.location.href)
		var uriHost = uri.protocol + '//' +  uri.host
		var deName = 'JB_Lookup_Messages';
		var keyFieldName = 'id';
		var valueFieldName = 'label';

		var webServiceURL = uriHost + '/proxy/https://webservice.' + currentStack + '.exacttarget.com/Service.asmx'
		var soapRequestBody = '';
		soapRequestBody += '<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">';
        soapRequestBody += '<soapenv:Header>';
        soapRequestBody += '    <fueloauth xmlns="http://exacttarget.com">' + tokens.fuel2token + '</fueloauth>';
        soapRequestBody += '</soapenv:Header>';
        soapRequestBody += '<soapenv:Body>';
        soapRequestBody += '    <RetrieveRequestMsg xmlns="http://exacttarget.com/wsdl/partnerAPI">';
        soapRequestBody += '      <RetrieveRequest>';
        soapRequestBody += '          <ObjectType>DataExtensionObject[' + deName + ']</ObjectType>';
		soapRequestBody += '          <Properties>' + keyFieldName + '</Properties>';
		soapRequestBody += '          <Properties>' + valueFieldName + '</Properties>';
		soapRequestBody += '          <Filter xsi:type="SimpleFilterPart">';
		soapRequestBody += '            <Property>_CustomObjectKey</Property>';
		soapRequestBody += '            <SimpleOperator>notEquals</SimpleOperator>';
		soapRequestBody += '            <Value>-1</Value>';
	    soapRequestBody += '          </Filter>';
        soapRequestBody += '      </RetrieveRequest>';
        soapRequestBody += '    </RetrieveRequestMsg>';
        soapRequestBody += '</soapenv:Body>';
		soapRequestBody += '</soapenv:Envelope>';

		$.ajax({
			url: webServiceURL,
			type: "POST",
			dataType: "xml",
			data: soapRequestBody,
			beforeSend: function(xhr) {
				xhr.setRequestHeader('SOAPAction', 'Retrieve')
				xhr.setRequestHeader('Content-Type', 'text/xml')
			},
			success: function(xml) {
				$(xml).find('Properties').each(function () {
					var selectMenuOption = {}
					$(this).find('Property').each(function () {
						var fieldName = $(this).find('Name').text()
						if (fieldName === 'id') { // Campo 1 de la data extension (codigo)
							selectMenuOption.value = $(this).find('Value').text()
						} else if (fieldName === 'label') { // Campo 2 de la data extension (label)
							selectMenuOption.text = $(this).find('Value').text()
						}
					});
					// Añadir al component drop-down menu los valores recuperados
					$('#dropDownMenu').append($('<option>', selectMenuOption));
				});

				// Only if we are able to retrieve the data, we continue with the custom activity config wizard
				connection.trigger('ready');
			},
			error: function(err) {
				alert('Error al leer datos de una Data Extension')
				console.log('Error al leer datos de una Data Extension', err)
			}
		})
		// Response: tokens = { token: <legacy token>, fuel2token: <fuel api token> }
    }

    function onGetEndpoints(endpoints) {
		console.log('Postmonger - requestedEndpoints', endpoints);
		currentStack = endpoints.stackKey;
		connection.trigger('requestTokens');
        // Response: endpoints = { restHost: <url> } i.e. rest.s1.qa1.exacttarget.com
    }

    function onGetSchema(getSchemaPayload) {
        console.log('Postmonger - requestedSchema', getSchemaPayload);
        schemaPayload = getSchemaPayload;
        // Response: getSchemaPayload == { schema: [ ... ] };
    }

    function onUpdateActivity(data) {
        console.log('Postmonger - updateActivity', data);
    }

    function onClickedNext() {
        console.log('Postmonger - clickedNext', steps[1].active, currentStep.key);
        if ((currentStep.key === 'step1' && steps[1].active === false) || currentStep.key === 'step2') {
            save();
        } else {
            connection.trigger('nextStep');
        }
    }

    function onClickedBack() {
        console.log('Postmonger - clickedBack');
        connection.trigger('prevStep');
    }

    function onGotoStep(step) {
		console.log('Postmonger - gotoStep', step);
		if (step) {
			showStep(step); // show the received step
		}
    }

    function onPayloadChanged() {
        console.log('Payload div - onPayloadChanged');
        if (currentStep && currentStep.key === 'step2') {
            try {
                payload = JSON.parse($('#payload').val());
                updateNextButton(true);
            } catch (e) {
				console.log('ERROR! INVALID JSON')
                updateNextButton(false);
            }
        }
    }

    function updateNextButton(text, enabled) {
        //console.log('updateNextButton');
        connection.trigger('updateButton', { button: 'next', text: text, visible: true, enabled: enabled });
    }

    function showStep(step, stepIndex) {
		// JB will automatically trigger 'onGotoStep' on page redady, but we want to skip
		// any call to this function invoked without the appropriate parameters
		console.log('showStep', 'isInitialized', isInitialized, 'step', step, 'stepIndex', stepIndex)

		if (step) {
			currentStep = step
		} else {
			currentStep = steps[stepIndex]
		}

		if (!(isInitialized && currentStep)) {
			console.log('showStep', 'skipping null step or uninitialized')
			return
		}

		console.log('showStep - currentStep', currentStep)

		// 1. Hides all the 'step' HTML div tags
        $('.step').hide();

		// 2. Shows only the current 'step' HTML div tag
        switch (currentStep.key) {
			// 2.A On enter step1, show it's html DIV. Then check if step2 is enabled and modify the 'next' button accordingly
            case 'step1':
				$('#step1').show();
				console.log('Step 1: checking message value', selectedMessage)
				if (lastStepEnabled) {
					updateNextButton('next', Boolean(selectedMessage));
				} else {
					updateNextButton('done', Boolean(selectedMessage));
				}
				break;

			// 2.B On enter step2, generate the final payload to show it in the UI. Then populate the text area and update the 'next' button.
			case 'step2':
				preparePayload();

				$('#payload').val(JSON.stringify(payload, null, 4));
				$('#step2').show();
				connection.trigger('updateButton', { button: 'back', visible: true });
				updateNextButton('done', Boolean(selectedMessage));
				break;
        }
    }

	/**
	 * This function uses the global var 'schemaPayload' that were set up by the postmonger callbacks.
	 */
    function preparePayload() {
        //1.a) Configure inArguments from the interaction entry event data extension
        var inArgumentsArray = []
        var schemaInArgumentsArray = []
        console.log('inArgumentsArray', inArgumentsArray);
        for (var i = 0; i < schemaPayload.schema.length; i++) {
			var type = schemaPayload.schema[i].key.split('.')[0]
			var name = schemaPayload.schema[i].key.split('.')[2]
			if (type === 'Event') {
				var inArgument = {};
				inArgument[name] = '{{' + schemaPayload.schema[i].key + '}}';
				inArgumentsArray.push(inArgument);

				var schemaInArgument = {};
				schemaInArgument[name] = {};
				schemaInArgument[name].dataType = schemaPayload.schema[i].type;
				schemaInArgument[name].isNullable = schemaPayload.schema[i].isPrimaryKey ? false : (schemaPayload.schema[i].isNullable ? true : false);
				schemaInArgument[name].direction = 'in';
				schemaInArgumentsArray.push(schemaInArgument);
			}
        }

        //1.b) Configure inArguments from the UI (end user manual config)
        inArgumentsArray.push({ 'message': selectedMessage });
        schemaInArgumentsArray.push({ 'message': { 'dataType': 'Text', 'isNullable': false, 'direction': 'in' } });

        //1.c) Set all inArguments in the payload
        payload.arguments.execute.inArguments = inArgumentsArray;
        payload.schema.arguments.execute.inArguments = schemaInArgumentsArray;

        //2.a) Configure outArguments
        var outArgumentsArray = [];
        var schemaOutArgumentsArray = [];
        outArgumentsArray.push({ 'result': '' });
        schemaOutArgumentsArray.push({ 'result': { 'dataType': 'Text', 'access': 'visible', 'direction': 'out' } });

        //2.b) Set all outArguments in the payload
        payload.arguments.execute.outArguments = outArgumentsArray;
        payload.schema.arguments.execute.outArguments = schemaOutArgumentsArray;

        //3) Set other payload values
        payload.name = $('#dropDownMenu').find('option:selected').html();
        payload.metaData.isConfigured = true; // Set the activity as 'configured'. This allows to activate the journey.

        console.log('preparePayload', payload);
    }

    function save() {
		preparePayload()
        console.log('save', payload);
        connection.trigger('updateActivity', payload);
    }
});
