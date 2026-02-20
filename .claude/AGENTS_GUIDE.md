# AIOS Agents & Commands Guide

> **TL;DR:** Use `@agent-name` to invoke, then `*command` to run. See quick reference below.

---

## 🎯 Agent Selection Matrix

| Need | Agent | Invoke | Primary Command |
|------|-------|--------|-----------------|
| Write/fix code | **@dev** | `@dev` | `*develop story-1.8` |
| Test code | **@qa** | `@qa` | `*review story-1.8` |
| Design architecture | **@architect** | `@architect` | `*design {feature}` |
| Create/manage stories | **@po** | `@po` | `*create-story` |
| Sprint planning | **@sm** | `@sm` | `*plan-sprint` |
| Git push/PR/deploy | **@devops** | `@devops` | `*push` |
| Market research | **@analyst** | `@analyst` | `*market-research` |
| Database design | **@data-engineer** | `@data-engineer` | `*design-schema` |
| UX/UI design | **@ux-design** | `@ux-design` | `*create-wireframe` |

---

## 👨‍💻 Dev Agent (@dev) — Most Used

**Invoke:** `@dev`

### Core Commands
```
*develop story-1.8          → Implement story (interactive)
*develop-yolo story-1.8     → Autonomous mode
*run-tests                  → Run linting + tests
*apply-qa-fixes             → Apply QA feedback
```

### Build & Recovery
```
*build-autonomous story-1.8 → Autonomous build with retries
*build-resume story-1.8     → Resume from checkpoint
*build-status               → Show current build status
*rollback [--hard]          → Revert last good state
```

### Worktree (Isolated Branches)
```
*worktree-create story-1.8  → Create isolated branch
*worktree-list              → Show active branches
*worktree-merge story-1.8   → Merge back to main
```

### Utilities
```
*create-service             → Scaffold from template
*run-tests                  → Execute all tests
*session-info               → Show current session
*clear-cache                → Clear context cache
*help                       → Show all dev commands
*exit                       → Exit dev mode
```

---

## 🛡️ DevOps Agent (@devops) — Git & Deployment

**Invoke:** `@devops`

**⚠️ CRITICAL:** Only @devops can push to remote!

### Commands
```
*push                       → Push to remote
*create-pr                  → Create pull request
*merge-pr {id}              → Merge PR
*deploy {env}               → Deploy to environment
*ci-status                  → Check CI pipeline
```

---

## 📝 PO Agent (@po) — Product Owner

**Invoke:** `@po`

### Commands
```
*create-story               → Create new story
*create-epic                → Create new epic
*manage-backlog             → Organize backlog
*validate-story story-1.8   → Check story completeness
```

---

## 🔨 Architect Agent (@architect)

**Invoke:** `@architect`

### Commands
```
*design {feature}           → Design feature architecture
*review-prd                 → Review PRD feasibility
*impact-analysis {change}   → Analyze change impact
```

---

## 🎯 SM Agent (@sm) — Scrum Master

**Invoke:** `@sm`

### Commands
```
*plan-sprint                → Plan sprint
*assign-story               → Assign story to dev
*track-progress             → Track sprint metrics
```

---

## 📊 QA Agent (@qa)

**Invoke:** `@qa`

### Commands
```
*review story-1.8           → Review story for quality
*test                       → Run test suite
*coverage                   → Check test coverage
```

---

## 🔬 Analyst Agent (@analyst)

**Invoke:** `@analyst`

### Commands
```
*market-research            → Research market trends
*competitive-analysis       → Analyze competitors
*roi-calculate              → Calculate ROI metrics
*brainstorm {topic}         → Facilitated brainstorm
```

---

## 💾 Data Engineer Agent (@data-engineer)

**Invoke:** `@data-engineer`

### Commands
```
*design-schema {entity}     → Design database schema
*create-migration {name}    → Create migration
*optimize-query             → Optimize slow query
*audit-rls                  → Audit RLS policies
```

---

## 🎨 UX Design Agent (@ux-design)

**Invoke:** `@ux-design`

### Commands
```
*create-wireframe           → Create mockup
*design-system              → Design system review
*accessibility-audit        → Audit for a11y
```

---

## ⚡ Common Workflows

### Workflow 1: Implement a Story
```bash
@dev
*develop story-1.8
# (interactive mode with prompts)
# → implement task → test → mark complete → repeat
```

### Workflow 2: Run Tests & QA
```bash
@dev
*run-tests
# Check output → fix failures

@qa
*review story-1.8
# Get feedback → fix issues

@dev
*apply-qa-fixes
```

### Workflow 3: Push to Remote
```bash
@devops
*push
# Only @devops can push
```

### Workflow 4: Create New Story
```bash
@po
*create-story
# Answer prompts → generates story file
```

### Workflow 5: Plan Architecture
```bash
@architect
*design consultancy-diagnosis
# Review approach → impact analysis
```

---

## 🚨 Critical Rules

### ✅ Dev Agent Can:
- Write/modify code
- Commit locally (`git add`, `git commit`)
- Run tests
- Create local branches
- Fix bugs

### ❌ Dev Agent Cannot:
- **Push to remote** (use @devops)
- Create PRs (use @devops)
- Merge PRs (use @devops)
- Deploy (use @devops)

### ✅ DevOps Agent Can:
- **Push to remote**
- **Create PRs**
- **Merge PRs**
- Deploy
- Manage CI/CD
- Handle secrets/env vars

### ❌ DevOps Agent Cannot:
- Write code (use @dev)
- Create stories (use @po)
- Design architecture (use @architect)
- Run tests directly (inform @dev)

### ✅ PO Agent Can:
- Create stories/epics
- Manage backlog
- Write acceptance criteria
- Validate requirements

### ❌ PO Agent Cannot:
- Implement code (use @dev)
- Push changes (use @devops)

---

## 📞 Command Prefix Reference

| Symbol | Meaning | Example |
|--------|---------|---------|
| `@agent-name` | Invoke agent | `@dev`, `@qa`, `@po` |
| `*command` | Agent command | `*develop`, `*review` |
| `{param}` | Parameter (required) | `*develop {story-id}` |
| `[param]` | Parameter (optional) | `*build-status [--all]` |

---

## 🔗 Cross-References

| File | Purpose |
|------|---------|
| **AIOS_COMMANDS.md** | Comprehensive reference (all commands) |
| **QUICK_COMMANDS.txt** | Visual quick card (print-friendly) |
| **commands-index.json** | Machine-readable index |
| **AGENTS_GUIDE.md** | This file (agent selection & workflows) |

---

## 💡 Pro Tips

1. **Always start with `@dev` for coding work:**
   ```bash
   @dev
   *develop story-1.8
   ```

2. **Use `*run-tests` before pushing:**
   ```bash
   @dev
   *run-tests
   ```

3. **Only @devops pushes:**
   ```bash
   @devops
   *push
   ```

4. **Create stories via @po:**
   ```bash
   @po
   *create-story
   ```

5. **Let @qa review after implementation:**
   ```bash
   @qa
   *review story-1.8
   ```

6. **Check help anytime:**
   ```bash
   *help          # Show current agent's commands
   *exit          # Exit agent mode
   ```

---

## 📝 Session Management

**Start an agent session:**
```
@dev
```

**List all available commands:**
```
*help
```

**Exit agent session:**
```
*exit
```

**Switch agents:**
```
*exit              # Exit current agent
@other-agent       # Invoke new agent
```

---

**Last Updated:** 2026-02-19 | **AIOS v3.0**
