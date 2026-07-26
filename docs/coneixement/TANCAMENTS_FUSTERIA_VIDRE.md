# Tancaments, fusteria i vidre — Base de coneixement inicial

**Jurisdicció inicial:** Espanya  
**Estat:** base inicial pendent de revisió multidisciplinària  
**Fonts inicials:** CTE DB-HE, DB-HS, DB-HR, DB-SUA i dades de fabricant  
**Verificat:** 26 de juliol de 2026

## 1. Abast

El terme “tancament” es divideix perquè no totes les regles són iguals:

- Façana opaca.
- Finestra, balconera, porta exterior i lluernari.
- Porta interior.
- Mampara de bany.
- Persiana, caixa i protecció solar.
- Premarc, marc, fulla, vidre, ferratges i segellats.
- Trobada amb façana, impermeabilització i acabats.

## 2. Model del buit i del conjunt

Cal separar:

- Buit d'obra.
- Premarc.
- Marc.
- Fulles.
- Envidrament o panell.
- Juntes.
- Tapajuntes.
- Ampit, llinda i brancals.
- Persiana o protecció solar.
- Espai d'operació i manteniment.

Una sola mida “amplada × alçada” no és suficient. El model registra:

```text
mida del buit
→ toleràncies i juntes
→ mida de premarc
→ mida exterior del conjunt
→ llum de pas o superfície de vidre
```

## 3. Propietats geomètriques

- Host: paret, coberta o partició.
- Posició i cota en `mm`.
- Amplada i alçada.
- Profunditat i pla de col·locació.
- Nombre de fulles.
- Tipus d'obertura.
- Sentit i mà.
- Angle màxim.
- Radi o volum d'escombratge.
- Llum de pas.
- Àrea de marc i d'envidrament.

El motor 3D detecta col·lisions entre fulles, mobiliari, sanitaris, radiadors i
altres elements.

## 4. Prestacions

Segons l'element i l'àmbit:

- Transmitància tèrmica del conjunt.
- Factor solar.
- Permeabilitat a l'aire.
- Estanquitat a l'aigua.
- Resistència al vent.
- Aïllament acústic.
- Seguretat davant impacte.
- Resistència o prestació al foc quan sigui aplicable.
- Accessibilitat, maniobra i pas.
- Durabilitat i manteniment.

Les prestacions declarades provenen del conjunt i del fabricant. No s'obtenen
sumant de manera improvisada “un bon vidre” i “un bon marc”.

## 5. Energia i envolupant

DB-HE tracta els buits com el comportament conjunt de vidre i marc i considera,
entre altres paràmetres, transmitància i permeabilitat a l'aire segons context
climàtic i actuació.

El motor necessita:

- Municipi o zona climàtica.
- Tipus i abast de la intervenció.
- Orientació.
- Dimensions.
- Prestacions declarades del conjunt.
- Proteccions solars.
- Relació amb la resta de l'envolupant.

No s'ha de codificar una transmitància límit única per a tota Espanya.

## 6. Humitat i trobades

El tancament està coordinat amb DB-HS 1:

- Pla de drenatge.
- Segellat exterior/interior segons sistema.
- Ampit i evacuació d'aigua.
- Llinda.
- Brancals.
- Continuïtat de barreres i aïllaments.
- Ponts tèrmics.
- Trobada amb cambres i revestiments.

Una finestra no queda “acabada” només col·locant marc i silicona. L'escandall
ha de considerar premarc, ancoratges, cintes o segellats del sistema, aïllament
de junta, ampit, remats i reposició d'acabats.

## 7. Vidre i seguretat d'ús

DB-SUA identifica àrees amb risc d'impacte i exigeix prestacions segons la
situació. També tracta específicament les parts vidriades de portes i els
tancaments de dutxes i banyeres.

### TANC-GLASS-IMPACT-ZONE-001

- Entrades: geometria, ús, desnivell, posició del vidre i barreres.
- Resultat: classificar si el vidre està en una zona de risc i determinar la
  prestació que s'ha de verificar.
- Font: DB-SUA 2, 1.3.

### TANC-SHOWER-GLASS-001

- Aplica quan: part vidriada de porta o tancament de dutxa/banyera.
- Resultat: requerir declaració compatible amb la prestació d'impacte exigida.
- Font: DB-SUA 2, 1.3.

La classificació final del producte prové de documentació conforme a la norma
referenciada; Obrametrik no simula l'assaig.

## 8. Ventilació

Finestres, portes i obertures poden formar part de l'estratègia de ventilació.
El model ha de distingir:

- Obertura practicable.
- Airejador o admissió.
- Obertura de pas.
- Extracció.
- Posició bloquejada per mobiliari o persianes.

No es compta automàticament tota la superfície de finestra com a ventilació
útil.

## 9. Escandall

- Premarc.
- Marc i fulles.
- Vidres o panells.
- Ferratges.
- Manetes i tancaments.
- Persiana, guies, eix, motor o cinta.
- Ancoratges.
- Calços.
- Aïllament de junta.
- Segellats i cintes segons sistema.
- Ampit i vierteaguas.
- Tapajuntes i remats.
- Reposició de revestiments.
- Proteccions i mitjans de muntatge.

### Amidaments derivats

```text
perímetre_de_junta =
2 × (amplada_conjunt + alçada_conjunt)

superfície_del_buit =
amplada_buit × alçada_buit

unitats_ancoratge =
regla_del_sistema(
  perímetre,
  material,
  exposició,
  instruccions_fabricant
)
```

Els ancoratges i segellats no s'inventen amb un pas universal; depenen del
sistema, suport, exposició i documentació tècnica.

## 10. Preguntes del flux

- És interior o part de l'envolupant?
- Quin és el buit d'obra real?
- Hi ha premarc i es conserva?
- Quin material i sistema es vol?
- Quin tipus i sentit d'obertura?
- Quina llum de pas és necessària?
- Hi ha risc de caiguda o impacte?
- Quin desnivell hi ha a cada costat?
- Forma part de la ventilació?
- Hi ha persiana o protecció solar?
- Quines prestacions declara el conjunt?
- Com es resolen ampit, llinda, brancals i junta?

## 11. Casos daurats inicials

### Finestra exterior

- Buit real.
- Premarc.
- Finestra de dues fulles.
- Persiana.
- Trobades i remats.
- Prestacions del conjunt.
- Escandall complet sense duplicar perímetres.

### Mampara de dutxa

- Geometria i sentit d'obertura.
- Col·lisions.
- Zona d'impacte.
- Prestació declarada del vidre.
- Perfils, fixacions i segellats.

## 12. Fonts

- CTE DB-HE:
  https://www.codigotecnico.org/pdf/Documentos/HE/DBHE.pdf
- CTE DB-HS:
  https://www.codigotecnico.org/pdf/Documentos/HS/DBHS.pdf
- CTE DB-SUA:
  https://www.codigotecnico.org/pdf/Documentos/SUA/DBSUA.pdf
- Catàleg d'Elements Constructius:
  https://www.codigotecnico.org/Recursos/Aplicaciones/CatalogoElementosConstructivos.html

Cal incorporar DB-HR, productes concrets, marcatge i documentació de fabricant
en desenvolupar les regles de prestacions.
