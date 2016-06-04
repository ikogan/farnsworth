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

        // We keep this here to make loading of backgrounds a bit faster...though
        // since we now load this from disk first in main as well, it doesn't
        // make much sense...TODO: Remove this and just get it from main.
        const BACKGROUND_FILE = app.getPath('userData') + '/backgrounds.json';

        // TODO: Load this form main too, possibly as part of the background data?
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
        ipc.on('background-available', function(sender, index, background) {
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
                bgData = bgData[0];

                // Get a list of all files in the directory.
                // TODO: I believe this is legacy logic and isn't necessary,
                // the `fs.accessSync` call verifies that the file exists, so
                // we should probably remove this.
                fs.readdir(BACKGROUNDS_DIR, function(error, entries) {
                    if(error) {
                        defered.reject('Cannot read background directory.', error);
                    } else {
                        if(!entries || entries.length == 0) {
                            return defered.reject('No images found in directory but images supposedly available?');
                        }

                        // Choose a random background to start with.
                        var index = Math.floor(Math.random() * (bgData.length - 1));
                        var checks = 0; // Make sure we don't keep checking forever if we can never find a background
                        var background = null; // The background to use

                        // Keep looping so long as we haven't found a background that isn't the last
                        // background we've used and we haven't mmade as many checks as there are entries
                        //
                        // TODO: This logic is flawed as we can check the same background multiple times,
                        // increasing the number of checks without insuring we don't re-check a failed
                        // background over and over.
                        while((!background || background === lastBackground) && checks < entries.length) {
                            checks++;

                            if(bgData[index].downloaded) {
                                var filename = path.join(BACKGROUNDS_DIR, bgData[index].filename);

                                // Make sure this background actually exists
                                try {
                                    fs.accessSync(filename, fs.R_OK);

                                    background = {
                                        filename: filename,
                                        metadata: index < bgData.length ? bgData[index] : null
                                    };
                                } catch(e) {}
                            }

                            index = Math.floor(Math.random() * (bgData.length - 1));
                        }

                        lastBackground = background;

                        defered.resolve(background);
                    }
                });
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
