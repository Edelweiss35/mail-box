const mongoose = require('mongoose');

//MongoDB configuration & connection
const mongoDB = {
  url:'mongodb://craigneil:craigneil123@ds117545.mlab.com:17545/sheet',
  config: {
    config: { autoIndex: false }
  },
  connection:function(){
    let self=this;
    mongoose.connect(this.url, this.config)
    mongoose.connection.on('connected', function () {
        console.log('Mongoose connection open to ' + self.url);
    });
    mongoose.connection.on('error',function (err) {
        console.log('Mongoose connection error: ' + err);
    });
    mongoose.connection.on('disconnected', function () {
        console.log('Mongoose connection disconnected');
    });
    return mongoose;
  }
}

exports.mongoDB = mongoDB;