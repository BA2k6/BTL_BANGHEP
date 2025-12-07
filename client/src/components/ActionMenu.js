import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

const ActionMenu = ({ buttonLabel = '⋯', items = [] }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const [menuPos, setMenuPos] = useState(null);

    // Close when clicked outside or Esc pressed
    useEffect(() => {
        const onDocClick = (e) => {
            if (!ref.current) return;
            if (!ref.current.contains(e.target)) setOpen(false);
        };
        const onEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('click', onDocClick);
        document.addEventListener('keydown', onEsc);
        return () => {
            document.removeEventListener('click', onDocClick);
            document.removeEventListener('keydown', onEsc);
        };
    }, []);

    // Recompute position on open, scroll or resize so the portal menu stays aligned
    useEffect(() => {
        if (!open) return;
        const updatePos = () => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const menuWidth = 160; // px (approx 10rem)
            const leftRaw = rect.right + window.scrollX - menuWidth;
            const left = Math.max(8 + window.scrollX, Math.min(leftRaw, window.innerWidth - menuWidth - 8 + window.scrollX));
            const top = rect.bottom + window.scrollY + 6;
            setMenuPos({ left, top });
        };
        updatePos();
        window.addEventListener('resize', updatePos);
        window.addEventListener('scroll', updatePos, true);
        return () => {
            window.removeEventListener('resize', updatePos);
            window.removeEventListener('scroll', updatePos, true);
        };
    }, [open]);

    const toggle = () => {
        const willOpen = !open;
        if (willOpen && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const menuWidth = 160;
            const leftRaw = rect.right + window.scrollX - menuWidth;
            const left = Math.max(8 + window.scrollX, Math.min(leftRaw, window.innerWidth - menuWidth - 8 + window.scrollX));
            const top = rect.bottom + window.scrollY + 6;
            setMenuPos({ left, top });
        }
        setOpen(willOpen);
    };

    return (
        <div className="relative inline-block text-left align-middle" ref={ref}>
            <button
                aria-haspopup="true"
                aria-expanded={open}
                onClick={toggle}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
                <span className="select-none">{buttonLabel}</span>
            </button>

            {open && menuPos && createPortal(
                <div
                    style={{
                        position: 'absolute',
                        top: `${menuPos.top}px`,
                        left: `${menuPos.left}px`,
                        minWidth: '10rem',
                        zIndex: 9999
                    }}
                >
                    <div className="bg-white border rounded shadow-lg">
                        {items.map((it, idx) => (
                            <button
                                key={idx}
                                onClick={() => { setOpen(false); if (typeof it.onClick === 'function') it.onClick(); }}
                                className={`w-full text-left px-3 py-2 hover:bg-gray-50 ${it.danger ? 'text-red-600' : ''}`}
                                title={it.title || ''}
                            >
                                {it.icon && <span className="inline-block mr-2 align-middle">{it.icon}</span>}
                                <span className="align-middle">{it.label}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default ActionMenu;