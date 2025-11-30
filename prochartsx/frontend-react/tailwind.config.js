// tailwind.config.js
module.exports = {
    darkMode: 'class', // enable class-based dark mode
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
    theme: {
        extend: {
            colors: {
                primary: '#1e40af', // custom primary color
                secondary: '#64748b',
            },
        },
    },
    plugins: [],
};
