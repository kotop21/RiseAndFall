---
title: "RafLoader Guide (C/C++)"
description: "Complete guide to developing C/C++ plugins for RafLoader. Working with C API, game memory, hooks, ticks, versioning, and crash handling."
keywords: "RafLoader, C++, C, Rise and Fall, modding, hooks, memory, SDK, API"
---

# RafLoader C API Documentation

## Overview

`RafLoader_SDK.h` exposes the public C API of **RafLoader** for developing ASI plugins. It provides functions for API versioning, initialization, logging, console control, memory manipulation, function hooking, tick callbacks, and crash recovery.

---

## Requirements

- Windows (x86)
- Include `RafLoader_SDK.h`

---

# Plugin Lifecycle

A typical RafLoader plugin follows this initialization flow:

1. The game loads your ASI plugin.
2. Register a ready callback using `Core_RegisterReadyCallback()`.
3. RafLoader completes its initialization.
4. Your ready callback is executed.
5. Install hooks, register tick callbacks, patch memory, or perform any other initialization.

> **Important**
>
> Avoid calling most RafLoader API functions from `DllMain`. Perform plugin initialization inside `Core_RegisterReadyCallback()` instead.

---

# Macros & Types

## Version Packaging Macro

```c
#define RAF_MAKE_VERSION(major, minor, patch) \
    (((uint32_t)(major) << 16) | ((uint32_t)(minor) << 8) | ((uint32_t)(patch)))
```

Packs the `major`, `minor`, and `patch` version numbers into a single `uint32_t` for efficient version comparisons.

### Example

```c
RAF_MAKE_VERSION(0, 2, 2) // 0x00000202
```

---

## Callback Types

```c
typedef void (__cdecl *Core_ReadyCallback)(void);
typedef void (__cdecl *Core_TickCallback)(void);
```

---

# Core API Reference

# Version & Initialization

## Core_GetVersion

```c
RAF_API uint32_t __cdecl Core_GetVersion(void);
```

Returns the current RafLoader version as a packed `uint32_t`.

### Returns

- `uint32_t`

---

## Core_GetVersionString

```c
RAF_API const char *__cdecl Core_GetVersionString(void);
```

Returns the current RafLoader version as a null-terminated string.

### Returns

- `const char*`

---

## Core_IsReady

```c
RAF_API bool __cdecl Core_IsReady(void);
```

Returns whether RafLoader has finished initialization.

### Returns

- `true` — the API is fully initialized.
- `false` — initialization is still in progress.

---

## Core_RegisterReadyCallback

```c
RAF_API void __cdecl Core_RegisterReadyCallback(Core_ReadyCallback callback);
```

Registers a callback that is executed once RafLoader has finished initialization.

All plugin initialization should be performed inside this callback. This guarantees that the loader and all exported APIs are fully initialized.

If RafLoader has already finished initialization, the callback is invoked immediately.

### Parameters

- `callback` — initialization function.

### Returns

- `void`

---

# Logging & Console

## Core_Log

```c
RAF_API void __cdecl Core_Log(const char *text);
```

Writes a message to:

- the RafLoader console,
- `stdout`,
- `RafLoader.log`.

### Parameters

- `text` — null-terminated UTF-8 string.

### Returns

- `void`

---

## Core_ToggleConsole

```c
RAF_API void __cdecl Core_ToggleConsole(bool state);
```

Shows or hides the RafLoader ImGui console.

### Parameters

- `state`
    - `true` — show the console.
    - `false` — hide the console.

### Returns

- `void`

---

# Memory

## Core_UnprotectMemory

```c
RAF_API bool __cdecl Core_UnprotectMemory(
    uintptr_t address,
    size_t size
);
```

Changes the protection of a memory region to `PAGE_EXECUTE_READWRITE`.

### Parameters

- `address` — starting memory address.
- `size` — region size in bytes.

### Returns

- `true` — operation succeeded.
- `false` — operation failed.

---

## Core_PatchMemory

```c
RAF_API bool __cdecl Core_PatchMemory(
    uintptr_t address,
    const uint8_t *newBytes,
    size_t size
);
```

Writes raw bytes into the target memory region.

The function automatically changes memory protection, writes the data, flushes the CPU instruction cache, and restores the original page protection.

### Parameters

- `address` — destination address.
- `newBytes` — pointer to the bytes to write.
- `size` — number of bytes.

### Returns

- `true` — patch applied successfully.
- `false` — operation failed.

---

# Function Hooking

## Core_CreateHook

```c
RAF_API void *__cdecl Core_CreateHook(
    void *target,
    void *detour
);
```

Creates and enables an inline hook using **MinHook**.

> **Warning**
>
> The detour function must use the exact same calling convention and function signature as the original function. Using an incorrect signature will usually crash the game.

### Parameters

- `target` — address of the target function.
- `detour` — pointer to the hook function.

### Returns

- Pointer to the original trampoline function.
- `NULL` if the hook could not be created.

> **Note**
>
> The returned pointer should be cast to the original function type before use.

---

# Tick Callbacks

## Core_RegisterTickCallback

```c
RAF_API void __cdecl Core_RegisterTickCallback(
    Core_TickCallback callback
);
```

Registers a callback that is executed once every game loop iteration on the game's main thread.

### Parameters

- `callback` — function executed every tick.

### Returns

- `void`

---

# Crash Recovery

## Core_RegisterRecoveryPoint

```c
RAF_API void __cdecl Core_RegisterRecoveryPoint(
    uintptr_t faultAddr,
    uintptr_t recoveryAddr
);
```

Registers a recovery point for a known access violation.

If execution reaches `faultAddr` and an access violation occurs, RafLoader redirects execution to `recoveryAddr` using a vectored exception handler (VEH).

### Parameters

- `faultAddr` — instruction address that may fault.
- `recoveryAddr` — safe address where execution continues.

### Returns

- `void`

---

# Complete Example

```cpp
#include <windows.h>
#include "RafLoader_SDK.h"

typedef int (__cdecl* GameFunction_t)(int);

GameFunction_t OriginalFunction = nullptr;

int __cdecl HookedFunction(int value)
{
    Core_Log("[Plugin] Function called.");

    return OriginalFunction(value);
}

void __cdecl OnTick()
{
    // Called every game loop iteration.
}

void __cdecl OnReady()
{
    Core_Log("[Plugin] RafLoader initialized.");

    Core_RegisterTickCallback(OnTick);

    OriginalFunction = (GameFunction_t)Core_CreateHook(
        (void*)0x00401000,
        HookedFunction
    );

    uint8_t nop[] = { 0x90, 0x90 };

    Core_PatchMemory(
        0x00402000,
        nop,
        sizeof(nop)
    );
}

BOOL APIENTRY DllMain(HMODULE, DWORD reason, LPVOID)
{
    if (reason == DLL_PROCESS_ATTACH)
    {
        Core_RegisterReadyCallback(OnReady);
    }

    return TRUE;
}
```
