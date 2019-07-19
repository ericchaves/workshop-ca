define([
    'js/postmonger'
], function(
    Postmonger
) {
    'use strict';

    var connection = new Postmonger.Session();

    $(window).ready(onRender);
	connection.on('initActivityRunningModal', function () {})

    function onRender() {
        connection.trigger('ready'); // JB will respond the first time 'ready' is called with 'initActivity'

        $('#close').click(function(){
            connection.trigger('destroy');
        });
    }
});
