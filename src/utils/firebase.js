import messaging from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import notifee, {AndroidImportance} from '@notifee/react-native';
import API_BASE_URL from '../config';

const sanitizeTopic = name => {
  return (
    'onedh_' +
    name
      .toLowerCase()
      .replace(/&/g, 'and')
      .replace(/[^a-z0-9._~%]+/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
  );
};

const getAuthHeader = async () => {
  const cache = await AsyncStorage.getItem('loginCache');
  const token = cache && JSON.parse(cache)?.token;
  if (!token) throw new Error('Token tidak ditemukan!');
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
};

export const requestUserPermission = async () => {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    await getFcmToken();
    await createNotificationChannel();
  } else {
  }
};

export const getFcmToken = async () => {
  let fcmToken = await AsyncStorage.getItem('fcmToken');

  if (!fcmToken) {
    try {
      const token = await messaging().getToken();
      if (token) {
        await AsyncStorage.setItem('fcmToken', token);
        await sendTokenToServer(token);
      }
    } catch {}
  } else {
    await sendTokenToServer(fcmToken);
  }
};

export const subscribeToTopics = async (dept, site) => {
  try {
    const deptTopic = sanitizeTopic(dept);
    const siteTopic = sanitizeTopic(site);
    await messaging().subscribeToTopic(deptTopic);
    await messaging().subscribeToTopic(siteTopic);
    await messaging().subscribeToTopic('onedh_all');
  } catch {}
};

export const unsubscribeFromTopics = async (dept, site) => {
  try {
    const deptTopic = `onedh_${dept.replace(/\s+/g, '_').toLowerCase()}`;
    const siteTopic = `onedh_${site.toLowerCase()}`;
    await messaging().unsubscribeFromTopic(deptTopic);
    await messaging().unsubscribeFromTopic(siteTopic);
    await messaging().unsubscribeFromTopic('onedh_all');
  } catch {}
};

const sendTokenToServer = async token => {
  try {
    const headers = await getAuthHeader();
    await axios.post(
      `${API_BASE_URL.onedh}/FCMToken`,
      {fcm_token: token},
      {headers},
    );
  } catch {}
};

export const createNotificationChannel = async () => {
  await notifee.createChannel({
    id: 'default',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
  });
};

export const listenForNotifications = () => {
  messaging().onMessage(async remoteMessage => {
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'Notifikasi',
      body: remoteMessage.notification?.body || 'Pesan baru masuk!',
      android: {
        channelId: 'default',
        smallIcon: 'ic_launcher',
        pressAction: {
          id: 'default',
        },
      },
    });
  });
};

export {};
