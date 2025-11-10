# 🧭 Pull Request Evaluation Rubric

**Project Stack:** TypeScript · React · Vite · Vitest · TailwindCSS · ESLint
**Purpose:** Assess the technical, architectural, and intellectual rigor of a pull request.

---

## 1. Understanding and Research (20%)

- [ ] **Contextual Awareness:** Demonstrates clear understanding of how the change fits into the overall architecture and existing codebase.
- [ ] **Research & Inquiry:** Evidence of thoughtful research, asking questions, testing alternatives, or referencing docs/discussions.

### Notes

## 2. Code Quality & Architecture (25%)

- [ ] **Readability & Self-Documentation:** Code explains itself via naming, structure, and typing. Comments explain *why*, not *what*.
- [ ] **Modularity & DRYness:** Code is lean, cohesive, reusable, and free of unnecessary duplication.
- [ ] **TypeScript Rigor:** Uses expressive, precise types. Avoids `any`, leverages unions/generics/utilities appropriately.
- [ ] **Appropriate Abstractions:** Right level of abstraction — neither over-engineered nor ad hoc.

### Notes

---

## 3. Use of Tools and Frameworks (15%)

- [ ] **React Practices:** Components are idiomatic, composable, and efficient with hooks/state management.
- [ ] **TailwindCSS Usage:** Utility classes are concise, consistent, and semantically grouped; minimal custom CSS.
- [ ] **Vite & Vitest Integration:** Build and test setup reflects good understanding of the environment. Tests are fast, isolated, and meaningful.

### Notes

---

## 4. Debuggability & Robustness (15%)

- [ ] **Invariant Usage:** Proper use of `invariant` for guarding assumptions; clear and contextual error messages.
- [ ] **Logging & Diagnostics:** Logging is structured, actionable, and minimal — helps trace complex flows.
- [ ] **Error Handling:** Edge cases handled gracefully; no unhandled rejections or swallowed errors.

### Notes

---

## 5. Code Hygiene & Process Discipline (15%)

- [ ] **Linting & Formatting:** Passes all ESLint rules and formatting checks.
- [ ] **Build & Test Status:** Code compiles and all Vitest suites pass; new code is covered by tests.
- [ ] **Commit Quality:** Commits are atomic, descriptive, and reference related issues or discussions.

### Notes

---

## 6. Overall Technical Judgment (10%)

- [ ] **Tool-Choice Appropriateness:** Uses the right libraries/utilities for the job; avoids reimplementation or misuse.
- [ ] **Scalability & Maintainability:** Improves or maintains system clarity and long-term maintainability.

### Notes

---

## ✍️ Evaluator Notes

- What questions did the contributor ask before implementing?  
- How does this change improve the long-term health of the codebase?  
- What tradeoffs were made, and are they documented or justified?  



