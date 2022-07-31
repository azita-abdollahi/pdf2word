const mongoose = require('mongoose');
const config= require('config');
module.exports = mongoose.connect(config.get("MONGO_URI"),
      {
        auth: {
          username: config.get("MONGO_USERNAME"),
          password: config.get("MONGO_PASSWORD"),
        },
        authSource: "admin",
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
