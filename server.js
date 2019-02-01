var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var formidable = require('formidable');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

var app = express();
app.set('view engine', 'ejs');

var { mongoDB } = require('./config');
var { isRanking } = require('./constant');
var Sheet = require('./models/Sheet');
var ExDomain = require('./models/ExDomain');

// set the port of our application
// process.env.PORT lets the port be set by Heroku
var port = process.env.PORT || 8080;

app.use(express.static(__dirname + '/app'));  
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({extended:true}));

// connection and express server
console.log('Connection established');
mongoDB.connection();

var exDomains = ['Yelp.com', 'Angieslist.com', 'Homeadvisor.com', 'Thumbtack.com'];

app.post('/fileupload', async function (req, res, next) {
  // drop db
  await Sheet.removeAll();
  // parse csv and store on db
  await parseCSV_SaveDB(req);
  //get google ranking
  getGoogleRanking();
  
  res.end('Saved');
});

app.get('/checkRankingState', function(req, res){
  res.json({isRanking});
});

app.get('/getCSVData', async function (req, res) {
  var result = await Sheet.getSheets();
  res.json(result);
});

app.get('/', function(req, res){
  res.render('home');
});

app.get('/table', function(req, res){
  res.render('table');
});

app.listen(port, async function(){
  console.log("Express server listening on port " + app.get('port'));

  for( var i in exDomains ){
    var domain = exDomains[i];
    var isExist = await ExDomain.isExist(domain);
    if(!isExist)
      await ExDomain.saveExcludedDomain(domain);
  }
});

getGoogleRanking= async ()=> {
  console.log('getGoogleRanking');
  isRanking = false;

  var queryResult = await getGoogleQueryResult('Plumbers Los Angeles');
  queryResult = removeExDomainsFromQueryResult(queryResult);
  await getRankFromQueryResult(queryResult);

  isRanking = true;
  console.log('getGoogleRanking finished');
}

getGoogleQueryResult= async (query)=>{
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.goto('https://google.com', { waitUntil: 'networkidle0' })
  const title = await page.title()
  console.log(title);

  var searchResultDomains = [];
  if(title == "Google"){
    await page.type('input[name=q]', query, { delay: 100 })
    await page.click('input[type="submit"]')
    await page.waitFor(15000);
    const anchorHandle = await page.$x('//div[@class="r"]/*[1]');

    for (const anchor of anchorHandle) {
      let text = await page.evaluate(ele => ele.href, anchor);
      searchResultDomains.push(text);
    }

    for( var i = 2; i < 7; i++){
      await page.click('a[aria-label="Page '+i+'"]');
      await page.waitFor(15000);

      const anchorHandle = await page.$x('//div[@class="r"]/*[1]');
      for (const anchor of anchorHandle) {
        let text = await page.evaluate(ele => ele.href, anchor);
        searchResultDomains.push(text);
      }
    }
  }

  await browser.close();
  return searchResultDomains;
}

getRankFromQueryResult = async (queryResult) => {
  console.log('getRankFromQueryResult');
  var sheetData = await Sheet.getSheets();
  for( var j in sheetData ){
    var ele = sheetData[j];
    var websiteUrl = ele.Website.toLowerCase();
    var id = ele._id;
    var gotRank = false;
    for( var i = 0; i < 50; i++){
      var url = queryResult[i].toLowerCase();
      gotRank = url.includes(websiteUrl);
      if(gotRank){
        saveGoogleRanking(id, '' + (i + 1));
        console.log(j, i+1);
        break;
      }
    }
    if(!gotRank)
      saveGoogleRanking(id, '50+')
  }
  console.log('getRankFromQueryResult finished');
}

saveGoogleRanking = async (id, ranking) => {
  await Sheet.saveGoogleRanking(id, ranking);
}

removeExDomainsFromQueryResult =(result) => {
  for( var i = 0; i < result.length; i++){
    var url = result[i].toLowerCase();
    for( var j in exDomains){
      var exDomain = exDomains[j].toLowerCase();
      var isExDomain = url.includes(exDomain);
      if(isExDomain){
        result.splice(i, 1);
        i = i-1
        break;
      }
    }
  }
  return result;
}

parseCSV_SaveDB = (req) => {
  return new Promise((resolve)=>{
    var form = new formidable.IncomingForm();
    form.parse(req, function (err, fields, files) {
      var path = files.filetoupload.path;
      fs.createReadStream(path)
      .pipe(csv())
      .on('data', function(data){
        try {
          //perform the operation
          Sheet.saveSheet(data.Company, data.Address1, data.Address2, data.ZIPCode, data.City, 
                                data.Region, data.Country, data.Phone, data.Contact, data.Website, 
                                data.Responsive, data.Email, data.Facebook, data.Twitter, data.GooglePlus, 
                                data.Linkedin, data.Instagram, data.Youtube, data.Facebook, data.Keyword);
        }
        catch(err) {
          //error handler
          console.log('error : ', err);
        }
      })
      .on('end',async function(){
        resolve();
      });  
    });
  });
}