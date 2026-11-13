<<<<<<< HEAD
import React from 'react';
=======
import { useEffect, useState } from 'react';
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e

// `useEffect` is not invoked during server rendering, meaning
// we can use this to determine if we're on the server or not.
export function useClientOnlyValue<S, C>(server: S, client: C): S | C {
<<<<<<< HEAD
  const [value, setValue] = React.useState<S | C>(server);
  React.useEffect(() => {
=======
  const [value, setValue] = useState<S | C>(server);
  useEffect(() => {
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e
    setValue(client);
  }, [client]);

  return value;
}
