package skills

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
)

const testUUID = "550e8400-e29b-41d4-a716-446655440000"

func TestNewStore_nilPool(t *testing.T) {
	t.Parallel()
	s := NewStore(nil)
	if s == nil || s.db != nil {
		t.Fatalf("NewStore(nil) = %#v", s)
	}
}

func TestStore_nilDB_errors(t *testing.T) {
	t.Parallel()
	s := &Store{db: nil}
	ctx := context.Background()

	if _, err := s.ListSkills(ctx); !errors.Is(err, errNilDB) {
		t.Fatalf("ListSkills err = %v, want errNilDB", err)
	}
	if _, err := s.GetSkill(ctx, testUUID); !errors.Is(err, errNilDB) {
		t.Fatalf("GetSkill err = %v, want errNilDB", err)
	}
	if _, err := s.GetSkillByName(ctx, "prep"); !errors.Is(err, errNilDB) {
		t.Fatalf("GetSkillByName err = %v, want errNilDB", err)
	}
	if _, err := s.CreateSkill(ctx, "prep", "description", "content"); !errors.Is(err, errNilDB) {
		t.Fatalf("CreateSkill err = %v, want errNilDB", err)
	}
	if err := s.UpdateSkill(ctx, testUUID, "description", "content"); !errors.Is(err, errNilDB) {
		t.Fatalf("UpdateSkill err = %v, want errNilDB", err)
	}
	if err := s.DeleteSkill(ctx, testUUID); !errors.Is(err, errNilDB) {
		t.Fatalf("DeleteSkill err = %v, want errNilDB", err)
	}
}

func TestStore_ListSkills_contextCanceled(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)
	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	_, err = s.ListSkills(ctx)
	if !errors.Is(err, context.Canceled) {
		t.Fatalf("err = %v, want context.Canceled", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_ListSkills_returnsRows(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)
	createdAt := time.Date(2026, 5, 23, 12, 0, 0, 0, time.UTC)
	updatedAt := createdAt.Add(time.Minute)

	mock.ExpectQuery("FROM skills").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "description", "content", "created_at", "updated_at"}).
			AddRow(testUUID, "prep", "Prepare ingredients", "Instructions", createdAt, updatedAt))

	got, err := s.ListSkills(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 {
		t.Fatalf("len = %d, want 1", len(got))
	}
	if got[0].ID != testUUID || got[0].Name != "prep" || got[0].Description != "Prepare ingredients" {
		t.Fatalf("got[0] = %#v", got[0])
	}
	if !got[0].CreatedAt.Equal(createdAt) || !got[0].UpdatedAt.Equal(updatedAt) {
		t.Fatalf("times = %v %v", got[0].CreatedAt, got[0].UpdatedAt)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_GetSkill_notFound(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectQuery("FROM skills").
		WithArgs(testUUID).
		WillReturnError(sql.ErrNoRows)

	_, err = s.GetSkill(context.Background(), testUUID)
	if !errors.Is(err, ErrSkillNotFound) {
		t.Fatalf("err = %v, want ErrSkillNotFound", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_GetSkill_returnsRow(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)
	now := time.Date(2026, 5, 23, 12, 0, 0, 0, time.UTC)

	mock.ExpectQuery("FROM skills").
		WithArgs(testUUID).
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "description", "content", "created_at", "updated_at"}).
			AddRow(testUUID, "prep", "Prepare ingredients", "Instructions", now, now))

	got, err := s.GetSkill(context.Background(), testUUID)
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != testUUID || got.Name != "prep" || got.Content != "Instructions" {
		t.Fatalf("got = %#v", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_GetSkillByName_notFound(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectQuery("FROM skills").
		WithArgs("prep").
		WillReturnError(sql.ErrNoRows)

	_, err = s.GetSkillByName(context.Background(), "prep")
	if !errors.Is(err, ErrSkillNotFound) {
		t.Fatalf("err = %v, want ErrSkillNotFound", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_GetSkillByName_returnsRow(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)
	now := time.Date(2026, 5, 23, 12, 0, 0, 0, time.UTC)

	mock.ExpectQuery("FROM skills").
		WithArgs("prep").
		WillReturnRows(sqlmock.NewRows([]string{"id", "name", "description", "content", "created_at", "updated_at"}).
			AddRow(testUUID, "prep", "Prepare ingredients", "Instructions", now, now))

	got, err := s.GetSkillByName(context.Background(), "prep")
	if err != nil {
		t.Fatal(err)
	}
	if got.ID != testUUID || got.Name != "prep" {
		t.Fatalf("got = %#v", got)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_CreateSkill_returnsID(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectQuery("INSERT INTO skills").
		WithArgs("prep", "Prepare ingredients", "Instructions").
		WillReturnRows(sqlmock.NewRows([]string{"id"}).AddRow(testUUID))

	id, err := s.CreateSkill(context.Background(), "prep", "Prepare ingredients", "Instructions")
	if err != nil {
		t.Fatal(err)
	}
	if id != testUUID {
		t.Fatalf("id = %q, want %q", id, testUUID)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_CreateSkill_uniqueViolation(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectQuery("INSERT INTO skills").
		WithArgs("prep", "Prepare ingredients", "Instructions").
		WillReturnError(errors.New(`pq: duplicate key value violates unique constraint "skills_name_unique" (SQLSTATE 23505)`))

	_, err = s.CreateSkill(context.Background(), "prep", "Prepare ingredients", "Instructions")
	if !errors.Is(err, ErrSkillNameTaken) {
		t.Fatalf("err = %v, want ErrSkillNameTaken", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_UpdateSkill_notFound(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectExec("UPDATE skills").
		WithArgs(testUUID, "Updated", "Updated content").
		WillReturnResult(sqlmock.NewResult(0, 0))

	err = s.UpdateSkill(context.Background(), testUUID, "Updated", "Updated content")
	if !errors.Is(err, ErrSkillNotFound) {
		t.Fatalf("err = %v, want ErrSkillNotFound", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_UpdateSkill_success(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectExec("UPDATE skills").
		WithArgs(testUUID, "Updated", "Updated content").
		WillReturnResult(sqlmock.NewResult(0, 1))

	if err := s.UpdateSkill(context.Background(), testUUID, "Updated", "Updated content"); err != nil {
		t.Fatal(err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_DeleteSkill_notFound(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectExec("DELETE FROM skills").
		WithArgs(testUUID).
		WillReturnResult(sqlmock.NewResult(0, 0))

	err = s.DeleteSkill(context.Background(), testUUID)
	if !errors.Is(err, ErrSkillNotFound) {
		t.Fatalf("err = %v, want ErrSkillNotFound", err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}

func TestStore_DeleteSkill_success(t *testing.T) {
	t.Parallel()
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	s := NewStore(db)

	mock.ExpectExec("DELETE FROM skills").
		WithArgs(testUUID).
		WillReturnResult(sqlmock.NewResult(0, 1))

	if err := s.DeleteSkill(context.Background(), testUUID); err != nil {
		t.Fatal(err)
	}
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatal(err)
	}
}
