const axios = require('axios');
const fs = require('fs');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const JohannaConfig = require("../johanna.json");
/** 
 * This class is used to authenticate users and get their access token.
 * @user Login Username
 * @password Login Password
 * @token The access token
 * @author Connor O'Keefe
*/
module.exports = class Authenticator {
    constructor() {
        this.token = null;
        this.user = null;
        this.password = null;
        this.host = process.env.BACKEND_URL;
    }


    /**
     * @param user The username of the user
     * @param password The password of the user
     */
    async authenticate(user, password) {
        this.user = user;
        this.password = password;
        try {
            var response = await axios.post(`${this.host}/login`, {
                username: this.user,
                password: this.password
            });
            console.log(response.data.message);
            this.token = response.data.token; 
            this.saveToken();
        } catch (error) {
            switch (error.response.status) {
                case 400:
                    console.log("Invalid login credentials, check your config - retrying in 10 seconds".red);
                    break;
                default:
                    console.log("Couldn't connect to the backend - retrying in 10 seconds".red);
                    break;
            }
            await sleep(10000);
            await this.login();
        }
    }
    
    async login() {
        await this.authenticate(JohannaConfig.username, JohannaConfig.password);
    }

    saveToken() {
        fs.writeFileSync(process.env.MAIN_CONFIG, JSON.stringify({ token: this.token }, null, 2))
    }

    getToken() {
        return this.token;
    }
}