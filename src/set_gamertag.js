const Util = require('./Util')
const CaptureManager = require('./CaptureManager')
let manager = new CaptureManager()

process.argv.splice(0,2)
const gamertag = process.argv.shift()

if(process.argv.length > 0){
    Util.error('Too many arguments. If your gamertag has spaces, then surround the whole gamertag in quotes', true)
}

manager.setGamertag(gamertag)
