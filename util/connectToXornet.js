const io = require("socket.io-client");
const getLocation = require("./getLocation");

/**
 * Connects to the Xornet Backend and sends system statistics every second.
 */
module.exports = async function connectToXornet(token) {
  return new Promise(async (resolve, reject) => {
    let socket = io.connect(process.env.BACKEND_WS_URL, {
      reconnect: true,
      auth: {
        geolocation: await getLocation(),
        type: "johanna",
        token,
      },
    });
    socket.once("connect", () => {
      console.log(`🌊 Connected to Xornet - ${process.env.BACKEND_WS_URL}\n`.cyan);
      resolve(socket);
    });
  });
};
