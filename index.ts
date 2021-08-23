import {Record, RestCollection, RestApi} from "./modules/restapi"

// Database interface

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

    constructor(data : any) {
        console.log("data", data)
        this.name = data.name
        this.age = data.age
    }

    updateRecord(data: any): void {
        for (const key in data) {
            this[key] = data[key]
        }
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

    updateRecordById(id: number, data: any): Record {
        let record = this.collection.find((element) => element.id == id)
        if (record == undefined) {
            throw new Error("ID not exists")
        }
        record.updateRecord(data)
        return record
    }

    dataToRecord(data : any) : ExampleRecord {
        return new ExampleRecord(data)
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