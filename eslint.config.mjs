import { defineConfig, globalIgnores } from 'eslint/config';
import { importX } from 'eslint-plugin-import-x';
import n from 'eslint-plugin-n';
import packageJson from 'eslint-plugin-package-json';
import perfectionist from 'eslint-plugin-perfectionist';
import regexp from 'eslint-plugin-regexp';
import stylistic from '@stylistic/eslint-plugin'
import tsEslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';
import vitest from '@vitest/eslint-plugin';
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";

export default defineConfig([
  globalIgnores([
    '**/*.js',
    '**/*.cjs',
    '**/*.mjs',
    '**/*.d.ts',
    'coverage/*',
    'dist/*',
    'node_modules/*',
  ]),
  stylistic.configs['disable-legacy'],
  {
    name: 'All Library Source Files',

    plugins: {
      'import-x': importX,
      perfectionist,
      '@stylistic': stylistic,
      '@typescript-eslint': tsEslint.plugin,
      unicorn,
    },

    extends: [
      importX.configs['flat/errors'],
      importX.configs['flat/typescript'],
      n.configs['flat/recommended-module'],
      regexp.configs['flat/recommended'],
      ...tsEslint.configs.strictTypeChecked,
      unicorn.configs.recommended,
    ],

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      parser: tsEslint.parser,
      ecmaVersion: 2022,
      sourceType: 'module',

      parserOptions: {
        project: [
          './tsconfig.json',
          './tsconfig.spec.json',
        ],
      }
    },

    settings: {
      'import-x/parsers': {
        '@typescript-eslint/parser': ['.ts', '.tsx'],
      },
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: [
            './tsconfig.json',
            './tsconfig.spec.json',
          ],
          noWarnOnMultipleProjects: true,
          alwaysTryTypes: true,
          enforceExtension: 1,
          moduleType: true,
        }),
      ],
    },

    files: ['lib/**/*.ts'],

    rules: {
      curly: ['error', 'all'],
      'default-case': ['error', { commentPattern: '^no default.*$'}],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-cond-assign': ['error', 'always'],
      'no-duplicate-case': 'error',
      'no-else-return': 'error',
      'no-fallthrough': 'error',
      'no-implicit-coercion': 'error',
      'no-implied-eval': 'error',
      'no-restricted-syntax': [
        'error',
        {
          selector: 'PropertyDefinition[definite=true]',
          message:
            "Don't use the `!` definite-assignment assertion. Initialize or mark it optional instead.",
        },
      ],
      'no-throw-literal': 'error',
      'no-unmodified-loop-condition': 'error',
      'no-var': 'error',
      'one-var': ['error', 'never'],
      'prefer-const': 'error',

      'import-x/extensions': [
        'error',
        'always',
        {
          ignorePackages: true,
          checkTypeImports: true,
          fix: true,
          pattern: {
            js: 'never',
            ts: 'always',
            tsx: 'never',
          },
        },
      ],
      'import-x/first': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-absolute-path': 'error',
      'import-x/no-commonjs': 'error',
      'import-x/no-cycle': 'error',
      'import-x/no-default-export': 'error',
      'import-x/no-duplicates': [
        'error',
        {
          'prefer-inline': true,
        },
      ],
      'import-x/no-unresolved': 'error',
      'import-x/no-self-import': 'error',
      'import-x/prefer-default-export': 'off',

      'n/prefer-node-protocol': 'error',
      'n/no-unsupported-features/node-builtins': 'off',

      'perfectionist/sort-imports': [
        'error',
        {
          type: 'alphabetical',
        },
      ],
      'perfectionist/sort-union-types': ['error', {
        groups: [
          'unknown',
          'nullish',
          'async',
        ],
        customGroups: [
          {
            groupName: 'async',
            elementNamePattern: 'Promise',
          }
        ]
      }],

      '@stylistic/array-bracket-spacing': 'error',
      '@stylistic/arrow-parens': 'error',
      '@stylistic/arrow-spacing': 'error',
      '@stylistic/comma-dangle': ['error', 'always-multiline'],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/comma-style': ['error', 'last'],
      '@stylistic/computed-property-spacing': ['error', 'never'],
      '@stylistic/implicit-arrow-linebreak': 'off', // rule is too restrictive
      '@stylistic/keyword-spacing': 'error',
      '@stylistic/lines-between-class-members': 'off',
      '@stylistic/member-delimiter-style': 'error',
      '@stylistic/new-parens': 'error',
      '@stylistic/newline-per-chained-call': 'error',
      '@stylistic/no-confusing-arrow': 'error',
      '@stylistic/no-extra-parens': [
        'error',
        'all',
        {
          nestedBinaryExpressions: false,
          ternaryOperandBinaryExpressions: false,
          ignoredNodes: ['ArrowFunctionExpression[body.type=ConditionalExpression]'],
        },
      ],
      '@stylistic/no-extra-semi': 'error',
      '@stylistic/no-floating-decimal': 'error',
      '@stylistic/no-mixed-operators': 'error',
      '@stylistic/no-multi-spaces': 'error',
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 1, maxBOF: 0 }],
      '@stylistic/no-whitespace-before-property': 'error',
      '@stylistic/object-curly-newline': [
        'error',
        {
          multiline: true,
          consistent: true,
        },
      ],
      '@stylistic/object-curly-spacing': [
        'error',
        'always',
        { objectsInObjects: false, emptyObjects: 'never' },
      ],
      '@stylistic/quotes': [
        'error',
        'single',
        { avoidEscape: true, allowTemplateLiterals: 'avoidEscape' },
      ],
      '@stylistic/rest-spread-spacing': ['error', 'never'],
      '@stylistic/semi': ['error', 'always'],
      '@stylistic/space-before-blocks': ['error', 'always'],
      '@stylistic/space-in-parens': ['error', 'never'],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/space-unary-ops': ['error', { words: true, nonwords: false }],
      '@stylistic/type-annotation-spacing': 'error',
      '@stylistic/type-generic-spacing': 'error',
      '@stylistic/type-named-tuple-spacing': 'error',
      '@stylistic/wrap-iife': ['error', 'inside'],

      '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
      '@typescript-eslint/dot-notation': ['error', {
        allowIndexSignaturePropertyAccess: true,
      }],
      '@typescript-eslint/no-meaningless-void-operator': [
        'error',
        {
          checkNever: true,
        },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': [
        'error',
        {
          ignoreIfStatements: true,
        },
      ],
      '@typescript-eslint/prefer-optional-chain': [
        'error',
        {
          requireNullish: true,
        },
      ],
      '@typescript-eslint/strict-boolean-expressions': ['error', {
        allowNullableBoolean: true,
      }],
      '@typescript-eslint/switch-exhaustiveness-check': [
        'error',
        {
          considerDefaultExhaustiveForUnions: true,
        },
      ],

      'unicorn/better-regex': ['warn', {
        sortCharacterClasses: false,
      }],
      'unicorn/consistent-function-scoping': ['error', {
        checkArrowFunctions: false,
      }],
      'unicorn/custom-error-definition': 'error',
      'unicorn/no-abusive-eslint-disable': 'warn',
      'unicorn/no-array-reduce': 'off',
      'unicorn/no-empty-file': 'off',
      'unicorn/no-nested-ternary': 'off',
      'unicorn/no-null': 'off',
      'unicorn/no-typeof-undefined': ['error', {
        checkGlobalVariables: false,
      }],
      'unicorn/no-unnecessary-polyfills': 'off',
      'unicorn/no-useless-undefined': ['error', {
        'checkArguments': false,
      }],
      'unicorn/prefer-import-meta-properties': 'error',
      'unicorn/prevent-abbreviations': 'off',
    },
  },
  {
    name: 'All Library Test Files',

    files: ['lib/**/*.spec.ts'],

    plugins: {
      vitest,
    },

    settings: {
      vitest: {
        typecheck: true,
      },
    },

    languageOptions: {
      globals: {
        ...vitest.environments.env.globals,
      },
    },

    rules: {
      '@typescript-eslint/await-thenable': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-useless-constructor': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',

      'unicorn/import-style': 'off',

      ...vitest.configs.recommended.rules,
      'vitest/consistent-test-filename': ['error', { pattern: '^.+\\.spec\\.ts$' }],
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'vitest/consistent-vitest-vi': ['error', { fn: 'vi' }],
      'vitest/hoisted-apis-on-top': 'error',
      'vitest/max-nested-describe': ['error', { max: 2 }],
      'vitest/no-alias-methods': 'error',
      'vitest/no-conditional-in-test': 'error',
      'vitest/no-conditional-tests': 'error',
      'vitest/no-duplicate-hooks': 'error',
      'vitest/no-test-prefixes': 'error',
      'vitest/no-test-return-statement': 'error',
      'vitest/padding-around-all': 'error',
      'vitest/prefer-called-with': 'error',
      'vitest/prefer-comparison-matcher': 'error',
      'vitest/prefer-equality-matcher': 'error',
      'vitest/prefer-expect-assertions': 'error',
      'vitest/prefer-expect-resolves': 'error',
      'vitest/prefer-expect-type-of': 'error',
      'vitest/prefer-hooks-in-order': 'error',
      'vitest/prefer-hooks-on-top': 'error',
      'vitest/prefer-import-in-mock': 'error',
      'vitest/prefer-importing-vitest-globals': 'error',
      'vitest/prefer-lowercase-title': ['error', {
        ignoreTopLevelDescribe: true,
        lowercaseFirstCharacterOnly: true,
      }],
      'vitest/prefer-mock-promise-shorthand': 'error',
      'vitest/prefer-mock-return-shorthand': 'error',
      'vitest/prefer-snapshot-hint': 'error',
      'vitest/prefer-spy-on': 'error',
      'vitest/prefer-strict-boolean-matchers': 'error',
      'vitest/prefer-strict-equal': 'error',
      'vitest/prefer-to-have-been-called-times': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/prefer-todo': 'error',
      'vitest/prefer-vi-mocked': 'error',
      'vitest/require-hook': 'error',
      'vitest/require-mock-type-parameters': 'error',
      'vitest/require-top-level-describe': ['error', {
        maxNumberOfTopLevelDescribes: 1,
      }],
      'vitest/valid-title': ['error', {
        ignoreTypeOfDescribeName: false,
        allowArguments: false,
        mustMatch: {
          it: '^should .+$',
        },
      }],
      'vitest/warn-todo': 'warn',
    },
  },
  {
    name: 'Library Package.json File',
    files: ['package.json'],
    extends: [
      packageJson.configs.recommended,
      packageJson.configs.stylistic,
    ],
    rules: {
      'package-json/specify-peers-locally': 'off',
    }
  },
]);
