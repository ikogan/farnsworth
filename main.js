'use strict';

const electron = require('electron');
const request = require('request');
const fs = require('fs');
const path = require('path');
const fsExtra = require('fs-extra');
const download = require('download');
const _ = require('lodash');

// Module to control application life.
const app = electron.app;
// Module to get events from renders.
const ipc = electron.ipcMain;
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow;
// URL where our backgrounds are
const BACKGROUND_URL = 'https://raw.githubusercontent.com/dconnolly/chromecast-backgrounds/master/backgrounds.json';
const BACKGROUNDS_SAVE_PATH = app.getPath('userData') + '/backgrounds.json';
const BACKGROUNDS_DIR = app.getPath('userData') + '/backgrounds';
const BACKGROUND_DOWNLOAD_THREADS = 4;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function init() {
    createWindow();
    downloadBackgrounds();
}

// Create the main window, mostly unchanged from the template
function createWindow () {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        movable: false,
        fullscreen: true,
        title: 'Farnsworth Launcher',
        frame: false,
        backgroundColor: '#000',
        titleBarStyle: 'hidden'
    });

    mainWindow.setFullScreen(true);

    // and load the index.html of the app.
    mainWindow.loadURL('file://' + __dirname + '/ui/index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();

    // Emitted when the window is closed.
    mainWindow.on('closed', function() {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null;
    });

    mainWindow.on('app-command', function(ev, command) {
        if(command === 'browser-backward' && someWindow.webContents.canGoBack()) {
            someWindow.webContents.goBack();
        }
    });

    mainWindow.on('background-service-ready', function(ev) {
        downloadBackgrounds(ev.sender);
    });
}

function cleanBackgrounds() {
    console.log('Cleaning leftover backgrounds...');

    // Clean up any backgrounds we don't have in the list anymore.
    fs.readDir(BACKGROUND_SAVE_PATH, function(error, files) {
        if(!error) {
            _.each(files, function(f) {
                var index = path.basename(f, path.extname(f));

                try {
                    if(parseInt(index) >= backgrounds.length) {
                        fs.unlink(f);
                    }
                } catch(e) {}
            });
        }
    });
}

// Download all of the available backgrounds locally just in case we
// need them when we don't have an internet connection.
function downloadBackgrounds() {
    ipc.on('background-service-ready', function(ev) {
        var bgService = ev.sender;

        function doDownload(backgrounds, index) {
            return new Promise(function(reject, resolve) {
                if(index < backgrounds.length) {
                    var filename = path.join(BACKGROUNDS_DIR, `${index}${path.extname(backgrounds[0].url)}`);

                    console.log(`Downloading ${backgrounds[index].url} to ${filename}...`);
                    download(backgrounds[index].url)
                        .pipe(fs.createWriteStream(filename))
                        .on('close', function() {
                            if(index === 0) {
                                bgService.send('background-available', index, backgrounds[index]);
                            }

                            return doDownload(backgrounds, index + 1);
                        }).on('error', function(error) {
                            console.log(error);
                        });
                } else {
                    resolve();
                }
            });
        }

        console.log('Loading background images...');

        // Load the JSON file describing the backgrounds.
        request(BACKGROUND_URL, function(error, response, body) {
            if(error || response.statusCode !== 200) {
                console.error('Error loading backgrounds from ' + BACKGROUND_URL, error);
                bgService.send('backgrounds-error', 'Error loading backgrounds from ' + BACKGROUND_URL, error);
            } else {
                var backgrounds = JSON.parse(body);

                bgService.send('background-data-available', backgrounds);

                // Store the file locally.
                fs.writeFile(BACKGROUNDS_SAVE_PATH, body, function(error) {
                    if(error) {
                        bgWindow.send('Could not save backgrounds list: ' + error);
                    }
                });

                // Create the backgrounds directory
                fsExtra.mkdirs(BACKGROUNDS_DIR, function(error) {
                    // TODO: Handle already exists
                    if(error) {
                        console.error('Could not create directory for backgrounds: ', error);
                        bgService.send('backgrounds-error', 'Could not create directory for backgrounds', error);
                    } else {
                        doDownload(backgrounds, 0).then(function() {
                            bgService.send('backgrounds-downloaded');

                            cleanBackgrounds();
                        }, function() {
                            bgService.send('backgrounds-downloaded');

                            cleanBackgrounds();
                        });
                    }
                });
            }
        });
    });
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', init);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
    app.quit();
});

app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) {
        createWindow();
    }
});
