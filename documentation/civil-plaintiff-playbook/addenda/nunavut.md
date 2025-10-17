# Nunavut Civil Plaintiff Addendum / Addenda pour le Nunavut

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 12 months after issuance (Nunavut Court of Justice Rules r. 30). | Signifier la « Statement of Claim » dans les 12 mois suivant l'émission (Nunavut Court of Justice Rules r. 30). |
| General limitation period is 2 years from discovery (Limitation of Actions Act, RSNWT (Nu) 1988 c. L-8 s. 2). | Délai de prescription général de 2 ans à compter de la découverte (Limitation of Actions Act, RSNWT (Nu) 1988 c. L-8 art. 2). |
| Serve Affidavit of Documents within 30 days after close of pleadings (r. 223 incorporated). | Signifier l'affidavit de documents dans les 30 jours suivant la clôture des actes (r. 223 incorporée). |
| File Certificate of Readiness before requesting trial scheduling (Practice Direction). | Déposer le certificat de préparation avant de demander la fixation du procès (directive de pratique). |

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
| "The Plaintiff claims damages arising from breach of the Inuit Impact and Benefit Agreement provisions." | « La demanderesse réclame des dommages découlant de la violation des dispositions de l'Accord sur les répercussions et les avantages pour les Inuits. » |
| Motion clause referencing Rule 27 for urgent interim relief. | Clause de requête fondée sur la règle 27 pour mesures intérimaires urgentes. |
| Pleading referencing equitable relief pursuant to the Judicature Act (Nu). | Plaidoirie sollicitant une réparation en equity en vertu du Judicature Act (Nunavut). |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('nu_service_limit', issuanceDate.plusMonths(12))` for service tracking. | `timeline.autoSchedule('nu_service_limit', issuanceDate.plusMonths(12))` pour suivre la signification. |
| Discovery automation `tasks.spawn('NU_DISCLOSURE', pleadingsCloseDate.plusDays(30))`. | Automatisation de la communication `tasks.spawn('NU_DISCLOSURE', pleadingsCloseDate.plusDays(30))`. |
| Trial readiness workflow `workflows.launch('NU_CERT_READY', discoveryCompleteDate.plusDays(21))`. | Flux de préparation `workflows.launch('NU_CERT_READY', discoveryCompleteDate.plusDays(21))`. |
| Motion generator `documents.merge('NU_FORM37', motionDate.minusDays(7))` for bilingual packages. | Générateur de requêtes `documents.merge('NU_FORM37', motionDate.minusDays(7))` pour des dossiers bilingues. |
