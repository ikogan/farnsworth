'use strict';

angular.module('farnsworth')
    .controller('HomeController', function($location, $mdToast, $timeout,
            $scope, hotkeys, SettingsService, Toolbar) {
        var self = this;
        var constants = {
            holdTime: 2000,
            editingDarkness: 20
        };

        self.holding = null;
        self.categories = {};
        self.categoryList = [];
        self.selectedCategory = null;
        self.selectedCategoryIndex = 0;
        self.selectedTile = null;
        self.selectedTileIndex = 0;

        SettingsService.get().then(function(settings) {
            if(_.has(settings, 'categories')) {
                self.categories = settings.categories;

                self.init();
            }
        }).catch(function(error) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(`Error loading application settings: ${error}`)
                    .hideDelay(3000));
        });

        self.init = function() {
            self.categoryList = _.sortBy(self.categories, 'order');
            self.selectedCategory = self.categoryList[self.selectedCategoryIndex];

            if(self.selectedCategory.tiles.length > self.selectedTileIndex) {
                self.selectedTile = self.selectedCategory.tiles[self.selectedTileIndex];
            }

            hotkeys.bindTo($scope).add({
                combo: 'right',
                description: 'Select the tile to the right of the currently selected tile.',
                callback: function() {
                    if(self.selectedCategory.tiles.length-1 >= self.selectedTileIndex) {
                        self.selectedTile = self.selectedCategory.tiles[++self.selectedTileIndex];
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'left',
                description: 'Select the tile to the right of the currently selected tile.',
                callback: function() {
                    if(self.selectedTileIndex > 0) {
                        self.selectedTile = self.selectedCategory.tiles[--self.selectedTileIndex];
                    }
                }
            });

            var selectProperCategoryTile = function() {
                if(self.selectedCategory.tiles.length <= self.selectedTileIndex) {
                    self.selectedTileIndex--;
                }

                self.selectedTile = self.selectedCategory.tiles[self.selectedTileIndex];
            }

            hotkeys.bindTo($scope).add({
                combo: 'down',
                description: 'Select the tile below the currently selected tile.',
                callback: function() {
                    if(self.categoryList.length-1 >= self.selectedCategoryIndex) {
                        self.selectedCategory = self.categoryList[++self.selectedCategoryIndex];

                        selectProperCategoryTile();
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'up',
                description: 'Select the tile above the currently selected tile.',
                callback: function() {
                    if(self.selectedCategoryIndex > 0) {
                        self.selectedCategory = self.categoryList[--self.selectedCategoryIndex];

                        selectProperCategoryTile();
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'enter',
                action: 'keydown',
                description: 'Activate the selected tile. Hold to edit instead.',
                callback: function() {
                    if(!self.holding) {
                        self.holding = $timeout(function() {
                            self.holding = null;
                            self.startEditing(self.selectedTile);
                        });
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'enter',
                action: 'keyup',
                callback: function() {
                    if(self.holding) {
                        $timeout.cancel(self.holding);
                        self.activate(self.selectedTile);
                        self.holding = null;
                    }
                }
            });
        };

        self.addTile = function() {
            $location.path('/edit-tile');
        };

        self.getTileStyle = function(tile) {
            if(Toolbar.editing && Toolbar.editing === tile) {
                return {
                    'background-color': tinycolor(tile.backgroundColor).darken(constants.editingDarkness).toString(),
                    'color': tinycolor(tile.textColor).darken(constants.editingDarkness).toString()
                };
            } else {
                return {
                    'background-color': tile.backgroundColor,
                    'color': tile.textColor
                };
            }
        };

        self.activate = function(tile) {
            console.log('Launching tile: ', tile);
        };

        self.startEditing = function(tile) {
            Toolbar.editing = tile;
        };
    });
