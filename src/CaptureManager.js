const fs = require('fs')
const https = require('https')

const Util = require('./Util')
const sqlite = require('./SqLite')

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
            Util.error('Missing xuid. Run set-gamertag script first', true)
            return
        }
        
        Util.status('Gamertag: '+meta.data.gamertag)
        
        cache.data.clips = []
        cache.data.screenshots = []
        
        let paths = {
            screenshots: meta.data.xuid+'/screenshots',
            clips: meta.data.xuid+'/game-clips',
        }
        
        let getClips = (continuationToken)=>{
            let path = continuationToken? paths.clips+'?continuationToken='+continuationToken: paths.clips
            let message = continuationToken? '    Getting more clips...': 'Getting clips...'
            return CaptureManager.apiGet(path, message).then((response)=>{
                let clips = response.data
                let {continuationToken} = response
                clips = JSON.parse(clips)
                Util.status('    Clips: '+clips.length)
                cache.data.clips = cache.data.clips.concat(clips)
                
                if(continuationToken){
                    return getClips(continuationToken)
                }else{
                    return getScreenshots()
                }
            })
        }
        
        let getScreenshots = (continuationToken)=>{
            let path = continuationToken? paths.screenshots+'?continuationToken='+continuationToken: paths.screenshots
            let message = continuationToken? '    Getting more screenshots...': 'Getting screenshots...'
            return CaptureManager.apiGet(path, message).then((response)=>{
                let screenshots = response.data
                let {continuationToken} = response
                screenshots = JSON.parse(screenshots)
                Util.status('    Screenshots: '+screenshots.length)
                cache.data.screenshots = cache.data.screenshots.concat(screenshots)
                
                if(continuationToken){
                    return getScreenshots(continuationToken)
                }else{
                    cache.save()
                    Util.status('Total clips cached: ' + cache.data.clips.length)
                    Util.status('Total screenshots cached: ' + cache.data.screenshots.length)
                    Util.status('Done')
                }
            })
        }
        
        getClips()
    }
    document(){
        let {cache, meta} = this.files
        if(!meta.data || !meta.data.xuid || !meta.data.gamertag){
            Util.error('Missing gamertag info. Run set-gamertag script first', true)
            return
        }else if(!cache.data || !cache.data.clips || !cache.data.screenshots){
            Util.error('Missing cache. Run cache script first', true)
            return
        }
        
        let totalClipCount = 0
        let clipCount = 0
        let totalScreenshotCount = 0
        let screenshotCount = 0
        
        let clipSql = `
            INSERT INTO Clips
            (Id, GameId, GameName, DateTaken, DatePublished, LastModified, XUID, Gamertag,
            ClipName, Duration, Caption, Type, SavedByUser, DeviceType, Locale, AchievementId, GreatestMomentId,
            SCID, GameData, SystemProps, ContentAttributes, OriginalUri, IsArchived)
            VALUES ($Id, $GameId, $GameName, $DateTaken, $DatePublished, $LastModified, $XUID, $Gamertag,
            $ClipName, $Duration, $Caption, $Type, $SavedByUser, $DeviceType, $Locale, $AchievementId, $GreatestMomentId,
            $SCID, $GameData, $SystemProps, $ContentAttributes, $OriginalUri, $IsArchived)
        `
        
        let screenshotSql = `
            INSERT INTO Screenshots
            (Id, GameId, GameName, DateTaken, DatePublished, LastModified, XUID, Gamertag,
            ScreenshotName, ResolutionWidth, ResolutionHeight, Caption, Type, SavedByUser, DeviceType, Locale, AchievementId, GreatestMomentId,
            SCID, GameData, SystemProps, ContentAttributes, OriginalUri, IsArchived)
            VALUES ($Id, $GameId, $GameName, $DateTaken, $DatePublished, $LastModified, $XUID, $Gamertag,
            $ScreenshotName, $ResolutionWidth, $ResolutionHeight, $Caption, $Type, $SavedByUser, $DeviceType, $Locale, $AchievementId, $GreatestMomentId,
            $SCID, $GameData, $SystemProps, $ContentAttributes, $OriginalUri, $IsArchived)
        `
        
        let clips = cache.data.clips.slice()
        let screenshots = cache.data.screenshots.slice()
        
        let documentClip = (clip)=>{
            if(clip.xuid != meta.data.xuid){
                Util.error(`Gamertag is set to "${meta.data.gamertag}" with xuid "${meta.data.xuid}", but cached clip is for user with xuid "${clip.xuid}".
                Run the set-gamertag script, then the cache script, then retry the document script.`, true)
            }
            
            let params = {
                $Id: clip.gameClipId,
                $GameId: clip.titleId,
                $GameName: clip.titleName,
                $DateTaken: clip.dateRecorded,
                $DatePublished: clip.datePublished,
                $LastModified: clip.lastModified,
                $XUID: clip.xuid,
                $Gamertag: meta.data.gamertag,
                $ClipName: clip.clipName,
                $Duration: clip.durationInSeconds,
                $Caption: clip.userCaption,
                $Type: clip.type,
                $SavedByUser: clip.savedByUser? 1: 0,
                $DeviceType: clip.deviceType,
                $Locale: clip.gameClipLocale,
                $AchievementId: clip.achievementId,
                $GreatestMomentId: clip.greatestMomentId,
                $SCID: clip.scid,
                $GameData: clip.titleData,
                $SystemProps: clip.systemProperties,
                $ContentAttributes: clip.clipContentAttributes,
                $OriginalUri: clip.gameClipUris[0].uri,
                $IsArchived: 0,
            }
            
            sqlite.query(clipSql, params, true).then(()=>{
                totalClipCount++
                Util.status('Clip '+clip.gameClipId+' added  - '+totalClipCount)
                clipCount++
                documentNext()
            }).catch((error)=>{
                totalClipCount++
                if(error.errno == 19){
                    Util.warning('Clip '+clip.gameClipId+' exists - '+totalClipCount)
                }else{
                    Util.error(error, true)
                }
                documentNext()
            })
        }
        
        let documentScreenshot = (screenshot)=>{
            if(screenshot.xuid != meta.data.xuid){
                Util.error(`Gamertag is set to "${meta.data.gamertag}" with xuid "${meta.data.xuid}", but cached screenshot is for user with xuid "${screenshot.xuid}".
                Run the set-gamertag script, then the cache script, then retry the document script.`, true)
            }
            
            let params = {
                $Id: screenshot.screenshotId,
                $GameId: screenshot.titleId,
                $GameName: screenshot.titleName,
                $DateTaken: screenshot.dateTaken,
                $DatePublished: screenshot.datePublished,
                $LastModified: screenshot.lastModified,
                $XUID: screenshot.xuid,
                $Gamertag: meta.data.gamertag,
                $ScreenshotName: screenshot.screenshotName,
                $ResolutionWidth: screenshot.resolutionWidth,
                $ResolutionHeight: screenshot.resolutionHeight,
                $Caption: screenshot.userCaption,
                $Type: screenshot.type,
                $SavedByUser: screenshot.savedByUser? 1: 0,
                $DeviceType: screenshot.deviceType,
                $Locale: screenshot.screenshotLocale,
                $AchievementId: screenshot.achievementId,
                $GreatestMomentId: screenshot.greatestMomentId,
                $SCID: screenshot.scid,
                $GameData: screenshot.titleData,
                $SystemProps: screenshot.systemProperties,
                $ContentAttributes: screenshot.screenshotContentAttributes,
                $OriginalUri: screenshot.screenshotUris[0].uri,
                $IsArchived: 0,
            }
            
            sqlite.query(screenshotSql, params, true).then(()=>{
                totalScreenshotCount++
                Util.status('Screenshot '+screenshot.screenshotId+' added  - '+totalScreenshotCount)
                screenshotCount++
                documentNext()
            }).catch((error)=>{
                totalScreenshotCount++
                if(error.errno == 19){
                    Util.warning('Screenshot '+screenshot.screenshotId+' exists - '+totalScreenshotCount)
                }else{
                    Util.error(error, true)
                }
                documentNext()
            })
        }
        
        let documentNext = ()=>{
            if(clips.length > 0){
                documentClip(clips.shift())
            }else if(screenshots.length > 0){
                documentScreenshot(screenshots.shift())
            }else{
                Util.status('----------------')
                Util.status(`${clipCount} clips documented out of ${cache.data.clips.length} cached`)
                Util.status(`${screenshotCount} screenshots documented out of ${cache.data.screenshots.length} cached`)
                Util.status('Done')
            }
        }
        
        documentNext()
    }
    setGamertag(gamertag){
        if(!gamertag){
            Util.error('Missing gamertag argument\nUsage: npm run set-gamertag <gamertag>', true)
            return
        }
        
        let meta = this.files.meta
        
        let path = 'xuid/'+gamertag
        CaptureManager.apiGet(path, 'Getting xuid...').then((response)=>{
            let xuid = response.data
            Util.status('Xuid: '+xuid)
            meta.data.xuid = xuid
        }).then(()=>{
            path = 'gamertag/'+meta.data.xuid
            return CaptureManager.apiGet(path, 'Getting exact gamertag...')
        }).then((response)=>{
            let gamertag = response.data
            Util.status('Gamertag: '+gamertag)
            meta.data.gamertag = gamertag
            meta.save()
            Util.status('Done')
        })
    }
    
    static apiGet(path, message){
        let options = {
            hostname: 'xboxapi.com',
            path: '/v2/'+encodeURI(path),
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
                
                let continuationToken = response.headers['x-continuationtoken']
                
                let data = ''
                response.on('data', (chunk)=>{
                    data += chunk
                })
                
                response.on('end', ()=>{
                    if(response.statusCode == 200){
                        resolve({
                            data: data,
                            continuationToken: continuationToken,
                        })
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
