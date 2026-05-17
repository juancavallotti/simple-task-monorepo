package service

import (
	"context"

	types "juancavallotti.com/recipe-types"
)

func (s *Service) AddRecipePhoto(ctx context.Context, recipeID string, photo types.Photo) (string, error) {
	if err := ValidateRecipeID(recipeID); err != nil {
		return "", err
	}
	if err := validatePhotos([]types.Photo{photo}); err != nil {
		return "", err
	}
	return s.store.AddRecipePhoto(ctx, recipeID, photo)
}
