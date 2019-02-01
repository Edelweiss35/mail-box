var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var formidable = require('formidable');
const csv = require('csv-parser');
const puppeteer = require('puppeteer');

var app = express();
app.set('view engine', 'ejs');

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

app.post('/fileupload', async function (req, res) {
  // drop db
  await Sheet.removeAll();
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
      }
    })
    .on('end',async function(){
        //some final operation
        console.log('Final Operation');
        var result = await getGoogleSearchResult('Plumbers Los Angeles');
        result = removeExDomainsFromResult(result);
        await getGoogleRanking(result);
        res.end('Finished');
    });  
  });

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
  // result = removeExDomainsFromResult(result);
  // await getGoogleRanking(result);
});


getGoogleRanking = async (result) => {
  console.log('SetGoogleRanking');
  var sheetData = await Sheet.getSheets();
  for( var j in sheetData ){
    var ele = sheetData[j];
    var websiteUrl = ele.Website.toLowerCase();
    var id = ele._id;
    var gotRank = false;
    for( var i = 0; i < 50; i++){
      var url = result[i].toLowerCase();
      gotRank = url.includes(websiteUrl);
      if(gotRank){
        await setGoogleRanking(id, '' + (i + 1));
        console.log(j, i+1);
        break;
      }
    }
    if(!gotRank)
      setGoogleRanking(id, '50+')
  }
  console.log('END');
}
setGoogleRanking = async (id, ranking) => {
  await Sheet.setGoogleRanking(id, ranking);
}
// var result = [ 'https://www.yelp.com/search?cflt=plumbing&find_loc=Los+Angeles%2C+CA',
//   'https://www.yelp.com/c/la/plumbing',
//   'https://www.ez-plumbing.com/',
//   'http://ritzplumbing.com/',
//   'https://www.homeadvisor.com/c.Plumbing.Los_Angeles.CA.-12058.html',
//   'https://rocketplumbingcalifornia.com/los-angeles-plumber/',
//   'https://www.angieslist.com/companylist/los-angeles/plumbing.htm',
//   'https://www.nautilusplumbing.com/',
//   'http://www.bossplumbing.com/',
//   'https://www.redlillyplumbing.com/',
//   'https://www.redlillyplumbing.com/',
//   'https://www.glassdoor.com/Job/los-angeles-plumber-jobs-SRCH_IL.0,11_IC1146821_KO12,19.htm',
//   'https://www.monkeywrenchplumbers.com/',
//   'https://mikediamondservices.com/locations/los-angeles-plumber/',
//   'https://www.craigsplumbingla.com/',
//   'https://www.thumbtack.com/ca/los-angeles/plumbing/',
//   'https://www.frasersplumbing.com/',
//   'http://justrightplumbingla.com/',
//   'http://www.gr-plumbing.com/',
//   'https://www.indeed.com/q-Plumbing-l-Los-Angeles,-CA-jobs.html',
//   'http://ezrothplumbing.com/',
//   'http://arieplumbing.com/',
//   'https://losangeles.craigslist.org/search/lac/hhh?query=Plumbing&srchType=A&areaAbb=losangeles&subArea=&catAbb=bbb',
//   'http://jomiplumbing.com/',
//   'http://lrsplumbing.com/',
//   'http://www.trmplumbing.com/',
//   'http://www.newtonplumbing.com/',
//   'https://laplumbingandbackflow.com/',
//   'https://www.expressrandp.com/',
//   'https://www.adeedo.com/',
//   'https://www.groupon.com/local/los-angeles/plumbing',
//   'http://www.jackstephan.com/',
//   'https://www.yellowpages.com/los-angeles-ca/plumbers',
//   'https://www.mrrooter.com/los-angeles/',
//   'https://ninjaplumber.com/',
//   'https://www.moeplumbing.com/commercial-plumbing-contractor/',
//   'https://www.a-1totalserviceplumbing.com/',
//   'http://www.billwestplumbing.com/',
//   'http://www.andersenplumbing.com/',
//   'http://college.lattc.edu/cmu/program/plumbing-technology/',
//   'https://reliancehs.com/',
//   'https://losangeles.cbslocal.com/2015/07/20/apprenticeship-programs-put-plumbers-to-work-in-l-a/',
//   'https://nextdoor.com/category/plumber/los-angeles--ca/',
//   'https://www.ferguson.com/branch/brazil-st-los-angeles-ca-plumbing',
//   'http://newgenerationplumbingcontractor.com/',
//   'http://www.911plumbingservice.com/',
//   'https://leadingedgeplumbing.com/',
//   'http://speedplumbing2000.com/',
//   'https://www.facebook.com/lrsplumbing/',
//   'https://www.linkedin.com/company/mr.-rooter-plumbing-los-angeles',
//   'http://www.247responseplumbing.com/',
//   'https://dpw.lacounty.gov/bsd/content/journeymanplumber_rd.aspx',
//   'https://www.kirmanplumbing.net/',
//   'http://www.kesslercrew.com/emergency-plumbing/',
//   'https://www.sunsetwestplumbing.com/',
//   'https://www.lloydsplumbing.net/plumbing-services-los-angeles-ca/',
//   'https://porch.com/los-angeles-ca/plumbers/sharpe-plumbing/pp',
//   'https://www.serviz.com/plumbing-los-angeles/service/1-1001',
//   'https://jmsexpressplumbing.com/',
//   'http://www.heflinandsonplumbing.com/' ];

removeExDomainsFromResult =(result) => {
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
getGoogleSearchResult= async (query)=>{
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