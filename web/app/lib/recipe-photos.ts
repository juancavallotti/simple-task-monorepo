import type { Recipe, RecipePhoto } from "~/lib/recipe-api";

export type DisplayPhoto = {
  key: string;
  src: string;
  featured: boolean;
  source: "url" | "stored";
};

function imageBase64ToSrc(imageBase64: string): string {
  const trimmed = imageBase64.trim();
  if (trimmed.startsWith("data:")) return trimmed;

  const mediaType =
    trimmed.startsWith("/9j/") ? "image/jpeg"
    : trimmed.startsWith("iVBOR") ? "image/png"
    : trimmed.startsWith("R0lGOD") ? "image/gif"
    : trimmed.startsWith("UklGR") ? "image/webp"
    : "image/jpeg";

  return `data:${mediaType};base64,${trimmed}`;
}

function storedPhotoToDisplayPhoto(photo: RecipePhoto, index: number): DisplayPhoto {
  return {
    key: photo.id ?? `stored-${index}`,
    src: imageBase64ToSrc(photo.image_base64),
    featured: photo.featured,
    source: "stored",
  };
}

export function getRecipeDisplayPhotos(recipe: Recipe): DisplayPhoto[] {
  const photos = recipe.photos ?? [];
  const storedPhotos = photos
    .map(storedPhotoToDisplayPhoto)
    .filter((photo) => photo.src.trim() !== "");
  const featuredPhoto = storedPhotos.find((photo) => photo.featured);
  const url = recipe.image.trim();
  const urlPhoto: DisplayPhoto | null =
    url === ""
      ? null
      : {
          key: "image-url",
          src: url,
          featured: false,
          source: "url",
        };

  if (featuredPhoto == null) {
    return urlPhoto == null ? storedPhotos : [urlPhoto, ...storedPhotos];
  }

  return [
    featuredPhoto,
    ...(urlPhoto == null ? [] : [urlPhoto]),
    ...storedPhotos.filter((photo) => photo.key !== featuredPhoto.key),
  ];
}

export function getRecipePrimaryPhoto(recipe: Recipe): DisplayPhoto | null {
  return getRecipeDisplayPhotos(recipe)[0] ?? null;
}
