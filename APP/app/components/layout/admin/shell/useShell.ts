"use client";

import { useContext } from "react";
import { ShellContext } from "./ShellContext";

export const useShell = () => useContext(ShellContext);
