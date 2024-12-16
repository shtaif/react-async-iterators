import { useState } from 'react';

export { useSimpleRerender };

function useSimpleRerender(): () => void {
  const [, setMockCount] = useState(0);
  return () => setMockCount(count => count + 1);
}
