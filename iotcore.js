const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');

const privateKeyFile = __dirname + '/rsa_private.pem';
const publicKeyFile = __dirname + '/rsa_cert.pem';
const deviceSettingsFile = __dirname + '/device.json';

function createJwt (projectId, privateKeyFile, algorithm) {
  // Create a JWT to authenticate this device. The device will be disconnected
  // after the token expires, and will have to reconnect with a new token. The
  // audience field should always be set to the GCP project id.
  const token = {
    'iat': parseInt(Date.now() / 1000),
    'exp': parseInt(Date.now() / 1000) + 20 * 60,  // 20 minutes
    'aud': projectId
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, { algorithm: algorithm });
}

function telemetryTopic(deviceId) {
  return `/devices/${deviceId}/events`;
}

function connect(settings) {

  const cloudRegion = "us-central1";
  const mqttClientId = `projects/${settings.projectId}/locations/${cloudRegion}/registries/${settings.registryId}/devices/${settings.deviceId}`;

// With Google Cloud IoT Core, the username field is ignored, however it must be
// non-empty. The password field is used to transmit a JWT to authorize the
// device. The "mqtts" protocol causes the library to connect using SSL, which
// is required for Cloud IoT Core.
  const connectionArgs = {
    host: 'mqtt.googleapis.com',
    port: 8883,
    clientId: mqttClientId,
    username: 'unused',
    password: createJwt(settings.projectId, privateKeyFile, 'RS256'),
    protocol: 'mqtts'
  };

  return new Promise((resolve,reject)=>{
    // Create a client, and connect to the Google MQTT bridge.
    const client = mqtt.connect(connectionArgs);
    client.on('connect', (data) => {
      console.log('connect', data);
      resolve(client);
    });

    client.on('close', (data) => {
      console.log('close', data);
    });

    client.on('error', (err) => {
      console.log('error', err);
    });

    client.on('packetsend', (data) => {
      console.log('packetsend', data);
    });
  });

}

module.exports = {
  connect : connect,
  telemetryTopic: telemetryTopic
};
