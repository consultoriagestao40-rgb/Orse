'use client';

import React, { useRef, useEffect, useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Indent,
  Outdent,
  Palette,
  Highlighter,
  Eraser,
  Undo2,
  Redo2,
  Pilcrow,
  Type,
} from 'lucide-react';

export function isHtmlContent(value?: string | null): boolean {
  if (!value) return false;
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

export function stripHtmlToText(value?: string | null): string {
  if (!value) return '';
  if (!isHtmlContent(value)) return value;
  return value
    .replace(/<\/(p|div|h1|h2|h3|h4|li|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

interface RichTextDisplayProps {
  content?: string | null;
  fallback?: string;
  className?: string;
  inline?: boolean;
}

export function RichTextDisplay({
  content,
  fallback = '',
  className = '',
  inline = false,
}: RichTextDisplayProps) {
  const raw = content && content.trim() !== '' ? content : fallback;
  if (!raw) return null;

  if (isHtmlContent(raw)) {
    const Tag = inline ? 'span' : 'div';
    return (
      <Tag
        className={`rich-text-output ${className}`}
        dangerouslySetInnerHTML={{ __html: raw }}
      />
    );
  }

  const Tag = inline ? 'span' : 'div';
  return <Tag className={`whitespace-pre-wrap ${className}`}>{raw}</Tag>;
}

interface RichTextFieldProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
  className?: string;
}

const FONT_FAMILIES = [
  { label: 'Fonte Padrão (Inter)', value: 'Inter, sans-serif' },
  { label: 'Arial', value: 'Arial, Helvetica, sans-serif' },
  { label: 'Times New Roman', value: '"Times New Roman", Times, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Verdana', value: 'Verdana, Geneva, sans-serif' },
  { label: 'Tahoma', value: 'Tahoma, Geneva, sans-serif' },
  { label: 'Trebuchet MS', value: '"Trebuchet MS", sans-serif' },
  { label: 'Courier New', value: '"Courier New", Courier, monospace' },
];

const FONT_SIZES = [
  { label: '10px (Muito Pequeno)', cmdValue: '1', px: '10px' },
  { label: '12px (Pequeno)', cmdValue: '2', px: '12px' },
  { label: '14px (Normal)', cmdValue: '3', px: '14px' },
  { label: '16px (Médio)', cmdValue: '4', px: '16px' },
  { label: '18px (Grande)', cmdValue: '5', px: '18px' },
  { label: '24px (Título)', cmdValue: '6', px: '24px' },
  { label: '32px (Destaque)', cmdValue: '7', px: '32px' },
];

const PRESET_COLORS = [
  '#0f172a', // Slate 900
  '#334155', // Slate 700
  '#64748b', // Slate 500
  '#1B4D3E', // Verde Corporativo
  '#059669', // Emerald 600
  '#1e4480', // Azul Corporativo
  '#2563eb', // Blue 600
  '#dc2626', // Red 600
  '#d97706', // Amber 600
  '#7c3aed', // Violet 600
];

export default function RichTextField({
  value,
  onChange,
  placeholder = 'Descreva detalhadamente o objeto da proposta...',
  minHeight = 200,
  className = '',
}: RichTextFieldProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const colorInputRef = useRef<HTMLInputElement>(null);
  const highlightInputRef = useRef<HTMLInputElement>(null);
  const [textColor, setTextColor] = useState('#0f172a');
  const [highlightColor, setHighlightColor] = useState('#fef08a');
  const [showColorMenu, setShowColorMenu] = useState(false);
  const isInternalChange = useRef(false);

  // Sync external value into editor only when it changes externally (e.g. loading another FPV)
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;

    if (isInternalChange.current) {
      isInternalChange.current = false;
      return;
    }

    const normalizedIncoming = value || '';
    const currentHtml = el.innerHTML;

    // If incoming is plain text with newlines and no HTML tags, convert newlines to <br> for editing
    const htmlToSet =
      normalizedIncoming && !isHtmlContent(normalizedIncoming)
        ? normalizedIncoming
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
        : normalizedIncoming;

    if (currentHtml !== htmlToSet) {
      el.innerHTML = htmlToSet;
    }
  }, [value]);

  const emitChange = () => {
    const el = editorRef.current;
    if (!el) return;
    isInternalChange.current = true;
    const html = el.innerHTML;
    // If empty or just a single <br>, store empty string
    if (html === '<br>' || html.trim() === '') {
      onChange('');
    } else {
      onChange(html);
    }
  };

  const exec = (command: string, arg?: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, arg);
    emitChange();
  };

  const applyListStyle = (listType: 'ul' | 'ol', styleType: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const cmd = listType === 'ul' ? 'insertUnorderedList' : 'insertOrderedList';
    document.execCommand(cmd, false);

    // Apply specific list-style-type to the active list element
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
      while (node && node !== el) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          ((node as HTMLElement).tagName === 'UL' || (node as HTMLElement).tagName === 'OL')
        ) {
          (node as HTMLElement).style.listStyleType = styleType;
          (node as HTMLElement).style.paddingLeft = '1.75rem';
          break;
        }
        node = node.parentNode;
      }
    }
    emitChange();
  };

  const toggleFirstLineIndent = () => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
    while (node && node !== el) {
      if (
        node.nodeType === Node.ELEMENT_NODE &&
        ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'BLOCKQUOTE'].includes(
          (node as HTMLElement).tagName
        )
      ) {
        const block = node as HTMLElement;
        const currentIndent = block.style.textIndent;
        block.style.textIndent = currentIndent === '2.5em' ? '0px' : '2.5em';
        emitChange();
        return;
      }
      node = node.parentNode;
    }

    // If no block wrapper yet, wrap in paragraph and apply indent
    document.execCommand('formatBlock', false, 'p');
    const retrySel = window.getSelection();
    if (retrySel && retrySel.rangeCount > 0) {
      let retryNode: Node | null = retrySel.getRangeAt(0).commonAncestorContainer;
      while (retryNode && retryNode !== el) {
        if (
          retryNode.nodeType === Node.ELEMENT_NODE &&
          ['P', 'DIV'].includes((retryNode as HTMLElement).tagName)
        ) {
          const block = retryNode as HTMLElement;
          block.style.textIndent = block.style.textIndent === '2.5em' ? '0px' : '2.5em';
          break;
        }
        retryNode = retryNode.parentNode;
      }
    }
    emitChange();
  };

  const applyLineHeight = (lineHeight: string) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      let node: Node | null = selection.getRangeAt(0).commonAncestorContainer;
      while (node && node !== el) {
        if (
          node.nodeType === Node.ELEMENT_NODE &&
          ['P', 'DIV', 'UL', 'OL', 'LI', 'H1', 'H2', 'H3'].includes(
            (node as HTMLElement).tagName
          )
        ) {
          (node as HTMLElement).style.lineHeight = lineHeight;
          emitChange();
          return;
        }
        node = node.parentNode;
      }
    }
    el.style.lineHeight = lineHeight;
    emitChange();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Support Tab / Shift+Tab for indentation inside the editor
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) {
        exec('outdent');
      } else {
        exec('indent');
      }
    }
  };

  return (
    <div
      className={`w-full rounded-xl border border-slate-300 bg-white shadow-xs focus-within:border-[#1B4D3E] focus-within:ring-1 focus-within:ring-[#1B4D3E] transition-all ${className}`}
    >
      {/* Formatting Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-2.5 py-2 rounded-t-xl flex flex-wrap items-center gap-1.5 select-none">
        {/* Formato de Parágrafo / Título */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              exec('formatBlock', e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-[#1B4D3E] cursor-pointer"
          title="Estilo de Parágrafo"
        >
          <option value="" disabled hidden>
            Parágrafo
          </option>
          <option value="p">Parágrafo Normal</option>
          <option value="h1">Título 1 (Grande)</option>
          <option value="h2">Título 2 (Médio)</option>
          <option value="h3">Título 3 (Subtítulo)</option>
          <option value="blockquote">Citação / Destaque</option>
        </select>

        {/* Fonte */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              exec('fontName', e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-[#1B4D3E] cursor-pointer max-w-[135px]"
          title="Tipo de Fonte"
        >
          <option value="" disabled hidden>
            Fonte
          </option>
          {FONT_FAMILIES.map((f) => (
            <option key={f.value} value={f.value} style={{ fontFamily: f.value }}>
              {f.label}
            </option>
          ))}
        </select>

        {/* Tamanho da Fonte */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-1.5 py-0.5">
          <Type size={12} className="text-slate-400 mr-1" />
          <select
            onChange={(e) => {
              if (e.target.value) {
                exec('fontSize', e.target.value);
                e.target.value = '';
              }
            }}
            defaultValue=""
            className="bg-transparent text-[11px] font-bold text-slate-700 outline-none cursor-pointer py-0.5"
            title="Tamanho da Fonte"
          >
            <option value="" disabled hidden>
              Tamanho
            </option>
            {FONT_SIZES.map((s) => (
              <option key={s.cmdValue} value={s.cmdValue}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* Negrito, Itálico, Sublinhado, Tachado */}
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Negrito (Ctrl+B)"
        >
          <Bold size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Itálico (Ctrl+I)"
        >
          <Italic size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Sublinhado (Ctrl+U)"
        >
          <Underline size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('strikeThrough')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Tachado"
        >
          <Strikethrough size={14} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* Cor da Fonte + Paleta Rápida */}
        <div className="relative flex items-center">
          <input
            ref={colorInputRef}
            type="color"
            value={textColor}
            onChange={(e) => {
              const color = e.target.value;
              setTextColor(color);
              exec('foreColor', color);
              setShowColorMenu(false);
            }}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => setShowColorMenu((prev) => !prev)}
            className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            title="Cor da Fonte"
          >
            <Palette size={14} style={{ color: textColor }} />
            <span
              className="w-2.5 h-2.5 rounded-full border border-slate-300"
              style={{ backgroundColor: textColor }}
            />
          </button>

          {showColorMenu && (
            <div className="absolute left-0 top-full mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg p-2.5 w-48">
              <div className="text-[10px] font-extrabold text-slate-500 uppercase mb-1.5">
                Cores Rápidas
              </div>
              <div className="grid grid-cols-5 gap-1.5 mb-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      setTextColor(c);
                      exec('foreColor', c);
                      setShowColorMenu(false);
                    }}
                    className="w-6 h-6 rounded-md border border-slate-200 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => colorInputRef.current?.click()}
                className="w-full text-[10px] font-bold text-[#1B4D3E] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg py-1 transition-colors cursor-pointer"
              >
                Outra Cor Personalizada...
              </button>
            </div>
          )}
        </div>

        {/* Marca-texto / Destaque */}
        <div className="relative flex items-center">
          <input
            ref={highlightInputRef}
            type="color"
            value={highlightColor}
            onChange={(e) => {
              const color = e.target.value;
              setHighlightColor(color);
              exec('hiliteColor', color);
            }}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => highlightInputRef.current?.click()}
            className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer flex items-center gap-1"
            title="Cor de Realce / Fundo do Texto"
          >
            <Highlighter size={14} />
            <span
              className="w-2.5 h-2.5 rounded-xs border border-slate-300"
              style={{ backgroundColor: highlightColor }}
            />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* Alinhamento */}
        <button
          type="button"
          onClick={() => exec('justifyLeft')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Alinhar à Esquerda"
        >
          <AlignLeft size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyCenter')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Centralizar"
        >
          <AlignCenter size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyRight')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Alinhar à Direita"
        >
          <AlignRight size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyFull')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Justificar Texto"
        >
          <AlignJustify size={14} />
        </button>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* Marcadores e Numeração */}
        <button
          type="button"
          onClick={() => applyListStyle('ul', 'disc')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Lista com Marcadores (•)"
        >
          <List size={14} />
        </button>
        <button
          type="button"
          onClick={() => applyListStyle('ol', 'decimal')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Lista Numerada (1, 2, 3)"
        >
          <ListOrdered size={14} />
        </button>
        <select
          onChange={(e) => {
            const val = e.target.value;
            if (val === 'disc') applyListStyle('ul', 'disc');
            else if (val === 'circle') applyListStyle('ul', 'circle');
            else if (val === 'square') applyListStyle('ul', 'square');
            else if (val === 'decimal') applyListStyle('ol', 'decimal');
            else if (val === 'lower-alpha') applyListStyle('ol', 'lower-alpha');
            else if (val === 'upper-alpha') applyListStyle('ol', 'upper-alpha');
            else if (val === 'lower-roman') applyListStyle('ol', 'lower-roman');
            e.target.value = '';
          }}
          defaultValue=""
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-[#1B4D3E] cursor-pointer"
          title="Opções de Marcadores e Numeração"
        >
          <option value="" disabled hidden>
            Listas...
          </option>
          <option value="disc">● Marcador Sólido</option>
          <option value="circle">○ Marcador Vazado</option>
          <option value="square">■ Marcador Quadrado</option>
          <option value="decimal">1, 2, 3 (Números)</option>
          <option value="lower-alpha">a, b, c (Letras min.)</option>
          <option value="upper-alpha">A, B, C (Letras mai.)</option>
          <option value="lower-roman">i, ii, iii (Romanos)</option>
        </select>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* Parágrafo e Recuo */}
        <button
          type="button"
          onClick={() => exec('outdent')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Diminuir Recuo (Shift+Tab)"
        >
          <Outdent size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('indent')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-700 transition-colors cursor-pointer"
          title="Aumentar Recuo (Tab)"
        >
          <Indent size={14} />
        </button>
        <button
          type="button"
          onClick={toggleFirstLineIndent}
          className="px-2 py-1 hover:bg-slate-200/80 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer flex items-center gap-1 border border-slate-200 bg-white"
          title="Alternar Recuo de 1ª Linha do Parágrafo"
        >
          <Pilcrow size={12} className="text-[#1B4D3E]" />
          <span>Recuo 1ª Linha</span>
        </button>

        {/* Espaçamento entre linhas */}
        <select
          onChange={(e) => {
            if (e.target.value) {
              applyLineHeight(e.target.value);
              e.target.value = '';
            }
          }}
          defaultValue=""
          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-slate-700 outline-none hover:border-slate-300 focus:border-[#1B4D3E] cursor-pointer"
          title="Espaçamento entre Linhas"
        >
          <option value="" disabled hidden>
            Espaçamento
          </option>
          <option value="1.2">Simples (1.2)</option>
          <option value="1.5">Normal (1.5)</option>
          <option value="1.8">Amplo (1.8)</option>
          <option value="2.0">Duplo (2.0)</option>
        </select>

        <div className="h-4 w-px bg-slate-300 mx-0.5" />

        {/* Desfazer / Refazer / Limpar Formatação */}
        <button
          type="button"
          onClick={() => exec('undo')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors cursor-pointer"
          title="Desfazer (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('redo')}
          className="p-1.5 hover:bg-slate-200/80 rounded-lg text-slate-600 transition-colors cursor-pointer"
          title="Refazer (Ctrl+Y)"
        >
          <Redo2 size={14} />
        </button>
        <button
          type="button"
          onClick={() => exec('removeFormat')}
          className="p-1.5 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600 transition-colors cursor-pointer"
          title="Limpar Formatação"
        >
          <Eraser size={14} />
        </button>
      </div>

      {/* Auto-Expanding Responsive ContentEditable Area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        onBlur={emitChange}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder}
        style={{ minHeight: `${minHeight}px` }}
        className="rich-text-editor w-full p-4 bg-white rounded-b-xl text-sm text-slate-800 outline-none leading-relaxed overflow-y-visible resize-y"
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
            .rich-text-editor:empty:before {
              content: attr(data-placeholder);
              color: #94a3b8;
              pointer-events: none;
              display: block;
            }
            .rich-text-editor ul,
            .rich-text-output ul {
              list-style-type: disc;
              padding-left: 1.75rem;
              margin: 0.35rem 0;
            }
            .rich-text-editor ol,
            .rich-text-output ol {
              list-style-type: decimal;
              padding-left: 1.75rem;
              margin: 0.35rem 0;
            }
            .rich-text-editor li,
            .rich-text-output li {
              margin: 0.15rem 0;
            }
            .rich-text-editor p,
            .rich-text-output p {
              margin: 0.25rem 0;
            }
            .rich-text-editor h1,
            .rich-text-output h1 {
              font-size: 1.35rem;
              font-weight: 800;
              margin: 0.5rem 0 0.25rem;
            }
            .rich-text-editor h2,
            .rich-text-output h2 {
              font-size: 1.15rem;
              font-weight: 700;
              margin: 0.4rem 0 0.2rem;
            }
            .rich-text-editor h3,
            .rich-text-output h3 {
              font-size: 1rem;
              font-weight: 700;
              margin: 0.3rem 0 0.15rem;
            }
            .rich-text-editor blockquote,
            .rich-text-output blockquote {
              border-left: 3px solid #1B4D3E;
              padding-left: 0.85rem;
              margin: 0.4rem 0;
              color: #475569;
              font-style: italic;
            }
          `,
        }}
      />
    </div>
  );
}
