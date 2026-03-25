import { memo } from 'react';

function PageHeader({ eyebrow, title, subtitle, right }) {
  return (
    <header className="header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        {title && <h1>{title}</h1>}
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {right ? <div>{right}</div> : null}
    </header>
  );
}

export default memo(PageHeader);
