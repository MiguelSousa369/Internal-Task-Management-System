import { useEffect, useRef, useState } from 'react';
import { Flame, Inbox, Wrench, CircleCheck, UserX, Maximize, X, LogOut, type LucideIcon } from 'lucide-react';
import { getDashboard, getTasks } from '../api/api';
import { Task } from '../App';
import logo from '../assets/logo.png';

// Modo TV, para um ecrã na parede: ecrã inteiro, letra maior e contadores do dia. Dois layouts,
// à escolha nos controlos (aparecem ao mexer o rato; Esc sai):
//  - Grelha: todas as tarefas numa grelha (urgentes, novas, em tratamento), com os cartões
//    aumentados para encher o ecrã; com um número de cartões escolhido, é esse tanto por página.
//  - Colunas: Urgentes / Novas / Em Tratamento; a largura vai para quem tem mais tarefas (várias
//    sub-colunas) e as colunas vazias ficam estreitas.
// Atualiza a cada 5 segundos; o que não cabe passa às páginas seguintes a cada PAGE_SECONDS.
// Abre em /#tv, ou logo após o login com um utilizador de perfil TV.

const REFRESH_MS = 5_000;
const PAGE_SECONDS = 12;
// Tarefas criadas há menos disto ficam assinaladas como recentes.
const RECENT_MINUTES = 10;

// Tudo é desenhado como num ecrã de 1600px de largura e depois ampliado: letra maior numa TV.
const BASE_WIDTH = 1600;
const PAD = 32;
const HEADER_H = 96;
const FOOTER_H = 40;
const GAP = 14;

// Grelha: tamanho base de um cartão. Os cartões aumentam até MAX_SCALE para encher o ecrã e nunca
// ficam abaixo de MIN_SCALE (o que não couber vai para a página seguinte).
const GRID_CARD_W = 360;
const GRID_CARD_H = 150;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.8;
const GRID_SIZES = [4, 6, 8, 12, 16, 20];

// Colunas: largura mínima de uma sub-coluna, largura de uma coluna vazia, altura do título da
// coluna e altura do cartão em "Auto" (com um número escolhido, os cartões esticam para caber).
const COL_MIN_W = 340;
const COL_EMPTY_W = 230;
const COL_HEADER_H = 48;
const COL_CARD_H = 128;
const COL_CARD_MIN_H = 96;
const COLUMN_SIZES = [2, 3, 4, 5, 6, 8];

type Layout = 'grid' | 'columns';
type CardCount = number | 'auto';

interface DashboardData {
  abertas: number; urgentes: number; semResponsavel: number;
  emTratamento: number; concluidasHoje: number;
}

// Preferência guardada neste browser (sem storage, p.ex. em modo privado, fica só em memória).
function usePersistentState<T>(key: string, initial: T, valid: (v: unknown) => v is T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      const parsed = raw === null ? null : JSON.parse(raw);
      return valid(parsed) ? parsed : initial;
    } catch {
      return initial;
    }
  });
  const set = (v: T) => {
    setValue(v);
    try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* sem storage */ }
  };
  return [value, set] as const;
}

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight });
  useEffect(() => {
    const onResize = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return size;
}

function useNow(everyMs: number) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

// Impede o ecrã de adormecer enquanto o modo TV está aberto (onde o browser o permite).
function useWakeLock() {
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        if ('wakeLock' in navigator && document.visibilityState === 'visible') lock = await navigator.wakeLock.request('screen');
      } catch {
        /* não permitido aqui: o ecrã pode adormecer, nada mais a fazer */
      }
    };
    void request();
    // O browser larga o lock quando o separador fica escondido; pedi-lo outra vez ao voltar.
    const onVisible = () => { if (document.visibilityState === 'visible') void request(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void lock?.release().catch(() => undefined);
    };
  }, []);
}

// A grelha para n cartões numa área w x h que os deixa maiores: colunas, linhas e escala. Entre
// grelhas quase do mesmo tamanho (10%), ganha a com menos células vazias e depois a com células
// mais parecidas com a forma de um cartão (sem cartões altos e estreitos).
function bestGrid(n: number, w: number, h: number) {
  const grids = Array.from({ length: n }, (_, i) => {
    const cols = i + 1;
    const rows = Math.ceil(n / cols);
    const scale = Math.min(w / (cols * GRID_CARD_W + (cols - 1) * GAP), h / (rows * GRID_CARD_H + (rows - 1) * GAP));
    const cellShape = (w / cols) / (h / rows) / (GRID_CARD_W / GRID_CARD_H);
    const misfit = Math.abs(Math.log(cellShape)) * (cellShape < 1 ? 2 : 1);
    return { cols, rows, scale, empty: cols * rows - n, misfit };
  });
  const top = Math.max(...grids.map(g => g.scale));
  return grids.filter(g => g.scale >= top * 0.9).sort((a, b) => a.empty - b.empty || a.misfit - b.misfit)[0];
}

function timeAgo(dateStr: string, now: number): string {
  const m = Math.floor((now - new Date(dateStr).getTime()) / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  if (h < 24) return `há ${h} h`;
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
}

interface Section {
  key: string; label: string; icon: LucideIcon; iconClass: string; items: Task[]; empty: string;
}

interface Props {
  onExit: () => void;
  // Utilizador de perfil TV: "Sair" termina a sessão e Esc não faz nada (não há para onde voltar).
  isTvUser: boolean;
}

export function TvMode({ onExit, isTvUser }: Props) {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [layout, setLayout] = usePersistentState<Layout>('tv_layout', 'grid',
    (v): v is Layout => v === 'grid' || v === 'columns');
  const [gridCards, setGridCards] = usePersistentState<CardCount>('tv_grid_cards', 'auto',
    (v): v is CardCount => v === 'auto' || (typeof v === 'number' && GRID_SIZES.includes(v)));
  const [columnCards, setColumnCards] = usePersistentState<CardCount>('tv_column_cards', 'auto',
    (v): v is CardCount => v === 'auto' || (typeof v === 'number' && COLUMN_SIZES.includes(v)));
  const { w, h } = useViewport();
  const now = useNow(1000);
  useWakeLock();

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const [t, d] = await Promise.all([getTasks(), getDashboard()]);
        if (!alive) return;
        setTasks(t);
        setDashboard(d);
        setError(false);
        setUpdatedAt(Date.now());
      } catch {
        if (alive) setError(true);
      }
    };
    void load();
    const id = setInterval(load, REFRESH_MS);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // Controlos: aparecem durante uns segundos depois de mexer o rato (e ao abrir).
  const [controls, setControls] = useState(true);
  const hideTimer = useRef<number | undefined>(undefined);
  useEffect(() => {
    const show = () => {
      setControls(true);
      window.clearTimeout(hideTimer.current);
      hideTimer.current = window.setTimeout(() => setControls(false), 4000);
    };
    show();
    window.addEventListener('mousemove', show);
    window.addEventListener('touchstart', show);
    return () => {
      window.removeEventListener('mousemove', show);
      window.removeEventListener('touchstart', show);
      window.clearTimeout(hideTimer.current);
    };
  }, []);

  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const exit = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    onExit();
  };
  // Em ecrã inteiro o browser usa o primeiro Esc para sair do ecrã inteiro; o seguinte sai do modo TV.
  useEffect(() => {
    if (isTvUser) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') exit(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTvUser]);

  // Páginas: um contador comum; cada bloco mostra a página (contador % páginas). Volta ao início
  // quando se muda o layout ou o número de cartões.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(0);
    const id = setInterval(() => setTick(t => t + 1), PAGE_SECONDS * 1000);
    return () => clearInterval(id);
  }, [layout, gridCards, columnCards]);

  const all = tasks ?? [];
  const sections: Section[] = [
    { key: 'urgentes', label: 'Urgentes', icon: Flame, iconClass: 'text-accent-500',
      items: all.filter(t => t.prioridade === 'Urgente' && t.estado !== 'Concluido'), empty: 'Sem urgentes' },
    { key: 'novas', label: 'Novas', icon: Inbox, iconClass: 'text-blue-600',
      items: all.filter(t => t.prioridade !== 'Urgente' && t.estado === 'Novo'), empty: 'Sem pedidos novos' },
    { key: 'emTratamento', label: 'Em Tratamento', icon: Wrench, iconClass: 'text-amber-600',
      items: all.filter(t => t.prioridade !== 'Urgente' && t.estado === 'EmTratamento'), empty: 'Nada em tratamento' },
  ];
  const open = sections.flatMap(s => s.items);

  // Área útil no ecrã "reduzido" a BASE_WIDTH.
  const zoom = Math.min(2.6, Math.max(1, w / BASE_WIDTH));
  const effH = h / zoom;
  const areaW = w / zoom - 2 * PAD;
  const areaH = effH - HEADER_H - FOOTER_H;

  let content: React.ReactNode;
  let pageInfo = '';
  let paged = false;

  if (!tasks) {
    content = <p className="pt-24 text-center text-[20px] text-gray-500">A carregar...</p>;
  } else if (layout === 'grid') {
    // Auto: todas as tarefas; um número: esse tanto por página. Os cartões aumentam para encher o
    // ecrã e, se ficassem pequenos demais, vão menos por página.
    let n = gridCards === 'auto' ? Math.max(1, open.length) : gridCards;
    let g = bestGrid(n, areaW, areaH);
    while (n > 1 && g.scale < MIN_SCALE) g = bestGrid(--n, areaW, areaH);
    const scale = Math.min(g.scale, MAX_SCALE);
    const pages = Math.max(1, Math.ceil(open.length / n));
    const page = tick % pages;
    paged = pages > 1;
    pageInfo = paged ? `Página ${page + 1} de ${pages}` : '';
    const shown = open.slice(page * n, (page + 1) * n);
    content = open.length === 0 ? <AllClear /> : (
      <div key={`grid-${n}-${page}`} className="tv-fade grid"
        style={{
          zoom: scale, height: areaH / scale, gap: GAP,
          gridTemplateColumns: `repeat(${g.cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${Math.ceil(n / g.cols)}, minmax(0, 1fr))`,
        }}>
        {shown.map(t => <TvCard key={t.id} task={t} now={now} showEstado />)}
      </div>
    );
  } else {
    // Colunas: linhas por coluna (Auto = as que cabem com o cartão normal; um número = esse
    // tanto, a esticar, sem ficarem baixos demais para ler).
    const usableH = areaH - COL_HEADER_H;
    let rows = columnCards === 'auto'
      ? Math.max(1, Math.floor((usableH + GAP) / (COL_CARD_H + GAP)))
      : columnCards;
    while (rows > 1 && (usableH - (rows - 1) * GAP) / rows < COL_CARD_MIN_H) rows--;
    const cardH = columnCards === 'auto' ? COL_CARD_H : (usableH - (rows - 1) * GAP) / rows;

    // Largura: as colunas vazias ficam estreitas; as outras repartem sub-colunas, primeiro para
    // quem tem tarefas que não cabem, depois (a sobrar) para quem tem mais tarefas.
    const filled = sections.filter(s => s.items.length > 0);
    const emptyCount = sections.length - filled.length;
    const freeW = areaW - emptyCount * (COL_EMPTY_W + GAP);
    const totalSlots = Math.max(filled.length, Math.floor((freeW + GAP) / (COL_MIN_W + GAP)));
    const slots: Record<string, number> = {};
    filled.forEach(s => { slots[s.key] = 1; });
    for (let left = totalSlots - filled.length; left > 0 && filled.length > 0; left--) {
      const unmet = (s: Section) => Math.ceil(s.items.length / rows) - slots[s.key];
      const target = [...filled].sort((a, b) => unmet(b) - unmet(a) || b.items.length - a.items.length)[0];
      slots[target.key]++;
    }

    let maxPages = 1;
    const template = sections.map(s => (s.items.length ? `minmax(0, ${slots[s.key]}fr)` : `${COL_EMPTY_W}px`)).join(' ');
    content = (
      <div className="grid h-full" style={{ gridTemplateColumns: template, gap: GAP }}>
        {sections.map(s => {
          const Icon = s.icon;
          const k = slots[s.key] ?? 1;
          const subCols = Math.max(1, Math.min(k, Math.ceil(s.items.length / rows)));
          const perPage = subCols * rows;
          const pages = Math.max(1, Math.ceil(s.items.length / perPage));
          maxPages = Math.max(maxPages, pages);
          const page = tick % pages;
          const shown = s.items.slice(page * perPage, (page + 1) * perPage);
          return (
            <section key={s.key} className="flex min-h-0 min-w-0 flex-col">
              <div className="flex shrink-0 items-center gap-2.5 px-1" style={{ height: COL_HEADER_H }}>
                <Icon className={`h-6 w-6 shrink-0 ${s.iconClass}`} />
                <h2 className="truncate text-[18px] font-semibold uppercase tracking-wider text-gray-700">{s.label}</h2>
                <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[16px] font-semibold text-gray-700 tabular-nums">{s.items.length}</span>
                {pages > 1 && <span className="ml-auto text-[14px] text-gray-500 tabular-nums">{page + 1} / {pages}</span>}
              </div>
              {shown.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                  <CircleCheck className="h-10 w-10" strokeWidth={1.5} />
                  <p className="text-center text-[16px]">{s.empty}</p>
                </div>
              ) : (
                // Coluna a coluna: as mais antigas no topo da primeira sub-coluna.
                <div key={`${s.key}-${rows}-${page}`} className="tv-fade grid"
                  style={{
                    gap: GAP, gridAutoFlow: 'column',
                    gridTemplateColumns: `repeat(${subCols}, minmax(0, 1fr))`,
                    gridTemplateRows: `repeat(${rows}, ${cardH}px)`,
                  }}>
                  {shown.map(t => <TvCard key={t.id} task={t} now={now} showEstado={s.key === 'urgentes'} />)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    );
    paged = maxPages > 1;
  }

  const segment = (on: boolean) =>
    `rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${on ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`;
  const sizes = layout === 'grid' ? GRID_SIZES : COLUMN_SIZES;
  const cards = layout === 'grid' ? gridCards : columnCards;
  const setCards = layout === 'grid' ? setGridCards : setColumnCards;

  return (
    <div className="h-screen overflow-hidden bg-gray-100">
      <div className="flex flex-col" style={{ zoom, height: effH, padding: `0 ${PAD}px` }}>
        {/* ------------------------------------------------ cabeçalho */}
        <header className="flex shrink-0 items-center justify-between gap-6" style={{ height: HEADER_H }}>
          <div className="flex items-center gap-8">
            <img src={logo} alt="Litinfor" className="h-8 object-contain" />
            {dashboard && (
              <div className="flex items-center gap-3">
                <Counter icon={Flame} tone="text-accent-500" value={dashboard.urgentes} label="urgentes" />
                <Counter icon={UserX} tone="text-amber-600" value={dashboard.semResponsavel} label="sem responsável" />
                <Counter icon={Wrench} tone="text-blue-600" value={dashboard.emTratamento} label="em tratamento" />
                <Counter icon={CircleCheck} tone="text-green-600" value={dashboard.concluidasHoje} label="concluídas hoje" />
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-[34px] font-semibold leading-none text-gray-900 tabular-nums">
              {new Date(now).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="mt-1.5 text-[13px] text-gray-500">
              {error
                ? <span className="font-medium text-red-600">Sem ligação ao servidor — a mostrar os últimos dados</span>
                : new Date(now).toLocaleDateString('pt-PT', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
        </header>

        {/* ------------------------------------------------ tarefas */}
        <main className="min-h-0 flex-1" style={{ height: areaH }}>{content}</main>

        {/* ------------------------------------------------ rodapé */}
        <footer className="flex shrink-0 items-center gap-4 text-[13px] text-gray-500" style={{ height: FOOTER_H }}>
          <span className="whitespace-nowrap">
            {[
              pageInfo,
              dashboard ? `${dashboard.abertas} ${dashboard.abertas === 1 ? 'tarefa' : 'tarefas'} em aberto` : '',
              updatedAt && !error ? `atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-PT')}` : '',
            ].filter(Boolean).join(' · ')}
          </span>
          {paged && (
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div key={tick} className="tv-progress h-full bg-primary-600/60" style={{ animationDuration: `${PAGE_SECONDS}s` }} />
            </div>
          )}
        </footer>
      </div>

      {/* ------------------------------------------------ controlos (sem zoom: tamanho normal, canto inferior direito) */}
      <div className={`fixed bottom-12 right-4 flex flex-wrap items-center justify-end gap-2 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-xl transition-opacity duration-300 ${
        controls ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}>
        <div role="group" aria-label="Layout" className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
          <button className={segment(layout === 'grid')} aria-pressed={layout === 'grid'} onClick={() => setLayout('grid')}>Grelha</button>
          <button className={segment(layout === 'columns')} aria-pressed={layout === 'columns'} onClick={() => setLayout('columns')}>Colunas</button>
        </div>
        <div role="group" aria-label="Número de cartões" className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
          <span className="px-2 text-xs text-gray-500">{layout === 'grid' ? 'Cartões' : 'Por coluna'}</span>
          {(['auto', ...sizes] as CardCount[]).map(n => (
            <button key={n} className={segment(cards === n)} aria-pressed={cards === n} onClick={() => setCards(n)}>
              {n === 'auto' ? 'Auto' : n}
            </button>
          ))}
        </div>
        {!fullscreen && (
          <button className="btn-ghost btn-sm" onClick={() => void document.documentElement.requestFullscreen().catch(() => undefined)}>
            <Maximize className="h-3.5 w-3.5" /> Ecrã inteiro
          </button>
        )}
        <button className="btn-ghost btn-sm" onClick={exit}>
          {isTvUser ? <><LogOut className="h-3.5 w-3.5" /> Terminar sessão</> : <><X className="h-3.5 w-3.5" /> Sair do modo TV</>}
        </button>
      </div>
    </div>
  );
}

function AllClear() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <CircleCheck className="h-16 w-16 text-green-600" strokeWidth={1.5} />
      <p className="text-[30px] font-semibold text-gray-800">Sem tarefas em aberto</p>
    </div>
  );
}

function Counter({ icon: Icon, tone, value, label }: { icon: LucideIcon; tone: string; value: number; label: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 ${value === 0 ? 'opacity-60' : ''}`}>
      <Icon className={`h-5 w-5 ${tone}`} />
      <span className="text-[24px] font-bold leading-none text-gray-900 tabular-nums">{value}</span>
      <span className="text-[14px] text-gray-500">{label}</span>
    </div>
  );
}

// Ocupa a célula inteira (altura e largura): o texto fica em cima, o responsável em baixo.
function TvCard({ task, now, showEstado }: { task: Task; now: number; showEstado: boolean }) {
  const recent = now - new Date(task.dataCriacao).getTime() < RECENT_MINUTES * 60_000;
  const urgent = task.prioridade === 'Urgente';
  return (
    <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-gray-200 border-l-4 bg-white px-4 py-3 shadow-sm ${
      urgent ? 'border-l-accent-500' : 'border-l-primary-600'
    }`}>
      <div className="flex items-center gap-2">
        {recent && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500 animate-pulse" title="Pedido recente" />}
        <h3 className="truncate text-[20px] font-semibold text-gray-900">{task.cliente}</h3>
        <span className="ml-auto shrink-0 text-[14px] text-gray-500 tabular-nums">{timeAgo(task.dataCriacao, now)}</span>
      </div>
      <p className="mt-1 line-clamp-3 text-[15px] leading-snug text-gray-600">
        {task.descricao || task.contacto || '—'}
      </p>
      <div className="mt-auto flex items-center gap-2 pt-1.5 text-[14px]">
        {task.emTratamentoPor ? (
          <>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-600 text-[11px] font-bold text-white">
              {task.emTratamentoPor.nome.charAt(0).toUpperCase()}
            </span>
            <span className="truncate font-medium text-primary-700">{task.emTratamentoPor.nome}</span>
          </>
        ) : (
          <span className="truncate text-gray-500">
            Sem responsável{task.tecnicoSolicitado ? ` · pediu ${task.tecnicoSolicitado.nome.split(' ')[0]}` : ''}
          </span>
        )}
        {showEstado && (
          <span className="ml-auto flex shrink-0 gap-1.5">
            {urgent && <span className="badge badge-Urgente text-[13px]"><Flame className="h-3 w-3" /> Urgente</span>}
            <span className={`badge badge-${task.estado} text-[13px]`}>
              {task.estado === 'EmTratamento' ? 'Em Tratamento' : 'Novo'}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
