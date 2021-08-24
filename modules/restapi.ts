
import express from "express"
import cors from "cors"

export interface Record {
    id : number
    toData() : any
    updateRecord(data : any) : void
}

export interface RestCollection {
    get name() : string
    dataToRecord(data : any) : Record
    insert(record : Record) : number
    getRecordById(id : number) : Record
    getAllRecordsByField(fieldname : string, fieldvalue : any) : Record[]
    deleteAllRecordsByField(fieldname : string, fieldvalue : any) : Number
    getAllRecords() : Record[]
    getUpdatedRecordById(id : number, data : any) : Record
    updateRecordById(id : number, data : any) : Record
    deleteRecordById(id : number) : Record
}

class Constraint {
    public ownerCollection : RestCollection 
    public userCollection : RestCollection
    public fieldNameInUserCollection : string

    constructor(ownerCollection : RestCollection, 
                userCollection : RestCollection, 
                fieldNameInUserCollection : string) {
        this.ownerCollection = ownerCollection
        this.userCollection = userCollection
        this.fieldNameInUserCollection = fieldNameInUserCollection
    }
}

export class RestApi {
    private app : express.Application
    private port : number
    private constraints : Array<Constraint>
    private server : any // Todo what is this type

    constructor(port : number) {
        this.app = express() 
        this.port = port
        this.constraints = Array<Constraint>()
        this.setupExpress()
    }

    addConstraint(ownerCollection : RestCollection, 
                  userCollection : RestCollection, 
                  fieldNameInUserCollection : string) {
        const constraint = new Constraint(ownerCollection, 
                                          userCollection,
                                          fieldNameInUserCollection)
        this.constraints.push(constraint)
    }

    findConstraintsByOwner(ownerCollection : RestCollection) : Constraint[] {
        return this.constraints.filter((e) => e.ownerCollection == ownerCollection)
    }

    findConstraintsByUser(userCollection : RestCollection) : Constraint[] {
        return this.constraints.filter((e) => e.userCollection == userCollection)
    }

    isConstraintFulfilledWithNewRecord(constraint : Constraint, newRecord : Record) : boolean {
        const referenceField = Number(newRecord[constraint.fieldNameInUserCollection])
        const referencedRecord = constraint.ownerCollection.getRecordById(referenceField)
        return referencedRecord != undefined
    }

    isAllConstraintsFulfilledWithNewRecord(constraints : Constraint[], newRecord : Record) : boolean {
        for (const constraint of constraints) {
            if (!this.isConstraintFulfilledWithNewRecord(constraint, newRecord)) {
                return false; 
            }
        }
        return true;
    }

    registerEndpoint(restCollection : RestCollection) {
        const endpointName = restCollection.name
        // For testing: curl -d '{"name":"valami nev", "age":30}' -H "Content-Type: application/json" -X POST http://localhost:3000/ticket
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

            const constraints = this.findConstraintsByUser(restCollection)
            const fulfilled = this.isAllConstraintsFulfilledWithNewRecord(constraints, record)
            if (!fulfilled) {
                res.send({"status": "unfulfilled constraints"})
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
            if (record == undefined) {
                throw Error("TODO : Record not found, but this shoulnd't be internal errpr")
            }
            const data = record.toData()
            res.send(data)
        })

        const updateRecordWithNewValues = (req, res) => {
            const id = Number(req.params['id'])
            const data = req.body
            const updatedRecord = restCollection.getUpdatedRecordById(id, data)
            
            const constraints = this.findConstraintsByUser(restCollection)
            const fulfilled = this.isAllConstraintsFulfilledWithNewRecord(constraints, updatedRecord)
            if (!fulfilled) {
                res.send({"status": "unfulfilled constraints"})
                return
            }

            restCollection.updateRecordById(id, data)
            const updatedData = updatedRecord.toData()
            res.send(updatedData)
        }

        this.app.patch(`${endpointName}/:id`, updateRecordWithNewValues)
        this.app.put(`${endpointName}/:id`, updateRecordWithNewValues)

        this.app.delete(`${endpointName}/:id`, (req, res) => {
            const id = Number(req.params['id'])
            const deleted = restCollection.deleteRecordById(id)

            const constraints = this.findConstraintsByOwner(restCollection)
            for (const constraint of constraints) {
                const fieldName = constraint.fieldNameInUserCollection
                constraint.userCollection.deleteAllRecordsByField(fieldName, id)
            }

            const deletedData = deleted.toData()
            res.send(deletedData)
        })
    }

    public setupExpress() : void {
        this.app.use(cors())
        // Configuring body parser middleware
        this.app.use(express.urlencoded({ extended: false }))
        this.app.use(express.json())
    }

    public async start() : Promise<void> {
        return new Promise((resolve) => {
            this.server = this.app.listen(this.port, () => {
                resolve()
            })
        })
    }

    public stop() : void {
        this.server.close()
    }
}