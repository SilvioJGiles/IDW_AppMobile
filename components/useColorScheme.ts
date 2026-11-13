<<<<<<< HEAD
export { useColorScheme } from 'react-native';
=======
import { useColorScheme as useColorSchemeCore } from 'react-native';

export const useColorScheme = () => {
  const coreScheme = useColorSchemeCore();
  return coreScheme === 'dark' ? 'dark' : 'light';
};
>>>>>>> 4a91ebb543abe322121176d612fecf3cab29610e
