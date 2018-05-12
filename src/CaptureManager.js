require('dotenv').config()
const fs = require('fs')
const https = require('https')

class DataFile{
    constructor(filename){
        this.data = {}
        this.filename = CaptureManager.SAVE_DIR + filename
        
        if(!fs.existsSync(this.filename)){
            this.save()
        }else{
            let string = fs.readFileSync(this.filename, 'utf8')
            this.data = JSON.parse(string)
        }
    }
    
    save(){
        let string = JSON.stringify(this.data)
        fs.writeFileSync(this.filename, string)
    }
}

class CaptureManager{
    constructor(){
        this.files = {
            meta: new DataFile('meta.json'),
        }
    }
    
    setGamertag(gamertag){
        if(!gamertag){
            CaptureManager.printError('Missing gamertag arg')
            return
        }
        
        let meta = this.files.meta
        let path = 'xuid/'+gamertag
        CaptureManager.status('Get xuid')
        CaptureManager.apiGet(path).then((xuid)=>{
            CaptureManager.status('Xuid: '+xuid)
            meta.data.xuid = xuid
        }).then(()=>{
            path = 'gamertag/'+meta.data.xuid
            CaptureManager.status('Get exact gamertag')
            return CaptureManager.apiGet(path)
        }).then((gamertag)=>{
            CaptureManager.status('Gamertag: '+gamertag)
            meta.data.gamertag = gamertag
            meta.save()
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
