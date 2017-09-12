
let blinkt;

try {
  blinkt = require('blinkt');
} catch (error) {
  console.log(error);
  console.warn('no connected blinkt');
  blinkt = null;
}

function ledOn(r,g,b,time) {
  try {
    blinkt.setAll(r, g, b, 0.2);
    blinkt.show();
    if (time) {
      setTimeout(() => {
        blinkt.clear();
        blinkt.show();
      }, time)
    }
  } catch (e) {
    console.warn('No led found');
  }
}

module.exports = {
  ledOn: ledOn
};
