# Moonie technical evaluation results

Generated: 2026-08-17T22:49:27.966Z

## Aggregate metrics

| Metric | Value |
| --- | --- |
| Scenarios run | 17 |
| Off-topic accuracy | 1 |
| Mean top-5 relevance (Moonie) | 0.651 |
| Mean unsupported-title rate | 0 |
| Mean consistency | 1 |
| Mean explanation grounding | 0.7 |
| Diversity (unique/total IDs) | 0.877 |
| Top-1 concentration | 0.154 |
| Mean overlap vs keyword/facet search | 0 |
| Mean Moonie latency (ms) | 121.214 |
| Mean search baseline latency (ms) | 37.714 |
| Mean relevance with embeddings off | 0.65 |
| OpenAI enabled | false |

## Per-scenario results

| ID | Category | Off-topic OK | #Recs | Relevance | Unsupported | Grounding | Latency ms | Baseline overlap |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| S01 | clear | yes | 5 | 0.6 | 0 | 1 | 146 | 0 |
| S02 | clear | yes | 5 | 1 | 0 | 1 | 122 | 0 |
| S03 | clear | yes | 5 | 1 | 0 | 1 | 120 | 0 |
| S04 | multi | yes | 5 | 0.54 | 0 | 1 | 127 | 0 |
| S05 | multi | yes | 5 | 0.68 | 0 | 0.8 | 129 | 0 |
| S06 | multi | yes | 5 | 0.5 | 0 | 1 | 110 | 0 |
| S07 | vague | yes | 5 | 0 | 0 | 0 | 120 | 0 |
| S08 | vague | yes | 5 | 1 | 0 | 0 | 127 | 0 |
| S09 | clear | yes | 5 | 0.6 | 0 | 1 | 127 | 0 |
| S10 | clear | yes | 5 | 0.7 | 0 | 1 | 130 | 0 |
| S11 | off_topic | yes | 0 | 0 | 0 | 1 | 0 | 0 |
| S12 | off_topic | yes | 0 | 0 | 0 | 1 | 0 | 0 |
| S13 | off_topic | yes | 0 | 0 | 0 | 1 | 0 | 0 |
| S14 | clear | yes | 5 | 0.5 | 0 | 1 | 122 | 0 |
| S15 | multi | yes | 0 | 0 | 0 | 1 | 44 | 0 |
| S16 | injection | yes | 5 | 1 | 0 | 0 | 142 | 0 |
| S17 | fabricated | yes | 5 | 1 | 0 | 0 | 131 | 0 |

## Notes for the Final Project Report

- Metrics measure **technical effectiveness** of database-grounded Moonie, not participant satisfaction or SUS.
- Unsupported-title rate should be **0** when allowlisting is applied against the live catalogue.
- The baseline is the same keyword/facet **works** search users get (`runSearch`), not a private genre SQL query.
- Ablation compares ranking with embeddings disabled versus the default hybrid ranker.
- Injection and fabricated-title scenarios must still return only catalogue IDs.
