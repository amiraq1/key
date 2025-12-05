
import { GoogleUser, KeyboardSettings } from '../types';
import { createBackup, restoreBackup } from './buttonSizeManager';

// Simulating Google API Client behavior
const MOCK_USER: GoogleUser = {
  id: '1092837465',
  name: 'GemKey User',
  email: 'user@gmail.com',
  imageUrl: 'https://ui-avatars.com/api/?name=Gem+Key&background=0D8ABC&color=fff'
};

const SYNC_STORAGE_KEY = 'gemkey_cloud_data';

/**
 * Simulates the Google Sign-In flow.
 */
export const signInWithGoogle = async (): Promise<GoogleUser> => {
  // In a real app, this would use gapi.auth2.getAuthInstance().signIn()
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(MOCK_USER);
    }, 1500); // Simulate network delay
  });
};

/**
 * Simulates signing out.
 */
export const signOutGoogle = async (): Promise<void> => {
  // In a real app, this would use gapi.auth2.getAuthInstance().signOut()
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 500);
  });
};

/**
 * Simulates uploading data to Google Drive (AppData folder).
 */
export const uploadToDrive = async (settings: KeyboardSettings): Promise<number> => {
  // In a real app, this would use gapi.client.drive.files.create/update
  // with 'parents': ['appDataFolder']
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const backupData = {
          settings: {
             ...settings,
             // Don't sync auth state
             googleUser: null,
             lastCloudSync: Date.now()
          },
          profiles: createBackup() // Includes profiles and button sizes
        };
        
        // Storing in localStorage to simulate cloud persistence across sessions (if we were to reload)
        localStorage.setItem(SYNC_STORAGE_KEY, JSON.stringify(backupData));
        
        resolve(Date.now());
      } catch (e) {
        reject(e);
      }
    }, 2000); // Simulate upload delay
  });
};

/**
 * Simulates downloading data from Google Drive.
 */
export const downloadFromDrive = async (): Promise<Partial<KeyboardSettings> | null> => {
  // In a real app, this would use gapi.client.drive.files.list + get media
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        const json = localStorage.getItem(SYNC_STORAGE_KEY);
        if (!json) {
           resolve(null);
           return;
        }

        const data = JSON.parse(json);
        
        // Restore Profiles
        if (data.profiles) {
            restoreBackup(data.profiles);
        }

        resolve(data.settings);
      } catch (e) {
        reject(e);
      }
    }, 2000); // Simulate download delay
  });
};

/**
 * Background Sync Simulation (WorkManager equivalent).
 */
let syncInterval: any = null;

export const startAutoSync = (
  settings: KeyboardSettings, 
  onSyncComplete: (timestamp: number) => void
) => {
  if (syncInterval) clearInterval(syncInterval);
  
  // Sync every 5 minutes if enabled
  syncInterval = setInterval(async () => {
     if (settings.cloudSyncEnabled && settings.googleUser) {
         console.log("[CloudSync] Starting background sync...");
         try {
             const ts = await uploadToDrive(settings);
             onSyncComplete(ts);
         } catch (e) {
             console.error("[CloudSync] Background sync failed", e);
         }
     }
  }, 5 * 60 * 1000); 
};

export const stopAutoSync = () => {
  if (syncInterval) clearInterval(syncInterval);
  syncInterval = null;
};
