import eslint from '@eslint/js';

export default [
    {
        ignores: [
            'dist/',
            'node_modules/',
        ],
    },

    eslint.configs.recommended,

    {
        files: [
            'extension.js',
            'prefs.js',
            'src/**/*.js',
        ],

        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',

            globals: {
                console: 'readonly',
                global: 'readonly',
                log: 'readonly',
            },
        },

        rules: {
            'no-console': 'off',
            'no-unused-vars': [
                'error',
                {
                    args: 'none',
                },
            ],
            'no-unused-private-class-members': 'error',
            'no-unreachable': 'error',
            'no-undef': 'error',
        },
    },
];
