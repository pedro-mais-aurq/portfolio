import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const projects = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/projects" }),
  schema: ({ image }) =>
    z.object({
      volume: z.string(), // "001", "002"...
      title: z.string(),
      client: z.string().optional(),
      summary: z.string(),
      role: z.array(z.string()).default([]),
      year: z.string().optional(),
      accentColor: z.string(), // cor específica do case, ex: "#2E4A3D"
      cover: image(),
      coverAlt: z.string(),
      featured: z.boolean().default(false),
      status: z.enum(["completed", "preview"]).default("completed"),
      order: z.number(),
      url: z.url().optional(),
      previewMode: z.enum(["live", "image"]).optional(),
      previewImage: image().optional(),
    }),
});

export const collections = { projects };
