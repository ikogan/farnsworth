'use strict';

/**
 * Service for accessing the backgrounds we've downloaded...in the background.
 */
angular.module('farnsworth')
    .service('BackgroundsService', function($q, $mdToast) {
        var electron = require('electron');
        var path = require('path');
        var fs = require('fs');

        var ipc = electron.ipcRenderer;
        var app = electron.remote.app;

        // TODO: Load this from main too, possibly as part of the background data?
        const BACKGROUNDS_DIR = app.getPath('userData') + '/backgrounds';

        var service = {};

        var bgAvailable = $q.defer();       // Promise that is resolved when we have data.
        var allBgsLoaded = $q.defer();      // Promise resolved when all backgrounds have been loaded.
        var bgDataAvailable = $q.defer();   // Promise resolved when at least one background is available.
        var lastBackground = null;          // The last background we displayed, so we don't cycle to the same one twice.
        var backgroundData = null;          // List of all backgrounds and their metadata.

        service.waitForBackgroundData = bgDataAvailable.promise;
        service.waitForBackground = bgAvailable.promise;
        service.waitForAllBackgrounds = allBgsLoaded.promise;

        // Listen for at least one background to be available and resolve
        // the promise.
        ipc.on('background-available', function(sender, background, index) {
            bgAvailable.resolve(background, index);
        });

        // Listen for all backgrounds to be downloaded and resolve that promise.
        ipc.on('backgrounds-downloaded', function() {
            allBgsLoaded.resolve();
        });

        // If any error occurs, reject any promises that haven't yet been
        // resolved and display the error.
        ipc.on('background-error', function(sender, text, details) {
            bgDataAvailable.reject(text, details);
            bgAvailable.reject(text, details);
            allBgsLoaded.reject(text, details);

            $mdToast.show(
              $mdToast.simple()
                .textContent(`${text}: ${details}`)
                    .hideDelay(3000));
        });

        // Listen for background data to be available and resolve the promise
        // as well as store the data.
        ipc.on('background-data-available', function(sender, data) {
            backgroundData = data; // TODO: Is it Kosher to reference data from the main process like this?
            bgDataAvailable.resolve(backgroundData);
        });

        /**
         * Get a single random background image.
         *
         * @return {object} Background metadata, including the full path.
         */
        service.getRandomBackground = function() {
            var defered = $q.defer();

            // We're going to wait for the data to be available *and* at least
            // one background to be available.
            var waits = [service.waitForBackgroundData, service.waitForBackground];

            $q.all(waits).then(function(bgData) {
                var background = bgData[1];
                bgData = _.filter(bgData[0], function(entry) {
                    return entry.downloaded;
                });

                if(bgData.length !== 0) {
                    background = null;
                } else if(background !== null) {
                    background = {
                        filename: path.join(BACKGROUNDS_DIR, background.filename),
                        metadata: background
                    };
                }

                // Choose a random background to start with.
                var index = Math.floor(Math.random() * (bgData.length - 1));
                var checked = []; // Make sure we don't keep checking forever if we can never find a background

                // Keep looping so long as we haven't found a background that isn't the last
                // background we've used and we haven't mmade as many checks as there are entries.
                while((!background || background === lastBackground) && checked.length < bgData.length) {
                    checked.push(index);

                    var filename = path.join(BACKGROUNDS_DIR, bgData[index].filename);

                    try {
                        fs.accessSync(filename, fs.R_OK);

                        background = {
                            filename: filename,
                            metadata: bgData[index]
                        };
                    } catch(e) {}

                    while(checked.indexOf(index) !== -1) {
                        index = Math.floor(Math.random() * (bgData.length - 1));
                    }
                }

                if(background) {
                    lastBackground = background;
                    defered.resolve(background);
                } else {
                    defered.reject('Unable to find background despite assurances that they exist.');
                }
            });

            return defered.promise;
        };

        // Tell main that we're ready to receive events, this will in turn
        // trigger it to begin loading backgrounds. We do this so that
        // it doesn't send us events when we're not yet ready to receive them,
        // thereby avoiding a race condition.
        ipc.send('background-service-ready');

        return service;
    });
