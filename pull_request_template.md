# 🧭 Pull Request Evaluation Rubric

**Project Stack:** TypeScript · React · Vite · Vitest · TailwindCSS · ESLint
**Purpose:** Assess the technical, architectural, and intellectual rigor of a pull request.

---

## 1. Understanding and Research (20%)

| Criteria | ✓ / ✗ | Notes |
|-----------|--------|-------|
| **Contextual Awareness:** Demonstrates clear understanding of how the change fits into the overall architecture and existing codebase. |  |  |
| **Research & Inquiry:** Evidence of thoughtful research, asking questions, testing alternatives, or referencing docs/discussions. |  |  |

---

## 2. Code Quality & Architecture (25%)

| Criteria | ✓ / ✗ | Notes |
|-----------|--------|-------|
| **Readability & Self-Documentation:** Code explains itself via naming, structure, and typing. Comments explain *why*, not *what*. |  |  |
| **Modularity & DRYness:** Code is lean, cohesive, reusable, and free of unnecessary duplication. |  |  |
| **TypeScript Rigor:** Uses expressive, precise types. Avoids `any`, leverages unions/generics/utilities appropriately. |  |  |
| **Appropriate Abstractions:** Right level of abstraction — neither over-engineered nor ad hoc. |  |  |

---

## 3. Use of Tools and Frameworks (15%)

| Criteria | ✓ / ✗ | Notes |
|-----------|--------|-------|
| **React Practices:** Components are idiomatic, composable, and efficient with hooks/state management. |  |  |
| **TailwindCSS Usage:** Utility classes are concise, consistent, and semantically grouped; minimal custom CSS. |  |  |
| **Vite & Vitest Integration:** Build and test setup reflects good understanding of the environment. Tests are fast, isolated, and meaningful. |  |  |

---

## 4. Debuggability & Robustness (15%)

| Criteria | ✓ / ✗ | Notes |
|-----------|--------|-------|
| **Invariant Usage:** Proper use of `invariant` for guarding assumptions; clear and contextual error messages. |  |  |
| **Logging & Diagnostics:** Logging is structured, actionable, and minimal — helps trace complex flows. |  |  |
| **Error Handling:** Edge cases handled gracefully; no unhandled rejections or swallowed errors. |  |  |

---

## 5. Code Hygiene & Process Discipline (15%)

| Criteria | ✓ / ✗ | Notes |
|-----------|--------|-------|
| **Linting & Formatting:** Passes all ESLint rules and formatting checks. |  |  |
| **Build & Test Status:** Code compiles and all Vitest suites pass; new code is covered by tests. |  |  |
| **Commit Quality:** Commits are atomic, descriptive, and reference related issues or discussions. |  |  |

---

## 6. Overall Technical Judgment (10%)

| Criteria | ✓ / ✗ | Notes |
|-----------|--------|-------|
| **Tool-Choice Appropriateness:** Uses the right libraries/utilities for the job; avoids reimplementation or misuse. |  |  |
| **Scalability & Maintainability:** Improves or maintains system clarity and long-term maintainability. |  |  |

---

## ✅ Scoring Summary

| Category | Weight | Score |
|-----------|--------|-------|
| Understanding & Research | 20% |   |
| Code Quality & Architecture | 25% |   |
| Use of Tools & Frameworks | 15% |   |
| Debuggability & Robustness | 15% |   |
| Code Hygiene & Process | 15% |   |
| Technical Judgment | 10% |   |
| **Total** | **100%** |   |

---

## ✍️ Evaluator Notes

- What questions did the contributor ask before implementing?  
- How does this change improve the long-term health of the codebase?  
- What tradeoffs were made, and are they documented or justified?  

---

### 🧩 Suggested Usage
- Place this file as `.github/PULL_REQUEST_REVIEW_RUBRIC.md`, or  
- Embed key sections into your `pull_request_template.md` for quick scoring.

