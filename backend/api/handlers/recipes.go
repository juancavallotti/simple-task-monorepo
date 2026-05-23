package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	types "juancavallotti.com/recipe-types"
)

// ListRecipes handles GET /recipes.
func (h *Handlers) ListRecipes(c *gin.Context) {
	recipes, err := h.Repo.GetRecipes(c.Request.Context())
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	c.JSON(http.StatusOK, recipes)
}

// GetRecipe handles GET /recipes/:id.
func (h *Handlers) GetRecipe(c *gin.Context) {
	id := c.Param("id")
	recipe, err := h.Repo.GetRecipe(c.Request.Context(), id)
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	c.JSON(http.StatusOK, recipe)
}

// CreateRecipe handles POST /recipes.
func (h *Handlers) CreateRecipe(c *gin.Context) {
	var body types.Recipe
	if err := c.ShouldBindJSON(&body); err != nil {
		writeBindErr(c, err)
		return
	}
	body.ID = ""

	id, err := h.Repo.CreateRecipe(c.Request.Context(), body)
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	created, err := h.Repo.GetRecipe(c.Request.Context(), id)
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	c.Header("Location", "/recipes/"+id)
	c.JSON(http.StatusCreated, created)
}

// ReplaceRecipe handles PUT /recipes/:id (full replacement of mutable fields and lines).
func (h *Handlers) ReplaceRecipe(c *gin.Context) {
	id := c.Param("id")
	var body types.Recipe
	if err := c.ShouldBindJSON(&body); err != nil {
		writeBindErr(c, err)
		return
	}
	body.ID = id

	if err := h.Repo.UpdateRecipe(c.Request.Context(), body); err != nil {
		writeRepoErr(c, err)
		return
	}
	out, err := h.Repo.GetRecipe(c.Request.Context(), id)
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	c.JSON(http.StatusOK, out)
}

// recipePatch is a partial update payload. Omitted JSON fields are nil and left unchanged.
type recipePatch struct {
	Name         *string        `json:"name"`
	Description  *string        `json:"description"`
	Category     *string        `json:"category"`
	Image        *string        `json:"image"`
	Ingredients  *[]string      `json:"ingredients"`
	Instructions *[]string      `json:"instructions"`
	Photos       *[]types.Photo `json:"photos"`
}

func (p recipePatch) anySet() bool {
	return p.Name != nil || p.Description != nil || p.Category != nil || p.Image != nil ||
		p.Ingredients != nil || p.Instructions != nil || p.Photos != nil
}

func mergeRecipePatch(cur types.Recipe, p recipePatch) types.Recipe {
	out := cur
	if p.Name != nil {
		out.Name = *p.Name
	}
	if p.Description != nil {
		out.Description = *p.Description
	}
	if p.Category != nil {
		out.Category = *p.Category
	}
	if p.Image != nil {
		out.Image = *p.Image
	}
	if p.Ingredients != nil {
		out.Ingredients = *p.Ingredients
	}
	if p.Instructions != nil {
		out.Instructions = *p.Instructions
	}
	if p.Photos != nil {
		out.Photos = *p.Photos
	}
	return out
}

// PatchRecipe handles PATCH /recipes/:id.
func (h *Handlers) PatchRecipe(c *gin.Context) {
	id := c.Param("id")
	var patch recipePatch
	if err := c.ShouldBindJSON(&patch); err != nil {
		writeBindErr(c, err)
		return
	}
	if !patch.anySet() {
		c.JSON(http.StatusBadRequest, gin.H{"error": "no fields to update"})
		return
	}

	cur, err := h.Repo.GetRecipe(c.Request.Context(), id)
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	merged := mergeRecipePatch(cur, patch)
	merged.ID = id

	if err := h.Repo.UpdateRecipe(c.Request.Context(), merged); err != nil {
		writeRepoErr(c, err)
		return
	}
	out, err := h.Repo.GetRecipe(c.Request.Context(), id)
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	c.JSON(http.StatusOK, out)
}

// DeleteRecipe handles DELETE /recipes/:id.
func (h *Handlers) DeleteRecipe(c *gin.Context) {
	id := c.Param("id")
	if err := h.Repo.DeleteRecipe(c.Request.Context(), id); err != nil {
		writeRepoErr(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

type photoPayload struct {
	ImageBase64 string `json:"image_base64"`
	Featured    bool   `json:"featured"`
}

// AddRecipePhoto handles POST /recipes/:id/photos.
func (h *Handlers) AddRecipePhoto(c *gin.Context) {
	var body photoPayload
	if err := c.ShouldBindJSON(&body); err != nil {
		writeBindErr(c, err)
		return
	}

	photo := types.Photo{
		ImageBase64: body.ImageBase64,
		Featured:    body.Featured,
	}
	id, err := h.Repo.AddRecipePhoto(c.Request.Context(), c.Param("id"), photo)
	if err != nil {
		writeRepoErr(c, err)
		return
	}

	created, err := h.Repo.GetRecipe(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	c.Header("Location", "/recipes/"+c.Param("id")+"/photos/"+id)
	c.JSON(http.StatusCreated, created)
}

// DeleteRecipePhoto handles DELETE /recipes/:id/photos/:photo_id.
func (h *Handlers) DeleteRecipePhoto(c *gin.Context) {
	if err := h.Repo.DeleteRecipePhoto(c.Request.Context(), c.Param("id"), c.Param("photo_id")); err != nil {
		writeRepoErr(c, err)
		return
	}
	c.Status(http.StatusNoContent)
}

// SetFeaturedRecipePhoto handles PUT /recipes/:id/photos/:photo_id/featured.
func (h *Handlers) SetFeaturedRecipePhoto(c *gin.Context) {
	if err := h.Repo.SetFeaturedRecipePhoto(c.Request.Context(), c.Param("id"), c.Param("photo_id")); err != nil {
		writeRepoErr(c, err)
		return
	}
	out, err := h.Repo.GetRecipe(c.Request.Context(), c.Param("id"))
	if err != nil {
		writeRepoErr(c, err)
		return
	}
	c.JSON(http.StatusOK, out)
}
