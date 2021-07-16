// @ts-ignore
const snmp = require("net-snmp");
const config = require("./johanna.json");

const oidLibrary = {
  "default": require("./oids/_defaults.json"),
  "unifi.switch": require("./oids/unifi.switch.json"),
  "unifi.ap": require("./oids/unifi.ap.json"),
}

class Manager {
  constructor(config){
    this.config = config;
    this.sessions = new Map();
  }

  start(){
    for (const device of this.config.devices) {
      let deviceInstance = new Device(device.ip, device.community || "public", device.libraries);
      this.sessions.set(deviceInstance.hostname, deviceInstance);
      console.log(`Started connection to ${device.ip}`);
    }
  }
}

class Device {
  constructor(ip, communityName, libraries) {
    this.ip = ip;
    this.communityName = communityName;
    this.oids = {
      ...oidLibrary.default,
      ...oidLibrary[libraries]
    };
    this.session = snmp.createSession(ip, communityName);
    this.buffer = {};

    setInterval(async () => {
      this.fetch(this.session, this.oids);
      console.log(this.buffer);
    }, 1000);
  }

  async fetch(){
    this.buffer = await this.get(this.session, this.oids);
  }

  async get(session, oids){
    return new Promise(resolve => {
      let garbage = {};
      session.get(Object.values(oids), (error, varbinds) => {
        if (error) {
          resolve(error)
          console.log(error);
        };
        for (let i in varbinds) {
          if (snmp.isVarbindError(varbinds[i])) console.error(snmp.varbindError(varbinds[i]));
          else garbage[Object.keys(oids)[i]] = varbinds[i].value.toString();
        }
        resolve(garbage);
      });
    });
  }

  get data(){
    return this.buffer;
  }
}
const Johanna = new Manager(config);
Johanna.start();