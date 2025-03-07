import { Status } from "../category/type"


interface ICategory{
    _id : string, 
    name : string, 
    description : string, 
    createdAt : string 
}
export interface ICourseForData{
    title : string, 
    coursePrice : string, 
    courseDescription: number, 
    category : ICategory | string, 
    duration : string,
    _id ?: string 
}

export interface ICourse extends ICourseForData{

    createdAt : string 
}

export interface IInitialData{
    courses : ICourse[], 
    status : Status
}