# Diagrammes PlantUML du projet CRM

Ces fichiers documentent l'implementation actuelle du CRM a partir du code analyse.

- `01_use_case_diagram.puml` : cas d'utilisation exposes par le frontend et l'API.
- `02_mcd_merise.puml` : modele conceptuel de donnees Merise base sur `schema.sql`.
- `03_sequence_create_order.puml` : sequence de creation d'une commande.
- `04_sequence_invoice_payment.puml` : sequence de creation de facture et de paiement.
- `05_activity_sales_workflow.puml` : workflow commercial implemente.
- `06_class_diagram.puml` : classes/metiers issues des tables et relations.
- `07_component_diagram.puml` : composants React, API Express et acces MySQL.
- `08_deployment_diagram.puml` : vue de deploiement navigateur, frontend, API et MySQL.
- `09_package_diagram.puml` : organisation des packages client et serveur.
- `10_physical_data_model.puml` : modele physique avec tables, colonnes, cles et relations.
- `11_gantt_diagram.puml` : planning Gantt realiste des phases de developpement du CRM sur environ 12 semaines.

Remarques :

- Les libelles sont en francais.
- Les tables `activities` et `settings` sont presentes dans le schema SQL, mais aucun CRUD applicatif n'a ete trouve pour elles.
- Les modules `contacts` et `inventory` sont exposes par le backend, mais aucune page frontend dediee n'a ete trouvee.
