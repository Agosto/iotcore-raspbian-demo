const iotcore = require('./lib/iotcore');
const provisioning = require('./lib/provisioning');
const leds = require('./lib/leds');


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
          startPublishing(settings);
        })
      });
      return Promise.resolve();
  });
}

function main() {
  leds.ledOn(255,0,0);
  provisioning.provision()
    .then(settings=>startPublishing(settings))
    /*.then(settings=>{
      console.log(settings);
      iotcore.connect(settings,provisioning.privateKeyFile).then(client=>{
        client.subscribe(iotcore.configTopic(settings.deviceId));
        client.on('message', function (topic, message) {
          // message is Buffer
          console.log(message.toString());
          leds.ledOn(255,255,0,5000);
          //client.end()
        });
        const topic = iotcore.telemetryTopic(settings.deviceId);
        setInterval(()=>{
          client.publish(topic,`${settings.deviceId} ${new Date().toISOString()}`);
          leds.ledOn(0,255,0,5000);
        },(1000*60));
      });
    })*/
    .catch(error=>{
      leds.ledOn(255,0,0);
      console.warn(error);
    });
}

main();


// openssl req -x509 -newkey rsa:2048 -keyout rsa_private.pem -nodes -out rsa_cert.pem -subj "/CN=unused"
