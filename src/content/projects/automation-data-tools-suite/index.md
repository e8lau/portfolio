---
title: Automation & Data Tools Suite
categories:
  - Workflow Automation & Apps Script
  - Data Infrastructure & Integration
tags:
  - toolkit
  - alumni-engagement
  - automation
  - apps-script
  - google-sheets
  - deduplication
  - imputation
  - fuzzy-matching
  - process-design
description: >-
  To streamline alumni engagement operations for UC San Diego’s Alumni Department—and to empower future student workers
  who aren’t code-heavy—I built a reusable toolkit of Google Sheets workflows powered by Google Apps Script custom
  functions. The suite replaces brittle manual processes with auditable, spreadsheet-native utilities that scale across
  teams. 


  Key capabilities include:

  - Record hygiene & merge logic: DUPE_DETECTOR and IMPUTATION_UNIQUE flag adjacent duplicates and impute sparse rows.

  - Cross-sheet assembly: GET_SHEET and COLUMN_STACK fetch standardized ranges and stack named columns.

  - Flexible lookups: MULTI_SEARCH and HASH_MAP_LOOKUP enable many-to-many mapping beyond VLOOKUP/XLOOKUP.

  - Similarity & cleaning: CHAR_SIM, MOST_SIMILAR, and F_FILL provide fuzzy matching and forward-fill capabilities.

  - Analytics utilities: CUMLATIVE_SUM, PARTITION_GROUPS, and JOIN_UNIQUE extend Sheets for grouped aggregation and
  cohort balancing. 


  Together, these tools transformed data prep and reporting into one-cell formulas—cutting turnaround time and enabling
  non-technical staff to maintain automations without writing code.
status: shipped
visibility: public
started: '2023-06-01'
ended: '2025-03-01'
featured: false
draft: false
links:
  demo: https://docs.google.com/document/d/1p45FgE2DMICaZZH4Tg9ke-XjjPfVAAJSHYt1smdQm7Y/edit
role: Author & Workflow Engineer
collaborators:
  - name: UC San Diego Alumni Engagement Department
metrics:
  - key: Custom Functions Built
    value: 10+
  - key: Operational Impact
    value: Cut manual data-prep time by ≈70%
  - key: Adopted By
    value: Future student analysts & department staff
related:
  - '["esp-database-matching"]'
---

