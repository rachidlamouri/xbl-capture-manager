require('dotenv').config()
const fs = require('fs')
const https = require('https')

class CaptureManager{
    constructor(){
        Object.assign(this, {
            metaFile: CaptureManager.SAVE_DIR + 'meta.json',
            meta: {},
        })
        
        if(!fs.existsSync(this.metaFile)){
            this.saveMeta()
        }else{
            let metaString = fs.readFileSync(this.metaFile, 'utf8')
            this.meta = JSON.parse(metaString)
        }
    }
    
    saveMeta(){
        let metaString = JSON.stringify(this.meta)
        fs.writeFileSync(this.metaFile, metaString)
    }
    setGamertag(gamertag){
        if(!gamertag){
            CaptureManager.printError('Missing gamertag arg')
            return
        }
        
        let path = 'xuid/'+gamertag
        CaptureManager.status('Get xuid')
        CaptureManager.apiGet(path).then((xuid)=>{
            CaptureManager.status('Xuid: '+xuid)
            this.meta.xuid = xuid
        }).then(()=>{
            path = 'gamertag/'+this.meta.xuid
            CaptureManager.status('Get exact gamertag')
            return CaptureManager.apiGet(path)
        }).then((gamertag)=>{
            CaptureManager.status('Gamertag: '+gamertag)
            this.meta.gamertag = gamertag
            this.saveMeta()
            CaptureManager.status('Done')
        })
    }
    
    static apiGet(path, onData){
        if(!process.env.API_KEY){
            CaptureManager.printError('API_KEY not defined in .env')
            return
        }
        
        let options = {
            hostname: 'xboxapi.com',
            path: '/v2/'+path,
            headers:{
                'X-AUTH': process.env.API_KEY,
            }
        }
        
        let promise = new Promise((resolve, reject)=>{
            let request = https.request(options, (response)=>{
                CaptureManager.status('Response Code: ' + response.statusCode)
                
                if(response.statusCode != 200){
                    CaptureManager.printError('https response failed with status: '+response.statusCode)
                    reject()
                    return
                }
                
                let data = ''
                response.on('data', (chunk)=>{
                    data += chunk
                })
                
                response.on('end', ()=>{
                    resolve(data)
                })
            })
            
            request.on('error', (error)=>{
                CaptureManager.printError('https request error: '+error)
                reject()
            })
            
            request.end()
        })
        
        return promise
    }
    static status(message){
        console.log('\x1b[32m%s\x1b[0m', message)
    }
    static printError(message){
        console.log('\x1b[31m%s\x1b[0m', 'Error: '+message)
        console.log('\x1b[31m%s\x1b[0m', 'Aborting')
    }
}
Object.assign(CaptureManager, {
    SAVE_DIR: './data/',
})

module.exports = CaptureManager
