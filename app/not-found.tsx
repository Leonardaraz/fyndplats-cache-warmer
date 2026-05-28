export default function NotFound() {
  return (
    <div className="container nf-wrap">
      <div className="nf">
        <div className="nf-num">404</div>
        <h1 className="nf-title">Sidan kunde inte hittas</h1>
        <p className="nf-text">Den här sidan finns inte – eller så har vi flyttat den. Här är några vägar tillbaka in i butiken:</p>
        <div className="nf-actions">
          <a className="btn btn-primary" href="/">← Tillbaka till startsidan</a>
          <a className="btn btn-ghost" href="/butik">Se hela sortimentet</a>
        </div>
        <div className="nf-cats">
          <div className="nf-cats-label">Populära kategorier</div>
          <div className="nf-cats-row">
            <a href="/kategori/elektronik">Elektronik</a>
            <a href="/kategori/hem-och-inredning">Hem &amp; Inredning</a>
            <a href="/kategori/skonhet-och-halsa">Skönhet &amp; Hälsa</a>
            <a href="/kategori/mode-och-accessoarer">Mode &amp; Accessoarer</a>
            <a href="/kategori/husdjur">Husdjur</a>
            <a href="/kategori/barn-och-familj">Barn &amp; Familj</a>
          </div>
        </div>
      </div>
    </div>
  );
}
