"use client"
import {signIn} from "next-auth/react"
const Page = () => {
  return (
    <div className='w-[100vw] h-[100vh] flex items-center justify-center'>
        <button className='bg-green-500 hover:bg-grenn-700 text-white font-bold py-2 px-4 rounded-md shadow-md'
        onClick={()=>signIn("google")}
        >Continue with google</button>
    </div>
  )
}

export default Page