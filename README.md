# CTU — Calendrier Terrestre Universel 🌍

---

## 🇫🇷 Présentation

Le **CTU (Calendrier Terrestre Universel)** est une proposition de calendrier et d’horloge alternatifs, fondée sur une idée simple :

> Chaque unité de temps doit correspondre à un phénomène astronomique réel,  
> sans approximation cachée ni convention arbitraire.

Le CTU sépare volontairement :
- le **calendrier**, basé sur des cycles orbitaux ou apparents,
- et l’**horloge**, basée sur la rotation réelle de la Terre.

Ce projet est à la fois :
- une **réflexion théorique** sur la mesure du temps,
- et une **implémentation concrète** (WebApp).

---

## 🇫🇷 Unités et définitions

### 📅 Calendrier (suffixe **-ion**)

Chaque unité de calendrier correspond à un phénomène indépendant.

- **Orbion** — 1 an  
  Révolution complète de la Terre autour du Soleil.

- **Lunion** — 1 mois  
  Une lunaison complète (cycle de la Lune).

- **Solion** (*abrégé : sol*) — 1 jour  
  Durée nécessaire pour que le Soleil retrouve la même position apparente dans le ciel  
  (jour solaire).

Un **solion** n’est pas défini par un angle de rotation, mais par un événement solaire observable.

---

### ⏱️ Horloge (suffixe **-or**)

L’horloge CTU mesure la **rotation sidérale de la Terre** de manière strictement angulaire.

- **Decor**  
  π / 10 radians de rotation sidérale de la Terre

- **Milor**  
  π / 1000 radians

- **Cenor**  
  π / 100 000 radians

Relations internes :
- 1 decor = 100 milor
- 1 milor = 100 cenor
- 1 decor = 10 000 cenor

L’horloge est **décimale dans ses subdivisions**, sans base 60.

> L’horloge mesure la rotation de la Terre.  
> Le calendrier mesure le retour du Soleil.

---

## 🇫🇷 Principe de calcul

- Les **heures (decor)** mesurent une quantité fixe de rotation terrestre.
- Les **solions** ne contiennent donc pas toujours le même nombre d’heures.
- Il n’y a **aucune correction artificielle** :  
  la variabilité est assumée comme une propriété physique réelle.

Le CTU évite ainsi :
- les secondes intercalaires,
- les moyennes cachées,
- les conventions historiques arbitraires.

---

## 🇫🇷 Pages du projet

Le projet CTU est composé de trois pages principales :

- **`index.html`**  
  Version complète du CTU (calendrier + horloge).

- **`watch.html`**  
  Version simplifiée, pensée pour les écrans réduits (montres, affichage minimal).

- **`convert.html`**  
  Outil de conversion entre dates classiques (UTC) et dates CTU.

---

---

## 🇬🇧 English version (summary)

### Presentation

The **CTU (Universal Terrestrial Calendar)** is an alternative calendar and timekeeping system based on a simple rule:

> Each unit of time must correspond to a real astronomical phenomenon,  
> without hidden approximations or arbitrary conventions.

The CTU clearly separates:
- the **calendar** (orbital or apparent cycles),
- and the **clock** (Earth’s actual rotation).

---

### Units and definitions

#### Calendar units (**-ion**)

- **Orbion** — one Earth revolution around the Sun.
- **Lunion** — one lunar cycle.
- **Solion (sol)** — one solar day  
  (time between two identical apparent positions of the Sun in the sky).

#### Clock units (**-or**)

- **Decor** = π / 10 radians of the Earth's sidereal rotation
- **Milor** = π / 1000 radians
- **Cenor** = π / 100 000 radians

Decimal relations:
- 1 decor = 100 milor
- 1 milor = 100 cenor

The clock measures **rotation**;  
the calendar measures **solar return**.

---

### Project pages

- `index.html` — full CTU calendar and clock
- `watch.html` — simplified display
- `convert.html` — date conversion tool

---

## ⚖️ Licence

This project is released under the **MIT License**,  
allowing free use, modification, and redistribution with attribution.
