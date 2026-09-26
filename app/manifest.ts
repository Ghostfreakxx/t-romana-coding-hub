import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/", name: "T. Romana Skills Hub", short_name: "TRC Skills",
    description: "Learn, practise and create with the T. Romana College Skills Hub.",
    start_url: "/", scope: "/", display: "standalone",
    background_color: "#101211", theme_color: "#173b36",
    lang: "en", categories: ["education", "music"],
    icons: [
      { src: "/icons/trc-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/trc-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/trc-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Driving practice", url: "/driving" },
      { name: "Music and basic skills", url: "/skills" },
      { name: "Electrical workbench", url: "/electrical" },
      { name: "Coding Studio", url: "/coding" },
    ],
  };
}
