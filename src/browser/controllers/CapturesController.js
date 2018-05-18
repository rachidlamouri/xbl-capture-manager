import fs from 'fs'
import sqlite from 'common/SqLite'
import JSZip from 'JSZip'
import dateFormat from 'dateformat'
import mkdirp from 'mkdirp'

class CapturesController{    
    static getClips(){
        let sql = `
            SELECT
                Id,
                Gamertag,
                DateTaken
            FROM Clips
            WHERE IsArchived = 1
            ORDER BY DateTaken DESC
            LIMIT 10
        `
        
        return(
            sqlite.query(sql, {})
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
    static extractClipThumbnail(clipId, gamertag, dateTaken, thumbnailType){
        let year = dateFormat(dateTaken, 'yyyy')
        let month = dateFormat(dateTaken, 'mm')
        let archiveDir = process.env.ARCHIVE_DIR+gamertag+'/thumbnails-'+thumbnailType+'/'+year+'/'
        let archiveName = gamertag+'-thumbnails-'+thumbnailType+'-'+year+'-'+month
        let tmpDir = process.env.TMP_DIR+thumbnailType+'/'
        let tmpFilepath = tmpDir+clipId+'.png'
        
        return new Promise((resolve, reject)=>{
            if(!fs.existsSync(tmpFilepath)){
                mkdirp.sync(tmpDir)
                let archiveBuffer = fs.readFileSync(archiveDir+archiveName+'.zip')
                return(
                    JSZip.loadAsync(archiveBuffer)
                    .then((zip)=>{
                        return zip.file(clipId+'.png').async('uint8array').then((data)=>{
                            fs.writeFileSync(tmpName, data)
                            return tmpFilepath
                        })
                    })
                )
            }else{
                resolve(tmpFilepath)
            }
        })
    }
}

export default CapturesController
