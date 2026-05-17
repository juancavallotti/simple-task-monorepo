package commands

func (r Runner) cmdSchema() error {
	recipeFields := map[string]any{
		"name": map[string]any{
			"type":        "string",
			"description": "Required for create. Must not be blank.",
		},
		"description": map[string]any{"type": "string"},
		"ingredients": map[string]any{
			"type":     "array",
			"items":    map[string]any{"type": "string"},
			"minItems": 1,
		},
		"instructions": map[string]any{
			"type":     "array",
			"items":    map[string]any{"type": "string"},
			"minItems": 1,
		},
		"category": map[string]any{"type": "string"},
		"image":    map[string]any{"type": "string"},
		"photos": map[string]any{
			"type": "array",
			"items": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"properties": map[string]any{
					"id":           map[string]any{"type": "string"},
					"image_base64": map[string]any{"type": "string", "description": "Raw base64 image data."},
					"featured":     map[string]any{"type": "boolean"},
				},
				"required": []string{"image_base64"},
			},
		},
	}
	schema := map[string]any{
		"$schema":     "https://json-schema.org/draft/2020-12/schema",
		"title":       "Recipe CLI JSON payloads",
		"description": "Use createRecipe for `recipes-cli create`; use recipePatch for `recipes-cli patch`.",
		"$defs": map[string]any{
			"createRecipe": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           recipeFields,
				"required":             []string{"name", "ingredients", "instructions"},
			},
			"recipePatch": map[string]any{
				"type":                 "object",
				"additionalProperties": false,
				"properties":           recipeFields,
				"minProperties":        1,
			},
		},
		"anyOf": []map[string]any{
			{"$ref": "#/$defs/createRecipe"},
			{"$ref": "#/$defs/recipePatch"},
		},
	}
	return r.writeIndentedJSON(schema)
}
