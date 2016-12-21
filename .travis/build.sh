#!/bin/bash
set -e

echo "Building on ${TRAVIS_OS_NAME}..."

mkdir -p dist/release

if [[ "${TRAVIS_OS_NAME}" == "linux" ]]; then
    npm run dist:win64
    mv -v dist/*.exe dist/release
    npm run dist:win32
    mv -v dist/*.exe dist/release
    npm run dist:linux64
    npm run dist:linux32
    mv -v dist/*.rpm dist/release
    mv -v dist/*.deb dist/release
    mv -v dist/*.tar.gz dist/release
elif [[ "${TRAVIS_OS_NAME}" == "osx" ]]; then
    npm run dist:darwin
    mv -v dist/osx/*.dmg dist/release
else
    echo "Unhandled operating ${TRAVIS_OS_NAME}!"
    exit 1
fi
