import { expect } from "chai"
import bent from "bent"
import {Record, RestCollection, RestApi} from "../../modules/restapi"

class ExampleRecord implements Record {
    public name : string
    public age : number
    public id: number

    constructor(data : any) {
        this.name = data.name
        this.age = data.age
    }

    updateRecord(data: any): void {
        for (const key in data) {
            this[key] = data[key]
        }
    }

    toData() {
        return {id: this.id, name: this.name, age: this.age}
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
    getAllRecordsByField(fieldname: string, fieldvalue: any): Record[] {
        return this.collection.filter((record) => record[fieldname] == fieldvalue)
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
        
        const copyRecord = new ExampleRecord(record.toData())
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

describe("Simple collections", () => {
    let restApi : RestApi
    let collection : VolatileRestCollection
    let baseUrl = "http://localhost:3000/"
    let endpoint = "example"
    let url = `${baseUrl}${endpoint}`
    const GET = bent(baseUrl, 'GET');
    const POST = bent(baseUrl, 'POST');
    const DELETE = bent(baseUrl, 'DELETE');
    const PUT = bent(baseUrl, 'PUT');

    beforeEach(async () => {
        collection = new VolatileRestCollection("/"+endpoint)
        restApi = new RestApi(3000)
        restApi.registerEndpoint(collection)
        await restApi.start()
    })

    afterEach(() => {
        restApi.stop()
    })

    it("Query empty collection", async () => {
        let stream = await GET(endpoint)
        // status code
        //console.log("stream.status", stream.status)
        //console.log("stream.statusCode", stream.statusCode)
        const obj = await stream.json()
        expect(obj).to.be.an('array').that.is.empty;
    })
   
    it("Post an element", async () => {
        const testObject = {name: "test", age: 14}
        let stream = await POST(endpoint, testObject)
        const obj = await stream.json()
        expect(obj).to.deep.equals({ status: 'inserted', id: 0 });
        expect(collection.collection[0]).to.contains(testObject).and.contains({id: 0})
    })
    
    it("Test GET method", async () => {
        const testObject = new ExampleRecord({name: "test", age: 13})
        testObject.id = 0
        const testObject2 = new ExampleRecord({name: "test2", age: 14})
        testObject2.id = 1
        collection.collection.push(testObject)
        collection.collection.push(testObject2)
        let obj = await (await GET(endpoint)).json()
        expect(obj).to.be.an('array').that.deep.equals([testObject.toData(), testObject2.toData()]);
        obj = await (await GET(endpoint+"/0")).json()
        expect(obj).to.be.deep.equals(testObject.toData());
        obj = await (await GET(endpoint+"/1")).json()
        expect(obj).to.be.deep.equals(testObject2.toData());
    })

    it("Delete an element", async() => {
        const testObject = new ExampleRecord({name: "test", age: 13})
        testObject.id = 0
        collection.collection.push(testObject)
        let stream = await DELETE(endpoint+"/0")
        const obj = await stream.json()
        expect(collection.collection).to.be.an('array').that.is.empty;
    })

    it("Put an element", async() => {
        const testObject = new ExampleRecord({name: "test", age: 13})
        testObject.id = 0
        collection.collection.push(testObject)
        const modification = {name: "other"}
        let stream = await PUT(endpoint+"/0", modification)
        const obj = await stream.json()
        expect(collection.collection[0]).contains(modification);
    })

});