#! /bin/bash

# Simple script to install IoT Core demo app

if [ $UID -ne 0 ]; then
	echo "Error - run this installer as root"
	exit 1
fi

# Get current directory of this script install
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd $DIR/..

# Install Node.js
curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install NPM
npm install

# Allow BLE advertising from non-root users. This grants the `node` binary `cap_net_raw` privileges, so it can start/stop BLE advertising.
sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)

# Copy to /opt
sudo cp -prdf $DIR/.. /opt/iotcore-raspbian-demo

# Put init script in place
sudo cp -f scripts/iotcore-demo-init-script /etc/init.d/iotcoredemo
sudo update-rc.d iotcoredemo defaults

echo "Install complete. Start app with: /etc/init.d/iotcoredemo start"
