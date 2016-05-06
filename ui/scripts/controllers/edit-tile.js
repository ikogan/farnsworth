'use strict';

angular.module('farnsworth')
    .controller('EditTileController', function($mdDialog, $mdToast, $window, $scope, $rootScope, SettingsService) {
        var self = this;
        var dialog = require('electron').remote.dialog;

        var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

        self.newTile = true;
        self.tile = {
            backgroundColor: randomColor,
            textColor: tinycolor(randomColor).complement().toHexString()
        };

        SettingsService.get().then(function(settings) {
            if(!_.has(settings, 'categories')) {
                settings.categories = {};
            }

            self.categories = settings.categories;
        }).catch(function(error) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(`Error loading application settings: ${error}`)
                    .hideDelay(3000));
            window.history.goBack();
        });

        self.browseFile = function(property, currentValue) {
            dialog.showOpenDialog({
                title: 'Tile Command',
                properties: ['openFile'],
                defaultPath: currentValue
            }, function(filename) {
                if(filename) {
                    self.tile[property] = filename;
                    $scope.$apply();
                }
            });
        };

        self.cancel = function() {
            $window.history.back();
        };

        self.save = function(tile) {
            self.categories[tile.category].tiles.push(tile);
            SettingsService.save().then(function() {
                $window.history.back();
            }).catch(function(error) {
                $mdToast.show(
                  $mdToast.simple()
                    .textContent(`Error saving tile: ${error}`)
                        .hideDelay(3000));
            });
        };

        self.addCategory = function() {
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
                    self.categories[category] = {
                        name: category,
                        tiles: []
                    };
                    self.tile.category = category;


                    $mdToast.show(
                      $mdToast.simple()
                        .textContent(`Added category ${category}.`)
                            .hideDelay(3000));
                });
        };
    });
