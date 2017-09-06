

Device Setup

1) Flash Raspbian to to Raspberry Pi 3.
https://www.raspberrypi.org/downloads/raspbian/

- update device
- add wifi
- start ssh server ? (optional)

2) Add software for app

- nodejs

curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
sudo apt-get install -y nodejs

- bluetooth support 

sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
