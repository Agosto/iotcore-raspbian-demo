# Google Cloud IoT Core Demo Node.js App
A Node.js app targeting Raspberry Pi 3 running Raspbian that demonstrating how to provision an device into [Google Cloud IoT Core](https://cloud.google.com/iot-core/).  

This project is the device half of the Cloud IoT Core demo. The provisioning mobile app can be found here [TODO: LINK TO ANDROID APP](TODO) 

## What You Need

- Raspberry Pi 3 Model B (other models might work but have not been tested)
- MicroSD card of 8 GB or higher
- Micro USB power adapter.
- HDMI display and cable (setup only)
- USB Mouse and keyboard (setup only)
- (optional) [Blinkt!](https://shop.pimoroni.com/products/blinkt) RGB LED Strip

## Device Setup

### 1) Flash Raspbian to Raspberry Pi 3.
Official instructions can be found [HERE](https://www.raspberrypi.org/documentation/installation/installing-images/README.md): 

#### Quick Setup
- Download Raspbian Image from [https://www.raspberrypi.org/downloads/raspbian/](https://www.raspberrypi.org/downloads/raspbian/). _Note:_ Download the lite version if doing headless, otherwise grab the version with a desktop. 
- Flash image to SD Card. [Etcher](https://etcher.io/) is good open source SD card burner app that can flash from zip file.
- To get the device on your network you can do a headless configuration or setup with Keyboard / Mouse
##### Headless
Optionally, configure your Pi's network settings before moving the SD card for headless boot-up:
- After flashing the card, pull SD card out and put back into your machine and you should be able to access the /boot/ directory.
- If a wpa\_supplicant.conf file is placed into the /boot/ directory, this will be moved to the /etc/wpa\_supplicant/ directory the next time the system is booted, overwriting the network settings; this allows a Wifi configuration to be preloaded onto a card from a Windows or other machine that can only see the boot partition. Create the following wpa\_supplicant.conf file on the SD card:
```bash
ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
network={
  ssid="YOUR_SSID"
  psk="YOUR_PASSWORD"
  key_mgmt=WPA-PSK
}
```
- Place a file named `ssh` on the boot partition of the SD card. This will cause the Pi to start SSH on boot. The contents of the file are irrelevant
- Insert SD card into your Pi
- Connect power adapter
- Once it boots, you'll have to figure out the DHCP-assigned IP address of your Pi. One option is to check your router's admin page, another possiblity is to run `arp -a | grep b8:27:eb` as long as your workstation is on the same physical network as the Pi. All Pi's have mac addresses that start out with b8:27:eb.

##### With Keyboard / Mouse
If not configuring for headless boot:
- Insert SD card into your Pi, connect the USB power adapter, mouse, keyboard and HDMI display.  You should see the device boot to desktop.
- (optional) Use the Raspberry Pi Configuration App (Desktop or CL) to set your timezone and keyboard.  _Note:_ On the desktop, `Raspberry Pi Configuration` can be found under the `Start -> Preferences` menu.
- Configure Wi-Fi
- (optional) Using Raspberry Pi Configuration App, set the device to run an SSH server on startup. Once this is done, you can disconnect the mouse, keyboard and display if you like. 

##### Update Raspbian
Login to your Pi, then upgrade it.

(optional) Change the default password (`"raspberry"`) for the `pi` user.
```bash
$ sudo apt update
$ sudo apt -y full-upgrade
```

### 2) Add software for app
#### Install required packages, including bluetooth support
```bash
$ sudo apt-get -y install git bluetooth bluez libbluetooth-dev libudev-dev
```

#### Download Demo App

TODO: change to google urls

- Using GIT 
```bash
$ git clone https://github.com/agosto-dev/iotcore-raspbian-demo
```

- Or Download Zip: [IotCoreDemo](https://github.com/agosto-dev/iotcore-raspbian-demo/releases)
 
Which ever way to get the app, make sure it's cloned or unzipped to pi's home dir (`/home/pi`) 

 
#### Install App

This will install additional requirements and the app into /opt/
```bash
$ cd iotcore-raspbian-demo/scripts
$ sudo ./install.sh
```

#### Run App
```bash
sudo /etc/init.d/iotcoredemo start
```
Debug logs are located in the `/var/log/iotcoredemo/` directory. 

At this point you should be able to see the device in the Android test app. See below for more details.

### Blinkt!
Optionally you can attached a Blinkt! LED strip to your Raspberry Pi 3 and receive visual feedback.

#### LED Indicators
Red - Device is not ready to operate.  Should only flash for a brief sec on startup.  If persists longer, something is mis-configured (see setup).

Blue - Device is ready for provisioning or operation. The LED will flash blue for 5 seconds.

Green - Device is publishing telemetry data to IOT Core   

Yellow - Device is receiving a config update from IOT Core.

Purple - Device is receiving an HTTP `OPTIONS` request

Under normal operation, you should see the following Indicators.

**Unprovisioned Device**
- Red 
- Blue (5 seconds)

**Provisioned Device**
- Red
- Blue
- Yellow (once on startup and every time a new config is published)
- Green (every 1 min)

### NPM Scripts
You can start / stop or reset device keys using npm if needed. (Note you can also reset the device keys using the Android Test app so you will most likely not need to do this)

Change to the install directory (/opt/iotcore-raspbian-demo) before performing commands.
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

### Pushing configs in the GCP Console

If you send an updated device config in the IoT Core section of the Cloud console (or via API), the device LEDs will flash yellow and the text from your config will be displayed (or logged).


### Operation Overview

1. On start attempts to load key pairs and device settings from the filesystem.   If none exist, new ones are generated.
2. Device advertises an eddystone url beacon of the ip address of it's webserver.
3. A Webserver running on the Pi on port 8080 can receive GET, POST, DELETE, OPTION http requests.

-  `GET` returns device settings:
```json
{
  "deviceId": "device-12345678",
  "projectId": "cloud-iot-demo",
  "registryId": "a-gateways",
  "encodedPublicKey": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----\n"
}
```  

- `POST` accept a json payload to set the `deviceId` and `registryId`
- `OPTIONS` acts as normal but also lights the LED (if connected) purple
- `DELETE` deletes key pairs and device settings and reboots device   
    
4. Once device has a `projectId` and `registryId` (either after a POST or present on startup), then device will:
- Subscribe to the IoT Core device config topic
- Publish data 1/min to the telemetry topic
- reconnect when token expires

### Integration with IoT Core and Android Test App

An Android app is available that will use the simple API described above to provision your device with the IoT Core Registry.

#### Setting up IoT Core

1. Pick a GCP project you have Owner access and enable the IoT Core API
2. Create a Device Registry
3. Create or select a pub/sub topic (#2 will guide you through this)

At this point, you should have an empty device registry.

#### Use Android app to provision the Pi

1. Your Android device should be on the same Wifi network as the Pi (or can access tcp port 8080 on the Pi)
2. Make sure the IoT Core demo app is running on the Pi
3. Download and install the Android provisioning app *TODO - link to Android app*
4. Run the App, login and select the GCP project with your Device Registry
5. If you have multiple device registries, you can choose one
6. The Device should show up in the list with a red icon - Tap on it to Provision it
7. Device icon will turn green. If you have a Blinkt! strip, it should flash
8. Once the device is provisioned, the web server built into the demo app on the Pi will shut down

Check your IoT Core Registry - your device should be there!

To turn the web server back on (for reprovisioning or to flash the LEDs), tap the device in the list and select Update Config.  If you *Enable Config Server*, a simple configuration: `{"config_server_on":true}` is sent to the device, which turns the web server back on.


