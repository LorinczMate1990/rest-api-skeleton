import express from "express"
import cors from "cors"

const app = express()
const port = 3000

// Database interface
let tickets = []
let people = []

app.use(cors())

// Configuring body parser middleware
app.use(express.urlencoded({ extended: false }))
app.use(express.json())

interface Record {
    get id() : number
    set id(val : number)
    toData() : any
}

interface RestCollection {
    get name() : string
    dataToRecord(data : any) : Record
    insert(record : Record) : number
    getRecordById(id : number) : Record
    getAllRecords() : Record[]
}

class ExampleRecord implements Record {
    private _id : number
    get id() : number {
        return this._id
    }
    set id(val : number) {
        this._id = val
    }

    public name : string
    public age : number

    constructor(id : number, name : string, age : number) {
        this.name = name
        this.age = age
    }

    toData() {
        return {id: this._id, name: this.name, age: this.age}
    }
}

class VolatileRestCollection implements RestCollection {
    private _name : string
    public collection : ExampleRecord[]
    private nextId : number

    get name(): string {
        this.collection = [];
        return this._name
    }
    
    constructor(_name : string) {
        this._name = _name
        this.nextId = 0 
    }

    dataToRecord(data : any) : ExampleRecord {
        return new ExampleRecord(10, "kjjj", 4)
    }

    insert(record : Record) : number {
        if (record instanceof ExampleRecord) {
            record.id = this.nextId
            this.nextId++
            this.collection.push(record)
            return record.id
        }
        throw new Error("This is not an ExampleRecord")
    }

    getRecordById(id : number) : Record {
        let ret = this.collection.find((element) => element.id == id)
        if (ret == undefined) {
            throw new Error("ID not exists")
        }
        return ret
    }

    getAllRecords() : Record[] {
        return this.collection;
    }
} 

class RestApi {
    private app : Express.Application

    constructor(app : Express.Application, restCollections : RestCollection[]) {
        this.app = app
    }

    registerEndpoint(restCollection : RestCollection) {
        const endpointName = restCollection.name
        console.log("register post by name", endpointName)
        // For testing: curl -d '{"name":"valami nev", age:30}' -H "Content-Type: application/json" -X POST http://localhost:3000/example
        app.post(endpointName, (req, res) => {
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
        app.get(endpointName, (req, res) => {
            const records = restCollection.getAllRecords()
            const dataRecords = records.map((record : Record) => {
                return record.toData()
            })
            res.send(dataRecords)
        })

        app.get(`${endpointName}/:id`, (req, res) => {
            const id = Number(req.params['id'])
            const record = restCollection.getRecordById(id)
            const data = record.toData()
            res.send(data)
        })
    }
}


let restApi = new RestApi(app, [new VolatileRestCollection("/example")])
restApi.registerEndpoint(new VolatileRestCollection("/example"))

app.listen(port, () => console.log(`Hello world app listening on port ${port}!`))