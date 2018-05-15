const fs = require('fs')
const https = require('https')
const readline = require('readline')
const dateformat = require('dateformat')
const mkdirp = require('mkdirp')
const JSZip = require('jszip')

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
        this.archiveDir = process.env.SAVE_DIR + 'archive/'
        this.tmpDir = process.env.SAVE_DIR + 'tmp/'
        
        if(!fs.existsSync(this.tmpDir)){
            fs.mkdirSync(this.tmpDir)
        }
        
        if(!fs.existsSync(this.archiveDir)){
            fs.mkdirSync(this.archiveDir)
        }
    }
    
    archive(count, type){
        let {meta} = this.files
        if(!meta.data || !meta.data.xuid || !meta.data.gamertag){
            Util.error('Missing gamertag info. Run set-gamertag script first', true)
            return
        }
        
        if(count === undefined){
            Util.error('Missing count argument. Provide the number of captures to archive. Usage: npm run archive <integer count>', true)
        }
        count = parseInt(count)
        if(isNaN(count)){
            Util.error('Count is not an integer. Usage: npm run archive <integer count>', true)
        }
        count = Math.abs(count)
        
        Util.status(meta.data.gamertag)
        
        let selectSql = `
            SELECT * FROM(
                SELECT
                    Id,
                    1 AS IsClip,
                    XUID,
                    Gamertag,
                    OriginalUri,
                    DateTaken,
                    FileSize,
                    DATETIME('now') > UriExpiryDate AS Expired,
                    IsArchived
                FROM Clips
                UNION ALL
                SELECT
                    Id,
                    0 AS IsClip,
                    XUID,
                    Gamertag,
                    OriginalUri,
                    DateTaken,
                    FileSize,
                    DATETIME('now') > UriExpiryDate AS Expired,
                    IsArchived
                FROM Screenshots
            )
            WHERE IsArchived = 0
                AND XUID = $XUID
                AND(
                    $_AllCaptures = 1
                    OR(
                        IsClip = 1
                        AND $_ClipsOnly = 1
                    )
                    OR(
                        IsClip = 0
                        AND $_ScreenshotsOnly = 1
                    )
                )
            ORDER BY DateTaken DESC
            LIMIT 1
        `
        
        let updateClipSql = `
            UPDATE Clips
            SET IsArchived = 1,
                LastArchived = DATETIME('now')
            WHERE Id = $Id
        `
        
        let updateScreenshotSql = `
            UPDATE Screenshots
            SET IsArchived = 1,
                LastArchived = DATETIME('now')
            WHERE Id = $Id
        `
        
        let clipsOnly = type === 'clips'
        let screenshotsOnly = type === 'screenshots'
        let allCaptures = !clipsOnly && !screenshotsOnly
        
        let selectParams = {
            $XUID: meta.data.xuid,
            $_AllCaptures: allCaptures? 1: 0,
            $_ClipsOnly: clipsOnly? 1: 0,
            $_ScreenshotsOnly: screenshotsOnly? 1: 0,
        }
        
        let nextCapture = {}
        
        let archivedCount = 0
        let archiveNext = ()=>{
            if(archivedCount >= count){
                Util.status('Done')
                return
            }
            
            sqlite.query(selectSql, selectParams).then((result)=>{
                if(!result.first){
                    Util.status('No clips to archive')
                    return new Promise((resolve, reject)=>{reject()})
                }
                
                nextCapture = result.first
                let {Id, OriginalUri, IsClip, FileSize, Expired} = nextCapture
                if(Expired === 1){
                    Util.error(`URI for ${Id} has expired. Run the cache script, then the document script, then retry the archive script`, true)
                }
                
                let type = IsClip === 1? 'Clip': 'Screenshot'
                Util.status('Downloading '+type+' '+Id+' '+(archivedCount + 1))
                return this.download(Id, OriginalUri, FileSize, IsClip === 1)
            }).then((data)=>{
                let {contentLength, filename, filepath} = data
                let {Id, Gamertag, IsClip, FileSize, DateTaken} = nextCapture
                let date = new Date(DateTaken)
                let year = dateformat(date, 'yyyy')
                let month = dateformat(date, 'mm')
                let type = IsClip === 1? 'clips': 'screenshots'
                let archiveName = Gamertag+'-'+type+'-'+year+'-'+month+'.zip'
                let archiveDir = this.archiveDir+Gamertag+'/'+type+'/'+year+'/'
                let archiveFile = archiveDir+archiveName
                
                if(!fs.existsSync(archiveDir)){
                    mkdirp.sync(archiveDir)
                }
                
                return new Promise((resolve, reject)=>{
                    if(fs.existsSync(archiveFile)){
                        Util.status('    Archiving in '+archiveName)
                        let archiveBuffer = fs.readFileSync(archiveFile)
                        JSZip.loadAsync(archiveBuffer).then((zip)=>{
                            resolve(zip)
                        })
                    }else{
                        Util.status('    Creating archive '+archiveName)
                        resolve(new JSZip())
                    }
                }).then((zip)=>{
                    return new Promise((resolve, reject)=>{
                        let tmpFileBuffer = fs.readFileSync(filepath)
                        if(tmpFileBuffer.length != contentLength){
                            Util.error('File did not download correctly')
                            Util.error(`${tmpFileBuffer.length} downloaded vs`)
                            Util.error(`${contentLength} expected`, true)
                        }
                        
                        zip.file(filename, tmpFileBuffer)
                        zip.file(filename).async('arrayBuffer').then((destBuffer)=>{
                            if(destBuffer.byteLength != contentLength){
                                Util.error('File was not added to archive correctly')
                                Util.error(`${destBuffer.byteLength} transfered vs`)
                                Util.error(`${contentLength} expected`, true)
                            }
                            
                            let output = fs.createWriteStream(archiveFile)
                            zip.generateNodeStream({
                                type: 'nodebuffer',
                                compression: 'DEFLATE',
                                compressionOptions: {
                                    level: 3,
                                },
                                streamFile: true,
                            })
                            .pipe(output)
                            .on('finish', ()=>{
                                fs.unlinkSync(filepath)
                                resolve()
                            })
                        })
                    })
                })
            }).then(()=>{
                let {Id, IsClip} = nextCapture
                if(IsClip === 1){
                    return sqlite.query(updateClipSql, {
                        $Id: Id,
                    })
                }else{
                    return sqlite.query(updateScreenshotSql, {
                        $Id: Id,
                    })
                }
            }).then((result)=>{
                Util.status('    Done')
                console.log('--------------------------------------------------')
                archivedCount++
                archiveNext()
            }).catch((error)=>{
                if(error){
                    Util.error(error, true)
                }else{
                    Util.status('Done')
                }
            })
        }
        archiveNext()
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
            return this.apiGet(path, message).then((response)=>{
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
            return this.apiGet(path, message).then((response)=>{
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
        
        let counts = {
            clips: {
                added: 0,
                total: 0,
            },
            screenshots: {
                added: 0,
                total: 0,
            },
        }
        
        let clipExistsSql = `
            SELECT COUNT(*) AS Count
            FROM Clips
            WHERE Id = $Id
        `
        
        let clipSql = `
            INSERT OR REPLACE INTO Clips
            (Id, GameId, GameName, DateTaken, DatePublished, LastModified, XUID, Gamertag,
            ClipName, Duration, Caption, Type, SavedByUser, DeviceType, Locale, AchievementId, GreatestMomentId,
            SCID, GameData, SystemProps, ContentAttributes, OriginalUri, FileSize, UriExpiryDate,
            LastDocumented, LastArchived, IsArchived)
            VALUES ($Id, $GameId, $GameName, $DateTaken, $DatePublished, $LastModified, $XUID, $Gamertag,
            $ClipName, $Duration, $Caption, $Type, $SavedByUser, $DeviceType, $Locale, $AchievementId, $GreatestMomentId,
            $SCID, $GameData, $SystemProps, $ContentAttributes, $OriginalUri, $FileSize, $UriExpiryDate,
            DATETIME('now'),
            COALESCE((SELECT LastArchived FROM Clips WHERE Id = $Id), NULL),
            COALESCE((SELECT IsArchived FROM Clips WHERE Id = $Id), 0))
        `
        
        let screenshotExistsSql = `
            SELECT COUNT(*) AS Count
            FROM Screenshots
            WHERE Id = $Id
        `
        
        let screenshotSql = `
            INSERT OR REPLACE INTO Screenshots
            (Id, GameId, GameName, DateTaken, DatePublished, LastModified, XUID, Gamertag,
            ScreenshotName, ResolutionWidth, ResolutionHeight, Caption, Type, SavedByUser, DeviceType, Locale, AchievementId, GreatestMomentId,
            SCID, GameData, SystemProps, ContentAttributes, OriginalUri, FileSize, UriExpiryDate,
            LastDocumented, LastArchived, IsArchived)
            VALUES ($Id, $GameId, $GameName, $DateTaken, $DatePublished, $LastModified, $XUID, $Gamertag,
            $ScreenshotName, $ResolutionWidth, $ResolutionHeight, $Caption, $Type, $SavedByUser, $DeviceType, $Locale, $AchievementId, $GreatestMomentId,
            $SCID, $GameData, $SystemProps, $ContentAttributes, $OriginalUri, $FileSize, $UriExpiryDate,
            DATETIME('now'),
            COALESCE((SELECT LastArchived FROM Screenshots WHERE Id = $Id), NULL),
            COALESCE((SELECT IsArchived FROM Screenshots WHERE Id = $Id), 0))
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
                $FileSize: clip.gameClipUris[0].fileSize,
                $UriExpiryDate: clip.gameClipUris[0].expiration,
            }
            
            let clipExists = false
            sqlite.query(clipExistsSql, {$Id: clip.gameClipId}).then((result)=>{
                clipExists = result.first.Count > 0
                return sqlite.query(clipSql, params, true)
            }).then((result)=>{
                counts.clips.total++
                if(clipExists){
                    Util.warning('Clip '+clip.gameClipId+' updated - '+counts.clips.total)
                }else{
                    counts.clips.added++
                    Util.status('Clip '+clip.gameClipId+' added   - '+counts.clips.total)
                }
                
                documentNext()
            }).catch((error)=>{
                Util.error(error, true)
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
                $FileSize: screenshot.screenshotUris[0].fileSize,
                $UriExpiryDate: screenshot.screenshotUris[0].expiration,
            }
            
            let screenshotExists = false
            sqlite.query(screenshotExistsSql, {$Id: screenshot.screenshotId}).then((result)=>{
                screenshotExists = result.first.Count > 0
                return sqlite.query(screenshotSql, params, true)
            }).then((result)=>{
                counts.screenshots.total++
                if(screenshotExists){
                    Util.warning('Screenshot '+screenshot.screenshotId+' updated - '+counts.screenshots.total)
                }else{
                    counts.screenshots.added++
                    Util.status('Screenshot '+screenshot.screenshotId+' added   - '+counts.screenshots.total)
                }
                
                documentNext()
            }).catch((error)=>{
                Util.error(error, true)
            })
        }
        
        let documentNext = ()=>{
            if(clips.length > 0){
                documentClip(clips.shift())
            }else if(screenshots.length > 0){
                documentScreenshot(screenshots.shift())
            }else{
                Util.status('----------------')
                Util.status(`Clips: ${counts.clips.total} documented`)
                Util.status(`    ${counts.clips.added} new`)
                Util.status(`    ${counts.clips.total - counts.clips.added} updated`)
                Util.status('----------------')
                Util.status(`Screenshots: ${counts.screenshots.total} documented`)
                Util.status(`    ${counts.screenshots.added} new`)
                Util.status(`    ${counts.screenshots.total - counts.screenshots.added} updated`)
                Util.status('----------------')
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
        this.apiGet(path, 'Getting xuid...').then((response)=>{
            let xuid = response.data
            Util.status('Xuid: '+xuid)
            meta.data.xuid = xuid
        }).then(()=>{
            path = 'gamertag/'+meta.data.xuid
            return this.apiGet(path, 'Getting exact gamertag...')
        }).then((response)=>{
            let gamertag = response.data
            Util.status('Gamertag: '+gamertag)
            meta.data.gamertag = gamertag
            meta.save()
            Util.status('Done')
        })
    }
    
    apiGet(path, message){
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
    download(id, uri, expectedSize, isClip){
        return new Promise((resolve, reject)=>{
            let extension = isClip? '.mp4': '.png'
            let filename = id+extension
            let filepath = this.tmpDir+filename
            let file = fs.createWriteStream(filepath)
            let request = https.request(uri, (response)=>{
                if(response.statusCode != 200){
                    Util.error('https response failed with status: '+response.statusCode)
                }
                
                let contentLength = parseInt(response.headers['content-length'])
                let contentDownloaded = 0
                if(contentLength != expectedSize){
                    Util.warning(`    Warning: Download size does not match expected size`)
                    Util.warning(`        ${contentLength} downloading vs`)
                    Util.warning(`        ${expectedSize} expected`)
                }
                process.stdout.write('    \x1b[32mProgress\x1b[0m')
                
                response.on('data', (chunk)=>{
                    contentDownloaded += chunk.length
                    readline.clearLine(process.stdout, 0)
                    readline.cursorTo(process.stdout, 0)
                    let progress = contentDownloaded/contentLength
                    progress = (progress*100).toFixed(2) + '%'
                    process.stdout.write('    \x1b[32mProgress: '+progress+'\x1b[0m')
                })
                
                response.pipe(file)
                
                response.on('end', ()=>{
                    if(response.statusCode == 200){
                        console.log('') // writes new line
                        resolve({
                            contentLength: contentLength,
                            filename: filename,
                            filepath: filepath,
                        })
                    }else{
                        Util.error('Failed to download capture - '+id, true)
                    }
                })
            })
            
            request.on('error', (error)=>{
                Util.error('https request error: '+error, true)
            })
            
            request.end()
        })
    }
}

module.exports = CaptureManager
