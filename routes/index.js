const express = require('express')
const router = express.Router({mergeParams: true})
const activityBackend = require('./activityBackend')
const proxy = require('./proxy')
const configJSON = require('./configJSON')

router.use('/rest-activity', configJSON)
router.use('/rest-activity', activityBackend)
router.use('/proxy/', proxy)

module.exports = router
