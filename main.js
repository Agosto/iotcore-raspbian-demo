
const iotcore = require('./iotcore');
const provisioning = require('./provisioning');
const leds = require('./leds');

function main() {
  leds.ledOn(255,0,0);
  provisioning.provision()
    .then(settings=>{
      console.log(settings);
      iotcore.connect(settings).then(client=>{
        client.subscribe(`/devices/${settings.deviceId}/config`);
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
    });
}

main();


// openssl req -x509 -newkey rsa:2048 -keyout rsa_private.pem -nodes -out rsa_cert.pem -subj "/CN=unused"
