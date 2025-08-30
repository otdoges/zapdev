'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Users, Sparkles, MessageSquare, Target, Clock, CheckCircle } from 'lucide-react';

interface DesignCharacter {
  id: string;
  name: string;
  role: string;
  personality: string;
  expertise: string[];
  designPhilosophy: string;
}

interface DesignWorkflow {
  id: string;
  name: string;
  description: string;
  estimatedDuration: number;
  outputType: string;
  requiredCharacters: string[];
}

interface DesignTeamResponse {
  primaryOutput: string;
  characterContributions: Record<string, string>;
  teamConsensus: string;
  recommendedNextSteps: string[];
  designDecisions: Array<{
    decision: string;
    rationale: string;
    supportingCharacters: string[];
  }>;
}

export function DesignTeamInterface() {
  const [designBrief, setDesignBrief] = useState('');
  const [projectType, setProjectType] = useState<'web-app' | 'landing-page' | 'dashboard' | 'mobile-app' | 'brand-system'>('web-app');
  const [targetAudience, setTargetAudience] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [characters, setCharacters] = useState<DesignCharacter[]>([]);
  const [workflows, setWorkflows] = useState<DesignWorkflow[]>([]);
  const [teamResponse, setTeamResponse] = useState<DesignTeamResponse | null>(null);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [activeSection, setActiveSection] = useState<'collaborate' | 'characters' | 'workflows'>('collaborate');

  // Load available characters and workflows
  useEffect(() => {
    loadDesignTeamData();
  }, []);

  const loadDesignTeamData = async () => {
    try {
      const [charactersRes, workflowsRes] = await Promise.all([
        fetch('/api/design-team-collaboration?action=design-characters'),
        fetch('/api/design-team-collaboration?action=available-workflows')
      ]);

      if (charactersRes.ok) {
        const charactersData = await charactersRes.json();
        setCharacters(charactersData.characters || []);
      }

      if (workflowsRes.ok) {
        const workflowsData = await workflowsRes.json();
        setWorkflows(workflowsData.workflows || []);
      }
    } catch (error) {
      console.error('Failed to load design team data:', error);
    }
  };

  const startDesignCollaboration = async () => {
    if (!designBrief.trim()) return;

    setIsLoading(true);
    setTeamResponse(null);

    try {
      const response = await fetch('/api/design-team-collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-integrated-response',
          designBrief,
          projectType,
          targetAudience: targetAudience || undefined,
          preferredCharacters: selectedCharacters.length > 0 ? selectedCharacters : undefined,
          discussionStyle: 'collaborative'
        })
      });

      const result = await response.json();

      if (result.success) {
        setTeamResponse(result.teamResponse);
      } else {
        console.error('Design team collaboration failed:', result.error);
      }
    } catch (error) {
      console.error('Failed to start design collaboration:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCharacterSelection = (characterId: string) => {
    setSelectedCharacters(prev => 
      prev.includes(characterId) 
        ? prev.filter(id => id !== characterId)
        : [...prev, characterId]
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
          <Users className="w-8 h-8 text-blue-600" />
          ZapDev Design Team
        </h1>
        <p className="text-gray-600">
          Collaborative AI design using multiple specialized personas
        </p>
      </div>

      {/* Simple tab navigation */}
      <div className="flex border-b">
        {[
          { id: 'collaborate', label: 'Collaborate', icon: Sparkles },
          { id: 'characters', label: 'Team Members', icon: Users },
          { id: 'workflows', label: 'Workflows', icon: Target }
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveSection(id as any)}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeSection === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4 inline mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* Collaborate Section */}
      {activeSection === 'collaborate' && (
        <div className="space-y-6">
          <div className="bg-white border rounded-lg">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Start Design Collaboration
              </h2>
              <p className="text-gray-600">
                Describe your design challenge and let the team collaborate on a solution
              </p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Design Brief</label>
                <Textarea
                  placeholder="Describe what you want to design or improve..."
                  value={designBrief}
                  onChange={(e) => setDesignBrief(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Project Type</label>
                  <select 
                    className="w-full p-2 border rounded-md"
                    value={projectType}
                    onChange={(e) => setProjectType(e.target.value as any)}
                  >
                    <option value="web-app">Web Application</option>
                    <option value="landing-page">Landing Page</option>
                    <option value="dashboard">Dashboard</option>
                    <option value="mobile-app">Mobile App</option>
                    <option value="brand-system">Brand System</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Target Audience (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., busy professionals, tech startups..."
                    className="w-full p-2 border rounded-md"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                  />
                </div>
              </div>

              {characters.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Select Team Members (Optional)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {characters.map(character => (
                      <div
                        key={character.id}
                        onClick={() => toggleCharacterSelection(character.id)}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedCharacters.includes(character.id)
                            ? 'bg-blue-50 border-blue-300'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-medium">{character.name}</div>
                        <div className="text-sm text-gray-600">{character.role}</div>
                      </div>
                    ))}
                  </div>
                  {selectedCharacters.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Leave empty to auto-select optimal team members
                    </p>
                  )}
                </div>
              )}

              <Button 
                onClick={startDesignCollaboration}
                disabled={!designBrief.trim() || isLoading}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Design Team Collaborating...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Start Design Collaboration
                  </>
                )}
              </Button>
            </div>
          </div>

          {teamResponse && (
            <div className="bg-white border rounded-lg">
              <div className="p-6 border-b">
                <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Design Team Results
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Team Consensus</h3>
                  <p className="text-gray-700 whitespace-pre-wrap">{teamResponse.teamConsensus}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Character Contributions</h3>
                  <div className="space-y-3">
                    {Object.entries(teamResponse.characterContributions).map(([characterName, contribution]) => (
                      <div key={characterName} className="border-l-4 border-blue-300 pl-4">
                        <div className="font-medium text-blue-700">{characterName}</div>
                        <p className="text-sm text-gray-600">{contribution}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {teamResponse.designDecisions.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Key Design Decisions</h3>
                    <div className="space-y-2">
                      {teamResponse.designDecisions.map((decision, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="font-medium">{decision.decision}</div>
                          <div className="text-sm text-gray-600 mt-1">{decision.rationale}</div>
                          <div className="flex gap-1 mt-2">
                            {decision.supportingCharacters.map(character => (
                              <span key={character} className="inline-block bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                                {character}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {teamResponse.recommendedNextSteps.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4" />
                      Recommended Next Steps
                    </h3>
                    <ul className="space-y-1">
                      {teamResponse.recommendedNextSteps.map((step, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 text-xs flex items-center justify-center mt-0.5 font-medium">
                            {index + 1}
                          </div>
                          <span className="text-sm">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Demo Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
            <div className="p-6 border-b border-blue-200">
              <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Try the Design Team
              </h2>
              <p className="text-gray-600">
                Example prompts to test the multi-character design system
              </p>
            </div>
            <div className="p-6">
              <div className="grid gap-2 md:grid-cols-2">
                {[
                  "Design a modern dashboard for project management",
                  "Create a landing page for a SaaS product",
                  "Design a mobile app onboarding flow",
                  "Build a design system for an e-commerce site"
                ].map((example, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    onClick={() => setDesignBrief(example)}
                    className="text-left justify-start h-auto p-3"
                  >
                    <MessageSquare className="w-3 h-3 mr-2 flex-shrink-0" />
                    <span className="text-xs">{example}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Characters Section */}
      {activeSection === 'characters' && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {characters.map(character => (
            <div key={character.id} className="bg-white border rounded-lg">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold">{character.name}</h3>
                <p className="text-gray-600">{character.role}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Personality</h4>
                    <p className="text-sm text-gray-600">{character.personality}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Expertise</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {character.expertise.slice(0, 3).map(skill => (
                        <span key={skill} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          {skill}
                        </span>
                      ))}
                      {character.expertise.length > 3 && (
                        <span className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                          +{character.expertise.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Philosophy</h4>
                    <p className="text-xs text-gray-500">{character.designPhilosophy}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Workflows Section */}
      {activeSection === 'workflows' && (
        <div className="grid gap-4 md:grid-cols-2">
          {workflows.map(workflow => (
            <div key={workflow.id} className="bg-white border rounded-lg">
              <div className="p-6 border-b">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {workflow.name}
                </h3>
                <p className="text-gray-600">{workflow.description}</p>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{workflow.estimatedDuration} min</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>{workflow.outputType}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-sm mb-1">Required Team Members</h4>
                    <div className="flex flex-wrap gap-1">
                      {workflow.requiredCharacters.map(charId => {
                        const character = characters.find(c => c.id === charId);
                        return character ? (
                          <span key={charId} className="inline-block bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                            {character.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}