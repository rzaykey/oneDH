import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';

// Import semua screens yang kamu gunakan
import AuthLoadingScreen from '../screens/AuthLoadingScreen';
import UpdatePassword from '../screens/UpdatePasswordScreen';
import LoginScreen from '../screens/LoginScreen';
import Register from '../screens/RegisterScreen';
// import FullDashboard from '../screens/FullDashboard';
// import AdminDashboard from '../screens/AdminDashboard';
// import TrainerDashboard from '../screens/TrainerDashboard';
import Data from '../screens/otpd/mentoring/Data';
import TrainHours from '../screens/otpd/trainhours/TrainHours';
import EditDataMentoring from '../screens/otpd/mentoring/EditDataMentoring';
import AddDataMentoring from '../screens/otpd/mentoring/AddDataMentoring';
import DailyActivity from '../screens/otpd/daily/Daily';
import AddDailyActivity from '../screens/otpd/daily/AddDailyActivity';
import EditDailyActivity from '../screens/otpd/daily/EditDailyActivity';
import AddTrainHours from '../screens/otpd/trainhours/AddTrainHours';
import EditTrainHours from '../screens/otpd/trainhours/EditTrainHours';
import Mop from '../screens/otpd/mop/Mop';
import AddMop from '../screens/otpd/mop/AddMop';
import TabNavigator from './TabNavigator';
import JCMScreen from '../screens/module/JCMScreen';
import CreateJCMScreen from '../screens/jcm/CreateJCMScreen';
import JCMHistoryScreen from '../screens/jcm/JCMHistoryScreen';
import JCMOpenScreen from '../screens/jcm/JCMOpenScreen';
import JCMValidasiScreen from '../screens/jcm/JCMValidasiScreen';
import MOPScreen from '../screens/module/MOPScreen';
import SitePickerScreen from '../screens/SitePickerScreen';
import P2HScreen from '../screens/module/P2HScreen';
import P2HHistory from '../screens/p2h/P2HHistoryScreen';
import P2HMyHistory from '../screens/p2h/P2HMyHistoryScreen';
import P2HDetailScreen from '../screens/p2h/P2HDetailScreen';
import CreateP2HScreen from '../screens/p2h/CreateP2HScreen';
import MasterCacheScreen from '../screens/MasterCacheScreen';

// Stack inisialisasi dengan tipe RootStackParamList
const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="AuthLoading"
    screenOptions={{headerShown: false}}>
    <Stack.Screen name="AuthLoading" component={AuthLoadingScreen} />
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="SitePicker" component={SitePickerScreen} />
    <Stack.Screen
      name="UpdatePassword"
      component={UpdatePassword}
      options={{title: 'Update Password'}}
    />
    <Stack.Screen name="Register" component={Register} />
    <Stack.Screen name="MainApp" component={TabNavigator} />
    <Stack.Screen name="MOPScreen" component={MOPScreen} />

    <Stack.Screen name="JCMScreen" component={JCMScreen} />
    <Stack.Screen name="JCMHistoryScreen" component={JCMHistoryScreen} />
    <Stack.Screen name="CreateJCMScreen" component={CreateJCMScreen} />
    <Stack.Screen name="JCMOpenScreen" component={JCMOpenScreen} />
    <Stack.Screen name="JCMValidasiScreen" component={JCMValidasiScreen} />

    <Stack.Screen name="P2HScreen" component={P2HScreen} />
    <Stack.Screen name="P2HHistory" component={P2HHistory} />
    <Stack.Screen name="P2HMyHistory" component={P2HMyHistory} />
    <Stack.Screen name="P2HDetail" component={P2HDetailScreen} />
    <Stack.Screen name="CreateP2HScreen" component={CreateP2HScreen} />

    <Stack.Screen name="MasterCacheScreen" component={MasterCacheScreen} />

    <Stack.Screen
      name="Data"
      component={Data}
      options={{title: 'Data Mentoring'}}
    />
    <Stack.Screen
      name="EditDataMentoring"
      component={EditDataMentoring}
      options={{title: 'Edit Data Mentoring'}}
    />
    <Stack.Screen
      name="AddDataMentoring"
      component={AddDataMentoring}
      options={{title: 'Add Data Mentoring'}}
    />
    <Stack.Screen name="DailyActivity" component={DailyActivity} />
    <Stack.Screen
      name="AddDailyActivity"
      component={AddDailyActivity}
      options={{title: 'Add Daily Activity'}}
    />
    <Stack.Screen
      name="EditDailyActivity"
      component={EditDailyActivity}
      options={{title: 'Edit Daily Activity'}}
    />
    <Stack.Screen name="TrainHours" component={TrainHours} />
    <Stack.Screen
      name="AddTrainHours"
      component={AddTrainHours}
      options={{title: 'Add Train Hours'}}
    />
    <Stack.Screen
      name="EditTrainHours"
      component={EditTrainHours}
      options={{title: 'Edit Train Hours'}}
    />
    <Stack.Screen
      name="Mop"
      component={Mop}
      options={{title: 'Data Mine Operator Performance '}}
    />
    <Stack.Screen
      name="AddMop"
      component={AddMop}
      options={{title: 'Add MOP'}}
    />
  </Stack.Navigator>
);

export default AppNavigator;
