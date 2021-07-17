const snmp = require("net-snmp");
const DeviceParsers = require("./DeviceParsers");
// TODO: Make this auto import with FS
const oidLibrary = {
  default: require("../oids/_defaults.json"),
  "unifi.switch": require("../oids/unifi.switch.json"),
  "unifi.ap": require("../oids/unifi.ap.json"),
  idrac: require("../oids/idrac.json"),
};

/**
 * The device class that makes a connection to a SNMP device
 * And fetches it's data every second
 * @param {string} ip the ip of the device
 * @param {string} uuid the uuid of the device
 * @param {string} communityName The SNMP community name the device broadcasts on
 * @param {array} library the extra oid library for SNMP
 * @author George Tsotsos
 */
module.exports = class Device {
  constructor(uuid, type, ip, communityName, library) {
    this.ip = ip;
    this.type = type;
    this.uuid = uuid;
    this.communityName = communityName;
    this.oids = {
      ...oidLibrary.default,
      ...oidLibrary[library],
    };
    this.library = library;
    this.session = snmp.createSession(ip, communityName);
    this.buffer = {};
    setInterval(async () => {
      this.fetch(this.session, this.oids);
    }, 1000);
  }

  async fetch() {
    let report = {
      uuid: this.uuid,
      type: this.type,
      library: this.library,
      ...(await this.get(this.session, this.oids)),
    };

    // Parse the report with the correct parser if it exists from the
    // DeviceParsers based on the library the user has set in the johanna config
    DeviceParsers[this.library] ? (this.buffer = DeviceParsers[this.library](report)) : (this.buffer = report);
  }

  /**
   * Gets SNMP data from a device
   * @param {Session} session the tcp session with the device
   * @param {*} oids the oids to get data of
   * @author George Tsotsos
   */
  async get(session, oids) {
    return new Promise((resolve) => {
      let garbage = {};
      session.get(Object.values(oids), (error, varbinds) => {
        if (error) {
          resolve(error);
          console.log(` ❌ ${this.ip.red} timed out, check configuration, is the IP valid?`);
        }
        for (let i in varbinds) {
          if (snmp.isVarbindError(varbinds[i])) console.error(snmp.varbindError(varbinds[i]));
          else garbage[Object.keys(oids)[i]] = varbinds[i].value.toString();
        }
        resolve(garbage);
      });
    });
  }

  get data() {
    return this.buffer;
  }
};
