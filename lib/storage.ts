import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

class Storage {
  private static instance: Storage;
  private constructor() {}

  static getInstance(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('Error getting item:', error);
      return null;
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('Error setting item:', error);
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  }
}

export default Storage