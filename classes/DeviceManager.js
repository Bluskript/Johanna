const Device = require("./Device");

/**
 * Main DeviceManager class that keeps track of all the devices
 * @param {object} config The johanna.json config
 * @author George Tsotsos
 */
module.exports = class DeviceManager {
  constructor(configs) {
    this.configs = configs;
    this.devices = new Map();
    this.start();
  }

  async start() {
    console.log(`Connecting to devices \n`.blue);

    for (const device of this.configs) {
      console.log(` ☄️  Started connection to ${device.name.blue} - ${device.ip.blue}`);
      this.devices.set(device.uuid, new Device(device.uuid, device.type, device.ip, device.community || "public", device.libraries));
    }
    console.log("\n");
    Promise.resolve();
  }
};
