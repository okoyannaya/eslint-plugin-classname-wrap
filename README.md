# @okoyannaya/eslint-plugin-classname-wrap

Пакет на npm: [npm](https://www.npmjs.com/package/@okoyannaya/eslint-plugin-classname-wrap)

ESLint-плагин для автоматического переноса длинных строк CSS-классов
в JSX-атрибутах `className` и аргументах функции `clsx()`.

Если строка превышает установленную длину, правило заменяет обычную строку
на многострочный шаблонный литерал. Переносы выполняются только между целыми
классами: `rounded-full`, `hover:bg-blue-700` и другие классы остаются неразрывными.

## Возможности

- Автоматическое исправление через ESLint `--fix`.
- Настраиваемая максимальная длина строки — по умолчанию 100 символов.
- Учёт отступов при расчёте длины строки.
- Сохранение порядка классов.
- Поддержка строк в `className`, включая JSX-выражения.
- Поддержка именованного и default-импорта `clsx`, а также алиасов.
- Поддержка строк в условных аргументах и массивах внутри `clsx()`.
- Сохранение переводов строк LF и CRLF.

## Требования

- ESLint 9.
- Flat config: `eslint.config.js`, `eslint.config.mjs` или другой поддерживаемый формат.
- Для TypeScript и TSX — настроенный TypeScript-совместимый парсер ESLint.

## Установка

```bash
npm install -D eslint@^9 @okoyannaya/eslint-plugin-classname-wrap
```

Если совместимая версия ESLint уже установлена:

```bash
npm install -D @okoyannaya/eslint-plugin-classname-wrap
```

## Подключение

Пример конфигурации для JavaScript и JSX:

```js
import classNameWrap from "@okoyannaya/eslint-plugin-classname-wrap";

export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      "classname-wrap": classNameWrap,
    },
    rules: {
      "classname-wrap/wrap-class-names": ["error", { maxLength: 100 }],
    },
  },
];
```

В существующем проекте добавьте регистрацию плагина и правило
в вашу конфигурацию ESLint, сохранив остальные настройки.

Для TypeScript и TSX добавьте соответствующие расширения в `files`
и используйте настроенный в проекте TypeScript-парсер.
Сам плагин не настраивает парсинг TypeScript.

## Правило `wrap-class-names`

### До исправления

```jsx
<button
  className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700"
/>
```

### После исправления

```jsx
<button
  className={`
    inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm
    font-medium text-white shadow-sm transition-colors hover:bg-blue-700
  `}
/>
```

Правило также обрабатывает длинные строки внутри `clsx()`:

```jsx
import { clsx } from "clsx";

<button
  className={clsx(
    `
      inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm
      font-medium text-white shadow-sm transition-colors hover:bg-blue-700
    `,
    isDisabled && "pointer-events-none opacity-50",
  )}
/>
```

## Настройки

| Опция | Тип | По умолчанию | Описание |
| --- | --- | --- | --- |
| `maxLength` | `number` | `100` | Максимальная длина строки с учётом отступов. Положительное целое число. |

Например, ограничение в 120 символов:

```js
rules: {
  "classname-wrap/wrap-class-names": ["error", { maxLength: 120 }],
}
```

## Автоматическое исправление

```bash
npx eslint . --fix
```

Для исправления при сохранении файла в VS Code установите расширение ESLint
и включите соответствующее действие:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "always"
  }
}
```

## Особенности и ограничения

- Короткие строки остаются без изменений.
- Шаблонные литералы с интерполяциями `${...}` автоматически не преобразуются.
- Ключи и значения объектных аргументов `clsx()` не переписываются.
- Для `clsx()` поддерживаются импорты из пакета `clsx`.
  Другие функции объединения классов автоматически не распознаются.
- Если отдельный класс не помещается в лимит, он сохраняется целиком
  на отдельной строке. Такая строка может превышать `maxLength`.
- Правило добавляет переносы и отступы внутрь значения строки.
  Оно предназначено для списков CSS-классов, где эти пробельные символы
  служат разделителями.
- Плагин не сортирует классы и не устраняет конфликты между ними.
  Для сортировки можно дополнительно использовать `eslint-plugin-tailwindcss`.

## Лицензия

[MIT](./LICENSE)