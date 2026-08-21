import { Link } from 'react-router-dom';

export default function DocLink({ to, children }) {
  return (
    <Link className="doc-link" to={to} title={typeof children === 'string' ? 'Open ' + children : undefined}>
      <svg className="doc-thumb" viewBox="0 0 16 20" aria-hidden="true">
        <path
          d="M3 1.5h7.2L14.5 6v12.5H3z"
          fill="#fff"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
        <path d="M10.2 1.5V6H14.5" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M5.5 10h5M5.5 13h5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      </svg>
      {children}
    </Link>
  );
}
