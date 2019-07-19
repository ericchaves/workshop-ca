const express = require('express')
const router = express.Router({mergeParams: true})
const request = require('request')
const cors = require('cors')
const whitelist = [process.env.JB_CA_BASE_URL]
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error(origin + ' not allowed by CORS'))
    }
  },
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

router.use('/', cors(corsOptions), function (req, res) {
  const url = req.url.substring(1)
  const req2 = request(url)
  req2.pipefilter = function (response, dest) {
    // remove headers
    // for (const h in response.headers) {
    //   dest.removeHeader(h)
    // }
    // or modify
  }
  req.pipe(req2).pipe(res)
})

module.exports = router
