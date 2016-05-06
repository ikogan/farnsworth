'use strict';

angular.module('farnsworth')
    .controller('HomeController', function($location, $mdToast, $timeout, SettingsService, Toolbar) {
        var self = this;
        var constants = {
            holdTime: 2000,
            holdKeys: [13], // Enter Key
            editingDarkness: 20
        };

        self.holding = null;

        SettingsService.get().then(function(settings) {
            if(_.has(settings, 'categories')) {
                self.categories = settings.categories;
            }
        }).catch(function(error) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(`Error loading application settings: ${error}`)
                    .hideDelay(3000));
        });

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

        self.hold = function($event, tile) {
            if(!self.holding && $event.which in constants.holdKeys) {
                self.holding = {
                    $event: $event,
                    tile: tile,
                    timer: $timeout(function() {
                        self.holding = null;
                        self.startEditing(tile);
                    }, constants.holdTime)
                };
            }
        };

        self.release = function($event) {
            if(self.holding && self.holding.$event.which === $event.which) {
                $timeout.cancel(self.holding.timer);
                self.activate(self.holding.tile);
                self.holding = null;
            }
        };

        self.startEditing = function(tile) {
            Toolbar.editing = tile;
        };
    });
