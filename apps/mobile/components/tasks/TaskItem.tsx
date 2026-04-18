import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, Circle, Clock } from 'lucide-react-native';
import Badge from '@/components/shared/Badge';
import { PRIORITY_COLORS } from '@myorbit/config';
import type { TaskInstance } from '@myorbit/api';

interface TaskItemProps {
  instance:    TaskInstance;
  onComplete?: (id: string) => void;
  onPress?:    (instance: TaskInstance) => void;
}

export default function TaskItem({ instance, onComplete, onPress }: TaskItemProps) {
  const isDone   = instance.status === 'completed';
  const priority = instance.task.priority as keyof typeof PRIORITY_COLORS;
  const priColor = PRIORITY_COLORS[priority] ?? PRIORITY_COLORS.none;

  return (
    <TouchableOpacity
      onPress={() => onPress?.(instance)}
      className="flex-row items-center gap-3 rounded-xl bg-white border border-gray-100 px-3 py-3 mb-1.5"
      activeOpacity={0.7}
    >
      <TouchableOpacity
        onPress={() => !isDone && onComplete?.(instance.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        {isDone
          ? <CheckCircle2 size={20} color="#10B981" />
          : <Circle       size={20} color="#D1D5DB" />
        }
      </TouchableOpacity>

      <View className="flex-1 min-w-0">
        <Text
          numberOfLines={1}
          className={`text-sm font-medium ${isDone ? 'text-gray-400 line-through' : 'text-gray-900'}`}
        >
          {instance.task.title}
        </Text>
        {instance.task.dueTime && (
          <View className="flex-row items-center gap-1 mt-0.5">
            <Clock size={11} color="#9CA3AF" />
            <Text className="text-xs text-gray-400">{instance.task.dueTime}</Text>
          </View>
        )}
      </View>

      {priority !== 'none' && <Badge label={priority} color={priColor} />}
    </TouchableOpacity>
  );
}
