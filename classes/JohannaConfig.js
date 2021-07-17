const fs = require("fs");

/**
 * This class is responsible for creating the johanna.json
 * and parsing its settings, whilst saving login tokens
 * and updating it live
 * @author George Tsotsos
 */
module.exports = class JohannaConfig {
  constructor() {
    this.config = this.loadConfig();
    if (!this.config) this.createNew();
  }

  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync("./johanna.json"));
    } catch (error) {
      if (error) return undefined;
    }
  }

  createNew() {
    this.config = {
      username: "",
      password: "",
    };
    this.save();
  }

  save() {
    fs.writeFileSync("./johanna.json", JSON.stringify(this.config, null, 2));
  }
};
