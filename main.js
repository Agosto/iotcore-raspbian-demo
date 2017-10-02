const iotcore = require('./lib/iotcore');
const provisioning = require('./lib/provisioning');
const leds = require('./lib/leds');

const PUBLISH_INTERVAL = 1000*60;

/**
 * connects to IoT Core MQTT bridge, subscribes to the config topic, and publishes to the telemetry topic 1/PUBLISH_INTERVAL.
 * when token expires or connection is blocked, recursively calls itself to reconnect and continue.
 * @param {DeviceSettings} settings
 * @returns {Promise.<null>}
 */
function startPublishing(settings) {
  console.log(settings);
  return connectWithRetry(settings)
    .then(client=>publishUntilError(client,settings))
    .catch(error=>{
      // publishing stopped, restart
      console.log('publishing stopped',error);
      return startPublishing(settings);
    });
}

/**
 * subscribes to the config topic and publishes to the telemetry topic 1/PUBLISH_INTERVAL.
 * returns a Promise that will throw an error when connection expires or is blocked
 * @param {MqttClient} client
 * @param {DeviceSettings} settings
 * @returns {Promise.<object>} throws an error when connection expires or is blocked
 */
function publishUntilError(client,settings) {
  return new Promise((resolve,reject)=>{
    client.subscribe(iotcore.configTopic(settings.deviceId),{qos: 1});
    // listen for config changes
    client.on('message', function (topic, message) {
      try {
        leds.ledOn(255,255,0,5000);
        console.log(message.toString());
        const configs = JSON.parse(message.toString());
        if(configs) {
          provisioning.enableConfigServer(configs.config_server_on,settings);
        }
      } catch(error) {
        console.warn(error);
      }
    });

    // publish data every min
    const topic = iotcore.telemetryTopic(settings.deviceId);
    //client.publish(topic, `${settings.deviceId} ${new Date().toISOString()}`);
    const timerId = setInterval(()=>{
      client.publish(topic, `${settings.deviceId} ${new Date().toISOString()}`);
      leds.ledOn(0, 255, 0, 5000);
    },PUBLISH_INTERVAL);

    // error handler
    // likely an expired token or block communications
    client.once('error', (error) => {
      console.log('error', error);
      clearInterval(timerId);
      // end connection and reject
      client.end(true,()=>{
        reject(error)
      })
    });
  });
}


/**
 * simple timeout wrapped in a promise
 * @param {int} delay ms to delay
 * @param {object} [result] result to use on the resolve
 * @returns {Promise}
 */
function delayedPromise(delay,result) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(result);
    }, delay);
  });
}

/**
 * Connects to ito core.  If an error occurs, will continue to retry every PUBLISH_INTERVAL until successful
 * @param {DeviceSettings} settings
 */
function connectWithRetry(settings) {
  return iotcore.connect(settings,provisioning.privateKeyFile)
    .catch(error=>{
      leds.ledOn(255, 0, 0, 5000);
      console.warn('connect error',error);
      console.log(`attempting reconnect in ${PUBLISH_INTERVAL}ms`);
      return delayedPromise(PUBLISH_INTERVAL).then(()=>connectWithRetry(settings));
    });
}

/**
 * main entry point
 */
function main() {
  leds.ledOn(255,0,0);
  // wait for provisioning
  provisioning.provision()
    // unrecoverable error
    .catch(error=>{
      leds.ledOn(255,0,0);
      console.warn(error);
    })
    // connect to IoT core
    .then(settings=>startPublishing(settings))
}

main();
