"use client";import{useEffect}from"react";export function OfflineRuntime(){useEffect(()=>{if("serviceWorker"in navigator)void navigator.serviceWorker.register("/sw.js")},[]);return null}
