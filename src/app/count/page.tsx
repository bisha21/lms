'use client';

import { useState } from 'react';
import { Counter } from './count';
// interface IProps{
//     count: number;
//     setCount:Dispatch<SetStateAction<undefined>>
// }

const CountPage = () => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <h1>Count Page</h1>
      <Counter count={count} setCount={setCount} />
    </div>
  );
};

export default CountPage;
