import type { MetadataRoute } from "next";
import { buildRobots } from "@/seo/robots";

export default function robots(): MetadataRoute.Robots {
  return buildRobots();
}
