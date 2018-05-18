const fs = require('fs')
const sqlite3 = window.require('sqlite3')

class QueryResult{
    constructor(records){
        Object.assign(this, {
            first: records.length > 0? records[0]: null,
            records: records,
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
        console.log('SQL Error')
        console.log(error)
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
    CREATE_STATEMENTS_FILE: process.env.SQL_DIR+'create_statements.sql',
    DB_FILE: process.env.DATA_DIR+'captures.sqlite3',
    ready: false,
})

if(!fs.existsSync(SqLite.DB_FILE)){
    fs.openSync(SqLite.DB_FILE, 'w')
}

module.exports = (new SqLite())
