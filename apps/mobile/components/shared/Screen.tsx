import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, View } from 'react-native';

interface ScreenProps {
  children:   React.ReactNode;
  scrollable?: boolean;
}

export default function Screen({ children, scrollable = true }: ScreenProps) {
  if (scrollable) {
    return (
      <SafeAreaView className="flex-1 bg-[#F7F7F5]">
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    );
  }
  return (
    <SafeAreaView className="flex-1 bg-[#F7F7F5]">
      <View className="flex-1 px-4 pt-4">{children}</View>
    </SafeAreaView>
  );
}
