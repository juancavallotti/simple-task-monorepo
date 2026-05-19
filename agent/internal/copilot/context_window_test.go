package copilot

import (
	"strings"
	"testing"

	"google.golang.org/adk/model"
	"google.golang.org/genai"
)

func userContent(text string) *genai.Content {
	return &genai.Content{Role: "user", Parts: []*genai.Part{{Text: text}}}
}

func modelContent(text string) *genai.Content {
	return &genai.Content{Role: "model", Parts: []*genai.Part{{Text: text}}}
}

func functionResponseContent(name, result string) *genai.Content {
	return &genai.Content{
		Role: "user",
		Parts: []*genai.Part{{
			FunctionResponse: &genai.FunctionResponse{
				Name:     name,
				Response: map[string]any{"result": result},
			},
		}},
	}
}

func TestTrimContents_UnderThresholdLeavesContentsAlone(t *testing.T) {
	req := &model.LLMRequest{
		Contents: []*genai.Content{
			userContent("hello"),
			modelContent("hi"),
			userContent("how are you"),
		},
	}
	original := len(req.Contents)
	trimContents(req)
	if len(req.Contents) != original {
		t.Fatalf("contents length = %d, want %d", len(req.Contents), original)
	}
}

func TestTrimContents_DropsOldestUserTurnsAboveThreshold(t *testing.T) {
	bigText := strings.Repeat("a", contextTokenBudget*avgCharsPerToken)
	req := &model.LLMRequest{
		Contents: []*genai.Content{
			userContent(bigText),
			modelContent("reply 1"),
			userContent(bigText),
			modelContent("reply 2"),
			userContent("latest question"),
		},
	}
	trimContents(req)
	if len(req.Contents) == 0 {
		t.Fatalf("contents were emptied")
	}
	last := req.Contents[len(req.Contents)-1]
	if last.Role != "user" || last.Parts[0].Text != "latest question" {
		t.Fatalf("latest user turn not preserved; got role=%q text=%q", last.Role, last.Parts[0].Text)
	}
	if len(req.Contents) >= 5 {
		t.Fatalf("expected oldest turns to be dropped, got %d contents", len(req.Contents))
	}
}

func TestTrimContents_KeepsAtLeastLatestUserTurn(t *testing.T) {
	bigText := strings.Repeat("a", contextTokenBudget*avgCharsPerToken*4)
	req := &model.LLMRequest{
		Contents: []*genai.Content{
			userContent("old"),
			modelContent("old reply"),
			userContent(bigText),
		},
	}
	trimContents(req)
	if len(req.Contents) == 0 {
		t.Fatalf("contents were emptied; latest user turn must be preserved")
	}
	if req.Contents[0].Role != "user" {
		t.Fatalf("first remaining content should start a user turn, got role=%q", req.Contents[0].Role)
	}
}

func TestUserMessageBoundaries_SkipsFunctionResponses(t *testing.T) {
	contents := []*genai.Content{
		userContent("first user msg"),
		modelContent("calling tool"),
		functionResponseContent("foo", "result"),
		modelContent("done"),
		userContent("second user msg"),
	}
	got := userMessageBoundaries(contents)
	want := []int{0, 4}
	if len(got) != len(want) {
		t.Fatalf("boundaries = %v, want %v", got, want)
	}
	for i := range got {
		if got[i] != want[i] {
			t.Fatalf("boundaries = %v, want %v", got, want)
		}
	}
}

func TestEstimateRequestTokens_IncludesSystemInstruction(t *testing.T) {
	sysText := strings.Repeat("s", 4*avgCharsPerToken)
	req := &model.LLMRequest{
		Config: &genai.GenerateContentConfig{
			SystemInstruction: &genai.Content{
				Parts: []*genai.Part{{Text: sysText}},
			},
		},
		Contents: []*genai.Content{userContent("x")},
	}
	got := estimateRequestTokens(req)
	if got < 4 {
		t.Fatalf("estimate = %d, want at least 4 (from system instruction)", got)
	}
}
