const mongoose = require('mongoose');

const { Schema } = mongoose;

/*
    TopRank Schema
*/
const TopRankSchema = new Schema({
    query: String,
    domain: String
});


TopRankSchema.statics.saveTopRankDomain = function(query, domain){
    return this.create({query, domain});
}


var TopRank =  mongoose.model('TopRankSchema', TopRankSchema);
module.exports = TopRank;