var express = require('express')
var app = express()
var mongo = require('mongodb').MongoClient
var path = require('path')

var GoogleImgs = require('google-images')
var cseID = '010371145318051871757:b4csgoz6f9i'
var apiKey = 'AIzaSyB9sJS2ofNk_PkrH9QJFgMrg8swDtqnRC8'
var client = new GoogleImgs(cseID, apiKey)

var MONGO_URL = process.env.MONGO_URL

var port = process.env.PORT || 3000

app.get('/', handleMain)
app.get('/api/imagesearch/:data', handleSearch)
app.get('/api/latest/imagesearch/', handleLatestSearch)

function handleMain(req, res) {
   var file = path.join(__dirname, 'index.html')
   res.sendFile(file)
}

function handleSearch(req, res) {
   var page = {
      page: req.query.offset || 1
   }
   var term = req.params.data
   client.search(term, page)
      .then(images => {
         mongo.connect(MONGO_URL, function(err, db) {
            var c = db.collection('images')
            var date = new Date().toISOString()
            c.insert({term: term, when: date}, function (err, result) {
               if (err) {
                  db.close()
                  throw err
               }
               else res.json(images)
            })
         })
      })

}

function handleLatestSearch(req, res) {
   mongo.connect(MONGO_URL, function(err, db) {
      if (err) throw err
      else {
         var c = db.collection('images')
         c.find().sort({_id:-1}).limit(10).
            toArray(function(err, entries) {
               if (err) {
                  db.close()
                  throw err
               }
               else {
                  res.json(entries)
               }
            })
      }
   })
}

app.listen(port, function(err) {
   if (err) throw err
})
