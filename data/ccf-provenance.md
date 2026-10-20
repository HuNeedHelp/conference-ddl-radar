# CCF catalog provenance

Verified on 2026-10-20 against the official seventh edition, titled 中国计算机学会推荐国际学术会议和期刊目录（2026年）. Official announcement: https://www.ccf.org.cn/Academic_Evaluation/By_category/ . The announcement is dated 2026-03-31 and states that an erratum was corrected on 2026-04-09.

Official PDF: https://www.ccf.org.cn/ccf/contentcore/resource/download?ID=112CF3BF7E1140ACEB271ADAED12A67ADFABB8FF099E40C2759502A85C8A281F

Reference document: the 72-page official PDF linked above; it is not redistributed in this repository. SHA-256: `271b630b576bf8a4f802e767f5694caded93680e22b3a19bef7902591c45c1d3`. Keep this reference out of the website bundle. `sourcePage` is the one-based PDF page index, rather than an inferred printed page number.

## Included records

The catalog contains all 58 A-ranked conferences in the official seventh edition, plus two selected B-ranked conferences: ECCV and ICRA (PDF page 58). The B selection is intentionally limited to explicitly verified vision / robotics venues; it is not the complete B catalog.

| Area code | Official category | A conferences | PDF page |
| --- | --- | ---: | ---: |
| DS | 计算机体系结构/并行与分布计算/存储系统 | 11 | 5 |
| NW | 计算机网络 | 4 | 13 |
| SC | 网络与信息安全 | 6 | 20 |
| SE | 软件工程/系统软件/程序设计语言 | 10 | 27 |
| DB | 数据库/数据挖掘/内容检索 | 5 | 35 |
| CT | 计算机科学理论 | 5 | 41 |
| CG | 计算机图形学与多媒体 | 4 | 47 |
| AI | 人工智能 | 7 | 57 |
| HI | 人机交互与普适计算 | 4 | 64 |
| MX | 交叉/综合/新兴 | 2 | 70 |

Area codes are the application's mapping to the official Chinese categories. Tags are application labels based on the named subject of each conference; CCF does not publish these tags. Only CVPR, ICCV and ECCV receive `vision`; only ICRA receives `robotics`. Broad AI or ML conferences are not automatically included in those filters.

## Explicit exclusions / checks

- CVPR and ICCV: A, page 57.
- ECCV and ICRA: B, page 58.
- IROS and BMVC: C, page 59; not included as B.
- RSS, CoRL and WACV: neither their acronyms nor their full-name search terms (Robotics: Science, Robot Learning, Applications of Computer Vision) occur in the text of this 72-page official edition. They are not assigned an A/B rank in this application.
- The seventh-edition list has IJCAI in B (page 58); it is not included in the all-A list. HPDC is A (page 5) and ICLR is A (page 57).

## Joining deadline sources

CCF is the authority for the rank, not the deadline. Deadline aggregators may use different series names and older rank data. Never replace this verified catalog rank with the aggregator's rank.

Likely alias joins to review against actual source records: `SIGKDD` ↔ `KDD`; `ACM MM` ↔ `MM`; `IEEE VIS` ↔ `VIS`; `ACM SIGOPS ATC` ↔ `USENIX ATC` / `USENIXATC` / `ATC`; `S&P` ↔ `SP` / `S&P`; `USENIX Security` ↔ `Security` / `USENIX Security`. These aliases are join hints, not verified current aggregator identifiers.

Conference names were transcribed from the official PDF with line wrapping removed. Former names in parentheses are omitted from `name`; the ATC former name remains documented here. The local PDF preserves the full official table and its notes.
