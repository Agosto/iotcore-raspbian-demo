const eddystoneBeacon = require('eddystone-beacon');

const fs = require('fs');
const keypair = require('keypair');
const Promise = require('promise');
const crypto = require("crypto");
const os = require('os');

const readFile = Promise.denodeify(fs.readFile);
const writeFile = Promise.denodeify(fs.writeFile);

const privateKeyFile = __dirname + '/private.key';
const publicKeyFile = __dirname + '/public.pem';
const deviceSettingsFile = __dirname + '/device.json';

function advertiseBeacon() {
  const url = "http://"+getWifiIPAddress();
  eddystoneBeacon.advertiseUrl(url);
}

function getStoreKeyPairs() {
  console.log('Loading stored key pair');
  const pair  = {public:null,private:null};
  return readFile(publicKeyFile,'utf8')
    .then(text=>{
      pair.public = text;
      return readFile(privateKeyFile,'utf8');
    })
    .then(text=>{
      pair.private = text;
      return Promise.resolve(pair);
    })
    .catch(err=>{
      console.log(err);
      return generateKeyPairs();
    })
}

function generateKeyPairs() {
  console.log('Generating key pair');
  const pair = keypair({
    bits: 2048, // size for the private key in bits. Default: 2048
    e: 65537 // public exponent to use. Default: 65537
  });
  return writeFile(privateKeyFile,pair.private)
    .then(()=>writeFile(publicKeyFile,pair.public))
    .then(()=>Promise.resolve(pair));
}

function loadDeviceSettings(pair) {
  return readFile(deviceSettingsFile,'utf8')
    .then(text=>{
      const json = JSON.parse(text);
      json.encodedPublicKey = pair.public;
      return Promise.resolve(json)
    })
    .catch(err=>{
      console.warn(err);
      return generateDeviceSettings();
    })
}

function generateDeviceSettings(pair) {
  const data = {deviceId:crypto.randomBytes(4).toString('hex'),projectId:'',registryId:''};
  return writeFile(deviceSettingsFile,JSON.stringify(data))
    .then(() => {
    data.encodedPublicKey = pair.public;
    return Promise.resolve(data);
  });
}

function getWifiIPAddress() {
  const interfaces = os.networkInterfaces();
  if(interfaces.wlan0) {
    for (let a of interfaces.wlan0) {
      if (a.family == 'IPv4') {
        return a.address;
      }
    }
  }
  throw 'no wifi address';
}

const http = require('http');

function webServer(settings) {
  const hostname = getWifiIPAddress();
  const port = 8080;
  const server = http.createServer((req, res) => {
    console.log(`requesting ${req.method} ${req.url}`);
    res.writeHead(200, {"Content-Type": "application/json"});
    res.end(JSON.stringify(settings));
  });
  server.listen(port, hostname, () => {
    console.log(`WebServer running at http://${hostname}:${port}/`);
  });
}

function main() {
  getStoreKeyPairs()
    .then(pair=>loadDeviceSettings(pair))
    .then(settings=>{
      console.log(settings);
      advertiseBeacon();
      webServer(settings);
    });
}

main();

