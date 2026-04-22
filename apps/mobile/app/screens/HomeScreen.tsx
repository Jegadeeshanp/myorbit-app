import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  Target,
  CheckSquare,
  Flame,
  Activity,
  Wallet,
  Sun,
  Zap,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../lib/theme';
import { MyOrbitHeader, Card, Button } from '../../components/common';
import { useAuthStore } from '../../lib/stores';

const modules = [
  {
    id: 'finance',
    title: 'Finance',
    description: 'Track accounts, expenses, investments and budgets.',
    cta: 'Manage Money →',
    icon: Wallet,
    color: COLORS.tasks,
  },
  {
    id: 'goals',
    title: 'Goals',
    description: 'Set and track personal targets with progress tracking.',
    cta: 'Start Achieving →',
    icon: Target,
    color: COLORS.goals,
  },
  {
    id: 'health',
    title: 'Health',
    description: 'Track workouts, sleep, mood and daily wellness metrics.',
    cta: 'Track Wellness →',
    icon: Activity,
    color: COLORS.health,
  },
  {
    id: 'habits',
    title: 'Habits',
    description: 'Build routines with streaks, focus timer & countdowns.',
    cta: 'Build Streaks →',
    icon: Flame,
    color: COLORS.habits,
  },
  {
    id: 'tasks',
    title: 'To-Do',
    description: 'Manage tasks, projects, and quick notes. Lists, subtasks & calendar.',
    cta: 'Get Things Done →',
    icon: CheckSquare,
    color: COLORS.tasks,
  },
  {
    id: 'insights',
    title: 'Insights',
    description: 'Cross-module Life Score, insights feed & weekly review.',
    cta: 'Discover Insights →',
    icon: Zap,
    color: COLORS.blue,
  },
];

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleModulePress = (moduleId: string) => {
    navigation.navigate(moduleId);
  };

  const handleLogout = () => {
    logout();
    navigation.navigate('SignIn');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
            Welcome back,
          </Text>
          <Text style={[TYPOGRAPHY.h2, { color: COLORS.textPrimary }]}>
            {user?.name || 'User'}
          </Text>
        </View>
        <MyOrbitHeader />
      </View>

      {/* Subtitle */}
      <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginHorizontal: SPACING.lg, marginBottom: SPACING.xl }]}>
        Choose what you want to manage today.
      </Text>

      {/* Modules Grid */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.grid}>
          {modules.map((module) => {
            const IconComponent = module.icon;
            return (
              <TouchableOpacity
                key={module.id}
                onPress={() => handleModulePress(module.id)}
                style={[styles.moduleCard, { borderColor: module.color }]}
              >
                {/* Icon + Title on same line */}
                <View style={styles.cardHeader}>
                  <View style={[styles.iconBox, { backgroundColor: module.color + '20' }]}>
                    <IconComponent size={26} color={module.color} strokeWidth={1.5} />
                  </View>
                  <Text style={[styles.cardTitle, { color: COLORS.textPrimary }]} numberOfLines={1}>
                    {module.title}
                  </Text>
                </View>

                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary, marginTop: SPACING.md }]}>
                  {module.description}
                </Text>

                <TouchableOpacity
                  onPress={() => handleModulePress(module.id)}
                  style={{ marginTop: SPACING.md }}
                >
                  <Text style={[TYPOGRAPHY.bodySmall, { color: module.color, fontWeight: '600' }]}>
                    {module.cta}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Actions - fixed icon bar */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.iconButton}>
          <Sun size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Settings')} style={styles.iconButton}>
          <Settings size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleLogout} style={styles.iconButton}>
          <LogOut size={22} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.lg,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  moduleCard: {
    width: '48%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconButton: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  bottomActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xl,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
});

export default HomeScreen;
