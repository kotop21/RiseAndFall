---
title: "Гайд по RafLoader (lua)"
description: "Полное руководство по RafLoader: создание Lua-скриптов для Rise and Fall: Civilization at war. Узнайте, как изменять игровую логику в реальном времени, использовать хуки и управлять памятью процесса."
keywords: "rise and fall, патч, баланс, фикс, установка, гайд"
---
## 📦 Memory API

```lua id="a1m9zf"
local memory = _G.Engine.Memory
```

### write_nop(address, size)

Забивает участок памяти NOP-инструкциями (0x90).

**Параметры:**

* `address (number)` — адрес в памяти (uintptr_t)
* `size (number)` — количество байт

**Возвращает:**

* `boolean` — успешно ли применен патч

```lua id="y3z2r8"
memory.write_nop(0x401000, 5)
```

---

### patch(address, bytes)

Записывает произвольные байты.

**Параметры:**

* `address (number)` — адрес
* `bytes (table<number>)` — массив байтов (0–255)

**Возвращает:**

* `boolean`

```lua id="q2xk7s"
memory.patch(0x401000, {0xEB, 0x01})
```

---

### read_int(address)

Читает `int32`.

**Параметры:**

* `address (number)`

**Возвращает:**

* `number` — int32 значение

```lua id="o9pw4d"
local hp = memory.read_int(0x500000)
print(hp)
```

---

### read_float(address)

Читает `float`.

**Параметры:**

* `address (number)`

**Возвращает:**

* `number` — float значение

```lua id="r5tm3k"
local speed = memory.read_float(0x500100)
print(speed)
```

---

### write_int(address, value)

Записывает `int32`.

**Параметры:**

* `address (number)`
* `value (number)` — int32

**Возвращает:**

* `nil`

```lua id="b8vx0g"
memory.write_int(0x500000, 999)
```

---

### write_float(address, value)

Записывает `float`.

**Параметры:**

* `address (number)`
* `value (number)` — float

**Возвращает:**

* `nil`

```lua id="l4s7dz"
memory.write_float(0x500100, 3.14)
```

---

## ⌨️ Input API

```lua id="m0c2pk"
local input = _G.Engine.Input
```

### bind(key, callback)

Вызывает функцию при нажатии клавиши (один раз при нажатии, не при удержании).

**Параметры:**

* `key (number)` — virtual-key code (WinAPI), например:

  * `0x41` — A
  * `0x46` — F
  * `0x20` — Space
* `callback (function)` — функция без аргументов

**Возвращает:**

* `nil`

```lua id="t9u1nl"
input.bind(0x41, function()
    print("Pressed A")
end)
```

---

### unbind(key)

Удаляет биндинг.

**Параметры:**

* `key (number)`

**Возвращает:**

* `nil`

```lua id="d2o8fr"
input.unbind(0x41)
```

---

## 🪝 Hooks API

```lua id="v1x6sh"
local hooks = _G.Engine.Hooks
```

### create(address, signature, callback)

Создает detour-хук функции.

**Параметры:**

* `address (number)` — адрес функции
* `signature (string)` — C-сигнатура с `NAME`
* `callback (function)` — Lua функция (должна соответствовать сигнатуре)

**Возвращает:**

* `function | nil` — оригинальная функция (если успешно)

**Важно:**

* обязательно вызывать `original(...)` чтобы не ломать логику
* сигнатура должна совпадать

```lua id="g7r3kx"
local original

original = hooks.create(0x401000, "int (__cdecl *NAME)(int a)", function(a)
    print("Called:", a)
    return original(a)
end)
```

---

### create_usercall(address, callback)

Хук для нестандартных (usercall) функций.

**Параметры:**

* `address (number)`
* `callback (function)` — сигнатура фиксирована:

```c id="g1x2nm"
int func(int, int, void*, void*, int, int)
```

**Возвращает:**

* `cdata | nil` — оригинальный указатель

```lua id="h8w0qa"
hooks.create_usercall(0x402000, function(a, b, c, d, e, f)
    print("Usercall intercepted")
    return 0
end)
```

---

## 🛡️ VahCrash API

```lua id="p3v9ez"
local crash = _G.Engine.VahCrash
```

### catch(crash_addr, safe_addr)

Регистрирует точку восстановления при краше.

**Параметры:**

* `crash_addr (number)` — адрес, где происходит краш
* `safe_addr (number)` — адрес для перехода

**Возвращает:**

* `nil`

```lua id="x4b2kp"
crash.catch(0x403000, 0x404000)
```

---

## 💡 Полный пример

```lua id="z8k1rq"
local memory = _G.Engine.Memory
local input  = _G.Engine.Input
local hooks  = _G.Engine.Hooks
local crash  = _G.Engine.VahCrash

-- биндим клавишу F
input.bind(0x46, function()
    print("Applying NOP")
    memory.write_nop(0x401000, 5)
end)

-- хук
local original
original = hooks.create(0x401000, "int (__cdecl *NAME)(int)", function(a)
    print("Hooked:", a)
    return original(a)
end)

-- защита от краша
crash.catch(0x403000, 0x404000)
```
