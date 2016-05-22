'use strict';

/**
 * Service to save and load the application's settings. Yes,
 * this probably could be more efficient than just storing
 * a single JSON file but it's not terribly likely this will
 * get very big or complex for the moment so let's avoid premature
 * optimization.
 */
angular.module('farnsworth')
    .service('SettingsService', function($q, $mdToast) {
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
            var defered = $q.defer();

            if(!service.settings || reload) {
                fs.readFile(path, function(error, data) {
                    var useBackup = false;

                    if(error) {
                        service.settings = {};
                        defered.resolve(service.settings);
                    } else {
                        try {
                            service.settings = JSON.parse(data);

                            if(!_.isPlainObject(service.settings) || !_.isPlainObject(service.settings.categories)) {
                                useBackup = 'Saved settings are not valid.';
                            } else {
                                service.save(true);

                                defered.resolve(service.settings);
                            }
                        } catch(e) {
                            useBackup = `Error loading settings, attempting to load backup: ${e}`;
                        }

                        if(useBackup !== false) {
                            $mdToast.show(
                              $mdToast.simple()
                                .textContent(useBackup)
                                    .hideDelay(3000));

                            fs.readFile(backupPath, function(error, data) {
                                if(error) {
                                    service.settings = {};
                                } else {
                                    try {
                                        service.settings = JSON.parse(data);

                                        if(!_.isPlainObject(service.settings)) {
                                            service.settings = {};
                                        }

                                        if(!_.isPlainObject(service.settings.categories)) {
                                            service.settings.categories = {};
                                        }
                                    } catch(e) {
                                        service.settings = {};
                                    }
                                }

                                defered.resolve(service.settings);
                            });
                        }
                    }
                });
            } else {
                defered.resolve(service.settings);
            }

            return defered.promise;
        };

        /**
         * Clean the settings.
         */
        service.clean = function() {
            if(_.has(service.settings, 'categories')) {
                service.settings.categories = _.omitBy(service.settings.categories, function(category) {
                    return !category.tiles || category.tiles.length === 0 || category.transient;
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
            var defered = $q.defer();

            if(!service.settings) {
                service.settings = {};
            }

            service.clean();

            fs.writeFile(backup ? backupPath : path, JSON.stringify(service.settings, null, 4), function(error) {
                if(error) {
                    defered.reject();
                } else {
                    defered.resolve(service.settings);
                }
            });

            return defered.promise;
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
