---
title: "Руководство по RafLoader (Lua)"
description: "Полное руководство по разработке Lua-скриптов для RafLoader. Работа с памятью игры, хуками, тиками, проверкой версии и обработкой крашей."
keywords: "RafLoader, Lua, Rise and Fall, modding, hooks, memory, scripting"
---

# RafLoader Lua API

RafLoader автоматически загружает все Lua-скрипты из папки `scripts/` после запуска игры.

Структура проекта:

```
Rise And Fall/
│
├── RafLoader.asi
└── scripts/
    ├── example.lua
    ├── balance.lua
    └── ui.lua
```

> **Примечание**
>
> Файлы, начинающиеся с `_` или `.`, автоматически пропускаются загрузчиком.
>
> Например:
>
> - `_debug.lua`
> - `.disabled.lua`

---

# 📌 Глобальные модули

Все API уже доступны через объект `Engine`.

```lua
local memory  = _G.Engine.Memory
local hooks   = _G.Engine.Hooks
local tick    = _G.Engine.Tick
local version = _G.Engine.Version
local crash   = _G.Engine.VahCrash
```

---

# 📝 Логирование

Стандартная функция `print()` переопределена RafLoader.

Любой вывод автоматически попадает в лог загрузчика.

```lua
print("Hello World")
print("Player HP:", 250)
```

---

# 📦 Version API

```lua
local version = _G.Engine.Version
```

## get_number()

Возвращает текущую версию RafLoader в числовом формате.

### Возвращает

- `number`

```lua
local ver = version.get_number()
```

---

## get_string()

Возвращает строковое представление версии.

### Возвращает

- `string`

```lua
print(version.get_string())
-- 0.2.1
```

---

## check(major, minor, patch)

Проверяет, удовлетворяет ли текущая версия минимальным требованиям.

### Параметры

- `major (number)`
- `minor (number)`
- `patch (number)`

### Возвращает

- `boolean`

```lua
if version.check(0, 2, 1) then
    print("Version supported")
end
```

---

## require(major, minor, patch)

Требует минимальную версию RafLoader.

Если версия ниже требуемой — вызывается ошибка.

### Параметры

- `major (number)`
- `minor (number)`
- `patch (number)`

### Возвращает

- `true`

```lua
version.require(0, 2, 1)
```

---

# 🔄 Tick API

```lua
local tick = _G.Engine.Tick
```

## add(callback)

Добавляет функцию, которая будет вызываться каждый игровой тик.

### Параметры

- `callback (function)`

### Возвращает

- `nil`

```lua
tick.add(function()
    print("Tick")
end)
```

---

## clear()

Удаляет все зарегистрированные callback-функции.

### Возвращает

- `nil`

```lua
tick.clear()
```

---

# 📦 Memory API

```lua
local memory = _G.Engine.Memory
```

> **Важно**
>
> Все функции чтения и записи работают напрямую с памятью процесса игры.
> Использование неверного адреса может привести к аварийному завершению игры.

---

## write_nop(address, size)

Заполняет участок памяти инструкциями `NOP (0x90)`.

### Параметры

- `address (number)`
- `size (number)`

### Возвращает

- `boolean`

```lua
memory.write_nop(0x401000, 5)
```

---

## patch(address, bytes)

Записывает произвольную последовательность байтов.

### Параметры

- `address (number)`
- `bytes (table<number>)`

### Возвращает

- `boolean`

```lua
memory.patch(0x401000, {
    0xEB,
    0x01
})
```

---

## read_int(address)

Читает значение `int32`.

### Параметры

- `address (number)`

### Возвращает

- `number`

```lua
local hp = memory.read_int(0x500000)
```

---

## read_float(address)

Читает значение `float`.

### Параметры

- `address (number)`

### Возвращает

- `number`

```lua
local speed = memory.read_float(0x500100)
```

---

## write_int(address, value)

Записывает значение `int32`.

### Параметры

- `address (number)`
- `value (number)`

### Возвращает

- `nil`

```lua
memory.write_int(0x500000, 999)
```

---

## write_float(address, value)

Записывает значение `float`.

### Параметры

- `address (number)`
- `value (number)`

### Возвращает

- `nil`

```lua
memory.write_float(0x500100, 3.14)
```

---

# 🪝 Hooks API

```lua
local hooks = _G.Engine.Hooks
```

> **Важно**
>
> Сигнатура функции должна полностью совпадать с оригинальной функцией игры.
> Неверная сигнатура почти всегда приводит к крашу.

---

## create(address, signature, callback)

Создает detour-хук.

### Параметры

- `address (number)` — адрес функции
- `signature (string)` — C-сигнатура с заменяемым именем `NAME`
- `callback (function)` — Lua-функция

### Возвращает

- `function | nil`

```lua
local original

original = hooks.create(
    0x401000,
    "int (__cdecl *NAME)(int value)",
    function(value)

        print("Called:", value)

        return original(value)
    end
)
```

---

## create_usercall(address, callback)

Создает мост (`bridge`) для функций с нестандартным соглашением вызова (`__usercall`).

Callback получает шесть аргументов типа `int32`.

### Параметры

- `address (number)`
- `callback (function)`

### Возвращает

- `cdata | nil`

```lua
hooks.create_usercall(
    0x402000,
    function(a, b, c, d, e, f)

        print(a, b, c)

        return 0
    end
)
```

---

# 🛡️ VahCrash API

```lua
local crash = _G.Engine.VahCrash
```

## catch(crash_addr, safe_addr)

Регистрирует точку восстановления после известного краша.

### Параметры

- `crash_addr (number)`
- `safe_addr (number)`

### Возвращает

- `nil`

```lua
crash.catch(
    0x403000,
    0x404000
)
```

---

# 💡 Полный пример

```lua
local version = _G.Engine.Version
local tick    = _G.Engine.Tick
local memory  = _G.Engine.Memory
local hooks   = _G.Engine.Hooks
local crash   = _G.Engine.VahCrash

version.require(0, 2, 1)

tick.add(function()
    print("Tick")
end)

memory.write_nop(0x401000, 5)

local original

original = hooks.create(
    0x401000,
    "int (__cdecl *NAME)(int value)",
    function(value)

        print("Hook:", value)

        return original(value)
    end
)

crash.catch(
    0x403000,
    0x404000
)
```
