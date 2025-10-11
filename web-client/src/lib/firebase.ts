"use client"

import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"

const fallbackConfig = {
  apiKey: "AIzaSyDBczhS0XYJCVhM3-WemvSFaWliSkjLRIM",
  authDomain: "madameai-dev.firebaseapp.com",
  databaseURL: "https://madameai-dev-default-rtdb.firebaseio.com",
  projectId: "madameai-dev",
  storageBucket: "madameai-dev.firebasestorage.app",
  messagingSenderId: "115515011999",
  appId: "1:115515011999:web:26f6328246216339b283aa",
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? fallbackConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? fallbackConfig.authDomain,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? fallbackConfig.databaseURL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? fallbackConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? fallbackConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? fallbackConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? fallbackConfig.appId,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
}

const firebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()

export const app = firebaseApp
export const auth = getAuth(firebaseApp)
