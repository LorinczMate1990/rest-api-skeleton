import { Record } from "./record"

export interface RestCollection {
    get name() : string
    dataToRecord(data : any) : Record
    insert(data : any) : number
    getRecordById(id : number) : Record
    getAllRecordsByField(fieldname : string, fieldvalue : any) : Record[]
    deleteAllRecordsByField(fieldname : string, fieldvalue : any) : Number
    getAllRecords() : Record[]
    getUpdatedRecordById(id : number, data : any) : Record
    updateRecordById(id : number, data : any) : Record
    deleteRecordById(id : number) : Record
}