import { useEffect, useRef, useState } from 'react';
import { Flame, Inbox, Wrench, CircleCheck, UserX, Maximize, X, LogOut, type LucideIcon } from 'lucide-react';
import { getDashboard, getTasks } from '../api/api';
import { Task } from '../App';
import logo from '../assets/logo.png';

// Modo TV, para um ecrã na parede: ecrã inteiro, letra maior, três colunas (Urgentes, Novas, Em
// Tratamento) e contadores do dia. Atualiza a cada 5 segundos; quando uma coluna não cabe no ecrã,
// passa sozinha às páginas seguintes a cada PAGE_SECONDS. Os controlos aparecem ao mexer o rato;
// Esc sai. Abre em /#tv, ou logo após o login com um utilizador de perfil TV.

const REFRESH_MS = 5_000;
const PAGE_SECONDS = 12;
// Tarefas criadas há menos disto ficam assinaladas como novas.
const RECENT_MINUTES = 10;

// Tudo é desenhado como num ecrã de 1600px de largura e depois ampliado: letra maior numa TV.
const BASE_WIDTH = 1600;
const PAD = 32;
const HEADER_H = 96;
const FOOTER_H = 40;
const COLUMN_HEADER_H = 48;
const CARD_H = 128;
const GAP = 12;

interface DashboardData {
  abertas: number; urgentes: number; semResponsavel: number;
  emTratamento: number; concluidasHoje: number;
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

function timeAgo(dateStr: string, now: number): string {
  const m = Math.floor((now - new Date(dateStr).getTime()) / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (m < 1) return 'agora';
  if (m < 60) return `há ${m} min`;
  if (h < 24) return `há ${h} h`;
  return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
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

  // Páginas: um contador comum a todas as colunas; cada uma mostra a página (contador % páginas).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), PAGE_SECONDS * 1000);
    return () => clearInterval(id);
  }, []);

  const all = tasks ?? [];
  const columns: { key: string; label: string; icon: LucideIcon; iconClass: string; items: Task[]; empty: string }[] = [
    { key: 'urgentes', label: 'Urgentes', icon: Flame, iconClass: 'text-accent-500',
      items: all.filter(t => t.prioridade === 'Urgente' && t.estado !== 'Concluido'), empty: 'Sem urgentes' },
    { key: 'novas', label: 'Novas', icon: Inbox, iconClass: 'text-blue-600',
      items: all.filter(t => t.prioridade !== 'Urgente' && t.estado === 'Novo'), empty: 'Sem pedidos novos' },
    { key: 'emTratamento', label: 'Em Tratamento', icon: Wrench, iconClass: 'text-amber-600',
      items: all.filter(t => t.prioridade !== 'Urgente' && t.estado === 'EmTratamento'), empty: 'Nada em tratamento' },
  ];

  // Quantos cartões cabem em cada coluna, no ecrã "reduzido" a BASE_WIDTH.
  const zoom = Math.min(2.6, Math.max(1, w / BASE_WIDTH));
  const effH = h / zoom;
  const columnH = effH - HEADER_H - FOOTER_H;
  const perPage = Math.max(1, Math.floor((columnH - COLUMN_HEADER_H + GAP) / (CARD_H + GAP)));
  const paged = columns.some(c => c.items.length > perPage);

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

        {/* ------------------------------------------------ colunas */}
        <main className="grid min-h-0 flex-1 grid-cols-3 gap-4">
          {!tasks ? (
            <p className="col-span-3 pt-24 text-center text-[20px] text-gray-500">A carregar...</p>
          ) : columns.map(col => {
            const pages = Math.max(1, Math.ceil(col.items.length / perPage));
            const page = tick % pages;
            const shown = col.items.slice(page * perPage, (page + 1) * perPage);
            const Icon = col.icon;
            return (
              <section key={col.key} className="flex min-h-0 flex-col">
                <div className="flex shrink-0 items-center gap-2.5 px-1" style={{ height: COLUMN_HEADER_H }}>
                  <Icon className={`h-6 w-6 ${col.iconClass}`} />
                  <h2 className="text-[18px] font-semibold uppercase tracking-wider text-gray-700">{col.label}</h2>
                  <span className="rounded-md bg-gray-200 px-2 py-0.5 text-[16px] font-semibold text-gray-700 tabular-nums">{col.items.length}</span>
                  {pages > 1 && (
                    <span className="ml-auto text-[14px] text-gray-500 tabular-nums">{page + 1} / {pages}</span>
                  )}
                </div>
                {shown.length === 0 ? (
                  <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-400">
                    <CircleCheck className="h-10 w-10" strokeWidth={1.5} />
                    <p className="text-[17px]">{col.empty}</p>
                  </div>
                ) : (
                  <div key={`${col.key}-${page}`} className="tv-fade flex flex-col" style={{ gap: GAP }}>
                    {shown.map(t => <TvCard key={t.id} task={t} now={now} showEstado={col.key === 'urgentes'} />)}
                  </div>
                )}
              </section>
            );
          })}
        </main>

        {/* ------------------------------------------------ rodapé */}
        <footer className="flex shrink-0 items-center gap-4 text-[13px] text-gray-500" style={{ height: FOOTER_H }}>
          <span className="whitespace-nowrap">
            {dashboard ? `${dashboard.abertas} ${dashboard.abertas === 1 ? 'tarefa' : 'tarefas'} em aberto` : ''}
            {updatedAt && !error ? ` · atualizado às ${new Date(updatedAt).toLocaleTimeString('pt-PT')}` : ''}
          </span>
          {paged && (
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-gray-200">
              <div key={tick} className="tv-progress h-full bg-primary-600/60" style={{ animationDuration: `${PAGE_SECONDS}s` }} />
            </div>
          )}
        </footer>
      </div>

      {/* ------------------------------------------------ controlos (sem zoom: tamanho normal, canto inferior direito) */}
      <div className={`fixed bottom-12 right-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-xl transition-opacity duration-300 ${
        controls ? 'opacity-100' : 'pointer-events-none opacity-0'
      }`}>
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

function Counter({ icon: Icon, tone, value, label }: { icon: LucideIcon; tone: string; value: number; label: string }) {
  return (
    <div className={`flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-2.5 ${value === 0 ? 'opacity-60' : ''}`}>
      <Icon className={`h-5 w-5 ${tone}`} />
      <span className="text-[24px] font-bold leading-none text-gray-900 tabular-nums">{value}</span>
      <span className="text-[14px] text-gray-500">{label}</span>
    </div>
  );
}

function TvCard({ task, now, showEstado }: { task: Task; now: number; showEstado: boolean }) {
  const recent = now - new Date(task.dataCriacao).getTime() < RECENT_MINUTES * 60_000;
  return (
    <div className={`flex flex-col rounded-xl border border-gray-200 border-l-4 bg-white px-4 py-3 shadow-sm ${
      task.prioridade === 'Urgente' ? 'border-l-accent-500' : 'border-l-primary-600'
    }`} style={{ height: CARD_H }}>
      <div className="flex items-center gap-2">
        {recent && <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent-500 animate-pulse" title="Pedido recente" />}
        <h3 className="truncate text-[20px] font-semibold text-gray-900">{task.cliente}</h3>
        <span className="ml-auto shrink-0 text-[14px] text-gray-500 tabular-nums">{timeAgo(task.dataCriacao, now)}</span>
      </div>
      <p className="mt-1 line-clamp-2 text-[15px] leading-snug text-gray-600">
        {task.descricao || task.contacto || '—'}
      </p>
      <div className="mt-auto flex items-center gap-2 text-[14px]">
        {task.emTratamentoPor ? (
          <>
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary-600 text-[11px] font-bold text-white">
              {task.emTratamentoPor.nome.charAt(0).toUpperCase()}
            </span>
            <span className="truncate font-medium text-primary-700">{task.emTratamentoPor.nome}</span>
          </>
        ) : (
          <span className="text-gray-500">
            Sem responsável{task.tecnicoSolicitado ? ` · pediu ${task.tecnicoSolicitado.nome.split(' ')[0]}` : ''}
          </span>
        )}
        {showEstado && (
          <span className={`badge badge-${task.estado} ml-auto text-[13px]`}>
            {task.estado === 'EmTratamento' ? 'Em Tratamento' : 'Novo'}
          </span>
        )}
      </div>
    </div>
  );
}
