import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Mapbox from '@rnmapbox/maps';

import RootNavigator from './src/app/navigation/RootNavigator';
import { MAPBOX_ACCESS_TOKEN } from './src/config/mapboxConfig';

Mapbox.setAccessToken(MAPBOX_ACCESS_TOKEN);

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <RootNavigator />
    </SafeAreaProvider>
  );
}

export default App;