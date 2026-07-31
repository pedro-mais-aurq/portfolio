import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      volume: z.string(), // "001", "002"...
      title: z.string(),
      client: z.string().optional(),
      summary: z.string(),
      role: z.array(z.string()).default([]),
      year: z.string(),
      accentColor: z.string(), // cor específica do case, ex: "#2E4A3D"
      cover: image(),
      coverAlt: z.string(),
      featured: z.boolean().default(false),
      order: z.number(),
      url: z.string().url().optional(),
    }),
});

export const collections = { projects };
