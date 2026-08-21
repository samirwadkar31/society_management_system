import { useEffect, useRef, useState } from 'react';

const CARDS = [
  {
    kind: 'work',
    chip: 'In progress',
    tag: 'Complaint',
    where: 'A-1204',
    title: 'Kitchen tap leaking',
    meta: 'Assigned to Ramesh'
  },
  {
    kind: 'gate',
    chip: 'At gate',
    tag: 'Visitor pass',
    where: 'No. 119355',
    title: 'Neha Desai',
    meta: 'Show this at the gate'
  },
  {
    kind: 'board',
    chip: 'Pinned',
    tag: 'Notice',
    where: 'Sunday',
    title: 'Water tank cleaning',
    meta: 'Supply off 9am–1pm'
  }
];

export default function LiveDeck() {
  const [active, setActive] = useState(0);
  const startX = useRef(0);
  const paused = useRef(false);
  const hushTimer = useRef(null);
  const swiped = useRef(false);

  function next() {
    setActive((n) => (n + 1) % 3);
  }
  function prev() {
    setActive((n) => (n + 2) % 3);
  }

  function hush() {
    paused.current = true;
    clearTimeout(hushTimer.current);
    hushTimer.current = setTimeout(() => {
      paused.current = false;
    }, 8000);
  }

  useEffect(() => {
    const t = setInterval(() => {
      if (!paused.current) next();
    }, 3000);
    return () => clearInterval(t);
  }, []);

  function onDown(e) {
    startX.current = e.clientX;
    swiped.current = false;
  }

  function onUp(e) {
    const dx = e.clientX - startX.current;
    if (dx < -50) {
      swiped.current = true;
      next();
      hush();
      return;
    }
    if (dx > 50) {
      swiped.current = true;
      prev();
      hush();
    }
  }

  return (
    <div
      className="wallet"
      onMouseEnter={() => {
        paused.current = true;
      }}
      onMouseLeave={() => {
        paused.current = false;
      }}
    >
      <div className="wallet-stack" onPointerDown={onDown} onPointerUp={onUp}>
        {CARDS.map((c, i) => {
          const d = (i - active + 3) % 3;
          return (
            <article
              key={c.title}
              className={'pass-card kind-' + c.kind + ' depth-' + d}
              style={{ zIndex: 3 - d }}
              onClick={() => {
                if (i !== active || swiped.current) return;
                next();
                hush();
              }}
            >
              <div className="pass-top">
                <span>
                  {c.tag}
                  <i>{c.where}</i>
                </span>
                <b className="pass-seal">K</b>
              </div>
              <h4>{c.title}</h4>
              <div className="pass-foot">
                <em>{c.meta}</em>
                <strong>{c.chip}</strong>
              </div>
            </article>
          );
        })}
      </div>
      <div className="trishul-dots">
        {CARDS.map((c, i) => (
          <button
            key={c.title}
            className={i === active ? 'on' : ''}
            type="button"
            aria-label={c.tag}
            onClick={() => {
              setActive(i);
              hush();
            }}
          />
        ))}
      </div>
      <p className="trishul-hint">Tap the front pass · or swipe</p>
    </div>
  );
}
