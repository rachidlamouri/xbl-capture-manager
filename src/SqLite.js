const fs = require('fs')
const sqlite3 = require('sqlite3')
const Util = require('./Util')

class QueryResult{
    constructor(rows){
        Object.assign(this, {
            first: rows.length > 0? rows[0]: null,
            rows: rows,
        })
    }
}

class SqLite{
    query(sql, params, supressLog){
        if(!SqLite.ready){
            return SqLite.init().then(()=>{
                return this.query(sql, params, supressLog)
            })
        }
        
        return SqLite.query(sql, params, supressLog)
    }
    
    static init(){
        return new Promise((resolve, reject)=>{
            let createStatements = fs.readFileSync(SqLite.CREATE_STATEMENTS_FILE, 'utf8')
            let statementList = createStatements.split(';')
            statementList.pop()
        
            let createNext = ()=>{
                if(statementList.length == 0){
                    SqLite.ready = true
                    resolve()
                }else{
                    SqLite.query(statementList.shift(), {}).then(()=>{
                        createNext()
                    })
                }
            }
            createNext()
        })
    }
    
    static connect(){
        return new sqlite3.Database(SqLite.DB_FILE)
    }
    static onError(error){
        Util.error(error)
    }
    static query(sql, params, supressLog = false){
        return new Promise((resolve, reject)=>{
            let db = SqLite.connect()
            
            let handleError = (error)=>{
                if(error){
                    if(!supressLog){
                        SqLite.onError(error)
                    }
                    reject(error)
                }
            }
            
            db.all(sql, params, (error, result)=>{
                if(error){
                    handleError(error)
                }else{
                    resolve(new QueryResult(result))
                }
            })
            
            db.close(handleError)
        })
    }
}
Object.assign(SqLite, {
    CREATE_STATEMENTS_FILE: 'sql/create_statements.sql',
    DB_FILE: process.env.SAVE_DIR + 'captures.sqlite',
    ready: false,
})

if(!fs.existsSync(SqLite.DB_FILE)){
    fs.openSync(SqLite.DB_FILE, 'w')
}

module.exports = (new SqLite())
