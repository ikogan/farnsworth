'use strict';

angular.module('farnsworth')
    .controller('ToolbarController', function($timeout, $rootScope, Toolbar) {
        var self = this;

        self.dateFormat = 'MMMM d, y h:mm a';
        self.toolbar = Toolbar;

        function displayDate() {
            self.currentDate = new Date();

            $timeout(displayDate, (60-self.currentDate.getSeconds())*1000);
        }

        displayDate();
    })
    .service('Toolbar', function() {
        return {
            editing: false
        };
    });
