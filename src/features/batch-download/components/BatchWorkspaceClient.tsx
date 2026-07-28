/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

"use client";

import { useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { BatchComposer } from "./BatchComposer";
import { BatchToolbar } from "./BatchToolbar";
import { DownloadQueue } from "./DownloadQueue";
import { BatchProgressBar } from "./BatchProgressBar";
import { QueuePreferencesButton } from "./QueuePreferencesButton";

const JobConfigDrawer = dynamic(
  () => import("./JobConfigDrawer").then((m) => m.JobConfigDrawer),
  { ssr: false }
);

const SettingsModal = dynamic(
  () => import("./SettingsModal").then((m) => m.SettingsModal),
  { ssr: false }
);

const emptySubscribe = () => () => { };

export function BatchWorkspaceClient() {
  const isMounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
  return (
    <>
      {/* Workspace Header */}
      <div className="flex items-center justify-between p-4 border rounded-xl bg-card border-border/80 shrink-0">
        <div className="flex flex-col gap-0.5">
          <h1 className="text-sm font-bold text-foreground">
            Untitled Batch Workspace
          </h1>
          <span className="text-[10px] text-muted-foreground uppercase">
            VoidFetch Queue manager
          </span>
        </div>

        <QueuePreferencesButton />
      </div>

      {/* Composer Input */}
      <BatchComposer />

      {/* Toolbar Controls - full width */}
      <BatchToolbar />

      {/* Queue Listing - full width */}
      <DownloadQueue />

      {/* Config Drawer popup */}
      <JobConfigDrawer />

      {/* Aceternity Animated Settings Modal */}
      <SettingsModal />

      {/* Stats Bottom Bar */}
      {isMounted && <BatchProgressBar />}
    </>
  );
}
