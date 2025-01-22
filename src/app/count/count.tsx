"use client";

import { Dispatch, SetStateAction } from "react";

interface IProps{
    count: number,
setCount:Dispatch<SetStateAction<number>>
    
}
 export const Counter= ({count, setCount}:IProps)=>{
   return(
    <>
    <h2>{count}</h2>
    <button onClick={()=>setCount(count + 1)}>Inc</button>
    </>
   )
}