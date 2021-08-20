
import express from "express"
import cors from "cors"

export interface Record {
    get id() : number
    set id(val : number)
    toData() : any
}

export interface RestCollection {
    get name() : string
    dataToRecord(data : any) : Record
    insert(record : Record) : number
    getRecordById(id : number) : Record
    getAllRecords() : Record[]
}

export class RestApi {
    private app : express.Application
    private port : number

    constructor(port : number, restCollections : RestCollection[]) {
        this.app = express() 
        this.port = port
    }

    registerEndpoint(restCollection : RestCollection) {
        const endpointName = restCollection.name
        console.log("register post by name", endpointName)
        // For testing: curl -d '{"name":"valami nev", age:30}' -H "Content-Type: application/json" -X POST http://localhost:3000/example
        this.app.post(endpointName, (req, res) => {
            const data = req.body
            const headers = req.headers
            let record : Record
            try {
                record = restCollection.dataToRecord(data)
            } catch {
                res.send({"status": "wrong data format"})
                return
            }
    
            let id : number
            try {
                id = restCollection.insert(record)
            } catch {
                res.send({"status": "data can't inserted"})
                return
            }
            
            res.send({"status": "inserted", "id": id})
        })
        

        console.log("register get by name", endpointName)
        this.app.get(endpointName, (req, res) => {
            const records = restCollection.getAllRecords()
            const dataRecords = records.map((record : Record) => {
                return record.toData()
            })
            res.send(dataRecords)
        })

        this.app.get(`${endpointName}/:id`, (req, res) => {
            const id = Number(req.params['id'])
            const record = restCollection.getRecordById(id)
            const data = record.toData()
            res.send(data)
        })
    }

    public listen() : void {
        this.app.use(cors())

        // Configuring body parser middleware
        this.app.use(express.urlencoded({ extended: false }))
        this.app.use(express.json())
        this.app.listen(this.port, () => console.log(`Hello world app listening on port ${this.port}!`))
    }
}