'use strict';

/**
 * Service to save and load the application's settings. Yes,
 * this probably could be more efficient than just storing
 * a single JSON file but it's not terribly likely this will
 * get very big or complex for the moment so let's avoid premature
 * optimization.
 */
angular.module('farnsworth')
    .service('SettingsService', function($q) {
        var mainApp = require('electron').remote.app;
        var fs = require('fs');
        var path = mainApp.getPath('userData') + '/settings.json';
        var backupPath = mainApp.getPath('userData') + '/settings-backup.json';

        var service = {
            settings: null
        };

        /**
         * Get all of the application's settings. This will load
         * them on the first call, and reuse the loaded data
         * on subequent calls.
         *
         * @param  {boolean} reload Reload settings from the stored file. Note that
         *                          if the settings object has been modified but not
         *                          saved, this will erase any changes.
         * @return {Promise -> object}       Promise, which, when resolved will yield the settings.
         */
        service.get = function(reload) {
            var deferred = $q.defer();

            if(!service.settings || reload) {
                fs.readFile(path, function(error, data) {
                    if(error) {
                        service.settings = {};
                    } else {
                        service.settings = JSON.parse(data);
                    }

                    deferred.resolve(service.settings);

                    service.save(true);
                });
            } else {
                deferred.resolve(service.settings);
            }

            return deferred.promise;
        };

        /**
         * Clean the settings.
         */
        service.clean = function() {
            if(_.has(service.settings, 'categories')) {
                service.settings.categories = _.filter(service.settings.categories, function(category) {
                    return category.tiles && category.tiles.length > 0 && !category.transient;
                });

                _.each(service.settings.categories, function(category) {
                    category.tiles = _.filter(category.tiles, function(tile) {
                        return !tile.transient;
                    })
                });
            }
        };

        /**
         * Save the current settings.
         *
         * @param {Boolean} backup Whether to use the backup path or not.
         * @return {Promise -> object} Promise which, when resolve, will yield the saved settings.
         */
        service.save = function(backup) {
            var deferred = $q.defer();

            if(!service.settings) {
                service.settings = {};
            }

            service.clean();

            fs.writeFile(backup ? backupPath : path, JSON.stringify(service.settings, null, 4), function(error) {
                if(error) {
                    deferred.reject();
                } else {
                    deferred.resolve(service.settings);
                }
            });

            return deferred.promise;
        };

        /**
         * Reload the settings from storage. If the settings object has
         * changed, the changed settings will be lost.
         *
         * @return {Promise -> object} Promise which, when resolved, will yield the new settings.
         */
        service.reload = function() {
            return service.get(true);
        }

        return service;
    });
