import mongoose, { Schema } from "mongoose"
 interface ICategoryType extends Document  {
    name: string,
    description: string,
    createdAt: Date,
}

const categorySchema  = new Schema<ICategoryType>({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    description:String,
    createdAt:{
    type:Date,
    default:Date.now
    },

})
export const Category = mongoose.models.Category || mongoose.model("Category", categorySchema);
