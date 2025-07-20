// Código completo actualizado con scroll automático, saludo centrado, y carrusel móvil
'use client';

import { useState, useEffect, useRef, Fragment } from 'react';
import {
  PaperPlaneIcon,
  GearIcon,
  ChevronLeftIcon,
  HamburgerMenuIcon
} from '@radix-ui/react-icons';

export default function ChatTestPage() {
  const [messages, setMessages] = useState<{ user: string; bot: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [suggestions] = useState([
    '¿Cuánto vendimos este mes?',
    'Muéstrame el stock crítico',
    'Registra esta factura'
  ]);

  const userMenuRef = useRef(null);
  const carouselRef = useRef(null);
  const sidebarRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setShowSidebar(window.innerWidth >= 768);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (userMenuRef.current && !userMenuRef.current.contains(target) && !target.closest('#config-button')) {
        setShowUserMenu(false);
      }
      if (!target.closest('#attach-button') && !target.closest('#attach-menu')) {
        setShowAttachMenu(false);
      }
      if (window.innerWidth < 768 && sidebarRef.current && !sidebarRef.current.contains(target)) {
        setShowSidebar(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (carouselRef.current && window.innerWidth < 768) {
        carouselRef.current.scrollBy({ left: 150, behavior: 'smooth' });
      }
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (customInput?: string) => {
    const userMsg = customInput ?? input;
    if (!userMsg.trim()) return;
    setInput('');
    setMessages(prev => [...prev, { user: userMsg, bot: '...' }]);
    setIsTyping(true);
    try {
      const res = await fetch('/api/chat-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, userId: 'demo_user' })
      });
      const data = await res.json();
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].bot = data.message;
        return updated;
      });
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1].bot = 'Error al enviar el mensaje.';
        return updated;
      });
    }
    setIsTyping(false);
  };

  const MetricCard = ({ title, value }: { title: string; value: string }) => (
    <div className="bg-white p-2 rounded-xl shadow-sm text-xs text-[#222B3A] min-w-[120px] mr-3 snap-start">
      <div>{title}</div>
      <div className="font-bold text-sm">{value}</div>
    </div>
  );

  return (
    <div className="h-screen bg-white flex flex-col text-[#222B3A] font-sans relative">
      <header className="h-20 px-6 flex items-center justify-between bg-white shadow-sm z-10 relative">
        <div className="text-2xl font-semibold">SinercIA</div>
        <div className="relative" ref={userMenuRef}>
          <button id="config-button" onClick={() => setShowUserMenu(!showUserMenu)}>
            <GearIcon className="w-5 h-5 text-[#63C0B9]" />
          </button>
          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-lg p-2 text-sm z-20">
              <div className="py-1 px-3 hover:bg-gray-100 rounded">👤 Mi perfil</div>
              <div className="py-1 px-3 hover:bg-gray-100 rounded">⚙️ Configuración</div>
              <div className="py-1 px-3 hover:bg-gray-100 rounded">🔓 Cerrar sesión</div>
            </div>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* SIDEBAR */}
        {showSidebar && (
          <aside
            ref={sidebarRef}
            className="fixed inset-y-0 left-0 z-40 w-64 bg-[#F8F9FA] p-4 space-y-6 shadow-inner md:static md:block"
          >
            <div className="flex justify-end md:hidden">
              <button onClick={() => setShowSidebar(false)} className="text-[#63C0B9]">
                <ChevronLeftIcon />
              </button>
            </div>
            <div className="space-y-2">
              <button className="w-full bg-[#63C0B9] text-white rounded px-3 py-2 text-sm">+ Nuevo Chat</button>
              <input className="w-full border border-gray-300 p-2 rounded text-sm" placeholder="Buscar chat..." />
            </div>
            <div>
              <h2 className="font-semibold mb-2 text-[#222B3A]">Historial</h2>
              <ul className="space-y-3 text-sm text-[#222B3A]">
                <li className="cursor-pointer">📄 Informe de ventas <span className="text-gray-400 text-xs block">Hoy 09:15</span></li>
                <li className="cursor-pointer">📦 Estado de stock <span className="text-gray-400 text-xs block">Ayer 16:40</span></li>
              </ul>
            </div>
          </aside>
        )}

        {/* MAIN */}
        <main className="flex-1 flex flex-col items-center px-4 md:px-8 py-4 md:py-6 min-h-0 overflow-hidden">
          {!showSidebar && (
            <div className="w-full md:hidden flex justify-start mb-4">
              <button onClick={() => setShowSidebar(true)} className="text-[#63C0B9]">
                <HamburgerMenuIcon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* CARRUSEL MÉTRICAS SOLO MÓVIL */}
          <div className="relative w-full overflow-x-auto pb-4 md:hidden">
            <div ref={carouselRef} className="flex pl-1 gap-1 snap-x scroll-smooth whitespace-nowrap touch-auto">
              <MetricCard title="📈 Ventas" value="$24,500" />
              <MetricCard title="🏦 Cheques" value="120" />
              <MetricCard title="📉 Stock Crítico" value="8" />
              <MetricCard title="🔄 Rotación Baja" value="15" />
            </div>
          </div>

          {/* SALUDO CENTRADO SI NO HAY MENSAJES NI INPUT */}
          {messages.length === 0 && input.trim() === '' && (
            <div className="flex flex-col items-center justify-center flex-grow text-center w-full">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Hola Fernando 👋</h1>
              <p className="text-lg text-gray-500">¿En qué te puedo ayudar hoy?</p>
            </div>
          )}

          {/* MENSAJES */}
          <div className="w-full max-w-2xl flex-1 space-y-6 overflow-y-auto min-h-0">
            {messages.map((msg, i) => (
              <div key={i} className="space-y-2">
                {msg.user && (
                  <Fragment>
                    <div className="text-sm font-semibold">Tú:</div>
                    <div className="bg-gray-100 p-3 rounded-xl text-sm shadow-sm max-w-full break-words">{msg.user}</div>
                  </Fragment>
                )}
                <div className="text-sm font-semibold">CeoBot:</div>
                <div className="bg-[#63C0B9] text-white p-3 rounded-xl text-sm shadow-sm max-w-full break-words">{msg.bot}</div>
              </div>
            ))}
            {isTyping && <div className="text-sm text-gray-500 animate-pulse">CeoBot está escribiendo…</div>}
            <div ref={bottomRef} />
          </div>

          {/* SUGERENCIAS */}
          <div className="flex flex-wrap gap-2 mt-8 mb-4 justify-center">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                className="bg-[#F0FDFD] border border-[#63C0B9] text-[#222B3A] px-3 py-1.5 rounded-full text-xs hover:bg-[#E0F7F7]"
              >
                {s}
              </button>
            ))}
          </div>

          {/* INPUT */}
          <div className="relative mt-4 w-full max-w-2xl flex items-center gap-2 border rounded-full px-4 py-2 shadow-sm">
            <button
              id="attach-button"
              onClick={() => setShowAttachMenu(!showAttachMenu)}
              className="text-[#63C0B9] text-xl font-bold pb-1 hover:text-[#4DA8A0] relative top-[2px]"
            >
              ＋
            </button>
            {showAttachMenu && (
              <div
                id="attach-menu"
                className="absolute bottom-12 left-4 bg-white border rounded-xl shadow-lg p-2 w-56 z-50 text-sm flex flex-col space-y-1"
              >
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">📄 Documento</div>
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">🖼️ Fotos y videos</div>
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">📷 Cámara</div>
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">🎧 Audio</div>
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">👤 Contacto</div>
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">📊 Encuesta</div>
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">📅 Evento</div>
                <div className="hover:bg-gray-100 px-3 py-2 rounded cursor-pointer">🆕 Nuevo sticker</div>
              </div>
            )}
            <input
              className="flex-1 outline-none text-sm text-[#222B3A] placeholder:text-gray-400"
              placeholder="Escribí un mensaje..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
            />
            <button className="text-[#63C0B9] hover:text-[#4DA8A0]" onClick={() => sendMessage()} disabled={!input.trim()}>
              <PaperPlaneIcon className="w-5 h-5" />
            </button>
          </div>
        </main>

        {/* PANEL DERECHO (ESCRITORIO) */}
        <aside className="hidden md:block w-64 bg-[#F8F9FA] p-4 space-y-6 shadow-inner rounded-tl-2xl rounded-bl-2xl">
          <h2 className="font-bold text-[#222B3A]">Métricas Clave</h2>
          <div className="flex flex-col space-y-3">
            <MetricCard title="📈 Ventas" value="$24,500" />
            <MetricCard title="🏦 Cheques" value="120" />
            <MetricCard title="📉 Stock Crítico" value="8" />
            <MetricCard title="🔄 Rotación Baja" value="15" />
          </div>
        </aside>
      </div>
    </div>
  );
}
