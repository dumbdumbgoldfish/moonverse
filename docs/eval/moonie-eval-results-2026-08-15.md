# Moonie technical evaluation results

Generated: 2026-08-15T22:51:12.605Z

## Aggregate metrics

| Metric | Value |
| --- | --- |
| Scenarios run | 15 |
| Off-topic accuracy | 1 |
| Mean relevance (in-domain) | 0.637 |
| Mean unsupported-title rate | 0 |
| Mean consistency | 1 |
| Diversity (unique/total IDs) | 0.867 |
| Top-1 concentration | 0.167 |
| Mean overlap vs genre baseline | 0.05 |

## Per-scenario results

| ID | Category | Off-topic OK | #Recs | Relevance | Unsupported | Consistency | Baseline overlap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | clear | yes | 5 | 0.6 | 0 | 1 | 0 |
| S02 | clear | yes | 5 | 1 | 0 | 1 | 0 |
| S03 | clear | yes | 5 | 1 | 0 | 1 | 0.4 |
| S04 | multi | yes | 5 | 0.567 | 0 | 1 | 0 |
| S05 | multi | yes | 5 | 0.76 | 0 | 1 | 0 |
| S06 | multi | yes | 5 | 0.5 | 0 | 1 | 0 |
| S07 | vague | yes | 5 | 0 | 0 | 1 | 0 |
| S08 | vague | yes | 5 | 1 | 0 | 1 | 0 |
| S09 | clear | yes | 5 | 0.7 | 0 | 1 | 0 |
| S10 | clear | yes | 5 | 0.82 | 0 | 1 | 0.2 |
| S11 | off_topic | yes | 0 | 0 | 0 | 1 | 0 |
| S12 | off_topic | yes | 0 | 0 | 0 | 1 | 0 |
| S13 | off_topic | yes | 0 | 0 | 0 | 1 | 0 |
| S14 | clear | yes | 5 | 0.5 | 0 | 1 | 0 |
| S15 | multi | yes | 5 | 0.2 | 0 | 1 | 0 |

## Notes for the Final Project Report

- Metrics measure **technical effectiveness** of database-grounded Moonie, not participant satisfaction.
- Unsupported-title rate should be **0** when allowlisting is applied against the live catalogue.
- Baseline overlap compares Moonie IDs with a simple genre keyword query (not collaborative filtering).
- Off-topic scenarios test domain guardrails (`looksOffTopic`).
