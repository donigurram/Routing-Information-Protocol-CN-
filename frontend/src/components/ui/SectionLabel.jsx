import React from 'react';

export default function SectionLabel({ children, T }) {
    return (
        <div style={{
            fontSize: 14, fontWeight: 700, color: T.textFaint,
            letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8
        }}>
            {children}
        </div>
    );
}