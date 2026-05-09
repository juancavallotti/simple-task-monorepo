package db

import (
	"database/sql"
	"errors"
)

// Store runs recipe persistence against a *sql.DB connection pool.
type Store struct {
	db   *sql.DB
	name string
}

var errNilDB = errors.New("db: nil *sql.DB")

// NewStore returns a Store that uses pool for all queries.
func NewStore(pool *sql.DB, name string) *Store {
	return &Store{db: pool, name: name}
}
