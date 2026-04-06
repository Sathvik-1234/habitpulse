import React from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download } from 'lucide-react';

export const InstallButton: React.FC = () => {
  const { isInstallable, triggerInstall } = usePWAInstall();

  if (!isInstallable) {
    return null;
  }

  return (
    <button
      onClick={triggerInstall}
      className="flex items-center gap-2 px-4 py-2 bg-black border border-primary text-primary font-display tracking-widest text-sm uppercase rounded shadow-[0_0_10px_rgba(77,159,255,0.5)] hover:bg-primary/10 hover:shadow-[0_0_15px_rgba(77,159,255,0.8)] transition-all duration-300 animate-pulse hover:animate-none"
    >
      <Download size={16} />
      Install System To Device
    </button>
  );
};
