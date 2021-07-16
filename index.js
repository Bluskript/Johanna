// @ts-ignore
const snmp = require("net-snmp");
const config = require("./johanna.json");

const oidLibrary = {
  "default": require("./oids/_defaults.json"),
  "unifi.switch": require("./oids/unifi.switch.json"),
}

class Manager {
  constructor(config){
    this.config = config;
    this.sessions = {};
  }

  start(){
    for (const device of this.config.devices) {
      this.sessions[device] = new Device(device.ip, device.community || "public", device.libraries),
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
    console.log(this.oids);
    this.session = snmp.createSession(ip, communityName);
    this.buffer = {};

    setInterval(async () => {
      this.fetch(this.session, this.oids);
    }, 1000);
  }

  async fetch(){
    this.buffer = await this.get(this.session, this.oids);
  }

  async get(session, oids){
    return new Promise(resolve => {
      let garbage = {};
      session.get(Object.values(oids), (error, varbinds) => {
        if (error) resolve(error);
        for (let i in varbinds) {
          if (snmp.isVarbindError(varbinds[i])) console.error(snmp.varbindError(varbinds[i]));
          else garbage[Object.keys(oids)[i]] = varbinds[i].value.toString();
        }
        console.log(garbage);
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