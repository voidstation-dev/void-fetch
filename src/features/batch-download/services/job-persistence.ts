/**
 * VoidFetch
 * Copyright (c) 2026 VoidStation.
 * All rights reserved.
 */

import type { DownloadJob, BatchProject } from '../types/batch-download';

const DB_NAME = 'voidfetch-db';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(new Error('Failed to open IndexedDB database'));
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('projects')) {
        db.createObjectStore('projects', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('jobs')) {
        db.createObjectStore('jobs', { keyPath: 'id' });
      }
    };
  });
}

export async function saveJob(job: DownloadJob): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('jobs', 'readwrite');
    const store = transaction.objectStore('jobs');
    const request = store.put(job);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveJobs(jobs: DownloadJob[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('jobs', 'readwrite');
    const store = transaction.objectStore('jobs');

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const job of jobs) {
      store.put(job);
    }
  });
}

export async function getJob(id: string): Promise<DownloadJob | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('jobs', 'readonly');
    const store = transaction.objectStore('jobs');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllJobs(): Promise<DownloadJob[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('jobs', 'readonly');
    const store = transaction.objectStore('jobs');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteJob(id: string): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('jobs', 'readwrite');
    const store = transaction.objectStore('jobs');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteJobs(ids: string[]): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('jobs', 'readwrite');
    const store = transaction.objectStore('jobs');

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);

    for (const id of ids) {
      store.delete(id);
    }
  });
}

export async function clearJobs(): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('jobs', 'readwrite');
    const store = transaction.objectStore('jobs');
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveProject(project: BatchProject): Promise<void> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readwrite');
    const store = transaction.objectStore('projects');
    const request = store.put(project);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getProject(id: string): Promise<BatchProject | null> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllProjects(): Promise<BatchProject[]> {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('projects', 'readonly');
    const store = transaction.objectStore('projects');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}
