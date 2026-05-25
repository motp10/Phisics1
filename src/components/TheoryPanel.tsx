import React from 'react';
import { BookOpen, Zap, Info, ShieldAlert } from 'lucide-react';

export default function TheoryPanel() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:p-6 text-slate-200 mt-6" id="theory-panel-card">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4 mb-5">
        <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-sans">Теоретические основы и Физика расчёта</h2>
          <p className="text-xs text-slate-400">Как работают электромагнитные соотношения в катушке</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300 leading-relaxed">
        {/* Paragraph 1 */}
        <div className="space-y-2">
          <h3 className="font-semibold text-emerald-400 flex items-center gap-1.5 text-sm">
            <Zap className="w-4 h-4 shrink-0" />
            Магнитная индукция в центре B(l)
          </h3>
          <p>
            Магнитное поле $B$ на оси тонкого соленоида длиной $l$ и диаметром $D_i$ с числом витков $N_1$ равно:
          </p>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-850 font-mono text-center text-[11px] text-indigo-300 my-1">
            {"B_i = \u03BC_0 \u00B7 (N_1 \u00B7 I) / \u221A(l\u00B2 + D_i\u00B2)"}
          </div>
          <p>
            Интегрируя это выражение по толщине намотки от внутреннего диаметра каркаса D до внешнего диаметра D_внеш ( непрерывная геометрическая модель ), мы получаем точную формулу:
          </p>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-850 font-mono text-center text-[10px] text-indigo-300">
            {"B = (\u03BC_0 \u00B7 l \u00B7 I) / (2 \u00B7 d\u00B2) \u00B7 ln[ (D_outer + \u221A(l\u00B2 + D_outer\u00B2)) / (D + \u221A(l\u00B2 + D\u00B2)) ]"}
          </div>
        </div>

        {/* Paragraph 2 */}
        <div className="space-y-2">
          <h3 className="font-semibold text-indigo-400 flex items-center gap-1.5 text-sm">
            <Info className="w-4 h-4 shrink-0" />
            Почему существует оптимум l_opt?
          </h3>
          <p>
            При проектировании катушки с фиксированной длиной провода $L$ и каркасом $D$ возникает фундаментальный компромисс:
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1 mt-1">
            <li>
              <strong>Если длина $l$ мала:</strong> провод наматывается во множество высоких слоев (толстая катушка). Внешние витки оказываются слишком далеко от оси в радиальном направлении ($r$ велико). Поле $B \propto 1/r$ от них становится ничтожным.
            </li>
            <li>
              <strong>Если длина $l$ велика:</strong> катушка размазывается по оси, превращаясь в длинный однослойный соленоид. Число витков на единицу длины падает, и осевое поле в центре также убывает.
            </li>
          </ul>
          <p className="text-slate-400 mt-1 font-medium">
            Точка максимума l_opt на графике B=f(l) показывает идеальный баланс между толщиной намотки и её осевой концентрацией.
          </p>
        </div>

        {/* Paragraph 3 */}
        <div className="space-y-2">
          <h3 className="font-semibold text-amber-400 flex items-center gap-1.5 text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            Индуктивность катушки L_ind
          </h3>
          <p>
            Для расчёта индуктивности многослойной цилиндрической катушки мы используем проверенную временем инженерную <strong>формулу Уилера (Wheeler Multilayer Formula)</strong> в метрической системе:
          </p>
          <div className="p-2.5 bg-slate-950 rounded border border-slate-850 font-mono text-center text-[11px] text-indigo-300 my-1">
            {"L_ind = (31.5 \u00B7 a\u00B2 \u00B7 N\u00B2) / (6a + 9l + 10h) \u3010мкГн\u3011"}
          </div>
          <p>
            Где параметры задаются в метрах:
          </p>
          <ul className="list-disc list-inside text-[11px] text-slate-400 pl-1">
            <li>$a = (D + h)/2$ &mdash; средний радиус намотки</li>
            <li>$l$ &mdash; длина намотки соленоида</li>
            <li>$h = k \cdot d$ &mdash; глубина (высота) намотки</li>
            <li>$N$ &mdash; общее число витков катушки</li>
          </ul>
          <p className="mt-1">
            Эта формула дает высокую точность (&lt;1.5%) при большинстве практических соотношений геометрии в любительском и промышленном приборостроении.
          </p>
        </div>
      </div>
    </div>
  );
}
