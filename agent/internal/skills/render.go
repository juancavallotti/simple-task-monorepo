package skills

import (
	"strings"
)

const (
	// CatalogPlaceholder is replaced with the formatted list of skill entries.
	CatalogPlaceholder = "{{SKILL_CATALOG}}"
	// CLIHelpPlaceholder is replaced with the raw `recipes-cli --help` output.
	CLIHelpPlaceholder = "{{CLI_HELP}}"
)

// Render substitutes the catalog into the given prompt template. Skills are
// listed as `- <name>: <description>` lines, sorted by name. The CLI help is
// inserted verbatim.
func Render(template string, catalog Catalog) string {
	out := template
	out = strings.ReplaceAll(out, CatalogPlaceholder, formatCatalog(catalog.Skills))
	out = strings.ReplaceAll(out, CLIHelpPlaceholder, strings.TrimRight(catalog.HelpText, "\n"))
	return out
}

func formatCatalog(skills []SkillEntry) string {
	if len(skills) == 0 {
		return "(no skills available)"
	}
	sorted := append([]SkillEntry(nil), skills...)
	sortByName(sorted)
	var b strings.Builder
	for i, sk := range sorted {
		if i > 0 {
			b.WriteByte('\n')
		}
		b.WriteString("- ")
		b.WriteString(sk.Name)
		b.WriteString(": ")
		b.WriteString(sk.Description)
	}
	return b.String()
}

func sortByName(skills []SkillEntry) {
	// Insertion sort: catalogs are tiny (a handful of entries) and this keeps
	// the package import surface small.
	for i := 1; i < len(skills); i++ {
		for j := i; j > 0 && skills[j-1].Name > skills[j].Name; j-- {
			skills[j-1], skills[j] = skills[j], skills[j-1]
		}
	}
}
