'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var cors = require('cors');
var dns = require('dns')
var urlExists = require('url-exists');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.MONGO_URI);
var Schema = mongoose.Schema
var urlSchema = new Schema({
  original_url: String,
  short_url: Number
})

var Url = mongoose.model('Url', urlSchema)

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended: false}))


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

//FCC Project

app.post('/api/shorturl/new', function (req, res) {
  urlExists(req.body.url, function (err, exists) {
    if (exists) {
      Url.find({original_url: req.body.url}, function(err, data) {
        if (err) {
          return res.send('error')
        }
        else if (data.length == 0) {
          Url.find().sort({short_url: 'desc'}).limit(1).exec(function (err, data) {
            if (data.length == 0) {
              var newShortUrl = 1
            }
            else {
              var newShortUrl = parseInt(data[0].short_url + 1)
            }
            var newUrl = new Url ({original_url: req.body.url, 
                                   short_url: newShortUrl})
            newUrl.save(function (err) {
              if (err) {
                return res.send('error, unable to save record') 
              }
              else {
                return res.send({original_url: req.body.url, 
                                 short_url: newShortUrl})
              }
            })
          })
        }
        else {
          return res.send({original_url: data[0].original_url, 
                           short_url: data[0].short_url})
        }
      }) 
    }
    else {
      return res.send({"error":"invalid URL"})  
    }
  })
})

app.get('/api/shorturl/:id', function (req, res) {
  Url.find({short_url: req.params.id}, function(err, data) {
    if (err) {
      return res.send('error')
    }
    else if (data.length == 0) {
      return res.status(404).end('error, no such url exists!') 
    }
    else {
      return res.redirect(data[0].original_url)
    }
  })
})


app.listen(port, function () {
  console.log('Node.js listening ...');
});