'use strict';

angular.module('farnsworth')
    .controller('ToolbarController', function($scope, $timeout) {
        $scope.dateFormat = 'MMMM d, y h:mm a';

        function displayDate() {
            $scope.currentDate = new Date();

            $timeout(displayDate, (60-$scope.currentDate.getSeconds())*1000);
        }

        displayDate();
    });
