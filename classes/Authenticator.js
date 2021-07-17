const axios = require('axios');
const fs = require('fs');

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
        return axios
            .post(`${this.host}/login`, {
                username: this.user,
                password: this.password
            })
            .then((response) => {
                console.log(response.data.message);
                this.token = response.data.token;
                this.saveToken();
            })
            .catch((error) => {
                console.log(error.response.data.message);
                process.exit(1);
            });
    }
    
    async login() {
        await this.authenticate("", ""); // Temp way to login (this should eventually be a GUI of some sort)
    }

    saveToken() {
        fs.writeFileSync(process.env.MAIN_CONFIG, JSON.stringify({ token: this.token }))
    }

    getToken() {
        return this.token;
    }
}