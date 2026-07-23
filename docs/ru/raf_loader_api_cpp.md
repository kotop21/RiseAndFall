---
title: "Руководство по RafLoader (C/C++)"
description: "Полное руководство по разработке C/C++ плагинов для RafLoader. Работа с C API, памятью игры, хуками, тиками, версионированием и обработкой крашей."
keywords: "RafLoader, C++, C, Rise and Fall, modding, hooks, memory, SDK, API"
---

# Документация C API RafLoader

## Обзор

`RafLoader_SDK.h` предоставляет публичный C API **RafLoader** для разработки ASI-плагинов. Он включает функции для проверки версии API, инициализации, логирования, управления консолью, работы с памятью, перехвата функций, регистрации тик-колбэков и восстановления после известных сбоев.

---

## Требования

- Windows (x86)
- Подключите `RafLoader_SDK.h`

---

# Жизненный цикл плагина

Типичный плагин для RafLoader проходит следующую последовательность инициализации:

1. Игра загружает ваш ASI-плагин.
2. Зарегистрируйте callback готовности через `Core_RegisterReadyCallback()`.
3. RafLoader завершает собственную инициализацию.
4. Вызывается ваш callback готовности.
5. Выполните установку хуков, регистрацию тик-колбэков, патчинг памяти и любую другую инициализацию.

> **Важно**
>
> Не рекомендуется вызывать большинство функций API RafLoader из `DllMain`. Инициализацию плагина следует выполнять внутри `Core_RegisterReadyCallback()`.

---

# Макросы и типы

## Макрос упаковки версии

```c
#define RAF_MAKE_VERSION(major, minor, patch) \
    (((uint32_t)(major) << 16) | ((uint32_t)(minor) << 8) | ((uint32_t)(patch)))
```

Упаковывает номера версий `major`, `minor` и `patch` в одно значение `uint32_t`, что позволяет быстро сравнивать версии обычным сравнением чисел.

### Пример

```c
RAF_MAKE_VERSION(0, 2, 2) // 0x00000202
```

---

## Типы callback-функций

```c
typedef void (__cdecl *Core_ReadyCallback)(void);
typedef void (__cdecl *Core_TickCallback)(void);
```

---

# Справочник API

# Версия и инициализация

## Core_GetVersion

```c
RAF_API uint32_t __cdecl Core_GetVersion(void);
```

Возвращает текущую версию RafLoader в виде упакованного значения `uint32_t`.

### Возвращает

- `uint32_t`

---

## Core_GetVersionString

```c
RAF_API const char *__cdecl Core_GetVersionString(void);
```

Возвращает строковое представление текущей версии RafLoader.

### Возвращает

- `const char*`

---

## Core_IsReady

```c
RAF_API bool __cdecl Core_IsReady(void);
```

Проверяет, завершена ли инициализация RafLoader.

### Возвращает

- `true` — API полностью готов к использованию.
- `false` — инициализация ещё продолжается.

---

## Core_RegisterReadyCallback

```c
RAF_API void __cdecl Core_RegisterReadyCallback(Core_ReadyCallback callback);
```

Регистрирует callback, который будет вызван после завершения инициализации RafLoader.

Всю инициализацию плагина рекомендуется выполнять именно внутри этого callback. Это гарантирует, что загрузчик и все экспортируемые функции API уже готовы к работе.

Если RafLoader уже был инициализирован, callback будет вызван сразу после регистрации.

### Параметры

- `callback` — функция инициализации.

### Возвращает

- `void`

---

# Логирование и консоль

## Core_Log

```c
RAF_API void __cdecl Core_Log(const char *text);
```

Записывает сообщение:

- в консоль RafLoader;
- в `stdout`;
- в файл `RafLoader.log`.

### Параметры

- `text` — UTF-8 строка, завершающаяся нулевым символом.

### Возвращает

- `void`

---

## Core_ToggleConsole

```c
RAF_API void __cdecl Core_ToggleConsole(bool state);
```

Показывает или скрывает ImGui-консоль RafLoader.

### Параметры

- `state`
    - `true` — показать консоль.
    - `false` — скрыть консоль.

### Возвращает

- `void`

---

# Работа с памятью

## Core_UnprotectMemory

```c
RAF_API bool __cdecl Core_UnprotectMemory(
    uintptr_t address,
    size_t size
);
```

Изменяет защиту указанного участка памяти на `PAGE_EXECUTE_READWRITE`.

### Параметры

- `address` — начальный адрес памяти.
- `size` — размер области в байтах.

### Возвращает

- `true` — операция выполнена успешно.
- `false` — произошла ошибка.

---

## Core_PatchMemory

```c
RAF_API bool __cdecl Core_PatchMemory(
    uintptr_t address,
    const uint8_t *newBytes,
    size_t size
);
```

Записывает произвольные байты в указанную область памяти.

Функция автоматически снимает защиту памяти, записывает данные, сбрасывает кэш инструкций процессора и восстанавливает исходную защиту страниц.

### Параметры

- `address` — адрес назначения.
- `newBytes` — указатель на записываемые данные.
- `size` — количество байт.

### Возвращает

- `true` — патч успешно применён.
- `false` — операция завершилась ошибкой.

---

# Перехват функций

## Core_CreateHook

```c
RAF_API void *__cdecl Core_CreateHook(
    void *target,
    void *detour
);
```

Создаёт и активирует inline-хук с использованием библиотеки **MinHook**.

> **Предупреждение**
>
> Функция-перехватчик (`detour`) должна полностью совпадать с оригинальной функцией по соглашению о вызове и сигнатуре. Неверная сигнатура практически всегда приводит к аварийному завершению игры.

### Параметры

- `target` — адрес перехватываемой функции.
- `detour` — указатель на функцию-перехватчик.

### Возвращает

- указатель на оригинальную функцию (trampoline);
- `NULL`, если создать хук не удалось.

> **Примечание**
>
> Перед использованием возвращаемый указатель необходимо привести к типу оригинальной функции.

---

# Tick Callback

## Core_RegisterTickCallback

```c
RAF_API void __cdecl Core_RegisterTickCallback(
    Core_TickCallback callback
);
```

Регистрирует callback, который будет вызываться один раз за каждую итерацию основного игрового цикла (Game Loop) в главном потоке игры.

### Параметры

- `callback` — функция, вызываемая каждый игровой тик.

### Возвращает

- `void`

---

# Восстановление после сбоев

## Core_RegisterRecoveryPoint

```c
RAF_API void __cdecl Core_RegisterRecoveryPoint(
    uintptr_t faultAddr,
    uintptr_t recoveryAddr
);
```

Регистрирует точку восстановления для известного Access Violation.

Если выполнение достигнет адреса `faultAddr` и произойдёт Access Violation, RafLoader перенаправит выполнение на `recoveryAddr` с помощью Vectored Exception Handler (VEH).

### Параметры

- `faultAddr` — адрес инструкции, на котором может возникнуть исключение.
- `recoveryAddr` — безопасный адрес, с которого следует продолжить выполнение.

### Возвращает

- `void`

---

# Полный пример

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
    // Вызывается каждый игровой тик.
}

void __cdecl OnReady()
{
    Core_Log("[Plugin] RafLoader успешно инициализирован.");

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
