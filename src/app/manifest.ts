import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ClinicOS Patient App",
    short_name: "ClinicOS",
    description: "View your prescriptions and appointments and request a clinic visit.",
    start_url: "/patient",
    scope: "/",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#047857",
    icons: [
      {
        src: "/patient-app-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
