"use client"

import {useTheme} from "next-themes"
import {ExternalToast, toast, Toaster as Sonner, ToasterProps} from "sonner"
import React from "react"

const ClickableToast: React.FC<{ id: string | number; children: React.ReactNode }> = ({id, children}) => {
    return (
        <div
            onClick={() => toast.dismiss(id)}
            style={{cursor: "pointer", width: "100%", height: "100%"}}
        >
            {children}
        </div>
    )
}

const originalToast = {...toast}
const wrappedToast = (message: React.ReactNode, data?: ExternalToast) => {
    return originalToast.custom((id) => <ClickableToast id={id}>{message}</ClickableToast>, {
        ...data,
    })
}

wrappedToast.success = (message: React.ReactNode, data?: ExternalToast) => {
    return originalToast.custom((id) => <ClickableToast id={id}>{message}</ClickableToast>, {
        ...data,
        className: data?.className ? `${data.className} success` : "success",
    })
}

wrappedToast.info = (message: React.ReactNode, data?: ExternalToast) => {
    return originalToast.custom((id) => <ClickableToast id={id}>{message}</ClickableToast>, {
        ...data,
        className: data?.className ? `${data.className} info` : "info",
    })
}

wrappedToast.warning = (message: React.ReactNode, data?: ExternalToast) => {
    return originalToast.custom((id) => <ClickableToast id={id}>{message}</ClickableToast>, {
        ...data,
        className: data?.className ? `${data.className} warning` : "warning",
    })
}

wrappedToast.error = (message: React.ReactNode, data?: ExternalToast) => {
    return originalToast.custom((id) => <ClickableToast id={id}>{message}</ClickableToast>, {
        ...data,
        className: data?.className ? `${data.className} error` : "error",
    })
}

wrappedToast.loading = (message: React.ReactNode, data?: ExternalToast) => {
    return originalToast.custom((id) => <ClickableToast id={id}>{message}</ClickableToast>, {
        ...data,
        className: data?.className ? `${data.className} loading` : "loading",
    })
}

wrappedToast.custom = originalToast.custom
wrappedToast.promise = originalToast.promise
wrappedToast.dismiss = originalToast.dismiss
wrappedToast.getHistory = originalToast.getHistory
wrappedToast.getToasts = originalToast.getToasts

const Toaster = ({...props}: ToasterProps) => {
    const {theme = "system"} = useTheme()

    return (
        <Sonner
            theme={theme as ToasterProps["theme"]}
            className="toaster group"
            position="top-center"
            toastOptions={{
                style: {
                    fontSize: "16px",
                    padding: "12px 16px",
                    minWidth: "200px",
                    maxWidth: "400px",
                    background: "#FFF0F5",
                    color: "#4A0010",
                    borderColor: "#FF8FAB",
                },
                className: "responsive-toast",
            }}
            {...props}
        />
    )
}

const styles = `
  .responsive-toast {
    background: #FFF0F5 !important; /* Lavender blush */
    color: #4A0010 !important; /* Dark blood red */
    border: 1px solid #FF8FAB !important; /* Rose pink */
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(128, 0, 32, 0.1); /* Subtle shadow with burgundy tint */
  }

  .responsive-toast.success {
    background: #FFB6C1 !important; /* Light pink */
    border-color: #FF4B6A !important; /* Blood red */
  }

  .responsive-toast.info {
    background: #FFEBEE !important; /* Very light pink */
    border-color: #FF8FAB !important; /* Rose pink */
  }

  .responsive-toast.warning {
    background: #FF8FAB !important; /* Rose pink */
    border-color: #800020 !important; /* Burgundy */
  }

  .responsive-toast.error {
    background: #FF4B6A !important; /* Blood red */
    border-color: #800020 !important; /* Burgundy */
  }

  .responsive-toast.loading {
    background: #FFF0F5 !important; /* Lavender blush */
    border-color: #FFB6C1 !important; /* Light pink */
  }

  /* Desktop (1024px and above) */
  @media (min-width: 1024px) {
    .responsive-toast {
      font-size: 16px !important;
      padding: 12px 16px !important;
      min-width: 200px !important;
      max-width: 400px !important;
      transform: scale(1); /* Full size for desktop */
    }
  }

  /* iPad/Tablets (768px to 1023px) */
  @media (min-width: 768px) and (max-width: 1023px) {
    .responsive-toast {
      font-size: 15px !important;
      padding: 10px 14px !important;
      min-width: 180px !important;
      max-width: 360px !important;
      transform: scale(0.95); /* Slightly smaller for tablets */
    }
  }

  /* iPhone/Mobile (below 768px) */
  @media (max-width: 767px) {
    .responsive-toast {
      font-size: 14px !important;
      padding: 8px 12px !important;
      min-width: 160px !important;
      max-width: 300px !important;
      transform: scale(0.9); /* Smaller for mobile */
    }
  }
`

if (typeof document !== "undefined") {
    const styleSheet = document.createElement("style")
    styleSheet.innerText = styles
    document.head.appendChild(styleSheet)
}

export {Toaster, wrappedToast as toast}
