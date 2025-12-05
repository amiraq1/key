
import React, { useState } from 'react';
import { KeyboardSettings } from '../types';
import { ArrowLeft, Cloud, RefreshCw, LogOut, CheckCircle2, AlertCircle, UploadCloud, DownloadCloud } from 'lucide-react';
import { signInWithGoogle, signOutGoogle, uploadToDrive, downloadFromDrive } from '../services/cloudSyncService';

interface CloudSyncSettingsProps {
  settings: KeyboardSettings;
  onUpdateSettings: (newSettings: KeyboardSettings) => void;
  onBack: () => void;
  isArabic: boolean;
}

export const CloudSyncSettings: React.FC<CloudSyncSettingsProps> = ({
  settings,
  onUpdateSettings,
  onBack,
  isArabic
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const handleSignIn = async () => {
    setIsSyncing(true);
    setStatusMsg(isArabic ? 'جاري الاتصال بجوجل...' : 'Connecting to Google...');
    try {
      const user = await signInWithGoogle();
      onUpdateSettings({ ...settings, googleUser: user, cloudSyncEnabled: true });
      setStatusMsg(null);
    } catch (e) {
      setStatusMsg(isArabic ? 'فشل تسجيل الدخول' : 'Sign in failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await signOutGoogle();
    onUpdateSettings({ ...settings, googleUser: null, cloudSyncEnabled: false });
  };

  const handleSyncNow = async () => {
    if (!settings.googleUser) return;
    setIsSyncing(true);
    setStatusMsg(isArabic ? 'جاري رفع النسخة الاحتياطية...' : 'Uploading backup...');
    try {
       const ts = await uploadToDrive(settings);
       onUpdateSettings({ ...settings, lastCloudSync: ts });
       setStatusMsg(isArabic ? 'تمت المزامنة بنجاح' : 'Sync complete');
       setTimeout(() => setStatusMsg(null), 2000);
    } catch (e) {
       setStatusMsg(isArabic ? 'فشل الرفع' : 'Upload failed');
    } finally {
       setIsSyncing(false);
    }
  };

  const handleRestore = async () => {
    if (!settings.googleUser) return;
    if (!window.confirm(isArabic ? 'هل تريد استبدال الإعدادات الحالية بالنسخة السحابية؟' : 'Overwrite local settings with cloud backup?')) return;

    setIsSyncing(true);
    setStatusMsg(isArabic ? 'جاري تحميل النسخة...' : 'Downloading backup...');
    try {
        const cloudSettings = await downloadFromDrive();
        if (cloudSettings) {
            // Merge cloud settings but keep auth state
            onUpdateSettings({
                ...settings,
                ...cloudSettings,
                googleUser: settings.googleUser, // Preserve login
                cloudSyncEnabled: settings.cloudSyncEnabled
            });
            setStatusMsg(isArabic ? 'تمت الاستعادة بنجاح' : 'Restored successfully');
            setTimeout(() => window.location.reload(), 1000); // Reload to apply all effects
        } else {
            setStatusMsg(isArabic ? 'لا توجد نسخة احتياطية' : 'No backup found');
        }
    } catch (e) {
        setStatusMsg(isArabic ? 'فشل التحميل' : 'Download failed');
    } finally {
        setIsSyncing(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#1f1f1f] flex flex-col z-20 animate-in slide-in-from-right">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-800 bg-[#252525]">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-gray-700 text-gray-400">
          <ArrowLeft size={20} />
        </button>
        <h3 className="text-white font-semibold text-lg">{isArabic ? 'المزامنة السحابية' : 'Google Drive Backup'}</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Auth Section */}
        <div className="bg-[#2a2a2a] rounded-xl p-6 text-center">
            <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Cloud size={32} />
            </div>
            
            {!settings.googleUser ? (
                <>
                    <h4 className="text-white font-medium mb-2">{isArabic ? 'سجل الدخول للمزامنة' : 'Sign in to Sync'}</h4>
                    <p className="text-sm text-gray-400 mb-6 px-4">
                        {isArabic 
                          ? 'قم بحفظ إعداداتك، القاموس، والبروفايلات بأمان على Google Drive.' 
                          : 'Securely backup your settings, dictionary, and profiles to Google Drive.'}
                    </p>
                    <button 
                        onClick={handleSignIn}
                        disabled={isSyncing}
                        className="w-full py-3 bg-white text-gray-800 font-bold rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                    >
                        {isSyncing ? <RefreshCw size={18} className="animate-spin" /> : (
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                        )}
                        {isArabic ? 'تسجيل الدخول باستخدام Google' : 'Sign in with Google'}
                    </button>
                </>
            ) : (
                <>
                   <div className="flex flex-col items-center mb-6">
                       <img src={settings.googleUser.imageUrl} alt="Profile" className="w-16 h-16 rounded-full border-2 border-blue-500 mb-2" />
                       <h4 className="text-white font-medium">{settings.googleUser.name}</h4>
                       <span className="text-xs text-gray-500">{settings.googleUser.email}</span>
                   </div>
                   
                   <button 
                       onClick={handleSignOut}
                       className="text-red-400 text-sm hover:text-red-300 flex items-center justify-center gap-1 mx-auto"
                   >
                       <LogOut size={14} />
                       {isArabic ? 'تسجيل الخروج' : 'Sign out'}
                   </button>
                </>
            )}
        </div>

        {/* Sync Controls */}
        {settings.googleUser && (
           <div className="bg-[#2a2a2a] rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-gray-700">
                 <div>
                    <h5 className="text-gray-200 text-sm font-medium mb-1">{isArabic ? 'المزامنة التلقائية' : 'Auto-Sync Data'}</h5>
                    <p className="text-xs text-gray-500">{isArabic ? 'رفع التغييرات تلقائياً في الخلفية' : 'Automatically sync changes in background'}</p>
                 </div>
                 <button 
                    onClick={() => onUpdateSettings({...settings, cloudSyncEnabled: !settings.cloudSyncEnabled})}
                    className={`w-10 h-6 rounded-full relative transition-colors ${settings.cloudSyncEnabled ? 'bg-blue-600' : 'bg-gray-700'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${settings.cloudSyncEnabled ? 'left-5' : 'left-1'}`} />
                 </button>
              </div>

              <div className="flex items-center justify-between py-2">
                 <span className="text-xs text-gray-400">
                    {isArabic ? 'آخر مزامنة:' : 'Last Synced:'} <br/>
                    <span className="text-gray-200">
                        {settings.lastCloudSync ? new Date(settings.lastCloudSync).toLocaleString() : (isArabic ? 'أبداً' : 'Never')}
                    </span>
                 </span>
                 {statusMsg ? (
                     <span className="text-xs text-blue-400 animate-pulse">{statusMsg}</span>
                 ) : (
                     <CheckCircle2 size={16} className="text-green-500 opacity-50" />
                 )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="p-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-white text-sm font-medium flex flex-col items-center gap-2 disabled:opacity-50"
                  >
                      {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                      {isArabic ? 'مزامنة الآن' : 'Sync Now'}
                  </button>
                  
                  <button 
                    onClick={handleRestore}
                    disabled={isSyncing}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-gray-200 text-sm font-medium flex flex-col items-center gap-2 disabled:opacity-50"
                  >
                      <DownloadCloud size={20} />
                      {isArabic ? 'استعادة' : 'Restore'}
                  </button>
              </div>
           </div>
        )}

        {/* Info Box */}
        <div className="bg-blue-900/20 border border-blue-500/20 rounded-lg p-3 flex gap-3">
             <AlertCircle size={20} className="text-blue-400 shrink-0 mt-0.5" />
             <div className="text-xs text-blue-100 opacity-80">
                 {isArabic 
                    ? 'يتم تخزين البيانات في مجلد خاص بالتطبيق على Google Drive ولا يمكن للتطبيقات الأخرى الوصول إليه.'
                    : 'Data is stored in a private AppData folder on your Google Drive and is not accessible by other apps.'}
             </div>
        </div>
      </div>
    </div>
  );
};
