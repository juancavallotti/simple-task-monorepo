package types

import "time"

type Recipe struct {
	ID           string    `json:"id"`
	Name         string    `json:"name"`
	Description  string    `json:"description"`
	Ingredients  []string  `json:"ingredients"`
	Instructions []string  `json:"instructions"`
	Category     string    `json:"category"`
	Image        string    `json:"image"`
	Photos       []Photo   `json:"photos"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

type Photo struct {
	ID          string `json:"id,omitempty"`
	ImageBase64 string `json:"image_base64"`
	Featured    bool   `json:"featured"`
}
