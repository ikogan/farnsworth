'use strict';

angular.module('farnsworth')
    .controller('HomeController', function($location, $mdToast, $mdDialog, $timeout,
            $scope, hotkeys, SettingsService) {
        var self = this;
        var constants = {
            holdTime: 2000,
            editingDarkness: 20
        };

        self.holding = null;
        self.editing = false;
        self.moving = false;
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
                    if(self.editing) {
                    } else if(self.moving) {

                    } else {
                        if(self.selectedTileIndex < self.selectedCategory.tiles.length - 1) {
                            self.selectedTile = self.selectedCategory.tiles[++self.selectedTileIndex];
                        }
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'left',
                description: 'Select the tile to the right of the currently selected tile.',
                callback: function() {
                    if(self.editing) {
                    } else if(self.moving) {

                    } else {
                        if(self.selectedTileIndex > 0) {
                            self.selectedTile = self.selectedCategory.tiles[--self.selectedTileIndex];
                        }
                    }
                }
            });

            var selectProperCategoryTile = function() {
                if(self.selectedTileIndex >= self.selectedCategory.tiles.length) {
                    self.selectedTileIndex = self.selectedCategory.tiles.length - 1;
                }

                self.selectedTile = self.selectedCategory.tiles[self.selectedTileIndex];
            }

            hotkeys.bindTo($scope).add({
                combo: 'down',
                description: 'Select the tile below the currently selected tile.',
                callback: function() {
                    if(self.editing) {

                    } else if(self.moving) {
                        if(self.selectedCategoryIndex < self.categoryList.length - 1) {
                            self.selectedCategory = self.categoryList[++self.selectedCategoryIndex];

                            selectProperCategoryTile();
                        }
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'up',
                description: 'Select the tile above the currently selected tile.',
                callback: function() {
                    if(self.editing) {
                    } else if(self.moving) {
                        if(self.selectedCategoryIndex > 0) {
                            self.selectedCategory = self.categoryList[--self.selectedCategoryIndex];

                            selectProperCategoryTile();
                        }
                    }
                }
            });

            // angular-hotkeys doesn't support multiple actions on one hotkey
            // so we need to do something a little interesting: rebind the hotkey
            // as it's pressed.
            var addEnterHotkey = function(action) {
                hotkeys.del('enter');

                hotkeys.bindTo($scope).add({
                    combo: 'enter',
                    action: action,
                    description: 'Activate the selected tile. Hold to edit instead.',
                    callback: function() {
                        if(self.editing) {
                            self.holding = null;
                        } else if(self.moving) {
                        } else {
                            if(!self.holding) {
                                addEnterHotkey('keyup');

                                self.holding = $timeout(function() {
                                    self.startEditing(self.selectedTile);
                                }, constants.holdTime);
                            } else {
                                addEnterHotkey('keydown');

                                $timeout.cancel(self.holding);
                                self.holding = null;
                                self.activate(self.selectedTile);
                            }
                        }
                    }
                });
            }

            addEnterHotkey('keydown');
        };

        self.addTile = function() {
            $location.path('/edit-tile');
        };

        self.editTile = function() {
            $location.path(`/edit-tile/${self.selectedCategory.name}/${self.selectedTileIndex}`);
        };

        self.getTileStyle = function(tile) {
            if(self.moving && self.selectedTile === tile) {
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
            self.editing = true;

            $mdDialog.show({
                controller: function(hotkeys, $scope, $mdDialog) {
                    //TODO: This has to match the order of the buttons in the
                    // HTML. Rework at some point to make this less terrible.
                    $scope.actions = [
                        'arrange', 'edit', 'cancel', 'delete'
                    ];
                    $scope.action = 0;

                    hotkeys.bindTo($scope).add({
                        combo: 'right',
                        description: 'Select the option right of the current option',
                        callback: function() {
                            if($scope.action < $scope.actions.length-1) {
                                $scope.action++;
                            }
                        }
                    });

                    hotkeys.bindTo($scope).add({
                        combo: 'left',
                        description: 'Select the option left of the curren options.',
                        callback: function() {
                            if($scope.action > 0) {
                                $scope.action--;
                            }
                        }
                    });

                    hotkeys.bindTo($scope).add({
                        combo: 'enter',
                        description: 'Activate the selected option.',
                        callback: function() {
                            if(!self.holding) {
                                $mdDialog.hide($scope.actions[$scope.action]);
                            }
                        }
                    })
                },
                templateUrl: 'views/dialogs/edit-tile-popup.html',
                parent: angular.element(document.body),
                clickOutsideToClose:true
            }).then(function(result) {
                switch(result) {
                    case 'arrange': self.moving = true; break;
                    case 'edit': self.editTile(); break;
                    case 'delete': self.deleteTile(); break;
                }
            }).finally(function() {
                self.editing = false;
            });
        };
    });
