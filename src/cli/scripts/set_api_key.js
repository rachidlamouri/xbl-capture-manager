const CaptureManager = require('../CaptureManager')
let manager = new CaptureManager()

process.argv.splice(0,2)
const apiKey = process.argv.shift()

manager.setApiKey(apiKey)
