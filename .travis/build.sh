#!/bin/bash
set -e

echo "Building on ${TRAVIS_OS_NAME}..."

if [[ "${TRAVIS_OS_NAME}" == "linux" ]]; then
    npm run dist:win64
    npm run dist:win32
    npm run dist:linux64
    npm run dist:linux32
elif [[ "${TRAVIS_OS_NAME}" == "osx" ]]; then
    npm run dist:darwin
fi
