import { MetadataRoute } from "next";
import { AIDStore } from "@/lib/store";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://aid.ledpa7.com";

  try {
    const agents = await AIDStore.getAllAgents();

    const agentEntries: MetadataRoute.Sitemap = agents
      .filter((agent) => agent.visibility === "PUBLIC")
      .map((agent) => ({
        url: `${baseUrl}/${encodeURIComponent(agent.primaryAddress)}`,
        lastModified: new Date(agent.updatedAt || agent.createdAt || Date.now()),
        changeFrequency: "daily" as const,
        priority: 0.8,
      }));

    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/directory`,
        lastModified: new Date(),
        changeFrequency: "hourly" as const,
        priority: 0.9,
      },
      ...agentEntries,
    ];
  } catch (error) {
    console.error("Failed to generate dynamic sitemap:", error);
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1.0,
      },
      {
        url: `${baseUrl}/directory`,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 0.9,
      },
    ];
  }
}
