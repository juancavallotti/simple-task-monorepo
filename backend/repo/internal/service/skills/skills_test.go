package skills

import (
	"context"
	"errors"
	"testing"

	types "juancavallotti.com/recipe-types"
)

type fakeStore struct {
	listCalls       int
	getID           string
	getName         string
	createName      string
	createDesc      string
	createContent   string
	updateID        string
	updateDesc      string
	updateContent   string
	deleteID        string
	createErr       error
	updateErr       error
	deleteErr       error
	getByNameResult types.Skill
}

func (f *fakeStore) ListSkills(ctx context.Context) ([]types.Skill, error) {
	f.listCalls++
	return []types.Skill{{ID: "skill-id", Name: "prep"}}, nil
}

func (f *fakeStore) GetSkill(ctx context.Context, id string) (types.Skill, error) {
	f.getID = id
	return types.Skill{ID: id, Name: "prep"}, nil
}

func (f *fakeStore) GetSkillByName(ctx context.Context, name string) (types.Skill, error) {
	f.getName = name
	if f.getByNameResult.ID != "" {
		return f.getByNameResult, nil
	}
	return types.Skill{ID: "skill-id", Name: name}, nil
}

func (f *fakeStore) CreateSkill(ctx context.Context, name, description, content string) (string, error) {
	f.createName = name
	f.createDesc = description
	f.createContent = content
	return "skill-id", f.createErr
}

func (f *fakeStore) UpdateSkill(ctx context.Context, id, description, content string) error {
	f.updateID = id
	f.updateDesc = description
	f.updateContent = content
	return f.updateErr
}

func (f *fakeStore) DeleteSkill(ctx context.Context, id string) error {
	f.deleteID = id
	return f.deleteErr
}

func TestService_ListSkills_DelegatesToStore(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	got, err := s.ListSkills(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].Name != "prep" {
		t.Fatalf("got = %#v", got)
	}
	if f.listCalls != 1 {
		t.Fatalf("list calls = %d, want 1", f.listCalls)
	}
}

func TestService_GetSkill_ValidatesID(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	_, err := s.GetSkill(context.Background(), " ")
	if !errors.Is(err, ErrInvalidSkillID) {
		t.Fatalf("err = %v, want ErrInvalidSkillID", err)
	}
	if f.getID != "" {
		t.Fatalf("store should not be called, got id %q", f.getID)
	}
}

func TestService_GetSkill_DelegatesToStore(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	got, err := s.GetSkill(context.Background(), "skill-id")
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != "skill-id" || f.getID != "skill-id" {
		t.Fatalf("got=%#v store id=%q", got, f.getID)
	}
}

func TestService_GetSkillByName_ValidatesName(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	for _, name := range []string{"", "Upper", "-bad", "bad-", "has spaces"} {
		name := name
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			_, err := s.GetSkillByName(context.Background(), name)
			if !errors.Is(err, ErrInvalidSkillName) {
				t.Fatalf("err = %v, want ErrInvalidSkillName", err)
			}
		})
	}
}

func TestService_GetSkillByName_DelegatesToStore(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	got, err := s.GetSkillByName(context.Background(), "prep")
	if err != nil {
		t.Fatal(err)
	}
	if got.Name != "prep" || f.getName != "prep" {
		t.Fatalf("got=%#v store name=%q", got, f.getName)
	}
}

func TestService_CreateSkill_ValidatesInput(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name        string
		skillName   string
		description string
		content     string
		wantErr     error
	}{
		{"bad name", "Bad Name", "description", "content", ErrInvalidSkillName},
		{"empty description", "prep", " ", "content", ErrInvalidSkillDescription},
		{"empty content", "prep", "description", " ", ErrInvalidSkillContent},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			f := &fakeStore{}
			s := NewService(f)
			_, err := s.CreateSkill(context.Background(), tt.skillName, tt.description, tt.content)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err = %v, want %v", err, tt.wantErr)
			}
			if f.createName != "" {
				t.Fatalf("store should not be called, got name %q", f.createName)
			}
		})
	}
}

func TestService_CreateSkill_DelegatesToStore(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	id, err := s.CreateSkill(context.Background(), "prep", "Prepare ingredients", "Do the prep")
	if err != nil {
		t.Fatal(err)
	}
	if id != "skill-id" {
		t.Fatalf("id = %q, want skill-id", id)
	}
	if f.createName != "prep" || f.createDesc != "Prepare ingredients" || f.createContent != "Do the prep" {
		t.Fatalf("create args = %q %q %q", f.createName, f.createDesc, f.createContent)
	}
}

func TestService_UpdateSkill_ValidatesInput(t *testing.T) {
	t.Parallel()
	tests := []struct {
		name        string
		id          string
		description string
		content     string
		wantErr     error
	}{
		{"empty id", " ", "description", "content", ErrInvalidSkillID},
		{"empty description", "skill-id", " ", "content", ErrInvalidSkillDescription},
		{"empty content", "skill-id", "description", " ", ErrInvalidSkillContent},
	}

	for _, tt := range tests {
		tt := tt
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			f := &fakeStore{}
			s := NewService(f)
			err := s.UpdateSkill(context.Background(), tt.id, tt.description, tt.content)
			if !errors.Is(err, tt.wantErr) {
				t.Fatalf("err = %v, want %v", err, tt.wantErr)
			}
			if f.updateID != "" {
				t.Fatalf("store should not be called, got id %q", f.updateID)
			}
		})
	}
}

func TestService_UpdateSkill_DelegatesToStore(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	if err := s.UpdateSkill(context.Background(), "skill-id", "Updated", "Updated content"); err != nil {
		t.Fatal(err)
	}
	if f.updateID != "skill-id" || f.updateDesc != "Updated" || f.updateContent != "Updated content" {
		t.Fatalf("update args = %q %q %q", f.updateID, f.updateDesc, f.updateContent)
	}
}

func TestService_DeleteSkill_ValidatesID(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	err := s.DeleteSkill(context.Background(), "")
	if !errors.Is(err, ErrInvalidSkillID) {
		t.Fatalf("err = %v, want ErrInvalidSkillID", err)
	}
	if f.deleteID != "" {
		t.Fatalf("store should not be called, got id %q", f.deleteID)
	}
}

func TestService_DeleteSkill_DelegatesToStore(t *testing.T) {
	t.Parallel()
	f := &fakeStore{}
	s := NewService(f)

	if err := s.DeleteSkill(context.Background(), "skill-id"); err != nil {
		t.Fatal(err)
	}
	if f.deleteID != "skill-id" {
		t.Fatalf("delete id = %q, want skill-id", f.deleteID)
	}
}
