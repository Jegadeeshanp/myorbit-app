import React from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../../../lib/theme';
import { MyOrbitHeader, Card } from '../../../components/common';

export const VitalsScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary }]}>Vitals</Text>
        <MyOrbitHeader />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {/* Vital Score Gauge */}
        <View style={styles.scoreContainer}>
          <View style={styles.scoreCircle}>
            <Text style={[TYPOGRAPHY.h1, { color: COLORS.tasks }]}>5.5</Text>
            <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
              Fair
            </Text>
          </View>
        </View>

        {/* Score Breakdown */}
        <Card style={{ marginTop: SPACING.lg }}>
          <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginBottom: SPACING.lg }]}>
            Score Breakdown
          </Text>

          {[
            { name: 'Emergency Fund', score: '2/2', color: COLORS.tasks },
            { name: 'Savings Rate', score: '0.5/2', color: COLORS.warning },
            { name: 'Debt Ratio', score: '0.5/2', color: COLORS.warning },
            { name: 'Term Insurance', score: '2/2', color: COLORS.tasks },
            { name: 'Health Cover', score: '0.5/2', color: COLORS.warning },
          ].map((item) => (
            <View key={item.name} style={{ marginBottom: SPACING.md }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  {item.name}
                </Text>
                <Text style={[TYPOGRAPHY.body, { color: item.color }]}>
                  {item.score}
                </Text>
              </View>
              <View
                style={[
                  styles.scoreBar,
                  { backgroundColor: COLORS.surface, marginTop: SPACING.sm },
                ]}
              >
                <View
                  style={[
                    styles.scoreBarFill,
                    { width: '60%', backgroundColor: item.color },
                  ]}
                />
              </View>
            </View>
          ))}
        </Card>

        {/* Financial Profile */}
        <Card style={{ marginTop: SPACING.lg }}>
          <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
            Financial Profile (43% complete)
          </Text>

          <View style={[styles.profileGrid, { marginTop: SPACING.lg }]}>
            {[
              { label: 'Monthly Income', value: '₹0' },
              { label: 'Monthly Expense', value: '₹498' },
              { label: 'Liquid Assets', value: '₹2.1L' },
              { label: 'Age', value: '30' },
              { label: 'Dependents', value: '0' },
              { label: 'Term Cover', value: '₹1,00,00,000' },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1 }}>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>
                  {item.label}
                </Text>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary, marginTop: SPACING.xs }]}>
                  {item.value}
                </Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Core Vitals */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Core Vitals
        </Text>

        {[
          {
            title: 'Emergency Fund',
            score: '2/2',
            status: 'Good',
            details: 'Cash & Savings ₹2.1L | Monthly runway ₹2.1 months',
          },
          {
            title: 'Savings Rate',
            score: '0.5/2',
            status: 'Low',
            details: 'Income ₹0, Expense ₹498, Saving 0%',
          },
        ].map((vital) => (
          <Card key={vital.title} style={{ marginTop: SPACING.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
                  {vital.title}
                </Text>
                <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary, marginTop: SPACING.xs }]}>
                  {vital.details}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[TYPOGRAPHY.bodySmall, { color: COLORS.textSecondary }]}>
                  {vital.score}
                </Text>
                <Text
                  style={[
                    TYPOGRAPHY.caption,
                    {
                      color: vital.status === 'Good' ? COLORS.tasks : COLORS.warning,
                      marginTop: SPACING.xs,
                    },
                  ]}
                >
                  {vital.status}
                </Text>
              </View>
            </View>
          </Card>
        ))}

        {/* Top Actions */}
        <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary, marginTop: SPACING.xl }]}>
          Top Actions
        </Text>

        {[
          '1. Increase savings rate',
          '2. Improve health insurance',
          '3. Reduce debt',
        ].map((action) => (
          <Card key={action} style={{ marginTop: SPACING.md, padding: SPACING.lg }}>
            <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>
              {action}
            </Text>
          </Card>
        ))}
      </ScrollView>
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
  scoreContainer: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  scoreCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.tasks + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreBar: {
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  scoreBarFill: {
    height: '100%',
  },
  profileGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
});

export default VitalsScreen;
