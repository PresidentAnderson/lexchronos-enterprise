# Yukon Civil Plaintiff Addendum / Addenda pour le Yukon

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 12 months after filing (Rules of Court of the Supreme Court of Yukon r. 25). | Signifier la « Statement of Claim » dans les 12 mois suivant le dépôt (Rules of Court of the Supreme Court of Yukon r. 25). |
| General limitation period is 2 years from discovery (Limitations Act, RSY 2002 c. 139 s. 4). | Délai de prescription général de 2 ans à compter de la découverte (Limitations Act, RSY 2002 c. 139 art. 4). |
| Serve Affidavit of Documents within 35 days after close of pleadings (r. 223). | Signifier l'affidavit de documents dans les 35 jours suivant la clôture des actes (r. 223). |
| File Certificate of Readiness before applying for trial date (r. 390). | Déposer le certificat de préparation avant de demander la date de procès (r. 390). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 14 – Statement of Claim. | Formulaire 14 – « Statement of Claim ». |
| Form 65 – Affidavit of Documents. | Formulaire 65 – Affidavit de documents. |
| Form 37 – Notice of Motion. | Formulaire 37 – Avis de motion. |
| Form 124 – Certificate of Readiness. | Formulaire 124 – Certificat de préparation. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages pursuant to the Business Corporations Act, RSY 2002 c. 20." | « La demanderesse réclame des dommages en vertu du Business Corporations Act, RSY 2002 c. 20. » |
| Motion clause referencing Rule 43 for summary trial. | Clause de requête fondée sur la règle 43 pour procès sommaire. |
| Pleading referencing prejudgment interest under Judicature Act, RSY 2002 c. 128. | Plaidoirie mentionnant les intérêts avant jugement selon le Judicature Act, RSY 2002 c. 128. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('yt_service_limit', filingDate.plusMonths(12))` to monitor service window. | `timeline.autoSchedule('yt_service_limit', filingDate.plusMonths(12))` pour surveiller la fenêtre de signification. |
| Discovery automation `tasks.spawn('YT_DISCLOSURE', pleadingsCloseDate.plusDays(35))`. | Automatisation de la communication `tasks.spawn('YT_DISCLOSURE', pleadingsCloseDate.plusDays(35))`. |
| Trial readiness workflow `workflows.launch('YT_CERT_READY', discoveryCompleteDate.plusDays(21))`. | Flux de préparation `workflows.launch('YT_CERT_READY', discoveryCompleteDate.plusDays(21))`. |
| Motion assembly `documents.merge('YT_FORM37', motionDate.minusDays(7))`. | Assemblage des motions `documents.merge('YT_FORM37', motionDate.minusDays(7))`. |
