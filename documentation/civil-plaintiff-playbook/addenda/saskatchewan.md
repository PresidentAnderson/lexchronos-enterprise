# Saskatchewan Civil Plaintiff Addendum / Addenda pour la Saskatchewan

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 6 months of issuance (Queen's Bench Rules r. 3-5). | Signifier la « Statement of Claim » dans les 6 mois suivant la délivrance (Queen's Bench Rules r. 3-5). |
| General limitation period is 2 years from discovery (Limitations Act, SS 2004 c. L-16.1 s. 6). | Délai de prescription général de 2 ans à compter de la découverte (Limitations Act, SS 2004 c. L-16.1 art. 6). |
| Serve Affidavit of Documents within 3 months after close of pleadings (r. 5-17). | Signifier l'affidavit de documents dans les 3 mois suivant la clôture des actes (r. 5-17). |
| File the Trial Scheduling Request within 30 days after discovery completes (Practice Directive). | Déposer la demande de fixation du procès dans les 30 jours suivant la fin de la communication (directive de pratique). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 3-1 – Statement of Claim. | Formulaire 3-1 – « Statement of Claim ». |
| Form 5-2 – Affidavit of Documents. | Formulaire 5-2 – Affidavit de documents. |
| Form 4-8 – Notice of Application. | Formulaire 4-8 – Avis de requête. |
| Form 8-5 – Certificate of Readiness. | Formulaire 8-5 – Certificat de préparation. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages for breach of The Consumer Protection and Business Practices Act, SS 2013 c. C-30.2." | « La demanderesse réclame des dommages pour violation de The Consumer Protection and Business Practices Act, SS 2013 c. C-30.2. » |
| Application clause referencing Rule 7-5 for summary judgment. | Clause de requête citant la règle 7-5 pour jugement sommaire. |
| Pleading referencing punitive damages under art. 31 of The Judicature Act. | Plaidoirie demandant des dommages-intérêts punitifs conformément à l'art. 31 de The Judicature Act. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('sk_service_limit', issuanceDate.plusMonths(6))` to monitor service. | `timeline.autoSchedule('sk_service_limit', issuanceDate.plusMonths(6))` pour surveiller la signification. |
| Discovery workflow `tasks.spawn('SK_AFFIDAVIT_DOCS', pleadingsCloseDate.plusMonths(3))`. | Flux de communication `tasks.spawn('SK_AFFIDAVIT_DOCS', pleadingsCloseDate.plusMonths(3))`. |
| Trial readiness automation `workflows.launch('SK_CERT_READY', discoveryCompleteDate.plusDays(30))`. | Automatisation de la préparation `workflows.launch('SK_CERT_READY', discoveryCompleteDate.plusDays(30))`. |
| Application generator `documents.merge('SK_FORM4-8', motionDate.minusDays(7))`. | Générateur de requêtes `documents.merge('SK_FORM4-8', motionDate.minusDays(7))`. |
