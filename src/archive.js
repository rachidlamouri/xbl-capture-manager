const CaptureManager = require('./CaptureManager')
let manager = new CaptureManager()

process.argv.splice(0,2)
const count = process.argv.shift()

manager.archive(count)
