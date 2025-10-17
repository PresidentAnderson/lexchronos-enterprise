# Alberta Civil Plaintiff Addendum / Addenda pour l'Alberta

## Critical Deadlines / Délais critiques
| English | Français |
| --- | --- |
| Serve the Statement of Claim within 1 year of filing (Rules of Court r. 3.27). | Signifier l'« Statement of Claim » dans l'année du dépôt (Rules of Court r. 3.27). |
| Standard limitation period is 2 years from discovery of the claim (Limitations Act, s. 3). | Le délai de prescription standard est de 2 ans à compter de la découverte de la réclamation (Limitations Act, art. 3). |
| File an Affidavit of Records within 3 months after the Statement of Defence is filed (r. 5.5). | Déposer l'affidavit des dossiers dans les 3 mois suivant le dépôt de la défense (r. 5.5). |
| Schedule a pre-trial conference once the matter is set for trial; must occur at least 90 days before trial (r. 8.4). | Planifier la conférence préparatoire au moins 90 jours avant le procès après la fixation (r. 8.4). |

## Required Forms / Formulaires obligatoires
| English | Français |
| --- | --- |
| Form 10 – Statement of Claim (General) with bilingual caption. | Formulaire 10 – « Statement of Claim (General) » avec en-tête bilingue. |
| Form 26 – Affidavit of Records (Schedule 5). | Formulaire 26 – « Affidavit of Records » (annexe 5). |
| Form 38 – Certificate of Readiness for Trial. | Formulaire 38 – Certificat de préparation au procès. |
| Form 49 – Notice to Attend for Questioning (if compelling testimony). | Formulaire 49 – Avis de comparution pour interrogatoire. |

## Sample Pleadings / Modèles d'actes de procédure
| English | Français |
| --- | --- |
| "The Plaintiff claims damages in the sum of CAD 200,000 for breach of contract pursuant to the Sale of Goods Act, RSA 2000." | « La demanderesse réclame 200 000 $ en dommages-intérêts pour violation de contrat en vertu du Sale of Goods Act, RSA 2000. » |
| Application clause: "The Plaintiff applies for an Order extending the time for service under r. 3.26." | Clause de demande : « La demanderesse sollicite une ordonnance prorogeant le délai de signification en vertu de la règle 3.26. » |
| Undertaking confirmation referencing Part 5 discovery obligations. | Confirmation d'engagement mentionnant les obligations de communication de la Partie 5. |

## LexChrono Hooks / Intégrations LexChrono
| English | Français |
| --- | --- |
| `timeline.autoSchedule('ab_service_deadline', filingDate.plusYears(1))` to monitor r. 3.27 service. | `timeline.autoSchedule('ab_service_deadline', filingDate.plusYears(1))` pour surveiller la signification selon r. 3.27. |
| Auto-generate Affidavit of Records checklist via `tasks.spawn('AB_DISCOVERY_R5', defenceDate.plusMonths(3))`. | Générer automatiquement la liste de contrôle de l'affidavit via `tasks.spawn('AB_DISCOVERY_R5', defenceDate.plusMonths(3))`. |
| Link trial readiness workflow: `workflows.launch('AB_TRIAL_READY', trialSetDate.minusDays(120))`. | Lier le flux de préparation au procès : `workflows.launch('AB_TRIAL_READY', trialSetDate.minusDays(120))`. |
| Map questioning notices to docket automation with `dockets.mapTo('AB-FORM49', eventId)`. | Associer les avis d'interrogatoire à l'automatisation du greffe avec `dockets.mapTo('AB-FORM49', eventId)`. |
