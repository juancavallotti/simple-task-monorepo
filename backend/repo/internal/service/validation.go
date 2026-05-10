package service

import (
	"errors"
	"fmt"
	"strings"

	types "juancavallotti.com/recipe-types"
)

var (
	// ErrInvalidRecipeID is returned when a recipe id is missing or whitespace-only.
	ErrInvalidRecipeID = errors.New("invalid recipe id")
	// ErrInvalidRecipe is returned when recipe fields fail validation.
	ErrInvalidRecipe = errors.New("invalid recipe")
)

// ValidateRecipeID checks that id is non-empty after trimming spaces.
func ValidateRecipeID(id string) error {
	if strings.TrimSpace(id) == "" {
		return fmt.Errorf("%w", ErrInvalidRecipeID)
	}
	return nil
}

// ValidateRecipeForCreate checks fields required when inserting a recipe.
// ID must be empty; name, at least one ingredient, and at least one instruction are required.
func ValidateRecipeForCreate(recipe types.Recipe) error {
	if strings.TrimSpace(recipe.ID) != "" {
		return fmt.Errorf("%w: id must be empty for create", ErrInvalidRecipe)
	}
	return validateRecipeContent(recipe)
}

// ValidateRecipeForUpdate checks fields required when updating a recipe.
func ValidateRecipeForUpdate(recipe types.Recipe) error {
	if err := ValidateRecipeID(recipe.ID); err != nil {
		return err
	}
	return validateRecipeContent(recipe)
}

func validateRecipeContent(recipe types.Recipe) error {
	if strings.TrimSpace(recipe.Name) == "" {
		return fmt.Errorf("%w: name is required", ErrInvalidRecipe)
	}
	if !hasNonEmptyEntry(recipe.Ingredients) {
		return fmt.Errorf("%w: at least one non-empty ingredient is required", ErrInvalidRecipe)
	}
	if !hasNonEmptyEntry(recipe.Instructions) {
		return fmt.Errorf("%w: at least one non-empty instruction is required", ErrInvalidRecipe)
	}
	return nil
}

func hasNonEmptyEntry(items []string) bool {
	for _, item := range items {
		if strings.TrimSpace(item) != "" {
			return true
		}
	}
	return false
}
