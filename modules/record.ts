export interface Record {
    id : number
    toData() : any
    updateRecord(data : any) : void
}