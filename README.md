# Google Cloud IoT Core Demo Node.js App
A Node.js app targeting Raspberry Pi 3 running Raspbian that demonstrating how to provision an device into [Google Cloud IoT Core](https://cloud.google.com/iot-core/).  

This project is the device half of the Cloud IoT Core demo. The provisioning mobile app can be found here [TODO: LINK TO ANDROID APP](TODO) 

## What You Need

- Raspberry Pi 3 Model B (other models might work but have not been tested)
- MicroSD card of 16 GB or higher
- Micro USB power adapter.
- HDMI display and cable (setup only)
- USB Mouse and keyboard (setup only)
- (optional) [Blinkt!](https://shop.pimoroni.com/products/blinkt) RGB LED Strip

## Device Setup

### 1) Flash Raspbian to Raspberry Pi 3.
Official instructions can be found [HERE](https://www.raspberrypi.org/documentation/installation/installing-images/README.md): 

#### Quick Setup
- Download Raspbian Image from [https://www.raspberrypi.org/downloads/raspbian/](https://www.raspberrypi.org/downloads/raspbian/). _Note:_ Download the version with a desktop. 
- Unzip and Flash image to SD Card. [Etcher](https://etcher.io/) is good open source SD card burner app
- Insert SD card into your Raspberry Pi3 and connect the USB power adapter, mouse, keyboard and  HDMI display.  You should see the device boot to desktop.
- (optional) Use the Raspberry Pi Configuration App (Desktop or CL) to set your timezone and keyboard.  _Note:_ On the desktop, `Raspberry Pi Configuration` can be found under the `Start -> Preferences` menu.
- (optional) Change the default password (`"raspberry"`) for the `pi` user.
- Configure Wi-Fi 
- Update Raspbian
```bash
$ sudo apt update
$ sudo apt full-upgrade
```
- (optional) Using Raspberry Pi Configuration App, set the device to run an SSH server on startup. Once this is done, you can disconnect the mouse, keyboard and display if you like.  

### 2) Add software for app

#### Install Node.js
```bash
$ curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
$ sudo apt-get install -y nodejs
````
#### Add Bluetooth support 

```bash
$ sudo apt-get install bluetooth bluez libbluetooth-dev libudev-dev
```

#### Download Demo App

TODO: change to google urls

- Using GIT 
```bash
$ git clone https://github.com/agosto-dev/iotcore-raspbian-demo
```

- Or Download Zip: [IotCoreDemo](https://github.com/agosto-dev/iotcore-raspbian-demo/releases)
 
Which ever way to get the app, make sure it's cloned or unzipped to pi's home dir (`/home/pi`) 

 
#### Install App Dependencies

```bash
$ npm install
```

#### Run App*

To use BLE advertising without root, run the following (see [Bleno note]https://github.com/sandeepmistry/bleno#running-without-rootsudo).

```bash
$ sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
```
This grants the `node` binary `cap_net_raw` privileges, so it can start/stop BLE advertising (only need to do this once).

Run the App

```bash
node main.js
```


#### Configure App to Run on boot (via cron)

This is a very simple way to start the app on boot via cron.  You can also use [RC.LOCAL](https://www.raspberrypi.org/documentation/linux/usage/rc-local.md).  

- Add this to user `pi` cron jobs
```bash
$ crontab -e
```
- Add the following job and save
```bash
@reboot /home/pi/iotcore-raspbian-demo/startup.sh
```
- Reboot!

### Blinkt!
Optionally you can attached a Blinkt! LED strip to your Raspberry Pi 3 and receive visual feedback.

#### LED Indicators

Red - Device is not ready to operate.  Should only flash for a brief sec on startup.  If persists longer, something is mis-configured (see setup).

Blue - Device is ready for provisioning or operation. The LED will flash blue for 5 seconds.

Green - Device is publishing telemetry data to IOT Core   

Yellow - Device is receiving a config update from IOT Core.

Under normal operation, you should see the following Indiciators.

**Unprovisioned Device**
- Red 
- Blue (5 seconds)

**Provisioned Device**
- Red
- Blue
- Yellow (once on startup and every time a new config is published)
- Green (every 1 min)

### NPM Scripts

**reset** - reset device by deleting keys and stored settings  
```bash
$ npm run reset
```

**start** - start app  
```bash
$ npm start
```

**new** - resets and starts app  
```bash
$ npm run new
```

## Pushing configs in the GCP Console

If you send an updated device config in the IoT Core section of the Cloud console (or via API), the device LEDs will flash yellow and the text from your config will be displayed (or logged).
