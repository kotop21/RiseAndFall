---
title: "RafLoader Guide (Lua)"
description: "The Ultimate RafLoader Guide: building Lua scripts for Rise and Fall: Civilization at War. Learn how to modify game logic in real-time, use hooks, and manage process memory."
keywords: "rise and fall, patch, balance, fix, installation, guide"
---

## 📦 Memory API

```lua
local memory = _G.Engine.Memory
```

### write_nop(address, size)

Fills a memory region with NOP instructions (0x90).

**Parameters:**

* `address (number)` — memory address (uintptr_t)
* `size (number)` — number of bytes

**Returns:**

* `boolean` — whether the patch was applied successfully

```lua
memory.write_nop(0x401000, 5)
```

---

### patch(address, bytes)

Writes arbitrary bytes to memory.

**Parameters:**

* `address (number)` — address
* `bytes (table<number>)` — array of bytes (0–255)

**Returns:**

* `boolean`

```lua
memory.patch(0x401000, {0xEB, 0x01})
```

---

### read_int(address)

Reads an `int32`.

**Parameters:**

* `address (number)`

**Returns:**

* `number` — int32 value

```lua
local hp = memory.read_int(0x500000)
print(hp)
```

---

### read_float(address)

Reads a `float`.

**Parameters:**

* `address (number)`

**Returns:**

* `number` — float value

```lua
local speed = memory.read_float(0x500100)
print(speed)
```

---

### write_int(address, value)

Writes an `int32`.

**Parameters:**

* `address (number)`
* `value (number)` — int32 value

**Returns:**

* `nil`

```lua
memory.write_int(0x500000, 999)
```

---

### write_float(address, value)

Writes a `float`.

**Parameters:**

* `address (number)`
* `value (number)` — float value

**Returns:**

* `nil`

```lua
memory.write_float(0x500100, 3.14)
```

---

## ⌨️ Input API

```lua
local input = _G.Engine.Input
```

### bind(key, callback)

Triggers a function when a key is pressed (fires once per press, not while holding).

**Parameters:**

* `key (number)` — virtual-key code (WinAPI), for example:

  * `0x41` — A
  * `0x46` — F
  * `0x20` — Space
* `callback (function)` — function without arguments

**Returns:**

* `nil`

```lua
input.bind(0x41, function()
    print("Pressed A")
end)
```

---

### unbind(key)

Removes a key binding.

**Parameters:**

* `key (number)`

**Returns:**

* `nil`

```lua
input.unbind(0x41)
```

---

## 🪝 Hooks API

```lua
local hooks = _G.Engine.Hooks
```

### create(address, signature, callback)

Creates a detour hook for a function.

**Parameters:**

* `address (number)` — function address
* `signature (string)` — C signature with `NAME`
* `callback (function)` — Lua function (must match the signature)

**Returns:**

* `function | nil` — original function (if successful)

**Important:**

* you must call `original(...)` to preserve logic
* the signature must match exactly

```lua
local original

original = hooks.create(0x401000, "int (__cdecl *NAME)(int a)", function(a)
    print("Called:", a)
    return original(a)
end)
```

---

### create_usercall(address, callback)

Hook for non-standard (usercall) functions.

**Parameters:**

* `address (number)`
* `callback (function)` — fixed signature:

```c
int func(int, int, void*, void*, int, int)
```

**Returns:**

* `cdata | nil` — original pointer

```lua
hooks.create_usercall(0x402000, function(a, b, c, d, e, f)
    print("Usercall intercepted")
    return 0
end)
```

---

## 🛡️ VahCrash API

```lua
local crash = _G.Engine.VahCrash
```

### catch(crash_addr, safe_addr)

Registers a recovery point for crashes.

**Parameters:**

* `crash_addr (number)` — address where the crash occurs
* `safe_addr (number)` — address to jump to

**Returns:**

* `nil`

```lua
crash.catch(0x403000, 0x404000)
```

---

## 💡 Full Example

```lua
local memory = _G.Engine.Memory
local input  = _G.Engine.Input
local hooks  = _G.Engine.Hooks
local crash  = _G.Engine.VahCrash

-- bind key F
input.bind(0x46, function()
    print("Applying NOP")
    memory.write_nop(0x401000, 5)
end)

-- hook
local original
original = hooks.create(0x401000, "int (__cdecl *NAME)(int)", function(a)
    print("Hooked:", a)
    return original(a)
end)

-- crash protection
crash.catch(0x403000, 0x404000)
```
