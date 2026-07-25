# Architecture review

## Objectiu i ús

Revisar dependències, límits, cicles, ADR, sobreenginyeria i deute abans d'un
canvi estructural. No s'utilitza per correccions locals sense impacte.

## Entrades i procediment

Requisits, arbre, manifests, imports, ADR i tests. Mapeja responsabilitats,
comprova que dependències apunten al domini, detecta cicles/imports profunds i
compara alternatives.

## Comprovacions i resultat

Entrega troballes per severitat, evidència, risc, proposta i ADR necessari.
No recomanis abstraccions sense cas real ni moguis secrets a paquets compartits.
