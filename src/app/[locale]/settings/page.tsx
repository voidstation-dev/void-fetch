/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

'use client';

import React, { useEffect } from 'react';
import { useBatchStore } from '@/features/batch-download/store/batch-store';
import { WorkspaceLayout } from '@/features/batch-download/components/WorkspaceLayout';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/deferred-toast';
import { Settings, Save, RefreshCw, Loader2, Folder, FolderCheck, FolderSync } from 'lucide-react';
import { getActiveDirectoryName, selectCustomDirectory, clearActiveDirectoryHandle } from '@/lib/directory-picker';
import type { OutputType, BatchSettings } from '@/features/batch-download/types/batch-download';

export default function SettingsPage() {
  const store = useBatchStore();
  const initializeStore = useBatchStore((s) => s.initializeStore);
  const [customDirName, setCustomDirName] = React.useState<string | null>(getActiveDirectoryName());

  useEffect(() => {
    initializeStore();
  }, [initializeStore]);

  const handleUpdateSetting = async <K extends keyof BatchSettings>(key: K, value: BatchSettings[K]) => {
    await store.updateSettings({ [key]: value });
    toast.success('Preference auto-saved');
  };

  const handleChooseDirectory = async () => {
    try {
      const selected = await selectCustomDirectory();
      if (selected) {
        setCustomDirName(selected);
        toast.success(`Custom download folder set to "${selected}"`);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        toast.error(err.message);
      }
    }
  };

  const handleResetDirectory = () => {
    clearActiveDirectoryHandle();
    setCustomDirName(null);
    toast.info('Reset download location to browser default');
  };

  const handleResetDefaults = async () => {
    await store.updateSettings({
      parseConcurrency: 4,
      downloadConcurrency: 3,
      globalNetworkBudget: 18,
      defaultOutputType: 'mp4',
      defaultQuality: '1080p',
      filenameTemplate: '{index} - {title}',
      continueOnError: true,
      autoStartDownloads: false,
    });
    toast.success('Restored default preferences');
  };

  if (!store.isInitialized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="text-xs text-muted-foreground">Loading settings...</span>
      </div>
    );
  }

  const settings = store.settings;

  return (
    <>
      <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-bold text-foreground">Preferences</h1>
          <span className="text-[10px] text-muted-foreground uppercase">Configure default downloader behaviors</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleResetDefaults}
          className="h-8 text-xs gap-1.5 border-border/60"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Reset Defaults
        </Button>
      </div>

      <div className="border rounded-xl bg-card border-border/80 p-5 flex flex-col gap-5 text-xs text-foreground">
        
        {/* Core Defaults */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40">
            Downloader Defaults
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-semibold">Default Output Type</Label>
              <Select 
                value={settings.defaultOutputType} 
                onValueChange={(val) => handleUpdateSetting('defaultOutputType', val as OutputType)}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mp4">Video (MP4)</SelectItem>
                  <SelectItem value="original_video">Original Video format</SelectItem>
                  <SelectItem value="audio">Audio Only (MP3)</SelectItem>
                  <SelectItem value="images">Original Images</SelectItem>
                  <SelectItem value="zip_images">ZIP Image Package</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-semibold">Default Quality</Label>
              <Select 
                value={settings.defaultQuality} 
                onValueChange={(val) => handleUpdateSetting('defaultQuality', val)}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="best">Best Available</SelectItem>
                  <SelectItem value="original">Original source</SelectItem>
                  <SelectItem value="2160p">4K (2160p)</SelectItem>
                  <SelectItem value="1440p">2K (1440p)</SelectItem>
                  <SelectItem value="1080p">Full HD (1080p)</SelectItem>
                  <SelectItem value="720p">HD (720p)</SelectItem>
                  <SelectItem value="480p">SD (480p)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[11px] text-muted-foreground uppercase font-semibold">Default Filename Template</Label>
            <Input
              value={settings.filenameTemplate}
              onChange={(e) => handleUpdateSetting('filenameTemplate', e.target.value)}
              className="h-9 bg-background font-mono text-xs"
            />
            <span className="text-[10px] text-muted-foreground leading-relaxed mt-0.5">
              Placeholder tokens: <code className="bg-background px-1 py-0.5 rounded">{`{index}`}</code>, <code className="bg-background px-1 py-0.5 rounded">{`{title}`}</code>, <code className="bg-background px-1 py-0.5 rounded">{`{platform}`}</code>, <code className="bg-background px-1 py-0.5 rounded">{`{quality}`}</code>, <code className="bg-background px-1 py-0.5 rounded">{`{date}`}</code>
            </span>
          </div>
        </div>

        {/* Download Directory Path */}
        <div className="flex flex-col gap-3 mt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40 flex items-center gap-2">
            <Folder className="h-4 w-4 text-primary" />
            <span>Custom Download Directory Path</span>
          </h2>

          <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-4 rounded-xl border border-border/60 bg-muted/20 backdrop-blur-md">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                <FolderCheck className="h-5 w-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-foreground truncate">
                  {customDirName ? `📁 Custom Directory: ${customDirName}` : 'Browser Default (Downloads Folder)'}
                </span>
                <span className="text-[10px] text-muted-foreground truncate">
                  {customDirName ? 'All VoidFetch downloads will be written directly into this folder handle' : 'Files are handled by browser standard download manager'}
                </span>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              {customDirName ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResetDirectory}
                  className="h-9 text-xs px-3 rounded-xl text-muted-foreground hover:text-destructive"
                >
                  Reset Default
                </Button>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={handleChooseDirectory}
                className="h-9 text-xs gap-1.5 px-4 rounded-xl border-primary/40 bg-primary/10 text-primary font-bold hover:bg-primary/20"
              >
                <FolderSync className="h-4 w-4" />
                {customDirName ? 'Change Folder' : 'Select Custom Folder'}
              </Button>
            </div>
          </div>
        </div>

        {/* Concurrency and Performance */}
        <div className="flex flex-col gap-4 mt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40">
            Concurrency & Performance Caps
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-semibold">Parser Concurrency</Label>
              <Select 
                value={String(settings.parseConcurrency)} 
                onValueChange={(val) => handleUpdateSetting('parseConcurrency', parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Parse Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 concurrent URLs</SelectItem>
                  <SelectItem value="4">4 concurrent URLs (Recommended)</SelectItem>
                  <SelectItem value="6">6 concurrent URLs</SelectItem>
                  <SelectItem value="8">8 concurrent URLs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-semibold">Download Concurrency</Label>
              <Select 
                value={String(settings.downloadConcurrency)} 
                onValueChange={(val) => handleUpdateSetting('downloadConcurrency', parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Downloads Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 video at a time</SelectItem>
                  <SelectItem value="2">2 videos at a time</SelectItem>
                  <SelectItem value="3">3 videos at a time (Recommended)</SelectItem>
                  <SelectItem value="4">4 videos at a time</SelectItem>
                  <SelectItem value="6">6 videos at a time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-[11px] text-muted-foreground uppercase font-semibold">Global Network Request Budget</Label>
              <Select 
                value={String(settings.globalNetworkBudget)} 
                onValueChange={(val) => handleUpdateSetting('globalNetworkBudget', parseInt(val, 10))}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Budget limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12 active requests</SelectItem>
                  <SelectItem value="18">18 active requests (Recommended)</SelectItem>
                  <SelectItem value="24">24 active requests</SelectItem>
                  <SelectItem value="36">36 active requests</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-[9px] text-muted-foreground leading-relaxed mt-0.5">
                Controls combined HLS chunks downloaded globally to avoid connection limits.
              </span>
            </div>
          </div>
        </div>

        {/* Global Flags */}
        <div className="flex flex-col gap-3 mt-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border/40">
            Workflows & Flags
          </h2>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs">
            <input 
              type="checkbox" 
              checked={settings.continueOnError} 
              onChange={(e) => handleUpdateSetting('continueOnError', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-borderAccent text-primary focus:ring-0" 
            />
            <div className="flex flex-col">
              <span className="font-semibold">Continue queue on error</span>
              <span className="text-[10px] text-muted-foreground">Keep downloading subsequent jobs in the queue if one fails.</span>
            </div>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-xs mt-1">
            <input 
              type="checkbox" 
              checked={settings.autoStartDownloads} 
              onChange={(e) => handleUpdateSetting('autoStartDownloads', e.target.checked)}
              className="h-3.5 w-3.5 rounded border-borderAccent text-primary focus:ring-0" 
            />
            <div className="flex flex-col">
              <span className="font-semibold">Auto-start queue on URL parse</span>
              <span className="text-[10px] text-muted-foreground">Immediately append parsed ready URLs directly to the download stream.</span>
            </div>
          </label>
        </div>

      </div>
    </>
  );
}
