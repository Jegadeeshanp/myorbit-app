import { Tabs } from 'expo-router';
import { Sun, CheckSquare, Wallet, Heart, BarChart2 } from 'lucide-react-native';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor:  '#F3F4F6',
          borderTopWidth:  1,
        },
        tabBarActiveTintColor:   '#111827',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <Sun size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="do"
        options={{
          title: 'Do',
          tabBarIcon: ({ color }) => <CheckSquare size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="money"
        options={{
          title: 'Money',
          tabBarIcon: ({ color }) => <Wallet size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="body"
        options={{
          title: 'Body',
          tabBarIcon: ({ color }) => <Heart size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="reflect"
        options={{
          title: 'Reflect',
          tabBarIcon: ({ color }) => <BarChart2 size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
