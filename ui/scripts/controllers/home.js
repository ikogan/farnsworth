'use strict';

/**
 * Home screen controller, the meat of the application. This controller
 * displays a list of categories with a row of tiles. Keyboard navigation
 * is used to select the tile, move tiles around, and activate tiles.
 */
angular.module('farnsworth')
    .controller('HomeController', function($location, $mdToast, $mdDialog, $timeout, $q,
            $scope, $route, hotkeys, SettingsService, HotkeyDialog) {
        var slash = require('slash');               // Convert Windows paths to something we can use in `file:///` urls.
        var app = require('electron').remote.app;   // Needed to close the application.

        var self = this;
        var constants = {
            holdTime: 1000,                     // Time in MS we have to hold enter before we popup the edit dialog
            systemBackgroundColor: '#4B585C',   // Background color of the hardcoded "System" category tiles.
            systemTextColor: '#FFFFFF'          // Text color of the hardcoded "System" category tiles.
        };

        self.loading = true;                    // Used to track when to show the loading spinner.
        self.actionHold = {                     // Promise used to track when we're holding down the action button.
            defered: null,
            promise: null
        };
        self.actionTimeout = null;              // Set to a $timeout promise when we're holding enter on a tile.
        self.moving = false;                    // True when we're arranging a tile on the screen.
        self.categories = {};                   // Object containing all categories. Note: This is a reference to data that is read/written from the JSON file.
        self.categoryList = [];                 // Ordered list of categories.
        self.selectedCategory = null;           // The currently selected category.
        self.selectedCategoryIndex = 0;         // The index of the currently selected category, used when navigating and moving tiles.
        self.selectedTile = null;               // A reference to the currently selected tile.
        self.selectedTileIndex = 0;             // The index of the currently selected tile.
        self.editingCategories = false;         // Whether or not we're editing the list of categories.

        SettingsService.get().then(function(settings) {
            if(_.has(settings, 'categories')) {
                self.categories = settings.categories;

                self.init();
            } else {
                self.initEmpty();
            }

            self.loading = false;
        }).catch(function(error) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(`Error loading application settings: ${error}`)
                    .hideDelay(3000));

            self.initEmpty();
            self.loading = false;
        });

        /**
         * Initialize an empty homescreen. Really just bind the "Enter" button
         * to trigger adding our first tile.
         */
        self.initEmpty = function() {
            hotkeys.bindTo($scope).add({
                combo: 'enter',
                description: 'Add your first tile.',
                callback: function() {
                    self.addTile();
                }
            });
        };

        /**
         * Initialize all of the things. This pre-processes categories and
         * creates the hardcoded System category.
         */
        self.init = function() {
            // Make sure we ignore transient categories when building the list
            // as we're going to add them later.
            self.categoryList = _.sortBy(_.filter(self.categories, function(category) {
                return !category.transient;
            }), 'order');
            self.selectedCategory = self.categoryList[self.selectedCategoryIndex];

            if(self.selectedCategory.tiles.length > self.selectedTileIndex) {
                self.selectedTile = self.selectedCategory.tiles[self.selectedTileIndex];
            }

            // Hardcoded System tiles for editing categories, adding new
            // tiles, exiting, etc.
            self.categories['System'] = {
                'name': 'System',
                'order': self.categoryList.length,
                'transient': true,
                'tiles': [{
                    'name': 'Add Tile',
                    'category': 'System',
                    'transient': true,
                    'backgroundColor': constants.systemBackgroundColor,
                    'textColor': constants.systemTextColor,
                    'command': 'about:farnsworth/add-tile'
                },{
                    'name': 'Edit Categories',
                    'category': 'System',
                    'transient': true,
                    'backgroundColor': constants.systemBackgroundColor,
                    'textColor': constants.systemTextColor,
                    'command': 'about:farnsworth/edit-categories'
                },{
                    'name': 'Settings',
                    'category': 'System',
                    'transient': true,
                    'backgroundColor': constants.systemBackgroundColor,
                    'textColor': constants.systemTextColor,
                    'command': 'about:farnsworth/app-settings'
                },{
                    'name': 'Exit',
                    'category': 'System',
                    'transient': true,
                    'backgroundColor': constants.systemBackgroundColor,
                    'textColor': constants.systemTextColor,
                    'command': 'about:farnsworth/exit'
                }]
            };

            self.categoryList.push(self.categories['System']);

            self.setupBindings();
        };

        /**
         * Setup all of our keybindings. All of these should not function
         * when we're in edit mode and also handle moving tiles around when
         * we're in arrange mode.
         */
        self.setupBindings = function() {
            // Move to the right.
            hotkeys.bindTo($scope).add({
                combo: 'right',
                description: 'Select the tile to the right of the currently selected tile.',
                callback: function() {
                    if(self.selectedTileIndex < self.selectedCategory.tiles.length - 1) {
                        if(self.moving) {
                            var temp = self.selectedCategory.tiles[self.selectedTileIndex+1];
                            self.selectedCategory.tiles[self.selectedTileIndex+1] = self.selectedTile;
                            self.selectedCategory.tiles[self.selectedTileIndex] = temp;
                        }

                        self.selectedTile = self.selectedCategory.tiles[++self.selectedTileIndex];
                    }
                }
            });

            // Move to the left.
            hotkeys.bindTo($scope).add({
                combo: 'left',
                description: 'Select the tile to the right of the currently selected tile.',
                callback: function() {
                    if(self.selectedTileIndex > 0) {
                        if(self.moving) {
                            var temp = self.selectedCategory.tiles[self.selectedTileIndex-1];
                            self.selectedCategory.tiles[self.selectedTileIndex-1] = self.selectedTile;
                            self.selectedCategory.tiles[self.selectedTileIndex] = temp;
                        }

                        self.selectedTile = self.selectedCategory.tiles[--self.selectedTileIndex];
                    }
                }
            });

            // Move down to the next category.
            hotkeys.bindTo($scope).add({
                combo: 'down',
                description: 'Select the tile below the currently selected tile.',
                callback: function() {
                    if(self.selectedCategoryIndex < self.categoryList.length - 1) {
                        if(self.moving) {
                            if(self.categoryList[self.selectedCategoryIndex + 1].transient) {
                                return;
                            }

                            self.selectedCategory.tiles.splice(self.selectedTileIndex, 1);
                        }

                        self.selectedCategory = self.categoryList[++self.selectedCategoryIndex];

                        self.selectProperCategoryTile();
                    }
                }
            });

            // Move up to the previous category
            hotkeys.bindTo($scope).add({
                combo: 'up',
                description: 'Select the tile above the currently selected tile.',
                callback: function() {
                    if(self.selectedCategoryIndex > 0) {
                        if(self.moving) {
                            if(self.categoryList[self.selectedCategoryIndex - 1].transient) {
                                return;
                            }

                            self.selectedCategory.tiles.splice(self.selectedTileIndex, 1);
                        }

                        self.selectedCategory = self.categoryList[--self.selectedCategoryIndex];

                        self.selectProperCategoryTile();
                    }
                }
            });

            // angular-hotkeys doesn't support multiple actions on one hotkey
            // so we need to do something a little interesting: rebind the hotkey
            // as it's pressed.
            var addEnterHotkey = function(action) {
                hotkeys.del('enter');

                var handler;

                // This is sort of opposite, we're adding an action
                // when the opposite action was taken. If we're adding
                // the 'keydown' action, it's because we just released the key.
                if(action === 'keydown') {
                    handler = function() {
                        // The only time we ever want to do anything on keydown
                        // is if the edit dialog isn't open and we're not moving
                        // anything.
                        if(!self.moving) {
                            // First, setup the opposite hotkey.
                            addEnterHotkey('keyup');

                            // Set our hold timer, after which, we'll activate
                            // edit mode.
                            self.actionTimeout = $timeout(function() {
                                self.actionTimeout = null;

                                // Transient tiles can't be edited, always
                                // activate them.
                                if(!self.selectedTile.transient) {
                                    self.startEditing(self.selectedTile);
                                } else {
                                    self.activate(self.selectedTile);
                                }
                            }, constants.holdTime);

                            // Setup our hold promise.
                            self.actionHold.defered = $q.defer();
                            self.actionHold.promise = self.actionHold.defered.promise;
                        }
                    };
                } else {
                    handler = function() {
                        // Need to make sure we resolve this promise no matter
                        // what state we're in.
                        self.actionHold.defered.resolve();
                        self.actionHold.promise = null;

                        addEnterHotkey('keydown');

                        if(self.moving) {
                            // If we're moving something, then enter drops
                            // the tile we're moving.
                            self.moving = false;
                            SettingsService.save().catch(function(error) {
                                $mdToast.show(
                                  $mdToast.simple()
                                    .textContent(`Error saving tile: ${error}`)
                                        .hideDelay(3000));
                            });
                        } else {
                            // If there was ever a timeout, then cancel it
                            // and activate the tile.
                            if(self.actionTimeout) {
                                $timeout.cancel(self.actionTimeout);
                                self.actionTimeout = null;
                                self.activate(self.selectedTile);
                            }
                        }
                    }
                }

                hotkeys.bindTo($scope).add({
                    combo: 'enter',
                    action: action,
                    description: 'Activate the selected tile. Hold to edit instead',
                    callback: handler
                });
            }

            addEnterHotkey('keydown');
        }

        /**
         * Select the proper tile in the current category.
         */
        self.selectProperCategoryTile = function() {
            if(self.selectedTileIndex >= self.selectedCategory.tiles.length) {
                // When moving, self.selectedTile doesn't change, so this is safe.
                if(self.moving) {
                    self.selectedCategory.tiles.push(self.selectedTile);
                    self.selectedTileIndex = self.selectedCategory.tiles.length;
                } else {
                    self.selectedTileIndex = self.selectedCategory.tiles.length - 1;
                }
            } else if(self.moving) {
                self.selectedCategory.tiles.splice(self.selectedTileIndex, 0, self.selectedTile);
            }

            self.selectedTile = self.selectedCategory.tiles[self.selectedTileIndex];
        };

        /**
         * Disable all key bindings.
         */
        self.disableBindings = function() {
            if(self.actionHold.promise) {
                self.actionHold.promise.finally(function() {
                    Mousetrap.reset();
                });
            } else {
                Mousetrap.reset();
            }
        };

        /**
         * Add a new tile.
         */
        self.addTile = function() {
            $location.path('/edit-tile');
        };

        /**
         * Edit the currently selected tile.
         */
        self.editTile = function() {
            $location.path(`/edit-tile/${self.selectedCategory.name}/${self.selectedTileIndex}`);
        };

        /**
         * Exit the app.
         */
        self.exit = function() {
            app.quit();
        };

        /**
         * Enter category editing mode. In this mode, we can only move up and down
         * categories, rearrange them, or rename them.
         */
        self.editCategories = function(selectIndex) {
            self.disableBindings();

            // There are two ways we could be called, the first is if we're called
            // after deleting a category, in which case we were passed the index
            // of the category to select.
            if(!_.isUndefined(selectIndex)) {
                self.selectedCategory = self.categoryList[selectIndex];
            } else {
                // The second is from the edit categories button, in this case, move
                // the user up one category.
                self.selectedCategory = self.categoryList[--self.selectedCategoryIndex];
            }

            self.editingCategories = true;

            hotkeys.bindTo($scope).add({
                combo: 'right',
                description: 'Select stop editing option.',
                callback: function() {
                    if(self.selectedCategory !== null) {
                        self.selectedCategory = null;
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'left',
                description: 'Select category list.',
                callback: function() {
                    if(self.selectedCategory === null) {
                        self.selectedCategory = self.categoryList[self.selectedCategoryIndex];
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'up',
                description: 'Select previous category.',
                callback: function() {
                    if(self.selectedCategoryIndex > 0) {
                        self.selectedCategory = self.categoryList[--self.selectedCategoryIndex];
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'down',
                description: 'Select next category.',
                callback: function() {
                    if(self.selectedCategoryIndex < self.categoryList.length - 2) {
                        self.selectedCategory = self.categoryList[++self.selectedCategoryIndex];
                    }
                }
            });

            hotkeys.bindTo($scope).add({
                combo: 'enter',
                description: 'Edit the selected category',
                callback: function() {
                    if(self.selectedCategory === null) {
                        self.editingCategories = false;
                        self.selectedCategoryIndex = self.categoryList.length - 1;
                        self.selectedCategory = self.categoryList[self.selectedCategoryIndex];
                        self.selectedTileIndex = 1;
                        self.selectedTile = self.selectedCategory.tiles[self.selectedTileIndex];

                        self.setupBindings();
                        return;
                    }

                    self.disableBindings();

                    HotkeyDialog()
                        .actions([{
                            caption: 'Arrange',
                            icon: 'swap_vert'
                        }, {
                            caption: 'Rename',
                            icon: 'edit'
                        }, {
                            caption: 'Cancel',
                            icon: 'cancel'
                        }, {
                            caption: 'Delete',
                            icon: 'delete'
                        }])
                        .show()
                        .then(function(result) {
                            switch(result.caption) {
                                case 'Arrange':
                                    self.moving = true;
                                    self.editCategories();
                                    break;
                                case 'Rename':
                                    self.renameCategory();
                                    break;
                                case 'Delete':
                                    self.deleteCategory();
                                    break;
                                default:
                                    self.editCategories(self.selectedCategoryIndex);
                            }

                            self.selectProperCategoryTile();
                        });
                }
            });
        };

        self.renameCategory = function() {
            self.disableBindings();

            $mdDialog.show({
                controllerAs: 'controller',
                locals: {
                    category: self.selectedCategory
                },
                bindToController: true,
                templateUrl: 'views/dialogs/rename-category.html',
                controller: function(hotkeys, $mdDialog, $scope) {
                    hotkeys.bindTo($scope).add({
                        combo: 'enter',
                        description: 'Rename the category.',
                        allowIn: ['INPUT'],
                        callback: function() {
                            $mdDialog.hide();
                        }
                    });
                }
            }).then(function() {
                _.each(self.selectedCategory.tiles, function(tile) {
                    tile.category = self.selectedCategory.name;
                });

                return SettingsService.save().then(function() {
                    self.editCategories(self.selectedCategoryIndex);
                });
            }).catch(function() {
                self.editCategories(self.selectedCategoryIndex);
            });
        };

        self.deleteCategory = function() {
            self.disableBindings();

            HotkeyDialog()
                .prompt('Are you sure you want to delete this category?')
                .show()
                .then(function(result) {
                    if(result.caption === 'Yes') {
                        delete self.categories[self.selectedCategory.name];
                        self.categoryList.splice(self.selectedCategoryIndex, 1);

                        SettingsService.save().then(function() {
                            if(self.categoryList.length === 1) {
                                $route.reload();
                            } else {
                                return self.editCategories((self.selectedCategoryIndex < self.categoryList.length - 1)
                                    ? self.selectedCategoryIndex : self.selectedCategoryIndex - 1);
                            }
                        });
                    } else {
                        self.editCategories(self.selectedCategoryIndex);
                    }
                });
        };

        /**
         * Open the application settings.
         */
        self.appSettings = function() {
            $location.path('/settings');
        };

        /**
         * Get styling information for the current tile. This includes the
         * selected background as well as any filter when the tile
         * is not selected during move mode.
         * @param  {object} tile The tile for which to get the styles.
         */
        self.getTileStyle = function(tile) {
            var style = {
                'background-color': tile.backgroundColor,
                'color': tile.textColor
            };

            if(tile.image) {
                style['background-image'] = 'url(file:///' + slash(tile.image) + ')';
            }

            if(self.editingCategories || (self.moving && self.selectedTile !== tile)) {
                style['-webkit-filter'] = 'blur(1px) grayscale(0.4)';
            }

            return style;
        };

        /**
         * Activate the specified tile.
         * @param  {object} tile The tile.
         */
        self.activate = function(tile) {
            // Any tile with a command that begins with 'about:farnsworth' is
            // an "internal" command, we handle those by simply taking the remaining
            // string, converting it to camelcase, and, assuming one exists, calling
            // the method with the converted name on this controller.
            //
            // TODO: Consider how safe this is. Since we're running in Electron and not
            // a traditional browser, it's probably ok and allows users to maybe add more
            // tiles for internal commands?
            if(tile.command && tile.command.startsWith('about:farnsworth')) {
                var func = _.camelCase(tile.command.replace('about:farnsworth/', ''));

                if(_.has(self, func)) {
                    self[func]();
                }
            }
        };

        /**
         * Delete the currently selected tile.
         */
        self.deleteTile = function() {
            self.disableBindings();

            HotkeyDialog()
                .prompt('Are you sure you want to delete this tile?')
                .wait(self.actionHold.promise)
                .show()
                .then(function(result) {
                    if(result.caption === 'Yes') {
                        self.selectedCategory.tiles.splice(self.selectedTileIndex, 1);

                        while(self.selectedCategory.tiles.length == 0) {
                            self.selectedCategory = self.categoryList[++self.selectedCategoryIndex];
                        }

                        if(self.selectedTileIndex >= self.selectedCategory.tiles.length) {
                            self.selectedTileIndex = self.selectedCategory.tiles.length - 1;
                        }

                        self.selectedTile = self.selectedCategory.tiles[self.selectedTileIndex];

                        return SettingsService.save();
                    }
                })
                .finally(function() {
                    self.setupBindings();
                });
        };

        /**
         * Start tile editing mode for the given tile. Display a popup
         * with edit options:
         *
         * - arrange: Rearrange the tile on the screen.
         * - edit: Edit tile properties.
         * - delete: Delete the tile entirely.
         *
         * @param  {object} tile The tile to edit.
         */
        self.startEditing = function(tile) {
            self.disableBindings();

            HotkeyDialog()
                .actions([{
                    caption: 'Arrange',
                    icon: 'swap_horiz'
                }, {
                    caption: 'Edit',
                    icon: 'edit'
                }, {
                    caption: 'Cancel',
                    icon: 'cancel'
                }, {
                    caption: 'Delete',
                    icon: 'delete'
                }])
                .wait(self.actionHold.promise)
                .show()
                .then(function(result) {
                    switch(result.caption) {
                        case 'Arrange':
                            self.moving = true;
                            self.setupBindings();
                            break;
                        case 'Edit':
                            self.editTile();
                            break;
                        case 'Delete':
                            self.deleteTile();
                            break;
                        default:
                            self.setupBindings();
                    }
                });
        };
    });
