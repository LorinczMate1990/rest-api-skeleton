import { Record } from "./record"
import { RestCollection } from "./rest-collection"

export class VolatileRestCollection implements RestCollection {
    private _name : string
    public collection : Record[]
    private nextId : number
    private SpecificRecord : new (data: any) => Record

    get name(): string {
        return this._name
    }
    
    constructor(name : string, SpecificRecord : new (data: any) => Record) {
        this.collection = [];
        this._name = name
        this.nextId = 0 
        this.SpecificRecord = SpecificRecord
    }
    getAllRecordsByField(fieldname: string, fieldvalue: any): Record[] {
        const filteredCollection = this.collection.filter((record) => record[fieldname] == fieldvalue)
        const copiedRecords = filteredCollection.map((record : Record) => new this.SpecificRecord(record.toData()))
        return copiedRecords;
    }
    deleteAllRecordsByField(fieldname: string, fieldvalue: any): Number {
        const originalLength = this.collection.length
        this.collection = this.collection.filter((record) => record[fieldname] != fieldvalue)
        const newLength = this.collection.length
        return originalLength - newLength
    }
    getUpdatedRecordById(id: number, data: any): Record {
        const record = this.collection.find((element) => element.id == id)
        if (record == undefined) {
            throw new Error("ID does not exist")
        }
        
        const copyRecord = new this.SpecificRecord(record.toData())
        copyRecord.updateRecord(data)
        return copyRecord
    }
    deleteRecordById(id: number): Record {
        const record = this.getRecordById(id)
        this.deleteAllRecordsByField("id", id)
        return record
    }

    updateRecordById(id: number, data: any): Record {
        let record = this.collection.find((element) => element.id == id)
        if (record == undefined) {
            throw new Error("ID not exists")
        }
        record.updateRecord(data)
        return record
    }

    dataToRecord(data : any) : Record {
        return new this.SpecificRecord(data)
    }

    insert(data : any) : number {
        const record = this.dataToRecord(data)
        record.id = this.nextId
        this.nextId++
        this.collection.push(record)
        return record.id
    }

    getRecordById(id : number) : Record {
        let ret = this.collection.find((element) => element.id == id)
        return new this.SpecificRecord(ret.toData())
    }

    getAllRecords() : Record[] {
        return this.collection.map((record : Record) => new this.SpecificRecord(record.toData()));
    }
}
