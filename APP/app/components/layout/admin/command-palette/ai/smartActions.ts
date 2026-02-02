"use client";

export type SmartCommand = {
  id: string;
  phrase: string;       // kullanıcı cümlesi
  createdAt: number;
  action: () => void;   // uygulayacağı işlem
};

const STORAGE_KEY = "denetron-smart-commands";

export function loadSmartCommands(): SmartCommand[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveSmartCommands(list: SmartCommand[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addSmartCommand(cmd: SmartCommand) {
  const list = loadSmartCommands();
  list.push(cmd);
  saveSmartCommands(list);
}
