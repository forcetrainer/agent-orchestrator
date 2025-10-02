# BMM Workflows

## Available Workflows in bmm

**brainstorm-game**
- Path: `bmad/bmm/workflows/1-analysis/brainstorm-game/workflow.yaml`
- Facilitate game brainstorming sessions by orchestrating the CIS brainstorming workflow with game-specific context, guidance, and additional game design techniques.

**brainstorm-project**
- Path: `bmad/bmm/workflows/1-analysis/brainstorm-project/workflow.yaml`
- Facilitate project brainstorming sessions by orchestrating the CIS brainstorming workflow with project-specific context and guidance.

**game-brief**
- Path: `bmad/bmm/workflows/1-analysis/game-brief/workflow.yaml`
- Interactive game brief creation workflow that guides users through defining their game vision with multiple input sources and conversational collaboration

**product-brief**
- Path: `bmad/bmm/workflows/1-analysis/product-brief/workflow.yaml`
- Interactive product brief creation workflow that guides users through defining their product vision with multiple input sources and conversational collaboration

**research**
- Path: `bmad/bmm/workflows/1-analysis/research/workflow.yaml`
- Adaptive research workflow supporting multiple research types: market research, deep research prompt generation, technical/architecture evaluation, competitive intelligence, user research, and domain analysis

**plan-project**
- Path: `bmad/bmm/workflows/2-plan/workflow.yaml`
- Scale-adaptive project planning workflow for all project levels (0-4). Automatically adjusts outputs based on project scope - from single atomic changes (Level 0: tech-spec only) to enterprise platforms (Level 4: full PRD + epics). Level 2-4 route to 3-solutioning workflow for architecture and tech specs. Generates appropriate planning artifacts for each level.

**tech-spec**
- Path: `bmad/bmm/workflows/3-solutioning/tech-spec/workflow.yaml`
- Generate a comprehensive Technical Specification from PRD and Architecture with acceptance criteria and traceability mapping

**solution-architecture**
- Path: `bmad/bmm/workflows/3-solutioning/workflow.yaml`
- Scale-adaptive solution architecture generation with dynamic template sections. Replaces legacy HLA workflow with modern BMAD Core compliance.

**correct-course**
- Path: `bmad/bmm/workflows/4-implementation/correct-course/workflow.yaml`
- Navigate significant changes during sprint execution by analyzing impact, proposing solutions, and routing for implementation

**create-story**
- Path: `bmad/bmm/workflows/4-implementation/create-story/workflow.yaml`
- Create the next user story markdown from epics/PRD and architecture, using a standard template and saving to the stories folder

**dev-story**
- Path: `bmad/bmm/workflows/4-implementation/dev-story/workflow.yaml`
- Execute a story by implementing tasks/subtasks, writing tests, validating, and updating the story file per acceptance criteria

**retrospective**
- Path: `bmad/bmm/workflows/4-implementation/retrospective/workflow.yaml`
- Run after epic completion to review overall success, extract lessons learned, and explore if new information emerged that might impact the next epic

**review-story**
- Path: `bmad/bmm/workflows/4-implementation/review-story/workflow.yaml`
- Perform a Senior Developer Review on a completed story flagged Ready for Review, leveraging story-context, epic tech-spec, repo docs, MCP servers for latest best-practices, and web search as fallback. Appends structured review notes to the story.

**story-context**
- Path: `bmad/bmm/workflows/4-implementation/story-context/workflow.yaml`
- Assemble a dynamic Story Context XML by pulling latest documentation and existing code/library artifacts relevant to a drafted story

**testarch-atdd**
- Path: `bmad/bmm/workflows/testarch/atdd/workflow.yaml`
- Generate failing acceptance tests before implementation.

**testarch-automate**
- Path: `bmad/bmm/workflows/testarch/automate/workflow.yaml`
- Expand automation coverage after implementation.

**testarch-ci**
- Path: `bmad/bmm/workflows/testarch/ci/workflow.yaml`
- Scaffold or update the CI/CD quality pipeline.

**testarch-framework**
- Path: `bmad/bmm/workflows/testarch/framework/workflow.yaml`
- Initialize or refresh the test framework harness.

**testarch-gate**
- Path: `bmad/bmm/workflows/testarch/gate/workflow.yaml`
- Record the quality gate decision for the story.

**testarch-nfr**
- Path: `bmad/bmm/workflows/testarch/nfr-assess/workflow.yaml`
- Assess non-functional requirements before release.

**testarch-plan**
- Path: `bmad/bmm/workflows/testarch/test-design/workflow.yaml`
- Plan risk mitigation and test coverage before development.

**testarch-trace**
- Path: `bmad/bmm/workflows/testarch/trace/workflow.yaml`
- Trace requirements to implemented automated tests.


## Execution

When running any workflow:
1. LOAD {project-root}/bmad/core/tasks/workflow.md
2. Pass the workflow path as 'workflow-config' parameter
3. Follow workflow.md instructions EXACTLY
4. Save outputs after EACH section

## Modes
- Normal: Full interaction
- #yolo: Skip optional steps
