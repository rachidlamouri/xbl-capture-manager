import fs from 'fs'
import sqlite from 'common/SqLite'
import JSZip from 'JSZip'
import dateFormat from 'dateformat'
import mkdirp from 'mkdirp'

class CapturesController{    
    static cacheClip(clipId, gamertag, dateTaken){
        let year = dateFormat(dateTaken, 'yyyy')
        let month = dateFormat(dateTaken, 'mm')
        let archiveDir = process.env.ARCHIVE_DIR+gamertag+'/clips/'+year+'/'
        let archiveName = gamertag+'-clips-'+year+'-'+month+'.zip'
        let tmpDir = process.env.TMP_DIR+'clips/'
        let filename = clipId+'.mp4'
        let tmpFilepath = tmpDir+filename
        
        return new Promise((resolve, reject)=>{
            new Promise((resolve)=>{
                // delay to allow mapStateToProps to propogate
                setTimeout(()=>{resolve()}, 100)
            })
            .then(()=>{
                if(!fs.existsSync(tmpFilepath)){
                    mkdirp.sync(tmpDir)
                    let archiveBuffer = fs.readFileSync(archiveDir+archiveName)
                    JSZip.loadAsync(archiveBuffer)
                    .then((zip)=>{
                        zip.file(filename).async('uint8array').then((data)=>{
                            fs.writeFileSync(tmpFilepath, data)
                            resolve(tmpFilepath)
                        })
                    })
                }else{
                    resolve(tmpFilepath)
                }
            })
        })
    }
    static getClips(xuid){
        if(xuid == null){
            return Promise.resolve([])
        }
        
        let sql = `
            SELECT
                Id,
                Gamertag,
                GameName,
                DateTaken
            FROM Clips
            WHERE IsArchived = 1
                AND XUID = $XUID
            ORDER BY DateTaken DESC
            LIMIT 10
        `
        
        let params = {
            $XUID: xuid,
        }
        
        return(
            sqlite.query(sql, params)
            .then((result)=>{
                let promises = []
                result.records.forEach((record)=>{
                    let thumbnailPromise = (
                        CapturesController.extractClipThumbnail(record.Id, record.Gamertag, record.DateTaken, 'small')
                        .then((thumbnail)=>{
                            record.thumbnail = thumbnail
                        })
                    )
                    
                    promises.push(thumbnailPromise)
                })
                
                return Promise.all(promises).then(()=>{
                    return result.records
                })
            })
        )
    }
    static getDefaultProfile(){
        let sql = `
            SELECT
                XUID,
                Gamertag
            FROM Profiles
            ORDER BY
                IsDefault DESC,
                Gamertag
            LIMIT 1
        `
        
        return(
            sqlite.query(sql, {})
            .then((result)=>{
                let record = result.first? result.first: []
                return Promise.resolve(result.first)
            })
        )
    }
    static getProfiles(){
        let sql = `
            SELECT
                XUID,
                Gamertag
            FROM Profiles
            ORDER BY Gamertag
        `
        
        return(
            sqlite.query(sql, {})
            .then((result)=>{
                return Promise.resolve(result.records)
            })
        )
    }
    static extractClipThumbnail(clipId, gamertag, dateTaken, thumbnailType){
        let year = dateFormat(dateTaken, 'yyyy')
        let month = dateFormat(dateTaken, 'mm')
        let archiveDir = process.env.ARCHIVE_DIR+gamertag+'/thumbnails-'+thumbnailType+'/'+year+'/'
        let archiveName = gamertag+'-thumbnails-'+thumbnailType+'-'+year+'-'+month+'.zip'
        let tmpDir = process.env.TMP_DIR+thumbnailType+'/'
        let filename = clipId+'.png'
        let tmpFilepath = tmpDir+filename
        
        
        return new Promise((resolve, reject)=>{
            if(!fs.existsSync(tmpFilepath)){
                mkdirp.sync(tmpDir)
                let archiveBuffer = fs.readFileSync(archiveDir+archiveName)
                JSZip.loadAsync(archiveBuffer)
                .then((zip)=>{
                    zip.file(filename).async('uint8array').then((data)=>{
                        fs.writeFileSync(tmpFilepath, data)
                        resolve(tmpFilepath)
                    })
                })
            }else{
                resolve(tmpFilepath)
            }
        })
    }
}

export default CapturesController
