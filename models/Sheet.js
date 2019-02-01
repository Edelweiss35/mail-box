const mongoose = require('mongoose');

const { Schema } = mongoose;

/*
    Sheet Schema
*/
const SheetSchema = new Schema({
    Company: String,
    Address1 : String,
    Address2 : String,
    ZIPCode : String,
    City : String,
    Region: String,
    Country: String,
    Phone: String,
    Contact: String,
    Website: String,
    Responsive: String,
    Email :  String,
    Facebook: String,
    Twitter: String,
    GooglePlus: String,
    Linkedin: String,
    Instagram: String,
    Youtube: String,
    Facebook: String,
    Keyword: String,
    GoogleRank: String,
    Query: String
});

SheetSchema.statics.setGoogleRanking = function(id, GoogleRank){
    return this.updateOne({_id: id}, { GoogleRank });
}
SheetSchema.statics.getSheets = function(){
    return this.find();
}
SheetSchema.statics.removeAll = function(){
    return this.deleteMany();
}
SheetSchema.statics.saveSheet = function(Company, Address1, Address2, ZIPCode, City, Region, Country, Phone, Contact, Website, Responsive, Email, Facebook, Twitter, GooglePlus, Linkedin, Instagram, Youtube, Facebook, Keyword){
    return this.create({ Company, Address1, Address2, ZIPCode, City, Region, Country, Phone, Contact, Website, Responsive, Email, Facebook, Twitter, GooglePlus, Linkedin, Instagram, Youtube, Facebook, Keyword, 'GoogleRank': 0, 'Query':'Plumbers Los Angeles'});
}

var Sheet =  mongoose.model('SheetSchema', SheetSchema);
module.exports = Sheet;