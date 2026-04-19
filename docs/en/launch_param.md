---
title: "Game Launch Parameters"
description: "This document describes key launch parameters that can be used to control the game's behavior at startup."
keywords: "rise and fall, rise and fall civilization at war, патч, install maps, maps, map, баланс, фикс, установка, гайд, startup params, param, params, statup param"
---
# Game Launch Parameters

This document describes key launch parameters that can be used to control the game's behavior at startup.

---

## 📁 `-datapath`

**Description:**
Specifies the path to the folder containing game resources.

**Syntax:**

```
-datapath "<folder_name>\\"
```

**Notes:**

* The parameter is **case-insensitive** (`-datapath`, `-DataPath`, `-DATAPATH`, etc.)
* The path must **end with a `\\`**

**Example:**

```
-datapath "Data\\"
```

---

## 📦 `-redistpath`

**Description:**
Specifies the path to the folder containing required game libraries.

**Syntax:**

```
-redistpath "<folder_name>\\"
```

**Notes:**

* The path must end with a `\\`

**Example:**

```
-redistpath "redist\\"
```

---

## 🚫 `-nodump`

**Description:**
Disables creation of crash logs when the game crashes.

**Syntax:**

```
-nodump
```

**Notes:**

* Does not accept any arguments

---

## 🔄 `-forceautodetect=1`

**Description:**
Forces the game to reset all settings on every launch.

**Syntax:**

```
-forceautodetect=<value>
```

**Notes:**

* Works with any value **except `0`**
* Performs a full settings reset on each launch
* The parameter must be removed after the reset, otherwise settings will not be saved

**Example:**

```
-forceautodetect=1
```

---

## ⚠️ Notes

* It is recommended to wrap all paths in quotes
* Incorrect paths may lead to improp
