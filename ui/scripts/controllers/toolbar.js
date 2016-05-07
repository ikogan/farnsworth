'use strict';

angular.module('farnsworth')
    .controller('ToolbarController', function($timeout) {
        var self = this;

        self.dateFormat = 'MMMM d, y h:mm a';

        function displayDate() {
            self.currentDate = new Date();

            $timeout(displayDate, (60-self.currentDate.getSeconds())*1000);
        }

        displayDate();
    });
