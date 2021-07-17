require("colors");
const version = require("./package.json").version;
const connectToXornet = require("./util/connectToXornet");
const DeviceManager = require("./classes/DeviceManager");
const ConfigManager = require("./classes/ConfigManager");
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
 * Main entry function
 * @author George Tsotsos
 */
async function main(){
  const configManager = new ConfigManager();
  const deviceManager = new DeviceManager(configManager.configs);
  const socket = await connectToXornet();

  setInterval(() => {
    const devicesData = Array.from(deviceManager.devices.values()).map(device => device.buffer);
    socket.emit("data", devicesData);
  }, 1000);
}

main();

