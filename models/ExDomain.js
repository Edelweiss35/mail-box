const mongoose = require('mongoose');

const { Schema } = mongoose;

/*
    ExDomain Schema
*/
const ExDomainSchema = new Schema({
    domain: String
});

ExDomainSchema.statics.isExist = async function(domain){
    var result = await this.find({'domain': domain.toLowerCase()});
    if(result.length == 0)
        return false;
    else
        return true;
}
ExDomainSchema.statics.getDomains = function(){
    return this.find();
}
ExDomainSchema.statics.saveExcludedDomain = function(excludedDomain){
    return this.create({'domain':excludedDomain.toLowerCase()});
}

var ExDomain =  mongoose.model('ExDomainSchema', ExDomainSchema);
module.exports = ExDomain;