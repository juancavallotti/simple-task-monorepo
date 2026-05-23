// Package skills loads the skill catalog the agent embeds into its system
// prompt. The catalog is sourced from the installed recipes-cli binary so the
// agent and CLI share a single source of truth.
package skills

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os/exec"
	"strings"
	"sync"
	"time"
)

// DefaultCLIBinary is the recipes-cli binary name resolved through $PATH.
const DefaultCLIBinary = "recipes-cli"

const cliLoadTimeout = 15 * time.Second

// SkillEntry is one row of the catalog: just enough for the agent to decide
// whether to load the skill's full content. Content itself is fetched lazily
// at runtime via `recipes-cli load-skill <name>`.
type SkillEntry struct {
	Name        string
	Description string
}

// Catalog is the full set of inputs the agent needs to assemble its system
// prompt: the CLI's help text plus the list of available skills.
type Catalog struct {
	HelpText string
	Skills   []SkillEntry
}

// Loader fetches the catalog from the installed CLI exactly once and caches
// the result. Subsequent Load calls return the cached value (or error).
//
// One Loader is intended per process; create it at startup in app.Run and pass
// it to anything that needs the catalog. The loader execs the CLI binary, so
// it must not be invoked inside per-session paths (e.g. copilot.NewWith).
type Loader struct {
	cliBinary string
	once      sync.Once
	cached    Catalog
	err       error
}

// NewLoader returns a Loader that resolves the recipes-cli binary by the given
// name (looked up via $PATH). Pass DefaultCLIBinary for normal use.
func NewLoader(cliBinary string) *Loader {
	if cliBinary == "" {
		cliBinary = DefaultCLIBinary
	}
	return &Loader{cliBinary: cliBinary}
}

// Load returns the cached catalog, fetching it on first call. Returns an error
// if the CLI binary is missing, the CLI fails, or the listed skills can't be
// parsed.
func (l *Loader) Load(ctx context.Context) (Catalog, error) {
	l.once.Do(func() {
		l.cached, l.err = l.fetch(ctx)
	})
	return l.cached, l.err
}

func (l *Loader) fetch(ctx context.Context) (Catalog, error) {
	help, err := l.runCLI(ctx, "--help")
	if err != nil {
		return Catalog{}, fmt.Errorf("fetch CLI help: %w", err)
	}
	list, err := l.runCLI(ctx, "list-skills")
	if err != nil {
		return Catalog{}, fmt.Errorf("fetch skill list: %w", err)
	}
	skills, err := parseSkillList(bytes.NewReader(list))
	if err != nil {
		return Catalog{}, fmt.Errorf("parse skill list: %w", err)
	}
	if len(skills) == 0 {
		return Catalog{}, errors.New("skill catalog is empty; seed at least one skill in the database")
	}
	return Catalog{
		HelpText: string(help),
		Skills:   skills,
	}, nil
}

func (l *Loader) runCLI(ctx context.Context, args ...string) ([]byte, error) {
	runCtx, cancel := context.WithTimeout(ctx, cliLoadTimeout)
	defer cancel()
	cmd := exec.CommandContext(runCtx, l.cliBinary, args...)
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr
	if err := cmd.Run(); err != nil {
		return nil, fmt.Errorf("%s %s: %w (stderr: %s)", l.cliBinary, strings.Join(args, " "), err, strings.TrimSpace(stderr.String()))
	}
	return stdout.Bytes(), nil
}

// parseSkillList reads JSON Lines `{"name": "...", "description": "..."}` and
// returns the parsed entries. Blank lines are skipped; any non-blank line that
// doesn't decode cleanly fails the whole parse.
func parseSkillList(r io.Reader) ([]SkillEntry, error) {
	scanner := bufio.NewScanner(r)
	scanner.Buffer(make([]byte, 0, 64*1024), 1024*1024)
	out := []SkillEntry{}
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" {
			continue
		}
		var row struct {
			Name        string `json:"name"`
			Description string `json:"description"`
		}
		if err := json.Unmarshal([]byte(line), &row); err != nil {
			return nil, fmt.Errorf("invalid skill list line %q: %w", line, err)
		}
		if row.Name == "" {
			return nil, fmt.Errorf("invalid skill list line %q: missing name", line)
		}
		out = append(out, SkillEntry{Name: row.Name, Description: row.Description})
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return out, nil
}
