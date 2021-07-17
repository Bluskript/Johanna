const snmp = require("net-snmp");
const config = require("./johanna.json");
const connectToXornet = require("./util/connectToXornet");
const getLocation = require("./util/getLocation");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

// TODO: Make this auto import with FS
const oidLibrary = {
  "default": require("./oids/_defaults.json"),
  "unifi.switch": require("./oids/unifi.switch.json"),
  "unifi.ap": require("./oids/unifi.ap.json"),
}

process.env.BACKEND_URL = process.env.NODE_ENV.trim() === "development" ? "http://localhost:8080" : "https://backend.xornet.cloud";
process.env.BACKEND_WS_URL = process.env.NODE_ENV.trim() === "development" ? "ws://localhost:8080" : "wss://backend.xornet.cloud";

/**
 * Main manager class that keeps track of all the devices
 * @param {object} config The johanna.json config
 * @author George Tsotsos
 */
class Manager {
  constructor(config){
    this.config = config;
    this.devices = new Map();

    setInterval(() => {
      console.log(`Currently buffering ${this.devices.length} devices`);
    }, 5000);

  }

  async start(){
    for (const device of this.config.devices) {
      console.log(`Started connection to ${device.ip}`);
      if(!device.uuid) {
        device.uuid = uuidv4().replace(/-/g, "");
        fs.writeFileSync("./johanna.json", JSON.stringify(config, null, 2));
      }
      this.devices.set(device.uuid, new Device(device.uuid, device.type, device.ip, device.community || "public", device.libraries));
      Promise.resolve();
    }
  }
}

/**
 * The device class that makes a connection to a SNMP device
 * And fetches it's data every second
 * @param {string} ip the ip of the device
 * @param {string} communityName The SNMP community name the device broadcasts on
 * @param {array} libraries the array of extra oid libraries for SNMP
 * @author George Tsotsos
 */
class Device {
  constructor(deviceUUID, type, ip, communityName, libraries) {
    this.ip = ip;
    this.type = type;
    this.uuid = deviceUUID;
    this.communityName = communityName;
    this.oids = {
      ...oidLibrary.default,
      ...oidLibrary[libraries]
    };
    this.session = snmp.createSession(ip, communityName);
    this.buffer = {};

    setInterval(async () => {
      this.fetch(this.session, this.oids);
    }, 1000);
  }

  async fetch(){
    this.buffer = {
      uuid: this.uuid,
      type: this.type,
      ...await this.get(this.session, this.oids)
    };
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



async function main(){
  const location = await getLocation();
  const Johanna = new Manager(config);
  Johanna.start();
  const socket = await connectToXornet(location);

  setInterval(() => {
    socket.emit("data", Array.from(Johanna.devices.values()).map(device => device.buffer));
  }, 1000);

}

main();

