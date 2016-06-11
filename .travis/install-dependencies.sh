#!/bin/bash
set -e

echo "Installing dependenceis for ${TRAVIS_OS_NAME}..."

if [[ "${TRAVIS_OS_NAME}" == "linux" ]]; then
    sudo apt-add-repository ppa:ubuntu-wine/ppa -y
    sudo apt-add-repository ppa:likemartinma/osslsigncode -y
    sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys 3FA7E0328081BFF6A14DA29AA6A19B38D3D831EF

    echo "deb http://download.mono-project.com/repo/debian wheezy main" | sudo tee /etc/apt/sources.list.d/mono-xamarin.list

    sudo dpkg --add-architecture i386
    sudo apt-get update || true
    sudo apt-get install build-essential icnsutils graphicsmagick xz-utils rpm wine1.8 mono-devel ca-certificates-mono osslsigncode gcc-multilib g++-multilib -y --no-install-recommends
fi
