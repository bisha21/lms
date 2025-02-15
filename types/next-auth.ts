declare module "next-auth"
{
    interface Session{
        user:{
            role: string,
            id: string,
            name: string,
            email: string,
            image: string,
        }
    }
}