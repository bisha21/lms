import { createConnection } from '@/database/db';
import { Category } from '@/database/models/category';
import { data } from 'react-router';
export async function createCategory(req: Request) {
    await createConnection();
    const{name,description}= await req.json();
    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
        return  Response.json({ message: 'Category already exists' }, { status: 400 });
    }
    try{
     await Category.create({ name, description});
    return Response.json({ message: 'Category created successfully' }, { status: 201 });
    
    }catch(err){
        console.log(err);
        return Response.json({ message: 'Failed to create category' }, { status: 500 });
    }

}
export async function getAllCategory(){
    const category= await Category.find();
    if(category.length===0)
    {
        return Response.json({ message: 'Category not found' }, { status: 404 });
    }
    try{
        return Response.json({
            message:"Category fetched successfully",
            data:category,
            status: 200

        });
    }catch(err)
    {
        console.log(err);
        return Response.json({ message: 'Failed to get category' }, { status: 500 });
    }
}
