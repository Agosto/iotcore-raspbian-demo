
let blinkt;

try {
  blinkt = require('blinkt');
} catch (error) {
  console.log(error);
  console.warn('no connected blinkt');
  blinkt = null;
}

function ledOn(r,g,b,time) {
  if(blinkt) {
    blinkt.setAll(r, g, b, 0.25);
    try {
      blinkt.show();
      if (time) {
        setTimeout(() => {
          blinkt.clear();
        }, time)
      }
    } catch (e) {
      console.warn(2);
      console.warn('No blinkt');
    }
  }
}

module.exports = {
  ledOn: ledOn
};
