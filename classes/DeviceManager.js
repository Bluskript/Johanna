const Device = require("./Device");
const Authenticator = require("./Authenticator");
const auth = new Authenticator();

/**
 * Main DeviceManager class that keeps track of all the devices
 * @param {object} config The johanna.json config
 * @author George Tsotsos
 */
module.exports = class DeviceManager {
  constructor(configs, token) {
    this.configs = configs;
    this.devices = new Map();
    this.token = token;
    this.start();
  }

  async start() {
    console.log(`Connecting to devices \n`.blue);

    this.devices.set("token", this.token);
    for (const device of this.configs) {
      console.log(` ☄️  Started connection to ${device.name.blue} - ${device.ip.blue}`);
      this.devices.set(device.uuid, new Device(device.uuid, device.type, device.ip, device.community || "public", device.library));
    }
    console.log("\n");
    Promise.resolve();
  }
};
