require("colors");
const version = require("./package.json").version;
const fs = require('fs');
const connectToXornet = require("./util/connectToXornet");
const getLocation = require("./util/getLocation");
const uuidRegex = /[0-9a-f]{32}/g;
const { v4: uuidv4 } = require("uuid");
const DeviceManager = require("./classes/DeviceManager");
console.clear();

console.log(`
         __      __                           
        / /___  / /_  ____ _____  ____  ____ _
   __  / / __ \\/ __ \\/ __ \`/ __ \\/ __ \\/ __ \`/
  / /_/ / /_/ / / / / /_/ / / / / / / / /_/ / 
  \\____/\\____/_/ /_/\\__,_/_/ /_/_/ /_/\\__,_/  v${version}
\n`.cyan)

process.env.BACKEND_URL = process.env.NODE_ENV.trim() === "development" ? "http://localhost:8080" : "https://backend.xornet.cloud";
process.env.BACKEND_WS_URL = process.env.NODE_ENV.trim() === "development" ? "ws://localhost:8080" : "wss://backend.xornet.cloud";


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
  const deviceManager = new DeviceManager(configs);
  const socket = await connectToXornet(location);

  setInterval(() => {
    const devicesData = Array.from(deviceManager.devices.values()).map(device => device.buffer);
    socket.emit("data", devicesData);
  }, 1000);
}

main();

