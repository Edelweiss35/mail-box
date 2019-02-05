var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var formidable = require('formidable');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

var app = express();
app.set('view engine', 'ejs');

const { createWebsocket } = require('./websocket');
var { mongoDB } = require('./config');
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
  // get google ranking
  // getGoogleRanking();
  // get screenshots
  getScreenshots();
  console.log('Saved all data');
  res.end('Saved');
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

var ws = undefined;

var server = app.listen(port, async function(){
  console.log("Express server listening on port " + app.get('port'));
 
  ws = await createWebsocket(server);
  
  for( var i in exDomains ){
    var domain = exDomains[i];
    var isExist = await ExDomain.isExist(domain);
    if(!isExist)
      await ExDomain.saveExcludedDomain(domain);
  }
  // getScreenshots();
  // getGoogleRanking();
});
getGoogleRanking= async ()=> {
  console.log('getGoogleRanking');

  var result = await Sheet.getUnRankedSheets();
  var j = 0;
  for( var i in result ){
    j++;
    if(j > 100)
      break;
    const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
    const page = await browser.newPage();
    page.once('load', () => console.log('Page loaded!'));
    await page.goto('https://google.com', { waitUntil: 'networkidle0' });

    var ele = result[i];
    var id = ele._id;
    var website = ele.Website;
    var kw = ele.Keyword;
    var city = ele.City;
    var query = city + ' ' + kw;
    console.log(i, query);
    var queryResult = await getGoogleQueryResult(page, query);
    var newResult = removeExDomainsFromQueryResult(queryResult);
    var queryRank = await getRankFromQueryResult(newResult, website);
    console.log(i, query, queryRank);

    await Sheet.updateData(id, 'Query', query);
    await Sheet.updateData(id, 'GoogleRank', queryRank);

    await browser.close();
  }
  
  
  console.log('getGoogleRanking finished');
}

getGoogleQueryResult= async (page, query)=>{
  
  const navigationPromise = page.waitForNavigation({ waitUntil: 'domcontentloaded'});
  var queryResult = [];
  
  await page.evaluate(function() { document.querySelector('input[name=q]').value = ''; });
  await page.type('input[name=q]', query, { delay: 100 });
  await page.keyboard.press('Enter');
  await navigationPromise;
  // await page.waitFor(5000);

  try{
    const anchorHandle = await page.$x('//div[@class="r"]/a[1]');
    console.log(1, 'length', anchorHandle.length);
    for (const anchor of anchorHandle) {
      let text = await page.evaluate(ele => ele.href, anchor);
      queryResult.push(text);
    }
  }catch(error){
    console.log(error)
  }

  for( var k = 3; k < 7; k++){
    console.log('k = ', k);
    try{
      await navigationPromise
      await page.click('#nav > tbody > tr > td:nth-child('+k+') > .fl')

      await navigationPromise
      await page.waitFor(4000);
      
    } catch(error){
      console.log(error);
    }

    const anchorHandle1 = await page.$x('//div[@class="r"]/a[1]');
    
    console.log(k, 'length', anchorHandle1.length);
    for (const anchor1 of anchorHandle1) {
      let text = await page.evaluate(ele => ele.href, anchor1);
      queryResult.push(text);
    }
  }
    
  await page.close();
  console.log(queryResult.length);
  return queryResult;
}

getAvailableLinks = async (page, resolve)=>{
  const anchorHandle = await page.$x('//div[@class="r"]/a[1]');
  console.log('length',anchorHandle.length);
  if(anchorHandle.length > 0){
    resolve(anchorHandle);
  }else
    setTimeout(function(){ getAvailableLinks(page, resolve)}, 100);
}
removeExDomainsFromQueryResult =(queryResult) => {
  var newResult = [];
  for( var i = 0; i < queryResult.length; i++){
    var url = queryResult[i].toLowerCase();
    var isExDomain = false;
    for( var j in exDomains){
      var exDomain = exDomains[j].toLowerCase();
      isExDomain = url.includes(exDomain);
      if(isExDomain)
        break;
    }
    if(!isExDomain){
      newResult.push(queryResult[i]);
    }
  }
  return newResult;
}

getRankFromQueryResult = async (queryResult, website) => {
  var websiteUrl = website.toLowerCase();
  var gotRank = false;
  for( var i = 0; i < queryResult.length; i++){
    var url = queryResult[i].toLowerCase();
    gotRank = url.includes(websiteUrl);
    if(gotRank){
      return i+1;
    }
  }
  if(!gotRank)
    return '50+';
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

getScreenshots = async () => {
  var result = await Sheet.getSSEmptySheets();
  console.log(result.length);
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();

  // var j = 0;
  for( var i in result ){
    // j++;
    // if(j > 5)
    //   break;

    var ele = result[i];
    var _id = ele._id;
    var website = ele.Website;
    var fileName = website.slice(website.indexOf('//') + 2);
    fileName = fileName.replace('www.', '');
    fileName = fileName.replace(/\//g, '>');
    console.log(j, website, fileName);
    var mobileFileName = fileName + '-mobile.jpg';
    var desktopFileName = fileName + '-desktop.jpg';
    const desktopViewPort={width:1920, height:1080};
    const mobileViewPort={width:375, height:667};

    await page.setViewport(desktopViewPort);
    try {
      await page.goto(website);
    } catch (err) {
      console.log(err.message);
      continue;
    }
    await page.screenshot({path: './app/img/SS/'+desktopFileName, type: 'jpeg'});
    await page.setViewport(mobileViewPort);
    await page.screenshot({path: './app/img/SS/'+mobileFileName, type: 'jpeg'});

    await Sheet.updateData(_id, 'SSCaptured', true);
    console.log(desktopFileName, 'created');
    ws.send(desktopFileName, function() { /* ignore errors */ });
  }

  await browser.close();
}