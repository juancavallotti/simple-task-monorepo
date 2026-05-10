package main

import (
	"errors"
	"log"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	types "juancavallotti.com/recipe-types"
)

func loadDotenv() {
	for _, path := range []string{".env", "backend/.env"} {
		if err := godotenv.Load(path); err != nil {
			if errors.Is(err, os.ErrNotExist) {
				continue
			}
			log.Printf("dotenv: load %q: %v", path, err)
		}
	}
}

var recipes = []types.Recipe{
	{
		ID:           "1",
		Name:         "Recipe 1",
		Description:  "Description 1",
		Ingredients:  []string{"Ingredient 1", "Ingredient 2", "Ingredient 3"},
		Instructions: []string{"Instruction 1", "Instruction 2", "Instruction 3"},
		Category:     "Category 1",
		Image:        "Image 1",
	},
	{
		ID:           "2",
		Name:         "Recipe 2",
		Description:  "Description 2",
		Ingredients:  []string{"Ingredient 4", "Ingredient 5", "Ingredient 6"},
		Instructions: []string{"Instruction 4", "Instruction 5", "Instruction 6"},
		Category:     "Category 2",
		Image:        "Image 2",
	},
}

func getRecipes(c *gin.Context) {
	c.IndentedJSON(http.StatusOK, recipes)
}

func main() {
	loadDotenv()

	addr := os.Getenv("API_ADDR")
	if addr == "" {
		addr = "localhost:4000"
	}

	router := gin.Default()
	router.GET("/recipes", getRecipes)
	router.Run(addr)
}
