'use strict';

angular.module('farnsworth')
    .service('BackgroundsService', function($q, $mdToast) {
        var electron = require('electron');
        var path = require('path');
        var fs = require('fs');

        var ipc = electron.ipcRenderer;
        var app = electron.remote.app;

        const BACKGROUND_FILE = app.getPath('userData') + '/backgrounds.json';
        const BACKGROUNDS_DIR = app.getPath('userData') + '/backgrounds';

        var service = {};

        var bgAvailable = $q.defer();
        var allBgsLoaded = $q.defer();
        var bgDataAvailable = $q.defer();
        var lastBackground = null;
        var backgroundData = null;

        service.waitForBackgroundData = bgDataAvailable.promise;
        service.waitForBackground = bgAvailable.promise;
        service.waitForAllBackgrounds = allBgsLoaded.promise;

        ipc.on('background-available', function(index, background) {
            bgAvailable.resolve(index, background);
        });

        ipc.on('backgrounds-downloaded', function() {
            allBgsLoaded.resolve();
        });

        ipc.on('background-error', function(text, details) {
            bgAvailable.reject(text, details);
            allBgsLoaded.reject(text, details);

            $mdToast.show(
              $mdToast.simple()
                .textContent(`${text}: ${details}`)
                    .hideDelay(3000));
        });

        ipc.on('background-data-available', function(data) {
            backgroundData = data; // TODO: Is it Kosher to reference data from the main process like this?
            bgDataAvailable.resolve(backgroundData);
        });

        service.getBackgroundInfo = function() {
            return service.waitForBackgroundData.then(function(data) {
                return data;
            });
        };

        service.getRandomBackground = function() {
            var defered = $q.defer();

            var waits = [service.getBackgroundInfo(), bgAvailable];

            $q.all(waits).then(function(bgData) {
                bgData = bgData[0];

                fs.readdir(BACKGROUNDS_DIR, function(error, entries) {
                    if(error) {
                        defered.reject('Cannot read background directory.', error);
                    } else {
                        if(!entries || entries.length == 0) {
                            return defered.reject('No images found in directory but images supposedly available?');
                        }

                        var index = Math.floor(Math.random() * (entries.length - 1));
                        var checks = 0;
                        var background = null;

                        while((!background || background === lastBackground) && checks < entries.length) {
                            checks++;

                            try {
                                index = parseInt(path.basename(entries[index]), path.extname(entries[index]));

                                background = {
                                    filename: path.join(BACKGROUNDS_DIR, entries[index]),
                                    author: index < bgData.length ? bgData[index] : null
                                };
                            } catch(e) {}
                        }

                        lastBackground = background;

                        defered.resolve(background);
                    }
                });
            });

            return defered.promise;
        };

        ipc.send('background-service-ready');

        return service;
    });
