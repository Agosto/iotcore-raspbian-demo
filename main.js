const iotcore = require('./lib/iotcore');
const provisioning = require('./lib/provisioning');
const leds = require('./lib/leds');

/**
 * connects to IoT Core MQTT bridge, subscribes to the config topic, and publishes to the telemetry topic 1/min.
 * when token expires, recursively calls this function to reconnect and continue.
 * @param {DeviceSettings} settings
 * @returns {Promise.<null>}
 */
function startPublishing(settings) {
  console.log(settings);
  return iotcore.connect(settings,provisioning.privateKeyFile)
    .then(client=>{
      client.subscribe(iotcore.configTopic(settings.deviceId));
      // listen for config changes
      client.on('message', function (topic, message) {
        console.log(message.toString());
        leds.ledOn(255,255,0,5000);
      });

      // publish data every min
      const topic = iotcore.telemetryTopic(settings.deviceId);
      //client.publish(topic, `${settings.deviceId} ${new Date().toISOString()}`);
      const timerId = setInterval(()=>{
        client.publish(topic, `${settings.deviceId} ${new Date().toISOString()}`);
        leds.ledOn(0, 255, 0, 5000);
      },(1000*60));

      // error handler for expired token
      client.on('error', (err) => {
        //console.log('error', err);
        clearInterval(timerId);
        client.end(true,()=>{
          console.log('token expired, reconnecting..');
          // recursive callback
          startPublishing(settings).catch(e=>console.warn(e));
        })
      });
      return Promise.resolve();
  });
}

/**
 * main entry point
 */
function main() {
  leds.ledOn(255,0,0);
  // wait for provisioning
  provisioning.provision()
    // connect to IoT core
    .then(settings=>startPublishing(settings))
    // unrecoverable error
    .catch(error=>{
      leds.ledOn(255,0,0);
      console.warn(error);
    });
}

main();