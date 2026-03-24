import React from 'react';

export default function Toggle({ value, onChange, T }) {
    return (
        <div onClick={() => onChange(!value)} style={{
            width: 38, height: 21, borderRadius: 999, cursor: "pointer", flexShrink: 0,
            background: value ? T.accent : T.border, position: "relative", transition: "background .2s"
        }}>
            <div style={{
                position: "absolute", top: 2.5, left: value ? 19 : 2.5,
                width: 16, height: 16, borderRadius: 999,
                background: value ? "#fff" : T.textFaint,
                transition: "left .2s, background .2s",
                boxShadow: "0 1px 3px rgba(0,0,0,.3)"
            }} />
        </div>
    );
}
