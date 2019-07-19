define([
    'js/postmonger'
], function(
    Postmonger
) {
    'use strict';

    var connection = new Postmonger.Session();

    $(window).ready(onRender);
	connection.on('initActivityRunningHover', function (savedConfigJson) {
		console.log('Hover Ready')
		console.log(JSON.stringify(savedConfigJson))
	})


    function onRender() {
        connection.trigger('ready'); // JB will respond the first time 'ready' is called with 'initActivity'
    }
});
