import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.imovelweb.com.br" },
      { protocol: "https", hostname: "**.olx.com.br" },
      { protocol: "https", hostname: "**.zapimoveis.com.br" },
      { protocol: "https", hostname: "**.vivareal.com.br" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "**.supabase.in" },
    ],
  },
};

export default nextConfig;
