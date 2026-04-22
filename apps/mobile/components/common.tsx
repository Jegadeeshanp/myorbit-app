import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS, TYPOGRAPHY } from '../lib/theme';
import { Star } from 'lucide-react-native';

// MyOrbit Header Logo Component
export const MyOrbitHeader: React.FC = () => (
  <View className="flex-row items-center gap-2">
    <View style={[styles.logoBox, { backgroundColor: COLORS.tasks }]}>
      <Star size={16} color="#000" fill="#000" />
    </View>
    <Text style={[TYPOGRAPHY.h4, { color: COLORS.textPrimary }]}>MyOrbit</Text>
  </View>
);

// Header with back, title, and actions
interface HeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  centerContent?: React.ReactNode;
  style?: ViewStyle;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  centerContent,
  style,
}) => (
  <View style={[styles.header, style]}>
    <TouchableOpacity onPress={onLeftPress} style={{ flex: 1 }}>
      {leftIcon || <Text style={[TYPOGRAPHY.body, { color: COLORS.textPrimary }]}>{title}</Text>}
    </TouchableOpacity>
    
    {centerContent && (
      <View style={{ flex: 1, alignItems: 'center' }}>
        {centerContent}
      </View>
    )}
    
    {subtitle && (
      <View style={{ flex: 1 }}>
        <Text style={[TYPOGRAPHY.caption, { color: COLORS.textSecondary }]}>{subtitle}</Text>
      </View>
    )}
    
    <TouchableOpacity onPress={onRightPress} style={{ alignItems: 'flex-end' }}>
      {rightIcon}
    </TouchableOpacity>
  </View>
);

// Primary Button
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  color?: string;
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  style?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  color = COLORS.tasks,
  size = 'medium',
  disabled = false,
  style,
  leftIcon,
  rightIcon,
}) => {
  const isOutline = variant === 'outline';
  const isDanger = variant === 'danger';
  const backgroundColor = isOutline ? 'transparent' : isDanger ? COLORS.error : color;
  const borderWidth = isOutline ? 1.5 : 0;
  const borderColor = isOutline ? COLORS.border : 'transparent';
  const textColor = isOutline ? COLORS.textPrimary : '#000';
  
  const sizeStyles = {
    small: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
    medium: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
    large: { paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xl },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.button,
        sizeStyles[size],
        {
          backgroundColor,
          borderWidth,
          borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
        {leftIcon}
        <Text style={[TYPOGRAPHY.bodyLarge, { color: textColor, fontWeight: '600' }]}>
          {title}
        </Text>
        {rightIcon}
      </View>
    </TouchableOpacity>
  );
};

// Card Component
interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  backgroundColor?: string;
  gradient?: boolean;
  padding?: number;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  backgroundColor = COLORS.card,
  gradient = false,
  padding = SPACING.lg,
}) => (
  <TouchableOpacity
    onPress={onPress}
    disabled={!onPress}
    style={[
      styles.card,
      {
        backgroundColor,
        padding,
      },
      style,
    ]}
  >
    {children}
  </TouchableOpacity>
);

// Stat Card
interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  color?: string;
  icon?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  color = COLORS.textSecondary,
  icon,
}) => (
  <Card style={{ flex: 1, alignItems: 'center', gap: SPACING.md }}>
    {icon && <View>{icon}</View>}
    <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary }]}>{label}</Text>
    <Text style={[TYPOGRAPHY.h2, { color: COLORS.textPrimary }]}>{value}</Text>
    {sublabel && (
      <Text style={[TYPOGRAPHY.caption, { color: COLORS.textTertiary }]}>{sublabel}</Text>
    )}
  </Card>
);

// Empty State Component
interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel?: string;
  onButtonPress?: () => void;
  buttonColor?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  buttonLabel,
  onButtonPress,
  buttonColor = COLORS.tasks,
}) => (
  <View style={styles.emptyState}>
    <View style={styles.emptyIcon}>{icon}</View>
    <Text style={[TYPOGRAPHY.h3, { color: COLORS.textPrimary, marginTop: SPACING.lg }]}>
      {title}
    </Text>
    <Text style={[TYPOGRAPHY.body, { color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center' }]}>
      {description}
    </Text>
    {buttonLabel && (
      <Button
        title={buttonLabel}
        onPress={onButtonPress || (() => {})}
        color={buttonColor}
        style={{ marginTop: SPACING.xl }}
      />
    )}
  </View>
);

// Badge Component
interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  size?: 'small' | 'medium' | 'large';
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color = COLORS.purple,
  textColor = '#000',
  size = 'medium',
}) => {
  const sizeStyles = {
    small: { paddingVertical: 4, paddingHorizontal: 8 },
    medium: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md },
    large: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  };

  return (
    <View style={[styles.badge, sizeStyles[size], { backgroundColor: color }]}>
      <Text style={[TYPOGRAPHY.caption, { color: textColor, fontWeight: '600' }]}>
        {label}
      </Text>
    </View>
  );
};

// Chip (horizontal scrollable buttons)
interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  color?: string;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  color = COLORS.tasks,
}) => (
  <TouchableOpacity
    onPress={onPress}
    style={[
      styles.chip,
      {
        backgroundColor: selected ? color : COLORS.card,
        borderColor: selected ? color : COLORS.border,
      },
    ]}
  >
    <Text
      style={[
        TYPOGRAPHY.bodySmall,
        {
          color: selected ? '#000' : COLORS.textPrimary,
          fontWeight: selected ? '600' : '400',
        },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

// Divider
export const Divider: React.FC = () => (
  <View style={[styles.divider, { backgroundColor: COLORS.border }]} />
);

// Floating Action Button
interface FABProps {
  icon: React.ReactNode;
  onPress: () => void;
  color?: string;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  color = COLORS.tasks,
  size = 'large',
  style,
}) => {
  const sizeMap = {
    small: { width: 48, height: 48 },
    medium: { width: 56, height: 56 },
    large: { width: 64, height: 64 },
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.fab,
        sizeMap[size],
        { backgroundColor: color },
        style,
      ]}
    >
      {icon}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  logoBox: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    backgroundColor: COLORS.background,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 1,
  },
  button: {
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    borderColor: COLORS.border,
    borderWidth: 1,
  },
  badge: {
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chip: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.sm,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
  fab: {
    position: 'absolute',
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
