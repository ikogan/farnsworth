'use strict';

angular.module('farnsworth')
    .controller('HomeController', function($location) {
        var $scope = this;

        $scope.addTile = function() {
            $location.path('/edit-tile');
        }
    });
