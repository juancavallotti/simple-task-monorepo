package commands

import types "juancavallotti.com/recipe-types"

// recipePatch is the CLI equivalent of the API PATCH payload.
type recipePatch struct {
	Name         *string   `json:"name"`
	Description  *string   `json:"description"`
	Ingredients  *[]string `json:"ingredients"`
	Instructions *[]string `json:"instructions"`
	Category     *string   `json:"category"`
	Image        *string   `json:"image"`
}

func (p recipePatch) anySet() bool {
	return p.Name != nil || p.Description != nil || p.Ingredients != nil || p.Instructions != nil ||
		p.Category != nil || p.Image != nil
}

func mergeRecipePatch(cur types.Recipe, p recipePatch) types.Recipe {
	out := cur
	if p.Name != nil {
		out.Name = *p.Name
	}
	if p.Description != nil {
		out.Description = *p.Description
	}
	if p.Ingredients != nil {
		out.Ingredients = *p.Ingredients
	}
	if p.Instructions != nil {
		out.Instructions = *p.Instructions
	}
	if p.Category != nil {
		out.Category = *p.Category
	}
	if p.Image != nil {
		out.Image = *p.Image
	}
	return out
}
