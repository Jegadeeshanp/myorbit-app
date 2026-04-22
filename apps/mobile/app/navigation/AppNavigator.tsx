import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Target,
  CheckSquare,
  Flame,
  Activity,
  Wallet,
  Zap,
  MoreHorizontal,
} from 'lucide-react-native';
import { COLORS } from '../../lib/theme';

// Screens - Home
import { HomeScreen } from '../screens/HomeScreen';

// Screens - Goals
import { GoalsOverviewScreen } from '../screens/goals/GoalsOverviewScreen';
import { GoalDetailScreen } from '../screens/goals/GoalDetailScreen';
import { NewGoalWizard } from '../screens/goals/NewGoalWizard';
import { GoalCreatedModal } from '../screens/goals/GoalCreatedModal';

// Screens - Tasks
import { TasksTodayScreen } from '../screens/tasks/TasksTodayScreen';
import { TaskListsScreen } from '../screens/tasks/TaskListsScreen';
import { TaskListDetailScreen } from '../screens/tasks/TaskListDetailScreen';
import { CalendarScreen } from '../screens/tasks/CalendarScreen';
import { TaskDetailSheet } from '../screens/tasks/TaskDetailSheet';
import { TasksDrawer } from '../screens/tasks/TasksDrawer';

// Screens - Habits
import { HabitsDashboardScreen } from '../screens/habits/HabitsDashboardScreen';

// Screens - Health
import { HealthDashboardScreen } from '../screens/health/HealthDashboardScreen';
import { NutritionScreen } from '../screens/health/NutritionScreen';

// Screens - Finance
import { FinanceOverviewScreen } from '../screens/finance/FinanceOverviewScreen';
import { TransactionsScreen } from '../screens/finance/TransactionsScreen';
import { AccountsScreen } from '../screens/finance/AccountsScreen';
import { BudgetScreen } from '../screens/finance/BudgetScreen';
import { VitalsScreen } from '../screens/finance/VitalsScreen';
import { FinanceSettingsScreen } from '../screens/finance/FinanceSettingsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Goals Navigator
const GoalsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="GoalsOverview" component={GoalsOverviewScreen} />
    <Stack.Screen name="GoalDetail" component={GoalDetailScreen} />
    <Stack.Group screenOptions={{ presentation: 'modal' }}>
      <Stack.Screen name="NewGoalWizard" component={NewGoalWizard} />
      <Stack.Screen name="GoalCreated" component={GoalCreatedModal} />
    </Stack.Group>
  </Stack.Navigator>
);

// Tasks Navigator
const TasksStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animationEnabled: true,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="TasksToday" component={TasksTodayScreen} />
    <Stack.Screen name="TaskLists" component={TaskListsScreen} />
    <Stack.Screen name="TaskListDetail" component={TaskListDetailScreen} />
    <Stack.Screen name="Calendar" component={CalendarScreen} />
    <Stack.Group screenOptions={{ presentation: 'transparentModal' }}>
      <Stack.Screen name="TaskDetail" component={TaskDetailSheet} />
      <Stack.Screen name="TasksMenu" component={TasksDrawer} />
    </Stack.Group>
  </Stack.Navigator>
);

// Habits Navigator
const HabitsStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="HabitsDashboard" component={HabitsDashboardScreen} />
  </Stack.Navigator>
);

// Health Navigator
const HealthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="HealthDashboard" component={HealthDashboardScreen} />
    <Stack.Screen name="Nutrition" component={NutritionScreen} />
  </Stack.Navigator>
);

// Finance Navigator
const FinanceStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="FinanceOverview" component={FinanceOverviewScreen} />
    <Stack.Screen name="Transactions" component={TransactionsScreen} />
    <Stack.Screen name="Accounts" component={AccountsScreen} />
    <Stack.Screen name="Budget" component={BudgetScreen} />
    <Stack.Screen name="Vitals" component={VitalsScreen} />
    <Stack.Screen name="FinanceSettings" component={FinanceSettingsScreen} />
  </Stack.Navigator>
);

// Main App Navigator with Bottom Tabs
export const AppNavigator = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      cardStyle: { backgroundColor: COLORS.background },
    }}
  >
    <Stack.Screen name="Home" component={HomeScreen} />
    
    {/* Module Navigators - accessed from home */}
    <Stack.Screen name="goals" component={GoalsTabNavigator} />
    <Stack.Screen name="tasks" component={TasksTabNavigator} />
    <Stack.Screen name="habits" component={HabitsTabNavigator} />
    <Stack.Screen name="health" component={HealthTabNavigator} />
    <Stack.Screen name="finance" component={FinanceTabNavigator} />
  </Stack.Navigator>
);

// Tabs for each module
const GoalsTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.goals,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
      },
    }}
  >
    <Tab.Screen
      name="GoalsTab"
      component={GoalsStack}
      options={{
        tabBarLabel: 'Overview',
        tabBarIcon: ({ color }) => <Target size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Active"
      component={GoalsStack}
      options={{
        tabBarLabel: 'Active',
        tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Completed"
      component={GoalsStack}
      options={{
        tabBarLabel: 'Completed',
        tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="MoreGoals"
      component={GoalsStack}
      options={{
        tabBarLabel: 'More',
        tabBarIcon: ({ color }) => <MoreHorizontal size={24} color={color} />,
      }}
    />
  </Tab.Navigator>
);

const TasksTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.tasks,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
      },
    }}
  >
    <Tab.Screen
      name="TasksTab"
      component={TasksStack}
      options={{
        tabBarLabel: 'Today',
        tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Inbox"
      component={TasksStack}
      options={{
        tabBarLabel: 'Inbox',
        tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Lists"
      component={TasksStack}
      options={{
        tabBarLabel: 'Lists',
        tabBarIcon: ({ color }) => <Target size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="CalendarTab"
      component={TasksStack}
      options={{
        tabBarLabel: 'Calendar',
        tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="MoreTasks"
      component={TasksStack}
      options={{
        tabBarLabel: 'More',
        tabBarIcon: ({ color }) => <MoreHorizontal size={24} color={color} />,
      }}
    />
  </Tab.Navigator>
);

const HabitsTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.habits,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
      },
    }}
  >
    <Tab.Screen
      name="HabitsTab"
      component={HabitsStack}
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="HabitsCalendar"
      component={HabitsStack}
      options={{
        tabBarLabel: 'Calendar',
        tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Focus"
      component={HabitsStack}
      options={{
        tabBarLabel: 'Focus',
        tabBarIcon: ({ color }) => <Flame size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Countdown"
      component={HabitsStack}
      options={{
        tabBarLabel: 'Countdown',
        tabBarIcon: ({ color }) => <Target size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="MoreHabits"
      component={HabitsStack}
      options={{
        tabBarLabel: 'More',
        tabBarIcon: ({ color }) => <MoreHorizontal size={24} color={color} />,
      }}
    />
  </Tab.Navigator>
);

const HealthTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.health,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
      },
    }}
  >
    <Tab.Screen
      name="HealthTab"
      component={HealthStack}
      options={{
        tabBarLabel: 'Dashboard',
        tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Workouts"
      component={HealthStack}
      options={{
        tabBarLabel: 'Workouts',
        tabBarIcon: ({ color }) => <Flame size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="NutritionTab"
      component={HealthStack}
      options={{
        tabBarLabel: 'Nutrition',
        tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="Sync"
      component={HealthStack}
      options={{
        tabBarLabel: 'Sync',
        tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="MoreHealth"
      component={HealthStack}
      options={{
        tabBarLabel: 'More',
        tabBarIcon: ({ color }) => <MoreHorizontal size={24} color={color} />,
      }}
    />
  </Tab.Navigator>
);

const FinanceTabNavigator = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: COLORS.tasks,
      tabBarInactiveTintColor: COLORS.textSecondary,
      tabBarStyle: {
        backgroundColor: COLORS.card,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
      },
    }}
  >
    <Tab.Screen
      name="FinanceTab"
      component={FinanceStack}
      options={{
        tabBarLabel: 'Overview',
        tabBarIcon: ({ color }) => <Wallet size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="TransactionsTab"
      component={FinanceStack}
      options={{
        tabBarLabel: 'Transactions',
        tabBarIcon: ({ color }) => <Activity size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="AccountsTab"
      component={FinanceStack}
      options={{
        tabBarLabel: 'Accounts',
        tabBarIcon: ({ color }) => <CheckSquare size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="AssetsTab"
      component={FinanceStack}
      options={{
        tabBarLabel: 'Assets',
        tabBarIcon: ({ color }) => <Target size={24} color={color} />,
      }}
    />
    <Tab.Screen
      name="MoreFinance"
      component={FinanceStack}
      options={{
        tabBarLabel: 'More',
        tabBarIcon: ({ color }) => <MoreHorizontal size={24} color={color} />,
      }}
    />
  </Tab.Navigator>
);

export default AppNavigator;
