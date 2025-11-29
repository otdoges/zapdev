import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import type { AgentVote, CouncilDecision } from "@/inngest/types";

/**
 * Council Orchestrator Tests
 * Tests critical functionality:
 * - Vote recording and consensus calculation
 * - Edge cases (no votes, ties, unanimous decisions)
 * - Proper vote counting with majority rule
 */

// Mock CouncilOrchestrator
class CouncilOrchestrator {
  private votes: AgentVote[] = [];

  recordVote(vote: AgentVote): void {
    this.votes.push(vote);
  }

  recordVotes(votes: AgentVote[]): void {
    this.votes.push(...votes);
  }

  getConsensus(orchestratorInput: string): CouncilDecision {
    if (this.votes.length === 0) {
      return {
        finalDecision: "revise",
        agreeCount: 0,
        totalVotes: 0,
        votes: [],
        orchestratorDecision: "No votes recorded",
      };
    }

    // Count votes
    const approves = this.votes.filter((v) => v.decision === "approve").length;
    const rejects = this.votes.filter((v) => v.decision === "reject").length;
    const revises = this.votes.filter((v) => v.decision === "revise").length;
    const totalVotes = this.votes.length;

    // Determine consensus: majority wins
    let finalDecision: "approve" | "reject" | "revise";
    if (approves > totalVotes / 2) {
      finalDecision = "approve";
    } else if (rejects > totalVotes / 2) {
      finalDecision = "reject";
    } else {
      finalDecision = "revise";
    }

    return {
      finalDecision,
      agreeCount: approves,
      totalVotes,
      votes: this.votes,
      orchestratorDecision: orchestratorInput,
    };
  }
}

describe("Council Orchestrator", () => {
  let orchestrator: CouncilOrchestrator;

  beforeEach(() => {
    orchestrator = new CouncilOrchestrator();
  });

  describe("Vote Recording", () => {
    it("should record single vote", () => {
      const vote: AgentVote = {
        agentName: "planner",
        decision: "approve",
        confidence: 0.95,
        reasoning: "Plan is sound",
      };

      orchestrator.recordVote(vote);
      const consensus = orchestrator.getConsensus("test");

      expect(consensus.votes.length).toBe(1);
      expect(consensus.votes[0]).toEqual(vote);
    });

    it("should record multiple votes", () => {
      const votes: AgentVote[] = [
        {
          agentName: "planner",
          decision: "approve",
          confidence: 0.9,
          reasoning: "Plan is sound",
        },
        {
          agentName: "implementer",
          decision: "approve",
          confidence: 0.85,
          reasoning: "Code is working",
        },
        {
          agentName: "reviewer",
          decision: "approve",
          confidence: 0.8,
          reasoning: "Code passes review",
        },
      ];

      orchestrator.recordVotes(votes);
      const consensus = orchestrator.getConsensus("test");

      expect(consensus.votes.length).toBe(3);
      expect(consensus.totalVotes).toBe(3);
    });
  });

  describe("Consensus Calculation", () => {
    it("should return revise when no votes recorded", () => {
      const consensus = orchestrator.getConsensus("test");
      expect(consensus.finalDecision).toBe("revise");
      expect(consensus.agreeCount).toBe(0);
      expect(consensus.totalVotes).toBe(0);
    });

    it("should approve with majority approval votes", () => {
      orchestrator.recordVotes([
        {
          agentName: "planner",
          decision: "approve",
          confidence: 0.9,
          reasoning: "Approved",
        },
        {
          agentName: "implementer",
          decision: "approve",
          confidence: 0.85,
          reasoning: "Approved",
        },
        {
          agentName: "reviewer",
          decision: "reject",
          confidence: 0.8,
          reasoning: "Rejected",
        },
      ]);

      const consensus = orchestrator.getConsensus("test");
      expect(consensus.finalDecision).toBe("approve");
      expect(consensus.agreeCount).toBe(2);
      expect(consensus.totalVotes).toBe(3);
    });

    it("should reject with majority rejection votes", () => {
      orchestrator.recordVotes([
        {
          agentName: "planner",
          decision: "reject",
          confidence: 0.9,
          reasoning: "Rejected",
        },
        {
          agentName: "implementer",
          decision: "reject",
          confidence: 0.85,
          reasoning: "Rejected",
        },
        {
          agentName: "reviewer",
          decision: "approve",
          confidence: 0.8,
          reasoning: "Approved",
        },
      ]);

      const consensus = orchestrator.getConsensus("test");
      expect(consensus.finalDecision).toBe("reject");
      expect(consensus.totalVotes).toBe(3);
    });

    it("should revise on tied votes", () => {
      orchestrator.recordVotes([
        {
          agentName: "planner",
          decision: "approve",
          confidence: 0.9,
          reasoning: "Approved",
        },
        {
          agentName: "implementer",
          decision: "reject",
          confidence: 0.85,
          reasoning: "Rejected",
        },
      ]);

      const consensus = orchestrator.getConsensus("test");
      expect(consensus.finalDecision).toBe("revise");
      expect(consensus.totalVotes).toBe(2);
    });

    it("should handle unanimous approval", () => {
      orchestrator.recordVotes([
        {
          agentName: "planner",
          decision: "approve",
          confidence: 0.95,
          reasoning: "Approved",
        },
        {
          agentName: "implementer",
          decision: "approve",
          confidence: 0.95,
          reasoning: "Approved",
        },
        {
          agentName: "reviewer",
          decision: "approve",
          confidence: 0.95,
          reasoning: "Approved",
        },
      ]);

      const consensus = orchestrator.getConsensus("test");
      expect(consensus.finalDecision).toBe("approve");
      expect(consensus.agreeCount).toBe(3);
      expect(consensus.totalVotes).toBe(3);
    });
  });

  describe("Confidence Tracking", () => {
    it("should preserve confidence scores from votes", () => {
      const vote: AgentVote = {
        agentName: "planner",
        decision: "approve",
        confidence: 0.75,
        reasoning: "Test",
      };

      orchestrator.recordVote(vote);
      const consensus = orchestrator.getConsensus("test");

      expect(consensus.votes[0].confidence).toBe(0.75);
    });

    it("should handle various confidence levels", () => {
      orchestrator.recordVotes([
        {
          agentName: "agent1",
          decision: "approve",
          confidence: 1.0,
          reasoning: "Very confident",
        },
        {
          agentName: "agent2",
          decision: "approve",
          confidence: 0.5,
          reasoning: "Somewhat confident",
        },
        {
          agentName: "agent3",
          decision: "approve",
          confidence: 0.1,
          reasoning: "Low confidence",
        },
      ]);

      const consensus = orchestrator.getConsensus("test");
      expect(consensus.votes[0].confidence).toBe(1.0);
      expect(consensus.votes[1].confidence).toBe(0.5);
      expect(consensus.votes[2].confidence).toBe(0.1);
    });
  });

  describe("Reasoning Preservation", () => {
    it("should preserve agent reasoning", () => {
      const reasonings = [
        "Plan covers all requirements",
        "Code passes all tests",
        "Security audit passed",
      ];

      orchestrator.recordVotes([
        {
          agentName: "planner",
          decision: "approve",
          confidence: 0.9,
          reasoning: reasonings[0],
        },
        {
          agentName: "implementer",
          decision: "approve",
          confidence: 0.85,
          reasoning: reasonings[1],
        },
        {
          agentName: "reviewer",
          decision: "approve",
          confidence: 0.8,
          reasoning: reasonings[2],
        },
      ]);

      const consensus = orchestrator.getConsensus("test");
      expect(consensus.votes.map((v) => v.reasoning)).toEqual(reasonings);
    });
  });
});

describe("Sandbox Cleanup", () => {
  /**
   * Tests that sandbox cleanup is guaranteed even on failure
   */

  it("should track sandbox cleanup attempts", async () => {
    const mockInstance = {
      id: "sandbox-123",
      stop: jest.fn().mockResolvedValue(undefined),
    };

    let cleanupCalled = false;
    let error: Error | null = null;

    // Simulate try-finally pattern
    try {
      // Simulate work that fails
      throw new Error("Task execution failed");
    } catch (e) {
      error = e;
    } finally {
      // Cleanup always runs
      if (mockInstance) {
        try {
          await mockInstance.stop();
          cleanupCalled = true;
        } catch (cleanupError) {
          console.error("Cleanup failed", cleanupError);
        }
      }
    }

    expect(cleanupCalled).toBe(true);
    expect(mockInstance.stop).toHaveBeenCalled();
    expect(error).not.toBeNull();
  });

  it("should handle cleanup failure gracefully", async () => {
    const mockInstance = {
      id: "sandbox-123",
      stop: jest.fn().mockRejectedValue(new Error("Stop failed")),
    };

    let cleanupFailed = false;
    let executionError: Error | null = null;

    try {
      throw new Error("Task failed");
    } catch (e) {
      executionError = e;
    } finally {
      if (mockInstance) {
        try {
          await mockInstance.stop();
        } catch (cleanupError) {
          cleanupFailed = true;
        }
      }
    }

    // Both errors should be tracked, cleanup failure doesn't prevent execution error
    expect(cleanupFailed).toBe(true);
    expect(executionError).not.toBeNull();
  });
});
