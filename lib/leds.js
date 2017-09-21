let blinkt;

try {
  blinkt = require('blinkt');
} catch (error) {
  console.log(error);
  console.warn('no connected blinkt');
  blinkt = null;
}

/**
 * generic method to turn on led.  only work for blinkt right now but could support other hats
 * @param {int} r
 * @param {int} g
 * @param {int} b
 * @param {int} [time] timeout to turn display off
 */
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
