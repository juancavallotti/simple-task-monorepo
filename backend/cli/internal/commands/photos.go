package commands

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"os"
	"strings"

	types "juancavallotti.com/recipe-types"
)

func (r Runner) cmdAddPhoto(ctx context.Context, repo RecipeRepo, recipeID string, path string, featured bool) error {
	imageBase64, err := r.readPhotoBase64(path)
	if err != nil {
		return err
	}
	if _, err := repo.AddRecipePhoto(ctx, strings.TrimSpace(recipeID), types.Photo{
		ImageBase64: imageBase64,
		Featured:    featured,
	}); err != nil {
		return err
	}
	updated, err := repo.GetRecipe(ctx, strings.TrimSpace(recipeID))
	if err != nil {
		return err
	}
	return r.writeIndentedJSON(updated)
}

func (r Runner) readPhotoBase64(path string) (string, error) {
	if path != "-" {
		data, err := os.ReadFile(path)
		if err != nil {
			return "", err
		}
		return base64.StdEncoding.EncodeToString(data), nil
	}

	data, err := io.ReadAll(r.stdin)
	if err != nil {
		return "", err
	}
	imageBase64 := strings.Join(strings.Fields(string(data)), "")
	if imageBase64 == "" {
		return "", fmt.Errorf("empty base64 image data")
	}
	if _, err := base64.StdEncoding.DecodeString(imageBase64); err != nil {
		return "", fmt.Errorf("invalid base64 image data: %w", err)
	}
	return imageBase64, nil
}

func (r Runner) cmdDeletePhoto(ctx context.Context, repo RecipeRepo, recipeID string, photoID string) error {
	recipeID = strings.TrimSpace(recipeID)
	if err := repo.DeleteRecipePhoto(ctx, recipeID, strings.TrimSpace(photoID)); err != nil {
		return err
	}
	updated, err := repo.GetRecipe(ctx, recipeID)
	if err != nil {
		return err
	}
	return r.writeIndentedJSON(updated)
}

func (r Runner) cmdSetFeaturedPhoto(ctx context.Context, repo RecipeRepo, recipeID string, photoID string) error {
	recipeID = strings.TrimSpace(recipeID)
	if err := repo.SetFeaturedRecipePhoto(ctx, recipeID, strings.TrimSpace(photoID)); err != nil {
		return err
	}
	updated, err := repo.GetRecipe(ctx, recipeID)
	if err != nil {
		return err
	}
	return r.writeIndentedJSON(updated)
}
