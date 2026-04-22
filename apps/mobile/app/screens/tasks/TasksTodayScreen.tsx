import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Plus, Menu, Sun } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, EmptyState, FAB } from '../../../components/common';

export const TasksTodayScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handleMenuPress = () => {
    navigation.navigate('TasksMenu');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleMenuPress}>
          <Menu size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Tasks</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Title */}
        <Text style={[TYPOGRAPHY.h2, { color: COLORS.textPrimary }]}>Today</Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>
            🔍 Search tasks...
          </Text>
        </View>

        {/* Empty State */}
        <EmptyState
          icon={<Sun size={48} color={COLORS.tasks} />}
          title="All caught up!"
          description="No pending tasks for today"
          buttonColor={COLORS.tasks}
        />
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        icon={<Plus size={32} color="#000" />}
        onPress={() => {}}
        color={COLORS.tasks}
        style={{ bottom: SPACING.xl, right: SPACING.xl }}
      />
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
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  content: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  searchBar: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    marginVertical: SPACING.lg,
  },
});
