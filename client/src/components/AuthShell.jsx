import { Link } from 'react-router-dom';

export default function AuthShell({ title, blurb, tone, children }) {
  return (
    <div className={'auth-page' + (tone ? ' door-' + tone : '')}>
      <div className="auth-art">
        <Link className="brand" to="/">
          <div className="brand-mark">K</div>
          <div>
            <strong>Kutumb</strong>
            <span>Residency</span>
          </div>
        </Link>
        <div>
          <div className="kicker light">A quieter way to run the building</div>
          <h1>{title}</h1>
          {blurb && <p>{blurb}</p>}
        </div>
      </div>
      <div className="auth-form-col">
        <Link className="brand auth-mobile-brand" to="/">
          <div className="brand-mark">K</div>
          <div>
            <strong>Kutumb</strong>
            <span>Residency</span>
          </div>
        </Link>
        {children}
      </div>
    </div>
  );
}
