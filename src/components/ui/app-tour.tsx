"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useTourStore } from "@/stores/tour-store";

export function AppTour() {
  const { isActive, endTour } = useTourStore();

  useEffect(() => {
    let driverObj: ReturnType<typeof driver> | null = null;

    if (isActive) {
      driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        stagePadding: 5,
        scrollIntoViewOptions: {
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        },
        onDestroyed: () => {
          // Force exhaustive cleanup of driver.js side effects
          document.documentElement.style.overflow = "";
          document.body.style.overflow = "";
          document.documentElement.classList.remove("driver-active");
          document.body.classList.remove("driver-active");

          // Remove any inline styles driver might have left on highlighted elements
          const activeElements = document.querySelectorAll(
            ".driver-active-element",
          );
          activeElements.forEach((el) => {
            el.classList.remove("driver-active-element");
            (el as HTMLElement).style.pointerEvents = "";
            (el as HTMLElement).style.zIndex = "";
            (el as HTMLElement).style.position = "";
          });

          endTour();
        },
        steps: [
          {
            element: "#tour-url-input",
            popover: {
              title: "Paste Media Link",
              description:
                "Paste your social media or streaming link here. We support 25+ platforms!",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: "#tour-parse-btn",
            popover: {
              title: "Extract Metadata",
              description:
                "Click here to parse the link and resolve the media streams.",
              side: "bottom",
              align: "end",
            },
          },
          {
            element: "#tour-batch-queue",
            popover: {
              title: "Batch Workspace",
              description:
                "Review your parsed media here. You can customize download formats and quality for each item.",
              side: "top",
              align: "start",
            },
          },
          {
            element: "#tour-download-all",
            popover: {
              title: "Download All",
              description:
                "Start processing and downloading all items in your batch queue directly to your device.",
              side: "top",
              align: "center",
            },
          },
        ],
      });

      driverObj.drive();
    }

    return () => {
      try {
        if (driverObj) {
          driverObj.destroy();
          document.documentElement.style.overflow = "";
          document.body.style.overflow = "";
          document.documentElement.classList.remove("driver-active");
          document.body.classList.remove("driver-active");
        }
      } catch (e) {
        console.error("Tour cleanup error:", e);
      }
    };
  }, [isActive, endTour]);

  return null; // This component does not render any visible UI itself
}
