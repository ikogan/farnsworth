'use strict';

/**
 * Error dialog that handles situations where errors
 * prevent the application from functioning normally, like
 * route change errors.
 */
angular.module('farnsworth')
    .factory('$error', function($mdDialog) {
        return function(rejection, action, ev) {
            var error = "An unhandled error has occurred.";

            if(typeof rejection === 'string') {
                error = rejection;
            } else if(typeof rejection === 'object') {
                if(typeof rejection.error === 'string') {
                    error = rejection.error;
                } else if(typeof rejection.error === 'object' && rejection.error.message) {
                    error = rejection.error.message;
                } else if(rejection.message) {
                    error = rejection.message;
                }
            }

            var dialog = $mdDialog.alert()
                .clickOutsideToClose(true)
                .title('Error')
                .textContent(error)
                .ariaLabel('Error Dialog')
                .ok('Close');

            if(ev) {
                dialog.targetEvent(ev);
            }

            $mdDialog.show(dialog);
        }
    });
