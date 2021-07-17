require("colors");
const version = require("./package.json").version;
const snmp = require("net-snmp");
const fs = require('fs');
const connectToXornet = require("./util/connectToXornet");
const getLocation = require("./util/getLocation");
const uuidRegex = /[0-9a-f]{32}/g;
const { v4: uuidv4 } = require("uuid");
console.clear();

console.log(`
         __      __                           
        / /___  / /_  ____ _____  ____  ____ _
   __  / / __ \\/ __ \\/ __ \`/ __ \\/ __ \\/ __ \`/
  / /_/ / /_/ / / / / /_/ / / / / / / / /_/ / 
  \\____/\\____/_/ /_/\\__,_/_/ /_/_/ /_/\\__,_/  v${version}
\n`.cyan)

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
  constructor(configs){
    this.configs = configs;
    this.devices = new Map();
    this.start();
  }

  async start(){
    console.log(`Connecting to devices \n`.blue);
  
    for (const device of this.configs) {
      console.log(` ☄️  Started connection to ${device.name.blue} - ${device.ip.blue}`);
      this.devices.set(device.uuid, new Device(device.uuid, device.type, device.ip, device.community || "public", device.libraries));
    }
    console.log('\n');
    Promise.resolve();
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

/**
 * Gets device's name based on the config's name
 * @param {string} johannaConfigFile the filename of the config
 * @author George Tsotsos
 */
function getDeviceName(johannaConfigFile){
  name = johannaConfigFile.split(".");
  name.pop();
  name.pop();
  name = name.join("");
  return name;
}
/**
 * checks if a config has a uuid and or syntax errors and fixes them
 * @param {json} config the config to check
 * @author George Tsotsos
 */
function checkConfig(config){
  // If theres no UUID or the UUID is invalid for the machine add it or fix it
  if (!config.uuid || !config.uuid.match(uuidRegex)) {
    // Generate the new UUID
    const newConfig = {...config, uuid: uuidv4().replace(/-/g, "")};

    console.log(` 🛠️  Fixing configuration: ${config.filename}`.red);
    
    // Save the new config
    fs.writeFileSync("./configs/" + file, JSON.stringify(newConfig, null, 2));
  }
}

/**
 * Loads all the configs from the ./config folder
 * @author George Tsotsos
 */
function loadConfigs(){
  const configs = [];
  console.log(`Loading configurations \n`.yellow);

  for (file of fs.readdirSync("./configs")){

    // Load config
    let config = JSON.parse(fs.readFileSync("./configs/" + file));

    // Get the name of the device the user has set
    config.name = getDeviceName(file);
    config.filename = file;

    // Check if the config is okay
    checkConfig(config);

    configs.push(config);
    console.log(` ⚡ Loaded configuration: ${file.yellow}`);
  };

  console.log('\n');
  return configs;
}

/**
 * Main entry function
 * @author George Tsotsos
 */
async function main(){
  const location = await getLocation();
  const configs = loadConfigs();
  const Johanna = new Manager(configs);
  const socket = await connectToXornet(location);

  setInterval(() => {
    socket.emit("data", Array.from(Johanna.devices.values()).map(device => device.buffer));
  }, 1000);
}

main();

