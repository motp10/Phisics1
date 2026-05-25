import React, { useState } from 'react';
import { Terminal, Github, Check, Copy, BookOpen } from 'lucide-react';

export default function DeployGuide() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const code1 = `npm install gh-pages --save-dev`;
  const code2 = `"homepage": "https://username.github.io/repository-name",
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -dist dist"
}`;
  const code3 = `export default defineConfig({
  base: '/repository-name/', // Укажите имя вашего репозитория!
  plugins: [react(), tailwindcss()],
  // ...
})`;
  
  const code4 = `npm run deploy`;

  const codeActions = `# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ "main" ] # Ветка, при пуше в которую запускается деплой

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4`;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 text-slate-200 mt-6" id="deploy-guide-card">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg">
          <Github className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100">Инструкция по деплою на GitHub Pages</h2>
          <p className="text-xs text-slate-400">Пошаговое руководство по публикации этого веб-приложения</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Method 1: Automated Actions */}
        <div className="bg-slate-950/60 p-4 border border-slate-800/80 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                Рекомендуемый метод
              </span>
              <span className="text-xs text-slate-500 font-medium">100% Автоматически</span>
            </div>
            <h3 className="font-bold text-slate-200 mb-2">Способ А: Через GitHub Actions</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Идеальный, современный способ. Вам не нужно устанавливать локальные пакеты. GitHub сам компилирует и публикует проект при каждом пуше в ветку <code>main</code>.
            </p>

            <ol className="text-xs text-slate-400 space-y-3 list-decimal list-inside">
              <li>
                Убедитесь, что в <code>vite.config.ts</code> добавлен относительный путь: 
                <div className="relative mt-1 bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-indigo-300">
                  base: './',
                </div>
              </li>
              <li>Создайте в проекте структуру папок: <code>.github/workflows/</code></li>
              <li>
                Создайте файл <code>deploy.yml</code> с кодом конфигурации Actions:
                <button
                  onClick={() => handleCopy(codeActions, 'actions')}
                  className="mt-2 flex items-center justify-center gap-1.5 w-full bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold py-1 px-3 rounded border border-slate-700 cursor-pointer transition text-[11px]"
                >
                  {copiedText === 'actions' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedText === 'actions' ? 'Код скопирован!' : 'Скопировать deploy.yml'}
                </button>
              </li>
              <li>Запушьте проект на GitHub.</li>
              <li>
                В репозитории зайдите в <strong>Settings</strong> &rarr; <strong>Pages</strong>. В поле <em>Source</em> выберите <strong>GitHub Actions</strong>. Всё готово!
              </li>
            </ol>
          </div>
        </div>

        {/* Method 2: Manual gh-pages package */}
        <div className="bg-slate-950/40 p-4 border border-slate-800/50 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-700/30 text-slate-300 border border-slate-700/50">
                Классический метод
              </span>
              <span className="text-xs text-slate-500 font-medium">Локальный запуск</span>
            </div>
            <h3 className="font-bold text-slate-200 mb-2">Способ Б: С пакетом gh-pages</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Сборка происходит локально на вашем компьютере, и специальный npm-скрипт отправляет готовую сборку (папку <code>dist</code>) в ветку <code>gh-pages</code> на сервере.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <p className="text-slate-400 font-medium mb-1">1. Установите деплоер:</p>
                <div className="relative bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-indigo-300 flex justify-between items-center">
                  <span>{code1}</span>
                  <button onClick={() => handleCopy(code1, 'raw1')} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                    {copiedText === 'raw1' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">2. Добавьте в <code>package.json</code>:</p>
                <div className="relative bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-400 flex justify-between items-start">
                  <pre className="whitespace-pre-wrap">{code2}</pre>
                  <button onClick={() => handleCopy(code2, 'raw2')} className="text-slate-500 hover:text-slate-300 cursor-pointer shrink-0 mt-1">
                    {copiedText === 'raw2' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">3. Отредактируйте <code>vite.config.ts</code>:</p>
                <div className="bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-slate-400 whitespace-pre">
                  {code3}
                </div>
              </div>

              <div>
                <p className="text-slate-400 font-medium mb-1">4. Запустите в терминале:</p>
                <div className="relative bg-slate-950 p-2 rounded border border-slate-800 font-mono text-[10px] text-indigo-300 flex justify-between items-center">
                  <span>{code4}</span>
                  <button onClick={() => handleCopy(code4, 'raw3')} className="text-slate-500 hover:text-slate-300 cursor-pointer">
                    {copiedText === 'raw3' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-950/80 p-3 mt-4 border border-indigo-500/10 rounded-lg text-xs leading-relaxed text-indigo-300/90 flex gap-2.5 items-start">
        <Terminal className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div>
          <strong>Важное примечание:</strong> Если вы видите белый экран после деплоя, это означает, что в 
          <code> vite.config.ts</code> неверно настроено поле <code>base</code>. Измените его на 
          <code> base: "./"</code> для полной независимости от путей или укажите точное название вашего репозитория со слэшами.
        </div>
      </div>
    </div>
  );
}
