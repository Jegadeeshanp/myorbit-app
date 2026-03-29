'use client';

import { useEffect } from "react";
import { onForegroundMessage } from "@/lib/firebase";

export default function NotificationListener() {
  useEffect(() => {
    console.log("🔥 NotificationListener mounted"); // 👈 IMPORTANT

    const setup = async () => {
      await onForegroundMessage((payload) => {
        console.log("🔥 Foreground message:", payload);

        if (payload?.notification) {
          new Notification(payload.notification.title || "Notification", {
            body: payload.notification.body,
          });
        }
      });
    };

    setup();
  }, []);

  return null;
}