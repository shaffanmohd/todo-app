"use client";

import {useTheme} from "next-themes";
import {Toaster as Sonner, type ToasterProps} from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({...props}: ToasterProps) => {
  const {theme = "system"} = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",

          "--error-bg": "var(--destructive)",
          "--error-text": "white",
          "--error-border": "var(--destructive)",

          "--success-bg": "oklch(0.65 0.15 145)",
          "--success-text": "white",
          "--success-border": "oklch(0.65 0.15 145)",

          "--warning-bg": "oklch(0.75 0.15 80)",
          "--warning-text": "oklch(0.2 0.02 80)",
          "--warning-border": "oklch(0.75 0.15 80)",

          "--info-bg": "var(--primary)",
          "--info-text": "var(--primary-foreground)",
          "--info-border": "var(--primary)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  );
};

export {Toaster};
