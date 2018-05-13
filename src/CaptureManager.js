const Util = require('./Util')
const fs = require('fs')
const https = require('https')

class DataFile{
    constructor(filename){
        this.data = {}
        this.filename = process.env.SAVE_DIR + filename
        
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
            cache: new DataFile('cache.json'),
            meta: new DataFile('meta.json'),
        }
    }
    
    cache(){
        let {cache, meta} = this.files
        if(!meta.data || !meta.data.xuid){
            Util.error('Missing xuid. Run set_gamertag script first', true)
            return
        }
        
        let paths = {
            screenshots: meta.data.xuid+'/screenshots',
            clips: meta.data.xuid+'/game-clips',
        }
        CaptureManager.apiGet(paths.screenshots, 'Get screenshots').then((screenshots)=>{
            screenshots = JSON.parse(screenshots)
            Util.status('Screenshots: '+screenshots.length)
            cache.data.screenshots = screenshots
            
            return CaptureManager.apiGet(paths.clips, 'Get clips')
        }).then((clips)=>{
            clips = JSON.parse(clips)
            Util.status('Clips: '+clips.length)
            cache.data.clips = clips
            cache.save()
            Util.status('Done')
        })
    }
    setGamertag(gamertag){
        if(!gamertag){
            Util.error('Missing gamertag arg', true)
            return
        }
        
        let meta = this.files.meta
        
        let path = 'xuid/'+gamertag
        CaptureManager.apiGet(path, 'Get xuid').then((xuid)=>{
            Util.status('Xuid: '+xuid)
            meta.data.xuid = xuid
        }).then(()=>{
            path = 'gamertag/'+meta.data.xuid
            return CaptureManager.apiGet(path, 'Get exact gamertag')
        }).then((gamertag)=>{
            Util.status('Gamertag: '+gamertag)
            meta.data.gamertag = gamertag
            meta.save()
            Util.status('Done')
        })
    }
    
    static apiGet(path, message){
        let options = {
            hostname: 'xboxapi.com',
            path: '/v2/'+path,
            headers:{
                'X-AUTH': process.env.API_KEY,
            }
        }
        
        Util.status(message)
        let promise = new Promise((resolve, reject)=>{
            let request = https.request(options, (response)=>{
                if(response.statusCode != 200){
                    Util.error('https response failed with status: '+response.statusCode)
                }
                
                let data = ''
                response.on('data', (chunk)=>{
                    data += chunk
                })
                
                response.on('end', ()=>{
                    if(response.statusCode == 200){
                        resolve(data)
                    }else{
                        Util.error(data, true)
                    }
                })
            })
            
            request.on('error', (error)=>{
                Util.error('https request error: '+error, true)
            })
            
            request.end()
        })
        
        return promise
    }
}

module.exports = CaptureManager
