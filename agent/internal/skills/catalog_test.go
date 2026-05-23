package skills

import (
	"context"
	"strings"
	"testing"
)

func TestParseSkillList_HappyPath(t *testing.T) {
	t.Parallel()
	in := `{"name":"recipe-management","description":"Manage recipes."}` + "\n" +
		`{"name":"trace-analysis","description":"Investigate traces."}` + "\n"
	got, err := parseSkillList(strings.NewReader(in))
	if err != nil {
		t.Fatalf("parseSkillList: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("len=%d, want 2: %#v", len(got), got)
	}
	if got[0].Name != "recipe-management" || got[1].Name != "trace-analysis" {
		t.Fatalf("names = %q, %q", got[0].Name, got[1].Name)
	}
	if got[0].Description != "Manage recipes." {
		t.Fatalf("description = %q", got[0].Description)
	}
}

func TestParseSkillList_SkipsBlankLines(t *testing.T) {
	t.Parallel()
	in := "\n" + `{"name":"a","description":"x"}` + "\n\n\n" + `{"name":"b","description":"y"}` + "\n"
	got, err := parseSkillList(strings.NewReader(in))
	if err != nil {
		t.Fatalf("parseSkillList: %v", err)
	}
	if len(got) != 2 {
		t.Fatalf("len=%d, want 2", len(got))
	}
}

func TestParseSkillList_RejectsMissingName(t *testing.T) {
	t.Parallel()
	in := `{"description":"no name"}` + "\n"
	_, err := parseSkillList(strings.NewReader(in))
	if err == nil || !strings.Contains(err.Error(), "missing name") {
		t.Fatalf("err = %v, want missing-name error", err)
	}
}

func TestParseSkillList_RejectsInvalidJSON(t *testing.T) {
	t.Parallel()
	in := "not json\n"
	_, err := parseSkillList(strings.NewReader(in))
	if err == nil {
		t.Fatalf("expected error on invalid JSON")
	}
}

func TestLoader_CachesAcrossCalls(t *testing.T) {
	t.Parallel()
	// Point at a binary that cannot possibly exist. The first Load must error;
	// the second must return the same error without re-execing.
	l := NewLoader("/definitely/not/a/binary/recipes-cli-nope")
	_, err1 := l.Load(context.Background())
	if err1 == nil {
		t.Fatalf("expected first Load to error")
	}
	_, err2 := l.Load(context.Background())
	if err2 == nil {
		t.Fatalf("expected cached error on second Load")
	}
	if err1.Error() != err2.Error() {
		t.Fatalf("error not cached: %v vs %v", err1, err2)
	}
}

func TestLoader_FailsFastOnMissingBinary(t *testing.T) {
	t.Parallel()
	l := NewLoader("/definitely/not/a/binary/recipes-cli-nope")
	_, err := l.Load(context.Background())
	if err == nil {
		t.Fatalf("expected error for missing binary")
	}
	if !strings.Contains(err.Error(), "fetch CLI help") {
		t.Fatalf("error should mention which step failed; got %v", err)
	}
}
