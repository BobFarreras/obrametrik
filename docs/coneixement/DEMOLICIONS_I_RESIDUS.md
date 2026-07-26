# Demolicions, desmuntatges i residus — Base de coneixement inicial

**Jurisdicció inicial:** Espanya  
**Estat:** base inicial pendent de revisió tècnica i territorial  
**Fonts:** Llei 7/2022, Reial decret 105/2008 i normativa aplicable  
**Verificat:** 26 de juliol de 2026

## 1. Principi

Obrametrik diferencia:

- Desmuntatge per conservar o reutilitzar.
- Retirada selectiva.
- Demolició.
- Tall o perforació.
- Càrrega i transport intern.
- Classificació.
- Emmagatzematge temporal.
- Transport extern.
- Reutilització, valorització o eliminació.

“Retirar rajoles” no és una sola partida: pot afectar suport, instal·lacions,
residus, protecció, càrrega, transport i preparació posterior.

## 2. Inventari previ

Abans de generar una demolició:

- Element i material aparent.
- Quantitat.
- Sistema de fixació conegut.
- Host.
- Elements ocults.
- Caràcter estructural conegut o desconegut.
- Possible residu perillós.
- Reutilització prevista.
- Accés i evacuació.
- Proteccions necessàries.

Qualsevol sospita de material perillós activa un flux específic i impedeix
generar una instrucció ordinària de manipulació.

## 3. Demolició selectiva

La Llei 7/2022 estableix classificació de residus de construcció i demolició no
perillosos en fraccions i impulsa la demolició selectiva; des de l'1 de gener
de 2024 estableix l'obligatorietat en els termes de la llei.

Fraccions mínimes inicials:

- Fusta.
- Minerals: formigó, maó, rajola, ceràmica i pedra.
- Metalls.
- Vidre.
- Plàstic.
- Guix.

La normativa territorial i local pot afegir requisits. Les obres menors també
poden quedar sotmeses a ordenances municipals específiques.

## 4. Model de residu

```ts
type WasteEstimate = {
  sourceEntityIds: string[];
  materialClass: string;
  volumeM3?: number;
  massKg?: number;
  estimationMethod: string;
  hazardousStatus: "unknown" | "non_hazardous" | "suspected" | "confirmed";
  destination: "reuse" | "recycling" | "recovery" | "disposal" | "pending";
  confidence: "confirmed" | "estimated" | "pending";
};
```

## 5. Amidament

```text
volum_teòric =
àrea × gruix

massa_teòrica =
volum_teòric × densitat_documentada

volum_transport =
volum_teòric × factor_esponjament_documentat
```

Densitat i esponjament depenen del material i mètode. No s'assigna un factor
universal.

Per elements unitaris:

```text
massa =
unitats × massa_unitària_documentada
```

## 6. Escandall i cost

- Proteccions de zones conservades.
- Desconnexions prèvies.
- Mà d'obra o rendiment orientatiu.
- Eines i consumibles.
- Sacs, big bags o contenidors.
- Mitjans de càrrega.
- Transport.
- Taxes.
- Gestor.
- Tractament.
- Neteja.
- Reparació del suport.

Cada cost de residu conserva fracció, quantitat, destí i evidència.

## 7. Regles inicials

### DEM-HOST-UNKNOWN-001

- Aplica quan: element a demolir o perforar amb funció desconeguda.
- Resultat: revisió professional abans d'executar.

### DEM-HIDDEN-SERVICES-001

- Aplica quan: host pot contenir instal·lacions.
- Resultat: requerir localització i desconnexió/consignació aplicable.

### DEM-HAZARDOUS-UNKNOWN-001

- Aplica quan: antiguitat, material o evidència genera sospita.
- Resultat: aturar flux ordinari i requerir identificació específica.

### WASTE-SEPARATION-001

- Entrades: jurisdicció, data, tipus d'obra, materials i quantitats.
- Resultat: pla de fraccions i requisits aplicables.
- Fonts: Llei 7/2022, RD 105/2008 i normativa territorial.

## 8. Seqüència de control

```text
inventari
→ identificació de riscos
→ desconnexions
→ protecció
→ desmuntatge selectiu
→ classificació
→ amidament real
→ transport
→ documentació de destí
→ inspecció del suport
```

## 9. Cas daurat

Retirada d'un bany:

- Banyera.
- Mampara.
- Sanitaris.
- Moble.
- Revestiment ceràmic.
- Paviment.
- Fals sostre parcial.
- Instal·lacions que es mantenen.

El test comprova desmuntatge reutilitzable, fraccions, volum/massa estimats,
serveis ocults, riscos pendents i preparació posterior.

## 10. Fonts

- Llei 7/2022:
  https://www.boe.es/eli/es/l/2022/04/08/7/con
- Reial decret 105/2008:
  https://www.boe.es/buscar/act.php?id=BOE-A-2008-2486

Cal afegir normativa autonòmica, ordenança municipal i requisits del gestor
segons la ubicació real del projecte.
