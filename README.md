# Farnsworth Launcher

A simple [Electron](http://electron.atom.io/) based,
configurable launcher for systems connected to a TV. Farnsworth
is optimized for use with a remote control or game controller. There is no
"media" functionality, that is, no video or music library or support for
live TV. Farnsworth's purpose is to simply launch other applications and
get out of the way.

## Development

```bash
# Clone this repository
git clone git clone git@bitbucket.org:ikogan/farnsworth.git
# Go into the repository
cd farnsworth
# Install dependencies and run the app
npm install && npm start
```

## Packaging

Currently, packages are generated with gulp:

```bash
npm install -g gulp
npm install
gulp
```

## TODO

At the moment, this is completele enough to use for my own purposes but there
is much left that should be done:

-   Avoid packaging development modules
-   Windows Installer, Mac DMG, Linux packages
-   Keyboard support for edit tiles and settings screens
-   Refactor controls to be more generic, grid based?
-   Native support for game controllers
-   "Profiles" for a given tile: launch the tile command differently
    depending on a profile selected at launch time.
-   Customizable background color, image, list URL
-   Cleanup as indicated in the source

### License [Apache-2.0](LICENSE.md)
