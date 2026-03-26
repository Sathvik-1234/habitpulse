import React, { useState, useEffect } from 'react';
import { useLocalContext } from '../context/LocalContext';
import { Copy, Download, Upload, CheckCircle, AlertCircle, Bell, BellRing } from 'lucide-react';

export const SyncSettings = () => {
  const { getSyncCode, importSyncCode } = useLocalContext();
  const [importText, setImportText] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notification');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      new Notification('System Message', {
        body: 'Notifications enabled. You will receive alerts for your daily quests.',
        icon: '/favicon.ico'
      });
    }
  };

  const handleCopy = async () => {
    const code = getSyncCode();
    try {
      await navigator.clipboard.writeText(code);
      alert('Magic Sync Code copied to clipboard! Paste this on your other device.');
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Failed to copy code. Please try again.");
    }
  };

  const handleImport = () => {
    if (!importText.trim()) return;
    
    // Safety check handled by UI context, but good to double check intent
    if(!window.confirm("This will overwrite your current data with the data from the code. Are you sure?")) {
      return;
    }

    const success = importSyncCode(importText.trim());
    if (success) {
      setStatus('success');
      alert('Data Restored Successfully!');
      window.location.reload();
    } else {
      setStatus('error');
      alert('Invalid Sync Code. Please check the code and try again.');
    }
  };

  return (
    <div className="h-full bg-surface rounded-2xl border border-slate-700 p-8 overflow-y-auto custom-scrollbar flex flex-col items-center">
      
      <div className="text-center mb-8 max-w-lg">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <span className="text-2xl">⚙️</span> Settings & Sync
        </h2>
        <p className="text-slate-400">Manage your data, backup your progress, or sync between devices using Magic Codes.</p>
      </div>

      <div className="max-w-2xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
        
        {/* Notifications Section */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4 text-blue-400">
            <Bell size={24} />
            <h3 className="text-xl font-bold text-white">System Notifications</h3>
          </div>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Enable notifications to receive reminders about your daily quests and level ups.
            (Requires browser permission)
          </p>
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <BellRing size={20} className={notificationPermission === 'granted' ? 'text-green-400' : 'text-slate-500'} />
              <span className="text-slate-300 font-medium">
                Status: <span className={notificationPermission === 'granted' ? 'text-green-400' : notificationPermission === 'denied' ? 'text-red-400' : 'text-yellow-400'}>
                  {notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : 'Not Requested'}
                </span>
              </span>
            </div>
            {notificationPermission !== 'granted' && (
              <button
                onClick={requestNotificationPermission}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-sm"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Export Section */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4 text-primary">
            <Download size={24} />
            <h3 className="text-xl font-bold text-white">Export Data</h3>
          </div>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Generate a "Magic Code" containing all your habits, logs, and journal entries. 
            Copy this code and paste it into another device to transfer your progress.
          </p>
          <button
            onClick={handleCopy}
            className="w-full py-4 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            <Copy size={18} className="group-hover:scale-110 transition-transform" />
            Copy Sync Code to Clipboard
          </button>
        </div>

        {/* Import Section */}
        <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4 text-accent">
            <Upload size={24} />
            <h3 className="text-xl font-bold text-white">Import Data</h3>
          </div>
          <p className="text-slate-400 mb-6 text-sm leading-relaxed">
            Paste a Magic Code here to restore your data. 
            <strong className="text-red-400 block mt-1 flex items-center gap-2">
              <AlertCircle size={14}/> Warning: This will overwrite your current data.
            </strong>
          </p>
          
          <textarea
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value);
              setStatus('idle');
            }}
            placeholder="Paste your Magic Code here..."
            className={`w-full h-32 bg-slate-950 border rounded-xl p-4 text-slate-300 text-xs font-mono focus:ring-2 outline-none resize-none mb-4 transition-all ${
              status === 'error' ? 'border-red-500/50 focus:ring-red-500/50' : 'border-slate-700 focus:ring-accent'
            }`}
          />
          
          <button
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full py-4 bg-accent hover:bg-violet-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5 active:translate-y-0"
          >
            {status === 'success' ? <CheckCircle size={18} /> : <Upload size={18} />}
            Restore Data
          </button>
        </div>

      </div>
    </div>
  );
};