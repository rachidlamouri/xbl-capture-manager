require('dotenv').config()

const green = '\x1b[32m'
const red = '\x1b[31m'
const reset = '\x1b[0m'
const yellow = '\x1b[33m'

class Util{
    static checkEnv(){
        Util.expectedEnv.forEach((expected)=>{
            if(process.env[expected] === undefined){
                Util.printError('Missing env var '+expected, true)
            }
        })
    }
    static error(message, abort = false){
        console.log(red+'%s'+reset, 'Error: '+message)
        if(abort){
            console.log(red+'%s'+reset, 'Aborting')
            process.exit(0)
        }
    }
    static status(message){
        console.log(green+'%s'+reset, message)
    }
    static warning(message){
        console.log(yellow+'%s'+reset, message)
    }
}
Object.assign(Util, {
    expectedEnv: [
        'API_KEY',
        'SAVE_DIR',
    ],
})

Util.checkEnv()

module.exports = Util
