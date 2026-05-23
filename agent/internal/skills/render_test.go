package skills

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestRender_GoldenMatchesFixture(t *testing.T) {
	t.Parallel()
	template := readFixture(t, "template.md")
	want := readFixture(t, "golden.md")

	// Intentionally unsorted so the test also verifies Render orders by name.
	catalog := Catalog{
		HelpText: "recipes-cli — fixture help text.\n  list   List recipes.\n  schema Print schema.\n",
		Skills: []SkillEntry{
			{Name: "trace-analysis", Description: "Investigate agent traces and events."},
			{Name: "recipe-management", Description: "Create, patch, delete recipes and manage recipe photos."},
		},
	}

	got := Render(template, catalog)
	if got != want {
		t.Fatalf("Render output differs from golden.\n--- got ---\n%s\n--- want ---\n%s", got, want)
	}
}

func TestRender_EmptyCatalogShowsPlaceholder(t *testing.T) {
	t.Parallel()
	out := Render("skills:\n{{SKILL_CATALOG}}\n", Catalog{})
	if !strings.Contains(out, "(no skills available)") {
		t.Fatalf("expected placeholder for empty catalog, got %q", out)
	}
}

func TestRender_LeavesUnknownPlaceholdersAlone(t *testing.T) {
	t.Parallel()
	out := Render("hello {{NOT_A_PLACEHOLDER}}", Catalog{})
	if !strings.Contains(out, "{{NOT_A_PLACEHOLDER}}") {
		t.Fatalf("unknown placeholder was rewritten: %q", out)
	}
}

func readFixture(t *testing.T, name string) string {
	t.Helper()
	data, err := os.ReadFile(filepath.Join("testdata", name))
	if err != nil {
		t.Fatalf("read fixture %s: %v", name, err)
	}
	return string(data)
}
