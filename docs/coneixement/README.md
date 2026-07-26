# Obrametrik — Biblioteca de coneixement tècnic

**Estat:** estructura inicial  
**Àmbit inicial:** habitatges i reformes a Espanya  
**Data de revisió:** 26 de juliol de 2026

## Finalitat

Aquesta biblioteca concentra el context tècnic que necessiten el producte, els
desenvolupadors, els revisors d'ofici i el futur motor de regles d'Obrametrik.

Ha de permetre respondre ràpidament:

- Quines dades cal preguntar abans de calcular.
- Quins components formen una instal·lació.
- Quines fórmules produeixen l'amidament i l'escandall.
- Quines restriccions són normatives.
- Quines decisions requereixen un professional competent.
- Quina font i versió justifiquen cada regla.

No és una còpia de la normativa ni un manual d'execució d'obra. És una capa de
coneixement estructurat, traçable i preparada per convertir-se en regles
deterministes.

## Documents

| Àrea | Document | Estat |
| --- | --- | --- |
| Model comú | [MODEL_REGLA_TECNICA.md](MODEL_REGLA_TECNICA.md) | Inicial |
| Electricitat | [ELECTRICITAT_HABITATGES.md](ELECTRICITAT_HABITATGES.md) | Base inicial |
| Fontaneria i sanejament | [FONTANERIA_SANEJAMENT.md](FONTANERIA_SANEJAMENT.md) | Base inicial |
| Paleteria | [PALETERIA_SISTEMES_CONSTRUCTIUS.md](PALETERIA_SISTEMES_CONSTRUCTIUS.md) | Base funcional |
| Impermeabilització | [IMPERMEABILITZACIO_ZONES_HUMIDES.md](IMPERMEABILITZACIO_ZONES_HUMIDES.md) | Base inicial |
| Demolicions i residus | [DEMOLICIONS_I_RESIDUS.md](DEMOLICIONS_I_RESIDUS.md) | Base inicial |
| Revestiments i paviments | [REVESTIMENTS_I_PAVIMENTS.md](REVESTIMENTS_I_PAVIMENTS.md) | Base inicial |
| Ventilació | [VENTILACIO_I_QUALITAT_AIRE.md](VENTILACIO_I_QUALITAT_AIRE.md) | Base inicial |
| Climatització | [CLIMATITZACIO_I_CALEFACCIO.md](CLIMATITZACIO_I_CALEFACCIO.md) | Base inicial |
| Il·luminació | [ILLUMINACIO_I_CONTROL.md](ILLUMINACIO_I_CONTROL.md) | Base inicial |
| Pintura i acabats continus | [PINTURA_I_ACABATS_CONTINUS.md](PINTURA_I_ACABATS_CONTINUS.md) | Base inicial |
| Proves i posada en servei | [PROVES_I_POSADA_EN_SERVEI.md](PROVES_I_POSADA_EN_SERVEI.md) | Base inicial |
| Tancaments i fusteria | [TANCAMENTS_FUSTERIA_VIDRE.md](TANCAMENTS_FUSTERIA_VIDRE.md) | Base inicial |
| Coordinació | [MAPA_OFICIS_I_DEPENDENCIES.md](MAPA_OFICIS_I_DEPENDENCIES.md) | Inicial |

Documents futurs:

- Telecomunicacions i domòtica.
- Accessibilitat.
- Protecció contra incendis.
- Gestió de residus.

## Separació obligatòria del coneixement

Cada afirmació es classifica com:

1. **Normativa:** obligació vinculada a jurisdicció, font, apartat i vigència.
2. **Càlcul:** fórmula determinista amb entrades, sortides i arrodoniment.
3. **Compatibilitat:** relació entre productes, sistemes o condicions.
4. **Bona pràctica:** criteri professional que no es presenta com a llei.
5. **Valor per defecte:** ajuda editable, mai una dada confirmada.
6. **Pregunta:** informació que falta abans de calcular o validar.

Una frase com “la llum porta cable d'1,5 mm²” és insuficient. La regla útil
indica circuit, ús, protecció, límits, caiguda de tensió, sistema
d'instal·lació, font i excepcions.

## Governança

Cada document i regla necessita:

- Responsable de contingut.
- Professional revisor de l'ofici.
- Fonts primàries.
- Data de verificació.
- Jurisdicció.
- Versió.
- Casos de prova.
- Estat: esborrany, revisada, publicada o retirada.

Cap contingut es converteix en error bloquejant del producte sense revisió
tècnica i tests.

## Flux de manteniment

```text
font oficial o tècnica
→ resum intern
→ regla estructurada
→ revisió professional
→ casos de prova
→ publicació versionada
→ seguiment de vigència
```

Els enllaços són una ajuda de navegació. El motor ha de conservar també
l'identificador de la disposició i l'apartat, perquè una URL pot canviar.

## Regles de redacció

- Unitat SI i símbol correctes: `mm`, `mm²`, `A`, `V`, `W`, `m²`.
- Cap regla depèn només de text lliure.
- No barrejar mínims normatius amb recomanacions.
- No ometre condicions o notes d'una taula.
- No inferir dades ocultes de fotografies.
- Una dada desconeguda continua sent desconeguda.
- Tot resultat material mostra fórmula, marge i arrodoniment.
- Les normes UNE de pagament es referencien, però no se'n reprodueix el text.

## Fonts oficials inicials

- BOE — Reglament electrotècnic per a baixa tensió i ITC:
  `BOE-A-2002-18099`.
- Codi Tècnic de l'Edificació — DB-HS Salubritat.
- Codi Tècnic de l'Edificació — documents bàsics aplicables segons actuació.

La normativa autonòmica, municipal i les condicions de la distribuïdora o
subministradora s'han d'afegir al paquet de jurisdicció corresponent.
