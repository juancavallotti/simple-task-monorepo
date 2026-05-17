package commands

import (
	"encoding/json"
	"errors"
	"io"
	"os"
)

func (r Runner) readJSONObject(path string, out any) error {
	in, closeInput, err := r.openInput(path)
	if err != nil {
		return err
	}
	defer closeInput()

	dec := json.NewDecoder(in)
	dec.DisallowUnknownFields()
	if err := dec.Decode(out); err != nil {
		return err
	}
	var extra any
	if err := dec.Decode(&extra); !errors.Is(err, io.EOF) {
		if err == nil {
			return errors.New("expected a single JSON object")
		}
		return err
	}
	return nil
}

func (r Runner) openInput(path string) (io.Reader, func(), error) {
	if path == "-" {
		return r.stdin, func() {}, nil
	}
	f, err := os.Open(path)
	if err != nil {
		return nil, nil, err
	}
	return f, func() { _ = f.Close() }, nil
}

func (r Runner) writeIndentedJSON(v any) error {
	enc := json.NewEncoder(r.stdout)
	enc.SetIndent("", "  ")
	return enc.Encode(v)
}
