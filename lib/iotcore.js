const fs = require('fs');
const jwt = require('jsonwebtoken');
const mqtt = require('mqtt');

/**
 * Create a JWT to authenticate this device.
 * @param {string} projectId
 * @param {string} privateKeyFile
 * @param {string} algorithm
 * @returns {string}
 */
function createJwt (projectId, privateKeyFile, algorithm) {
  // audience field should always be set to the GCP project id.
  const token = {
    'iat': parseInt(Date.now() / 1000),
    'exp': parseInt(Date.now() / 1000) + 20 * 60,  // 20 minutes
    'aud': projectId
  };
  const privateKey = fs.readFileSync(privateKeyFile);
  return jwt.sign(token, privateKey, { algorithm: algorithm });
}

/**
 * gets topic for publishing telemetry data
 * @param {string} deviceId
 * @returns {string}
 */
function telemetryTopic(deviceId) {
  return `/devices/${deviceId}/events`;
}

/**
 * gets topic for subscribing to config data
 * @param {string} deviceId
 * @returns {string}
 */
function configTopic(deviceId) {
  return `/devices/${deviceId}/config`;
}

/**
 * Connects to IoT Core MQTT bridge and returns a promise that resolves to a MQTT client once connected.
 * @param {DeviceSettings} settings
 * @param {String} privateKeyFile
 * @returns {Promise.<MqttClient>}
 */
function connect(settings,privateKeyFile) {

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
      client.removeAllListeners('error');
      console.log('connect', data);
      resolve(client);
    });

    // if error occurs, reject promise
    client.once('error', (err) => {
      //console.log('error', err);
      client.end();
      reject(err);
    });

    client.on('packetsend', (data) => {
      console.log('packetsend', data);
    });
  });

}

module.exports = {
  connect : connect,
  telemetryTopic: telemetryTopic,
  configTopic: configTopic
};
