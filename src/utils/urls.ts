const rawBase = import.meta.env.BASE_URL || "/";

export const siteBase = `/${rawBase.replace(/^\/+|\/+$/g, "")}${
  rawBase === "/" ? "" : "/"
}`.replace("//", "/");

/** Cria uma URL interna que sempre respeita o base configurado no Astro. */
export function siteUrl(path = "", hash = "") {
  const cleanPath = path.replace(/^\/+|\/+$/g, "");
  const pathname = cleanPath ? `${siteBase}${cleanPath}/` : siteBase;
  const cleanHash = hash ? `#${hash.replace(/^#/, "")}` : "";
  return `${pathname}${cleanHash}`;
}
