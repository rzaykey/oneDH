/**
 * @format
 */

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

import messaging from '@react-native-firebase/messaging';
import notifee, {AndroidImportance} from '@notifee/react-native';

messaging().setBackgroundMessageHandler(async remoteMessage => {
  await notifee.displayNotification({
    title: remoteMessage.notification?.title || 'Notifikasi',
    body: remoteMessage.notification?.body || '',
    android: {
      channelId: 'default',
      importance: AndroidImportance.HIGH,
    },
  });
});

async function createDefaultChannel() {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
}

createDefaultChannel();

AppRegistry.registerComponent(appName, () => App);
