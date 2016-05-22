'use strict';

/**
 * Controller for editing a tile or creating a new tile.
 *
 * TODO: Add keyboard navigation.
 */
angular.module('farnsworth')
    .controller('EditTileController', function($mdDialog, $mdToast, $window, $scope,
            $rootScope, SettingsService, $routeParams) {
        var self = this;
        var dialog = require('electron').remote.dialog;

        // We're going to try and generate a colorscheme for users by default.
        var randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16);

        self.newTile = _.has($routeParams, 'category') && _.has($routeParams, 'tile');
        self.tile = {
            backgroundColor: randomColor,
            textColor: tinycolor(randomColor).complement().toHexString()
        };

        SettingsService.get().then(function(settings) {
            if(!_.has(settings, 'categories')) {
                settings.categories = {};
            }

            self.categories = settings.categories;

            // Figure out which tile to edit, if any.
            if($routeParams.category && _.has(self.categories, $routeParams.category) &&
                $routeParams.tile && $routeParams.tile < self.categories[$routeParams.category].tiles.length) {
                self.tile = self.categories[$routeParams.category].tiles[$routeParams.tile];
            }
        }).catch(function(error) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(`Error loading application settings: ${error}`)
                    .hideDelay(3000));
            window.history.goBack();
        });

        /**
         * Browse for a file and set the specified property.
         *
         * @param  {String} property     Property on the tile to set
         * @param  {[type]} currentValue Existing value, so users start at the closest spot to the current path.
         */
        self.browseFile = function(property, currentValue) {
            dialog.showOpenDialog({
                title: 'Tile Command',
                properties: ['openFile'],
                defaultPath: currentValue
            }, function(filename) {
                if(filename) {
                    // We always get an array back but we know we only want one value
                    self.tile[property] = filename[0];
                    $scope.$apply();
                }
            });
        };

        /**
         * Cancel editing, return to the previous page.
         */
        self.cancel = function() {
            $window.history.back();
        };

        /**
         * Save the changes. This will write the JSON file as well.
         *
         * @param  {object} tile The tile to save.
         */
        self.save = function(tile) {
            if(_.has($routeParams, 'tile')) {
                self.categories[tile.category].tiles[$routeParams['tile']] = tile;
            } else {
                self.categories[tile.category].tiles.push(tile);
            }

            SettingsService.save().then(function() {
                $window.history.back();
            }).catch(function(error) {
                $mdToast.show(
                  $mdToast.simple()
                    .textContent(`Error saving tile: ${error}`)
                        .hideDelay(3000));
            });
        };

        /**
         * Add a new category to the list of categories.
         */
        self.addCategory = function() {
            $mdDialog.show({
                    controller: function($scope, hotkeys) {
                        $scope.cancel = function() {
                            return $mdDialog.cancel();
                        };

                        $scope.save = function() {
                            return $mdDialog.hide($scope.category);
                        }

                        hotkeys.bindTo($scope).add({
                            combo: 'enter',
                            description: 'Add category.',
                            allowIn: ['INPUT'],
                            callback: $scope.save
                        });
                    },
                    templateUrl: './views/dialogs/add-category.html',
                    parent: angular.element(document.body),
                    clickOutsideToClose: false
                })
                .then(function(category) {
                    if(_.has(self.categories, category)) {
                        self.tile.category = category;

                        $mdToast.show(
                          $mdToast.simple()
                            .textContent(`${category} already exists`)
                                .hideDelay(3000));
                    } else {
                        self.categories[category] = {
                            name: category,
                            tiles: []
                        };

                        // Compute the new category's order based on the existing
                        // list of categories.
                        if(_.size(self.categories) == 1) {
                            self.categories[category].order = 1;
                        } else {
                            self.categories[category].order = _.reduce(_.filter(self.categories, function(category) {
                                return !category.transient;
                            }, function(max, category) {
                                return (category.order && category.order > max) ? category.order : (max || 0);
                            })) + 1;
                        }

                        self.tile.category = category;

                        $mdToast.show(
                          $mdToast.simple()
                            .textContent(`Added category ${category}.`)
                                .hideDelay(3000));
                    }
                });
        };
    })
    /**
     * Filter out any transient categories from our list of categories.
     */
    .filter('filterTransient', function() {
        return function(input) {
            return _.filter(input, function(category) {
                return !category.transient;
            });
        }
    });
