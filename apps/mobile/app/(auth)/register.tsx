import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { registerUser, setAuthToken } from '@myorbit/api';
import { useAuthStore } from '@/lib/authStore';
import * as SecureStore from 'expo-secure-store';

export default function RegisterScreen() {
  const { hydrate } = useAuthStore();
  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleRegister = async () => {
    if (!name || !email || !password) { setError('Please fill in all fields'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    setError('');
    try {
      const { token, user } = await registerUser(
        name.trim(), email.trim().toLowerCase(), password
      );
      await SecureStore.setItemAsync('myorbit_token', token);
      await SecureStore.setItemAsync('myorbit_user', JSON.stringify(user));
      setAuthToken(token);
      await hydrate();
      router.replace('/(tabs)/today');
    } catch {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#F7F7F5]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
        <View className="flex-1 items-center justify-center py-12">
          <View className="mb-8 items-center">
            <Text className="text-3xl font-bold text-gray-900">MyOrbit</Text>
            <Text className="mt-1 text-sm text-gray-500">Create your account</Text>
          </View>

          <View className="w-full rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <Text className="mb-5 text-lg font-semibold text-gray-900">Register</Text>

            {error ? (
              <View className="mb-4 rounded-xl bg-rose-50 px-4 py-3">
                <Text className="text-sm text-rose-600">{error}</Text>
              </View>
            ) : null}

            <Text className="mb-1 text-xs font-medium text-gray-500">Name</Text>
            <TextInput
              className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
              placeholder="Your name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
            />

            <Text className="mb-1 text-xs font-medium text-gray-500">Email</Text>
            <TextInput
              className="mb-4 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <Text className="mb-1 text-xs font-medium text-gray-500">Password</Text>
            <TextInput
              className="mb-6 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900"
              placeholder="Min. 8 characters"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="new-password"
            />

            <TouchableOpacity
              onPress={handleRegister}
              disabled={loading}
              className="items-center rounded-xl bg-emerald-600 py-3.5"
            >
              {loading
                ? <ActivityIndicator color="white" />
                : <Text className="text-sm font-semibold text-white">Create account</Text>
              }
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.back()} className="mt-4 py-2">
            <Text className="text-sm text-gray-500">
              Already have an account?{' '}
              <Text className="font-semibold text-emerald-600">Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
