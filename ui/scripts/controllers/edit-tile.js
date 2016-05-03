'use strict';

angular.module('farnsworth')
    .controller('EditTileController', function($mdDialog, $mdToast, $window) {
        var $scope = this;

        var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

        $scope.newTile = true;
        $scope.tile = {
            backgroundColor: randomColor,
            textColor: tinycolor(randomColor).complement().toHexString()
        };
        $scope.categories = [
            'Video',
            'Music'
        ];

        $scope.cancel = function() {
            $window.history.back();
        };

        $scope.save = function(tile) {
            $window.history.back();
        };

        $scope.addCategory = function() {
            $mdDialog.show({
                    controller: function($scope) {
                        $scope.cancel = function() {
                            return $mdDialog.cancel();
                        };

                        $scope.save = function() {
                            return $mdDialog.hide($scope.category);
                        }
                    },
                    templateUrl: './views/dialogs/add-category.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                })
                .then(function(category) {
                    $scope.categories.push(category);

                    $mdToast.show(
                      $mdToast.simple()
                        .textContent(`Added category ${category}.`)
                            .hideDelay(3000));
                });
        };
    });
