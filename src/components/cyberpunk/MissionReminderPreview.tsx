import './cyberpunk.css'

/**
 * Page de test (accessible via ?missiontest) présentant les 3 formats
 * envisagés pour rappeler les missions hebdo/mensuelle sur le Journal.
 * But : aide à la décision — aucun de ces formats n'est branché dans l'app.
 */
export function MissionReminderPreview() {
  return (
    <div className="cp-root">
      <div className="cp-page">
        <h1 className="cp-mr-h1">Preview · rappel missions</h1>
        <p className="cp-mr-lead">
          Trois formats pour ne pas oublier tes missions hebdo &amp; mensuelle depuis le Journal.
          Regarde, et dis-moi lequel tu préfères (format + ton).
        </p>

        {/* ——— Format A ——— */}
        <div className="cp-mr-block">
          <div className="cp-mr-label">Format A — Bandeau (mon conseil)</div>

          <div className="cp-mr-state">Ton « Night City »</div>
          <div className="cp-mr-banner">
            <span className="ico">◈</span>
            <span className="txt">
              BRIEFING<span className="sep">·</span>Hebdo <span className="hot">1/3</span>
              <span className="sep">·</span>Contrat mensuel : <span className="hot">12 j</span> restants
            </span>
            <span className="cta">Ouvrir ›</span>
          </div>

          <div className="cp-mr-state">Ton sobre</div>
          <div className="cp-mr-banner">
            <span className="ico">🎯</span>
            <span className="txt">
              N'oublie pas tes missions — <span className="hot">1</span> hebdo &amp; <span className="hot">1</span> mensuelle en cours
            </span>
            <span className="cta">Voir ›</span>
          </div>

          <div className="cp-mr-state">État « deadline proche »</div>
          <div className="cp-mr-banner warn">
            <span className="ico">⚠</span>
            <span className="txt">
              ALERTE — ta mission hebdo expire dans <span className="hot">2 j</span>. File la boucler.
            </span>
            <span className="cta">Ouvrir ›</span>
          </div>

          <p className="cp-mr-caption">
            Fin, discret, tient sur une ligne sous le navigateur de jour. <b>Un coup d'œil, un tap → Missions.</b>{' '}
            S'adapte à l'état (en cours / deadline). Le plus léger visuellement.
          </p>
        </div>

        {/* ——— Format B ——— */}
        <div className="cp-mr-block">
          <div className="cp-mr-label">Format B — Deux mini-cartes</div>
          <div className="cp-mr-cards">
            <div className="cp-mr-card">
              <div className="head"><span>Hebdomadaire</span><span className="dl">reset 4 j</span></div>
              <div className="name">1 / 3 accomplies</div>
              <div className="prog">
                <span className="cp-mr-bar"><i style={{ width: '33%' }} /></span>
                <span className="frac">33%</span>
              </div>
              <span className="go">›</span>
            </div>
            <div className="cp-mr-card">
              <div className="head"><span>Mensuel</span><span className="dl">12 j</span></div>
              <div className="name">Premier Contact</div>
              <div className="prog">
                <span className="cp-mr-bar"><i style={{ width: '25%' }} /></span>
                <span className="frac">1/4</span>
              </div>
              <span className="go">›</span>
            </div>
          </div>
          <p className="cp-mr-caption">
            Plus visuel et informatif : progression + deadline pour chaque cadence. <b>Prend plus de place</b>{' '}
            au-dessus des quêtes, mais on voit tout d'un coup.
          </p>
        </div>

        {/* ——— Format C ——— */}
        <div className="cp-mr-block">
          <div className="cp-mr-label">Format C — Badge sur l'onglet</div>
          <nav className="cp-mr-nav">
            <span className="cp-tab-num">1</span>
            <button type="button" className="cp-tab cp-tab-active"><span className="tico">◆</span>Journal</button>
            <button type="button" className="cp-tab">
              <span className="tico">◈</span>Missions<span className="cp-mr-badge">3</span>
            </button>
            <button type="button" className="cp-tab"><span className="tico">◇</span>Stats</button>
            <button type="button" className="cp-tab"><span className="tico">▣</span>Souvenirs</button>
            <span className="cp-tab-num">4</span>
          </nav>
          <p className="cp-mr-caption">
            Ultra-minimaliste : juste un badge « 3 » sur l'onglet Missions. <b>Zéro place perdue, mais facile à rater</b> —
            idéal <b>en complément</b> du Format A plutôt que seul.
          </p>
        </div>

        <p className="cp-note" style={{ textAlign: 'center', marginTop: 8 }}>
          preview // aucun format n'est encore actif dans l'app
        </p>
      </div>
    </div>
  )
}
