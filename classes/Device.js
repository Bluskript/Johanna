const snmp = require("net-snmp");

// TODO: Make this auto import with FS
const oidLibrary = {
  "default": require("../oids/_defaults.json"),
  "unifi.switch": require("../oids/unifi.switch.json"),
  "unifi.ap": require("../oids/unifi.ap.json"),
}

/**
 * The device class that makes a connection to a SNMP device
 * And fetches it's data every second
 * @param {string} ip the ip of the device
 * @param {string} communityName The SNMP community name the device broadcasts on
 * @param {array} libraries the array of extra oid libraries for SNMP
 * @author George Tsotsos
 */
module.exports = class Device {
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

  /**
   * Gets SNMP data from a device
   * @param {Session} session the tcp session with the device
   * @param {*} oids the oids to get data of
   * @author George Tsotsos
   */
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