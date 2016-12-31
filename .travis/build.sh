#!/bin/bash
set -e

echo "Building on ${TRAVIS_OS_NAME}..."

rm -Rf dist/
mkdir -p dist/release

if [[ "${TRAVIS_OS_NAME}" == "linux" || "${TRAVIS_OS_NAME}" == "all" ]]; then
    npm run dist:win64
    FILENAME=$(basename "`ls dist/*.exe`" | sed 's/ /-/g' | tr "[:upper:]" "[:lower:]" | sed 's/farnsworth-launcher/farnsworth-launcher-x64/')
    mv -v dist/*.exe dist/release/${FILENAME}
    npm run dist:win32
    FILENAME=$(basename "`ls dist/*.exe`" | sed 's/ /-/g' | tr "[:upper:]" "[:lower:]" | sed 's/farnsworth-launcher/farnsworth-launcher-x86/')
    mv -v dist/*.exe dist/release/${FILENAME}
    npm run dist:linux64
    npm run dist:linux32
    mv -v dist/*.rpm dist/release
    mv -v dist/*.deb dist/release
    mv -v dist/*.tar.gz dist/release
elif [[ "${TRAVIS_OS_NAME}" == "osx" || "${TRAVIS_OS_NAME}" == "all" ]]; then
    npm run dist:darwin
    mv -v dist/mac/*.dmg dist/release
else
    echo "Unhandled operating ${TRAVIS_OS_NAME}!"
    exit 1
fi
