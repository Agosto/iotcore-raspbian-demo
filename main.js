const eddystoneBeacon = require('eddystone-beacon');

const fs = require('fs');
//const keypair = require('keypair');
const Promise = require('promise');
const crypto = require("crypto");
const os = require('os');

const readFile = Promise.denodeify(fs.readFile);
const writeFile = Promise.denodeify(fs.writeFile);

const privateKeyFile = __dirname + '/rsa_private.pem';
const publicKeyFile = __dirname + '/rsa_cert.pem';
const deviceSettingsFile = __dirname + '/device.json';

const iotcore = require('./iotcore');

function advertiseBeacon() {
  const url = "http://"+getWifiIPAddress();
  eddystoneBeacon.advertiseUrl(url);
}

const spawn = require('child_process').spawn;

function generateKeyPair() {
  return new Promise((resolve,reject)=>{
    const args =  [ 'req', '-x509', '-newkey', 'rsa:2048', '-keyout', privateKeyFile,'-nodes', '-out', publicKeyFile, '-subj',   '/CN=unused'];
    const keygen = spawn('openssl', args);
    keygen.on('exit', () => {
      resolve('rsa_private');
    });
  }).then(()=>getStoreKeyPair())
}

function getKeyPair() {
  return getStoreKeyPair()
    .catch(err=>generateKeyPair())
}

function getStoreKeyPair() {
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
    });
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
      return generateDeviceSettings(pair);
    })
}

function generateDeviceSettings(pair) {
  const data = {deviceId:'device-'+crypto.randomBytes(4).toString('hex'),projectId:'',registryId:''};
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
      if (a.family === 'IPv4') {
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
    if(req.method==="POST") {
      let body = '';
      req.on('data', function(chunk) {
        body += chunk;
      });
      req.on('end', function() {
        console.log(body);
        const bodyJson = JSON.parse(body);
        settings.projectId = bodyJson.projectId;
        settings.registryId = bodyJson.registryId;
        writeFile(deviceSettingsFile,JSON.stringify(settings))
          .then(()=>{
            res.writeHead(200, {"Content-Type": "application/json"});
            res.end(JSON.stringify(settings));
          });
      });
      //console.log(req.body);
    } else {
      res.writeHead(200, {"Content-Type": "application/json"});
      res.end(JSON.stringify(settings));
    }
  });
  server.listen(port, hostname, () => {
    console.log(`WebServer running at http://${hostname}:${port}/`);
  });
}

function main() {
  getKeyPair()
    .then(pair=>loadDeviceSettings(pair))
    .then(settings=>{
      console.log(settings);
      advertiseBeacon();
      webServer(settings);
      iotcore.connect(settings).then(client=>{
        const topic = iotcore.telemetryTopic(settings.deviceId);
        setInterval(()=>client.publish(topic,`${settings.deviceId} ${new Date().toISOString()}`),(1000*60));
        client.subscribe(`/devices/${settings.deviceId}/config`);
        client.on('message', function (topic, message) {
          // message is Buffer
          console.log(message.toString())
          //client.end()
        })
      });
    });
}

main();

// openssl req -x509 -newkey rsa:2048 -keyout rsa_private.pem -nodes -out rsa_cert.pem -subj "/CN=unused"
