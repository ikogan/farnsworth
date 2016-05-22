'use strict';

/**
 * Controller for editing a tile or creating a new tile.
 *
 * TODO: Add form validation and keyboard navigation.
 */
angular.module('farnsworth')
    .controller('SettingsController', function($location, SettingsService) {
        var self = this;

        SettingsService.get().then(function(settings) {
            self.settings = settings;
        }).catch(function(error) {
            $mdToast.show(
              $mdToast.simple()
                .textContent(`Error loading application settings: ${error}`)
                    .hideDelay(3000));
            window.history.goBack();
        });

        self.cancel = function() {
            $location.path('/');
        }

        self.save = function() {
            SettingsService.save().then(function() {
                $location.path('/');
            });
        }
    });
