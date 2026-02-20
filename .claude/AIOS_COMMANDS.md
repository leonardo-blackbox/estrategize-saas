# AIOS Commands & Agents Reference

## 🤖 Agents

Invoke agents with `@agent-name` or `/AIOS:agents:agent-name`

### Core Development Squad

| Agent | Persona | Use For | Command |
|-------|---------|---------|---------|
| **@dev** | Dex (Builder) | Code implementation, debugging, refactoring | `@dev` or `/AIOS:agents:dev` |
| **@qa** | Quinn | Testing, QA, code review feedback | `@qa` or `/AIOS:agents:qa` |
| **@architect** | Aria | Architecture design, technical decisions | `@architect` or `/AIOS:agents:architect` |
| **@pm** | Morgan | Product management, market analysis | `@pm` or `/AIOS:agents:pm` |
| **@po** | Pax | Product owner, stories, epics | `@po` or `/AIOS:agents:po` |
| **@sm** | River | Scrum Master, sprint planning | `@sm` or `/AIOS:agents:sm` |
| **@analyst** | Alex | Research, competitive analysis | `@analyst` or `/AIOS:agents:analyst` |
| **@data-engineer** | Dara | Database design, migrations, optimization | `@data-engineer` or `/AIOS:agents:data-engineer` |
| **@ux-design** | Uma | UX/UI design, wireframes, accessibility | `@ux-design` or `/AIOS:agents:ux-design` |
| **@devops** | Gage | CI/CD, git push (EXCLUSIVE), infrastructure | `@devops` or `/AIOS:agents:devops` |

---

## 💻 Dev Agent Commands (Prefix: `*`)

### Story Development
| Command | Description | Example |
|---------|-------------|---------|
| `*help` | Show all dev commands | `*help` |
| `*develop {story-id}` | Implement story (interactive mode) | `*develop story-1.8` |
| `*develop-yolo {story-id}` | Autonomous development mode | `*develop-yolo story-1.8` |
| `*develop-preflight {story-id}` | Planning mode (no implementation) | `*develop-preflight story-1.8` |

### Subtask Execution
| Command | Description |
|---------|-------------|
| `*execute-subtask` | Run single subtask (13-step Coder workflow) |
| `*verify-subtask` | Verify subtask completion |

### Build & Recovery
| Command | Description |
|---------|-------------|
| `*build-autonomous {story-id}` | Autonomous build loop with retries |
| `*build-resume {story-id}` | Resume build from checkpoint |
| `*build-status [--all]` | Show build status |
| `*build-log {story-id}` | View attempt log |
| `*build-cleanup` | Cleanup abandoned build state |
| `*track-attempt` | Track implementation attempt |
| `*rollback [--hard]` | Rollback to last good state |

### Worktree & Git
| Command | Description |
|---------|-------------|
| `*worktree-create {story-id}` | Create isolated worktree |
| `*worktree-list` | List active worktrees |
| `*worktree-merge {story-id}` | Merge worktree to base |
| `*worktree-cleanup` | Remove stale worktrees |

### Quality & Testing
| Command | Description |
|---------|-------------|
| `*run-tests` | Execute linting + all tests |
| `*apply-qa-fixes` | Apply QA feedback |
| `*fix-qa-issues` | Fix QA issues (8-phase) |
| `*backlog-debt {title}` | Register technical debt |

### Service & Workflow
| Command | Description |
|---------|-------------|
| `*create-service` | Scaffold service from template |
| `*waves [--visual]` | Analyze workflow for parallel execution |

### Context & Info
| Command | Description |
|---------|-------------|
| `*load-full {file}` | Load complete file (bypass summary) |
| `*clear-cache` | Clear dev context cache |
| `*session-info` | Show current session details |
| `*explain` | Explain what I just did |
| `*guide` | Show comprehensive usage guide |
| `*yolo` | Toggle permission mode (ask→auto→explore) |
| `*exit` | Exit developer mode |

### Gotchas Memory (Epic 9)
| Command | Description |
|---------|-------------|
| `*gotcha {title} - {desc}` | Add gotcha manually |
| `*gotchas [--category X] [--severity Y]` | List/search gotchas |
| `*gotcha-context` | Get relevant gotchas for current task |

---

## 🎯 QA Agent Commands (Prefix: `*`)

Invoke with `@qa`

| Command | Description |
|---------|-------------|
| `*help` | Show QA commands |
| `*review {story-id}` | Review story for quality |
| `*test` | Run all tests |
| `*coverage` | Check test coverage |
| `*exit` | Exit QA mode |

---

## 📐 Architect Agent Commands (Prefix: `*`)

Invoke with `@architect`

| Command | Description |
|---------|-------------|
| `*help` | Show architect commands |
| `*design {feature}` | Design architecture for feature |
| `*review-prd` | Review PRD for technical feasibility |
| `*impact-analysis {change}` | Analyze impact of changes |
| `*exit` | Exit architect mode |

---

## 📋 PO Agent Commands (Prefix: `*`)

Invoke with `@po`

| Command | Description |
|---------|-------------|
| `*help` | Show PO commands |
| `*create-story` | Create new story |
| `*create-epic` | Create new epic |
| `*manage-backlog` | Manage product backlog |
| `*validate-story {story-id}` | Validate story completeness |
| `*exit` | Exit PO mode |

---

## 🎭 SM Agent Commands (Prefix: `*`)

Invoke with `@sm`

| Command | Description |
|---------|-------------|
| `*help` | Show SM commands |
| `*plan-sprint` | Plan sprint |
| `*assign-story` | Assign story to dev |
| `*track-progress` | Track sprint progress |
| `*exit` | Exit SM mode |

---

## 🔧 DevOps Agent Commands (Prefix: `*`)

Invoke with `@devops` (EXCLUSIVE for git push + remote operations)

| Command | Description |
|---------|-------------|
| `*help` | Show DevOps commands |
| `*push` | Push changes to remote |
| `*create-pr` | Create pull request |
| `*merge-pr {pr-id}` | Merge PR |
| `*deploy {env}` | Deploy to environment |
| `*ci-status` | Check CI pipeline status |
| `*exit` | Exit DevOps mode |

---

## 📊 Data Engineer Commands (Prefix: `*`)

Invoke with `@data-engineer`

| Command | Description |
|---------|-------------|
| `*help` | Show data engineer commands |
| `*design-schema {entity}` | Design database schema |
| `*create-migration {name}` | Create migration |
| `*optimize-query` | Optimize slow query |
| `*audit-rls` | Audit RLS policies |
| `*exit` | Exit data engineer mode |

---

## 🎨 UX Design Commands (Prefix: `*`)

Invoke with `@ux-design`

| Command | Description |
|---------|-------------|
| `*help` | Show UX design commands |
| `*create-wireframe` | Create wireframe/mockup |
| `*design-system` | Design system review |
| `*accessibility-audit` | Audit for a11y issues |
| `*exit` | Exit UX design mode |

---

## 🔬 Analyst Commands (Prefix: `*`)

Invoke with `@analyst`

| Command | Description |
|---------|-------------|
| `*help` | Show analyst commands |
| `*market-research` | Conduct market research |
| `*competitive-analysis` | Analyze competitors |
| `*roi-calculate` | Calculate ROI/metrics |
| `*brainstorm {topic}` | Facilitated brainstorm |
| `*exit` | Exit analyst mode |

---

## 🎯 Quick Reference

### Most Common Workflows

**Develop a story:**
```
@dev *develop story-1.8
(implement tasks → run tests → mark complete)
```

**Review code quality:**
```
@qa *review story-1.8
(identifies issues → *apply-qa-fixes)
```

**Create new story:**
```
@po *create-story
(describes feature → generates story file)
```

**Push to remote:**
```
@devops *push
(ONLY devops can push - do not attempt in @dev)
```

**Plan architecture:**
```
@architect *design {feature}
(reviews approach → impact analysis)
```

---

## 🚨 Important Rules

### Dev Agent (`@dev`)
- ✅ Can: Implement code, fix bugs, run local tests, commit locally
- ❌ Cannot: Push to remote (use `@devops`)
- ❌ Cannot: Create PRs (use `@devops`)
- ❌ Cannot: Merge to main (use `@devops`)

### DevOps Agent (`@devops`)
- ✅ Can: Push changes, create PRs, merge PRs, deploy
- ✅ Can: Manage CI/CD, infrastructure, secrets
- ❌ Cannot: Write code (use `@dev`)
- ❌ Cannot: Create stories (use `@po`)

### PO Agent (`@po`)
- ✅ Can: Create/manage stories, write acceptance criteria
- ✅ Can: Manage backlog, create epics
- ❌ Cannot: Implement code (use `@dev`)
- ❌ Cannot: Push code (use `@devops`)

---

## 🔗 Command Prefix Reference

| Symbol | Meaning | Example |
|--------|---------|---------|
| `@agent` | Invoke agent | `@dev`, `@qa`, `@po` |
| `*command` | Agent command | `*develop`, `*review`, `*create-story` |
| `/path` | Path-based invocation | `/AIOS:agents:dev` |

---

## 📝 Notes

- All `*` commands require an active agent context (`@agent`)
- DevOps operations are **EXCLUSIVE** to `@devops` agent
- Local git operations (add, commit, status) available in `@dev`
- Remote git operations (push, PR) **ONLY** in `@devops`
- Agents maintain context within session

---

**Last Updated:** 2026-02-19
**AIOS Version:** 3.0
