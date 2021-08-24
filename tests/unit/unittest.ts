import { expect } from "chai"
import bent from "bent"
import {Record, RestApi} from "../../modules/restapi"
import { VolatileRestCollection } from "../../modules/volatile-rest-collection"

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

class SubExampleRecord implements Record {
    public color : string
    public id: number
    public ownerExampleId : number

    constructor(data : any) {
        this.color = data.color
        this.ownerExampleId = data.ownerExampleId
    }

    updateRecord(data: any): void {
        for (const key in data) {
            this[key] = data[key]
        }
    }

    toData() {
        return {id: this.id, color: this.color, ownerExampleId: this.ownerExampleId}
    }    
}

describe("Simple test cases", () => {
    let restApi : RestApi
    let collection : VolatileRestCollection
    let baseUrl = "http://localhost:3000/"
    let endpoint = "example"
    let url = `${baseUrl}${endpoint}`
    const GET = bent(baseUrl, 'GET');
    const POST = bent(baseUrl, 'POST');
    const DELETE = bent(baseUrl, 'DELETE');
    const PUT = bent(baseUrl, 'PUT');

    afterEach(() => {
        restApi.stop()
    })

    describe("Handling two collections with constrains", () => {
        let subCollection : VolatileRestCollection
        let subendpoint = "sub"+endpoint

        beforeEach(async () => {
            collection = new VolatileRestCollection("/"+endpoint, ExampleRecord)
            subCollection = new VolatileRestCollection("/"+subendpoint, SubExampleRecord)
            
            restApi = new RestApi(3000)
            restApi.registerEndpoint(collection)
            restApi.registerEndpoint(subCollection)
            restApi.addConstraint(collection, subCollection, "ownerExampleId")
            await restApi.start()
        })

        it("Post subRecord without owner", async () =>{
            const testObject = {color: "red", ownerExampleId: 134}
            let stream = await POST(subendpoint, testObject)
            const obj = await stream.json()
            expect(obj).to.deep.equals({ status: 'unfulfilled constraints' });
            expect(subCollection.collection.length).to.equals(0)
        })

        it("Post subRecord with owner", async () =>{
            const testObject = new ExampleRecord({name: "test", age: 13})
            testObject.id = 10
            collection.collection.push(testObject)
            
            const subTestObject = {color: "red", ownerExampleId: 10}
            let stream = await POST(subendpoint, subTestObject)
            const obj = await stream.json()
            ///////////////////////////// TODO EZ NAGYON ROSSZ
            expect(obj).to.deep.equals({ status: 'inserted', id: 0 });
            expect(subCollection.collection.length).to.equals(1)
        })
    })

    describe("Handling a simple collection", () => {
        beforeEach(async () => {
            collection = new VolatileRestCollection("/"+endpoint, ExampleRecord)
            restApi = new RestApi(3000)
            restApi.registerEndpoint(collection)
            await restApi.start()
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
    })
})