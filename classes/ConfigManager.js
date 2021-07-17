const fs = require('fs');
const uuidRegex = /[0-9a-f]{32}/g;
const { v4: uuidv4 } = require("uuid");

/**
 * This class loads, parses & fixes 
 * configurations for devices
 * @author George Tsotsos
 */
module.exports = class ConfigManager {
  constructor(){
    this.configs = [];
    this.loadConfigs();
  }

  /**
   * Loads all the configs from the ./config folder
   * @author George Tsotsos
   */
  loadConfigs(){
    console.log(`Loading configurations \n`.yellow);

    for (let file of fs.readdirSync("./configs")){

      // Load config
      let config = JSON.parse(fs.readFileSync("./configs/" + file));

      // Get the name of the device the user has set
      config.name = this.getDeviceName(file);
      config.filename = file;

      // Check if the config is okay
      this.check(config);

      this.configs.push(config);
      console.log(` ⚡ Loaded configuration: ${file.yellow}`);
    };

    console.log('\n');
  }

  /**
   * Gets device's name based on the config's name
   * @param {string} johannaConfigFile the filename of the config
   * @author George Tsotsos
   */
  getDeviceName(johannaConfigFile){
    let name = johannaConfigFile.split(".");
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
  check(config){
    // If theres no UUID or the UUID is invalid for the machine add it or fix it
    if (!config.uuid || !config.uuid.match(uuidRegex)) {
      // Generate the new UUID
      const newConfig = {...config, uuid: uuidv4().replace(/-/g, "")};

      console.log(` 🛠️  Fixing configuration: ${config.filename}`.red);
      
      // Save the new config
      fs.writeFileSync("./configs/" + config.filename, JSON.stringify(newConfig, null, 2));
    }
  }
}