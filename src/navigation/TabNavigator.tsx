import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DashboardScreen from '../screens/DashboardScreen';
import ModulScreen from '../screens/ModulScreen';
import AccountScreen from '../screens/AccountScreen';
import Icon from 'react-native-vector-icons/Ionicons';
import {View, Text} from 'react-native';
import {tabBarStyles as styles} from '../styles/tabBarStyles'; // GUNAKAN styles

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarStyle: [
          styles.tabBar,
          {
            height: 66 + insets.bottom,
            paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          },
        ],
        tabBarShowLabel: false,
        headerShown: false,
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon icon="home-outline" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Modul"
        component={ModulScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon icon="layers-outline" label="Aplikasi" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarIcon: ({focused}) => (
            <TabIcon icon="person-outline" label="Account" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

type TabIconProps = {
  icon: string;
  label: string;
  focused: boolean;
};

const TabIcon = ({icon, label, focused}: TabIconProps) => (
  <View style={styles.tabIconWrap}>
    <Icon
      name={icon}
      size={26}
      color={focused ? '#1E90FF' : '#AAB2BD'}
      style={styles.tabIcon}
    />
    <Text
      style={[
        styles.tabLabel,
        focused && {color: '#1E90FF', fontWeight: 'bold'},
      ]}>
      {label}
    </Text>
  </View>
);
