# ScoutzOS Nightly Update Template
## Copy/Paste This Into Claude Every Night

---

**Date:** [YYYY-MM-DD]  
**Day of Phase:** [X of Y]  
**Phase:** [Phase 0 / 0.5 / 1 / 2 / 3 / 4]  
**Module(s) Worked On:** [List modules]

---

## 1. TODAY'S OUTPUT (CONCRETE, VERIFIABLE, BINARY)

*List EXACT things produced today â€” code, schema, screens, endpoints, prompts, docs.*

- [ ] 
- [ ] 
- [ ] 

---

## 2. TODAY'S CONTEXT (WHAT YOU DID, WHAT YOU DISCOVERED)

*Short, factual. No over-explanations.*



---

## 3. DECISIONS THAT SHOULD BE REMEMBERED (SYSTEM LEVEL)

*Anything that should persist across future chats.*

**Architecture:**


**Schema:**


**Naming conventions:**


**Component structure:**


**Security / RLS:**


**Workflow logic:**


---

## 4. QUESTIONS FOR THE MODEL (MAX 3â€”FOR FOCUS)

1. 
2. 
3. 

---

## 5. BLOCKERS (CLEARLY STATED, WITH WHAT YOU NEED NEXT)

*What stopped progress + what the model should help with next.*

**High:**


**Medium:**


**Low:**


---

## 6. TOMORROW'S MICRO-GOALS (2â€“5 ITEMS ONLY, BINARY)

*"Done or not done" tasks, each 2â€“4 hours max.*

- [ ] 
- [ ] 
- [ ] 
- [ ] 
- [ ] 

---

## 7. CROSS-MODULE IMPACT (DEAL ENGINE, PMS, CRM, LEDGER, SECURITY)

*Anything today that touches another module.*



---

## 8. ARCHITECTURE INTEGRITY CHECK (YES / NO + SHORT NOTE)

| Check | Status | Notes |
|-------|--------|-------|
| Schema still valid? | Yes / No | |
| API patterns consistent? | Yes / No | |
| Security model unchanged? | Yes / No | |
| Frontend-component plan intact? | Yes / No | |
| Any creep or drift? | Yes / No | |

---

## 9. KNOWLEDGE TO CARRY FORWARD (WHAT TOMORROW'S AI MUST REMEMBER)

*This is the single most important section. Summarize what Claude must treat as "truth" for the next day.*



---

## 10. SNAPSHOT EXPORT (OPTIONAL â€“ IF YOU NEED A CONTINUITY SAVE)

*Paste any raw output the model will need tomorrow: JSON, schema snippet, code block, draft prompts, etc.*

```

```

---

## COMPACT VERSION (For Quick Updates)

```
Today: 
Learned: 
Decisions: 
Blockers: 
Tomorrow: 
Dependencies: 
Architecture Check: âœ“ Schema | âœ“ API | âœ“ Security | âœ“ Components | âœ“ No drift
```

---

## HOW TO USE THIS TEMPLATE

### Every Night:
1. Fill out this template
2. Append to `nightly_update_log.md`
3. Update Section D of `SCOUTZOS_MASTER_PROJECT_STATE.md`
4. Export any WIP code/prompts to relevant bank files

### Every Morning:
1. Upload `SCOUTZOS_MASTER_PROJECT_STATE.md` to Claude
2. Say: "Load this file as the project state. Continue from the most recent nightly update."
3. Reference yesterday's update if needed

### Weekly (Sunday):
1. Perform architecture integrity audit
2. Summarize structural changes in Sections A-C (if any)
3. Update task playbook
4. Zero out Active Work Surface (Section F)
