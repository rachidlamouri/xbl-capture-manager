const CaptureManager = require('./CaptureManager')
let manager = new CaptureManager()

process.argv.splice(0,2)
const gamertag = process.argv.shift()

manager.setGamertag(gamertag)
