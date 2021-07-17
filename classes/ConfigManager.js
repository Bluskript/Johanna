const fs = require("fs");
const uuidRegex = /[0-9a-f]{32}/g;
const { v4: uuidv4 } = require("uuid");
JSON.fix = require("json-fixer");

/**
 * This class loads, parses & fixes
 * configurations for devices
 * @author George Tsotsos
 */
module.exports = class ConfigManager {
  constructor() {
    this.configs = [];
    this.loadConfigs();
  }

  /**
   * Loads all the configs from the ./config folder
   * @author George Tsotsos
   */
  loadConfigs() {
    console.log(`Loading configurations \n`.yellow);

    // Check if folder exists
    if (!fs.existsSync("./configs")) {
      fs.mkdirSync("configs");
      console.log(` ⚡ Created configuration folder`);
    }

    let configFiles = fs.readdirSync('./configs');

    if (configFiles.length == 0) {
      console.log(` ⚡ You have no configurations in your configs folder!`.red)
    };

    for (let file of fs.readdirSync("./configs").filter((file) => file.endsWith("johanna.json"))) {

      // Check if the config is okay
      let config = this.checkAndLoadConfig(file);

      // Get the name of the device the user has set
      config.name = this.getDeviceName(file);
      config.filename = file;

      this.configs.push(config);
      console.log(` ⚡ Loaded configuration: ${file.yellow}`);
    }

    console.log("\n");
  }

  /**
   * Gets device's name based on the config's name
   * @param {string} johannaConfigFile the filename of the config
   * @author George Tsotsos
   */
  getDeviceName(johannaConfigFile) {
    let name = johannaConfigFile.split(".");
    name.pop();
    name.pop();
    name = name.join("");
    return name;
  }

  /**
   * checks if a config has a uuid and or syntax errors and fixes them
   * @param {json} config the config to check
   * @param {string} file the file of the config
   * @author George Tsotsos
   */
  checkAndLoadConfig(file) {
    try {
      var config = JSON.parse(fs.readFileSync("./configs/" + file));
    } catch (error) {
      console.log(` 🛠️  Fixing configuration syntax: ${file}`.red);
      const { data, changed } = JSON.fix(fs.readFileSync("./configs/" + file, "utf-8"), { verbose: false });
      var config = data;
      this.save(file, config);
    }

    // If theres no UUID or the UUID is invalid for the machine add it or fix it
    if (!config.uuid || !config.uuid.match(uuidRegex)) {
      // Generate the new UUID
      const newConfig = { ...config, uuid: uuidv4().replace(/-/g, "") };
      console.log(` 🛠️  Fixing UUID configuration: ${file}`.red);
      this.save(file, newConfig);
    }

    return config;
  }

  save(file, newConfig) {
    fs.writeFileSync("./configs/" + file, JSON.stringify(newConfig, null, 2));
  }
};
