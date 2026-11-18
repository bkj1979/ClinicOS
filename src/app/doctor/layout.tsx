import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/doctor.webmanifest",
  title: "Doctor Mobile | ClinicOS",
  robots: { index: false, follow: false },
  appleWebApp: {
    capable: true,
    title: "ClinicOS Doctor",
    statusBarStyle: "default",
  },
};

export default function DoctorMobileLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
