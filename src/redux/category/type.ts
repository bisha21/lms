export enum Status{
    LOADING="loading",
    SUCCESS= "success",
    ERROR="error"
}
export interface ICategory{
    _id: string;
    name: string;
    description: string;
    createdAt: Date;
}

export interface ICategoryInitalState{
    categories: ICategory[];
    status: Status;
}