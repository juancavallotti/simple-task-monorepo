package copilot

import (
	"encoding/json"
	"log"

	"google.golang.org/adk/agent"
	"google.golang.org/adk/agent/llmagent"
	"google.golang.org/adk/model"
	"google.golang.org/genai"
)

const (
	contextTokenBudget = 100_000
	avgCharsPerToken   = 4
)

// newContextTrimCallback returns a BeforeModelCallback that drops the oldest
// user-rooted turns from req.Contents when the estimated token count exceeds
// contextTokenBudget. The latest user turn is always preserved.
func newContextTrimCallback() llmagent.BeforeModelCallback {
	return func(_ agent.CallbackContext, req *model.LLMRequest) (*model.LLMResponse, error) {
		trimContents(req)
		return nil, nil
	}
}

func trimContents(req *model.LLMRequest) {
	if req == nil || len(req.Contents) <= 1 {
		return
	}
	before := estimateRequestTokens(req)
	if before <= contextTokenBudget {
		return
	}

	boundaries := userMessageBoundaries(req.Contents)
	dropped := 0
	for len(boundaries) > 1 {
		nextTurnStart := boundaries[1]
		req.Contents = req.Contents[nextTurnStart:]
		dropped++
		if estimateRequestTokens(req) <= contextTokenBudget {
			break
		}
		boundaries = userMessageBoundaries(req.Contents)
	}
	if dropped > 0 {
		log.Printf("context_window: trimmed %d oldest user turns (~%d -> ~%d tokens, threshold=%d)",
			dropped, before, estimateRequestTokens(req), contextTokenBudget)
	}
}

func estimateRequestTokens(req *model.LLMRequest) int {
	chars := 0
	if req.Config != nil && req.Config.SystemInstruction != nil {
		for _, p := range req.Config.SystemInstruction.Parts {
			chars += partSize(p)
		}
	}
	for _, c := range req.Contents {
		for _, p := range c.Parts {
			chars += partSize(p)
		}
	}
	return chars / avgCharsPerToken
}

func partSize(p *genai.Part) int {
	if p == nil {
		return 0
	}
	size := len(p.Text)
	if p.FunctionCall != nil {
		if data, err := json.Marshal(p.FunctionCall); err == nil {
			size += len(data)
		}
	}
	if p.FunctionResponse != nil {
		if data, err := json.Marshal(p.FunctionResponse); err == nil {
			size += len(data)
		}
	}
	if p.InlineData != nil {
		size += len(p.InlineData.Data)
	}
	return size
}

// userMessageBoundaries returns the indices of contents that start a new
// user-initiated turn — Role == "user" with at least one text part. Function
// responses also carry Role == "user" but only have FunctionResponse parts,
// so they are not treated as turn starts.
func userMessageBoundaries(contents []*genai.Content) []int {
	var indices []int
	for i, c := range contents {
		if c == nil || c.Role != "user" {
			continue
		}
		if hasUserTextPart(c) {
			indices = append(indices, i)
		}
	}
	return indices
}

func hasUserTextPart(c *genai.Content) bool {
	for _, p := range c.Parts {
		if p == nil {
			continue
		}
		if p.FunctionResponse != nil {
			continue
		}
		if p.Text != "" {
			return true
		}
	}
	return false
}
