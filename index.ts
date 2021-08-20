import {Record, RestCollection, RestApi} from "./modules/restapi"

// Database interface
let tickets = []
let people = []

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


let restApi = new RestApi(3000, [new VolatileRestCollection("/example")])
restApi.registerEndpoint(new VolatileRestCollection("/example"))
restApi.listen()