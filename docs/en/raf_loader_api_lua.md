---
title: "RafLoader Guide (Lua)"
description: "Complete guide to developing Lua scripts for RafLoader. Learn how to work with game memory, hooks, tick callbacks, version checking, and crash recovery."
keywords: "RafLoader, Lua, Rise and Fall, modding, hooks, memory, scripting"
---

# RafLoader Lua API

RafLoader automatically loads all Lua scripts from the `scripts/` directory after the game starts.

Project structure:

```
Rise And Fall/
│
├── RafLoader.asi
└── scripts/
    ├── example.lua
    ├── balance.lua
    └── ui.lua
```

> **Note**
>
> Files whose names begin with `_` or `.` are skipped by the script loader.
>
> Examples:
>
> - `_debug.lua`
> - `.disabled.lua`

---

# 📌 Global Modules

All APIs are available through the `Engine` object.

```lua
local memory  = _G.Engine.Memory
local hooks   = _G.Engine.Hooks
local tick    = _G.Engine.Tick
local version = _G.Engine.Version
local crash   = _G.Engine.VahCrash
```

---

# 📝 Logging

The standard Lua `print()` function is overridden by RafLoader.

Any output is automatically written to the RafLoader log.

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

Returns the current RafLoader version as a numeric value.

### Returns

- `number`

```lua
local ver = version.get_number()
```

---

## get_string()

Returns the current RafLoader version as a string.

### Returns

- `string`

```lua
print(version.get_string())
-- 0.2.1
```

---

## check(major, minor, patch)

Checks whether the current RafLoader version satisfies the minimum required version.

### Parameters

- `major (number)`
- `minor (number)`
- `patch (number)`

### Returns

- `boolean`

```lua
if version.check(0, 2, 1) then
    print("Version supported")
end
```

---

## require(major, minor, patch)

Requires a minimum RafLoader version.

Throws an error if the current version is lower than required.

### Parameters

- `major (number)`
- `minor (number)`
- `patch (number)`

### Returns

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

Registers a callback that is executed every game tick.

### Parameters

- `callback (function)`

### Returns

- `nil`

```lua
tick.add(function()
    print("Tick")
end)
```

---

## clear()

Removes all registered tick callbacks.

### Returns

- `nil`

```lua
tick.clear()
```

---

# 📦 Memory API

```lua
local memory = _G.Engine.Memory
```

> **Warning**
>
> All memory read and write operations access the game's process memory directly.
> Writing to an invalid address may cause the game to crash.

---

## write_nop(address, size)

Fills a memory region with `NOP (0x90)` instructions.

### Parameters

- `address (number)`
- `size (number)`

### Returns

- `boolean`

```lua
memory.write_nop(0x401000, 5)
```

---

## patch(address, bytes)

Writes an arbitrary sequence of bytes to memory.

### Parameters

- `address (number)`
- `bytes (table<number>)`

### Returns

- `boolean`

```lua
memory.patch(0x401000, {
    0xEB,
    0x01
})
```

---

## read_int(address)

Reads a 32-bit signed integer (`int32`) from memory.

### Parameters

- `address (number)`

### Returns

- `number`

```lua
local hp = memory.read_int(0x500000)
```

---

## read_float(address)

Reads a `float` value from memory.

### Parameters

- `address (number)`

### Returns

- `number`

```lua
local speed = memory.read_float(0x500100)
```

---

## write_int(address, value)

Writes a 32-bit signed integer (`int32`) to memory.

### Parameters

- `address (number)`
- `value (number)`

### Returns

- `nil`

```lua
memory.write_int(0x500000, 999)
```

---

## write_float(address, value)

Writes a `float` value to memory.

### Parameters

- `address (number)`
- `value (number)`

### Returns

- `nil`

```lua
memory.write_float(0x500100, 3.14)
```

---

# 🪝 Hooks API

```lua
local hooks = _G.Engine.Hooks
```

> **Warning**
>
> The function signature must exactly match the original game function.
> An incorrect signature will almost certainly cause the game to crash.

---

## create(address, signature, callback)

Creates a detour hook.

### Parameters

- `address (number)` — target function address
- `signature (string)` — C function signature containing the placeholder `NAME`
- `callback (function)` — Lua callback

### Returns

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

Creates a bridge for functions that use the non-standard `__usercall` calling convention.

The callback receives six `int32` arguments.

### Parameters

- `address (number)`
- `callback (function)`

### Returns

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

Registers a recovery point for a known crash location.

### Parameters

- `crash_addr (number)`
- `safe_addr (number)`

### Returns

- `nil`

```lua
crash.catch(
    0x403000,
    0x404000
)
```

---

# 💡 Complete Example

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
