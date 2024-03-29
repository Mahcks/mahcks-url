// packages needed in this file
const express = require('express')
const validUrl = require('valid-url')
const shortid = require('shortid')
require('dotenv').config();

// creating express route handler
const router = express.Router()

// import the Url database model
const Url = require('../models/Url');
function checkForKey(req, res) {
  const apiKey = req.get("API-Key");
  const keys = process.env.API_KEY?.split(" ");
  if (!apiKey || !keys?.includes(apiKey)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  } else {
    return true;
  }
}
// @route    POST /api/url/shorten
// @description     Create short URL

// The API base Url endpoint
const baseUrl = process.env.BASE_URL;

router.post('/shorten', async (req, res) => {
  let isAuth = checkForKey(req, res);
  if (isAuth) {
    const {
      longUrl
    } = req.body // destructure the longUrl from req.body.longUrl

    // check base url if valid using the validUrl.isUri method
    if (!validUrl.isUri(baseUrl)) {
      return res.status(401).json('Invalid base URL')
    }

    // if valid, we create the url code
    const urlCode = shortid.generate()

    // check long url if valid using the validUrl.isUri method
    if (validUrl.isUri(longUrl)) {
      try {
        /* The findOne() provides a match to only the subset of the documents 
        in the collection that match the query. In this case, before creating the short URL,
        we check if the long URL was in the DB ,else we create it.
        */
        let url = await Url.findOne({
          longUrl
        })

        // url exist and return the respose
        if (url) {
          res.json(url)
        } else {
          // join the generated short code the the base url
          const shortUrl = baseUrl + '/' + urlCode

          // invoking the Url model and saving to the DB
          url = new Url({
            longUrl,
            shortUrl,
            urlCode,
            date: new Date(),
            count: 0
          })
          await url.save()
          res.json(url)
        }
      }
      // exception handler
      catch (err) {
        console.log(err)
        res.status(500).json('Server Error')
      }
    } else {
      res.status(401).json('Invalid longUrl')
    }
  }
})

module.exports = router
