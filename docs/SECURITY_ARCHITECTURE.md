# Arquitectura de seguretat

## Model d'amenaça

Dades sensibles: identitat, ubicació, fotografies, plànols, pressupostos i
documents. Límits de confiança: navegador/dispositiu, API, Supabase, storage i
proveïdors d'IA. Amenaces principals: IDOR, escalada entre organitzacions, XSS,
CSRF, SSRF, uploads maliciosos, filtració de secrets i prompt injection.

## Controls

RLS i autorització servidor per recurs; cookies Secure/HttpOnly/SameSite en
producció; CSP, HSTS a la plataforma, validació Zod, errors segurs, rate limit
abans d'activar endpoints sensibles, buckets privats i signed URLs. Els fitxers
requereixen límits, detecció MIME, quarantena i eliminació EXIF.

Les claus `service_role`, IA i Sentry auth són exclusivament server-side. Logs
estructurats no inclouen tokens ni dades personals. Dependències, secrets i
migracions es revisen a CI. Backups, retenció i resposta a incidents es
configuren abans de producció.
