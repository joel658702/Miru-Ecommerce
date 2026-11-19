import type { MetadataRoute } from "next";

/** El panel es privado: no debe indexarse. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", disallow: "/" }],
  };
}
